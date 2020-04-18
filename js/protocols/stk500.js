
'use strict';

var STK500_protocol = function () {
    this.baud;
    this.options = {};
    this.callback; // ref
    this.hex; // ref
    this.verify_hex;

    this.receive_buffer;

    this.bytes_to_read = 0; // ref
    this.read_callback; // ref

    this.upload_time_start;
    this.upload_process_alive;


    this.majorVersion = 0;
    this.minorVersion = 0;

    this.cmdLoadAddress;
    this.cmdLoadAddressForRead
    //this.cmdProg = [];
    this.cmdRead;
    this.cmdStatus;
    this.pageCount = 0;
    this.PAGE_SIZE = 128;

    this.status = {
        ACK:    0x79, // y
        NACK:   0x1F
    };

    this.command = {
        get:                    0x00, // Gets the version and the allowed commands supported by the current version of the bootloader
        get_ver_r_protect_s:    0x01, // Gets the bootloader version and the Read Protection status of the Flash memory
        get_ID:                 0x02, // Gets the chip ID
        read_memory:            0x11, // Reads up to 256 bytes of memory starting from an address specified by the application
        go:                     0x21, // Jumps to user application code located in the internal Flash memory or in SRAM
        write_memory:           0x31, // Writes up to 256 bytes to the RAM or Flash memory starting from an address specified by the application
        erase:                  0x43, // Erases from one to all the Flash memory pages
        extended_erase:         0x44, // Erases from one to all the Flash memory pages using two byte addressing mode (v3.0+ usart).
        write_protect:          0x63, // Enables the write protection for some sectors
        write_unprotect:        0x73, // Disables the write protection for all Flash memory sectors
        readout_protect:        0x82, // Enables the read protection
        readout_unprotect:      0x92  // Disables the read protection
    };

    this.signature = {
        ATMEGA328:    [ 0x1e,  0x95 , 0x0f], // y
        NACK:   0x1F
    };
    
    this.const = {
        STK_OK             :0x10,
        STK_FAILED         :0x11,  // Not used
        STK_UNKNOWN        :0x12,  // Not used
        STK_NODEVICE       :0x13,  // Not used
        STK_INSYNC         :0x14,  // ' '
        STK_NOSYNC         :0x15,  // Not used
        ADC_CHANNEL_ERROR  :0x16,  // Not used
        ADC_MEASURE_OK     :0x17,  // Not used
        PWM_CHANNEL_ERROR  :0x18,  // Not used
        PWM_ADJUST_OK      :0x19,  // Not used
        CRC_EOP            :0x20,  // 'SPACE'
        STK_GET_SYNC       :0x30,  // '0'
        STK_GET_SIGN_ON    :0x31,  // '1'
        STK_SET_PARAMETER  :0x40,  // '@'
        STK_GET_PARAMETER  :0x41,  // 'A'
        STK_SET_DEVICE     :0x42,  // 'B'
        STK_SET_DEVICE_EXT :0x45,  // 'E'
        STK_ENTER_PROGMODE :0x50,  // 'P'
        STK_LEAVE_PROGMODE :0x51,  // 'Q'
        STK_CHIP_ERASE     :0x52,  // 'R'
        STK_CHECK_AUTOINC  :0x53,  // 'S'
        STK_LOAD_ADDRESS   :0x55,  // 'U'
        STK_UNIVERSAL      :0x56,  // 'V'
        STK_PROG_FLASH     :0x60,  // '`'
        STK_PROG_DATA      :0x61,  // 'a'
        STK_PROG_FUSE      :0x62,  // 'b'
        STK_PROG_LOCK      :0x63,  // 'c'
        STK_PROG_PAGE      :0x64,  // 'd'
        STK_PROG_FUSE_EXT  :0x65,  // 'e'
        STK_READ_FLASH     :0x70,  // 'p'
        STK_READ_DATA      :0x71,  // 'q'
        STK_READ_FUSE      :0x72,  // 'r'
        STK_READ_LOCK      :0x73,  // 's'
        STK_READ_PAGE      :0x74,  // 't'
        STK_READ_SIGN      :0x75,  // 'u'
        STK_READ_OSCCAL    :0x76,  // 'v'
        STK_READ_FUSE_EXT  :0x77,  // 'w'
        STK_READ_OSCCAL_EXT:0x78,  // 'x'

        STK_PARM_SW_MAJOR:  0x81,
        STK_PARM_SW_MINOR:  0x82,
    };

    // Erase (x043) and Extended Erase (0x44) are exclusive. A device may support either the Erase command or the Extended Erase command but not both.

    this.available_flash_size = 0;
    this.page_size = 0;
    this.useExtendedErase = false;
};


function sleep(milliseconds) {
    var start = new Date().getTime();
    for (var i = 0; i < 1e7; i++) {
        if ((new Date().getTime() - start) > milliseconds){
            break;
        }
    }
}

// no input parameters
STK500_protocol.prototype.connect = function (port, baud, hex, options, callback) {
    var self = this;
    self.hex = hex;
    self.baud = baud;
    self.callback = callback;


    if (true) {
        serial.connect(port, {bitrate: self.baud, parityBit: 'no', stopBits: 'one'}, function (openInfo) {
            if (openInfo) {
                // we are connected, disabling connect button in the UI
                GUI.connect_lock = true;

                self.initialize();
            } else {
                GUI.log(i18n.getMessage('serialPortOpenFail'));
            }
        });

    } else {
        serial.connect(port, {bitrate: self.options.reboot_baud}, function (openInfo) {
            if (openInfo) {
                console.log('Sending ascii "R" to reboot');

                // we are connected, disabling connect button in the UI
                GUI.connect_lock = true;

                var bufferOut = new ArrayBuffer(1);
                var bufferView = new Uint8Array(bufferOut);

                bufferView[0] = 0x52;

                serial.send(bufferOut, function () {
                    serial.disconnect(function (result) {
                        if (result) {
                            // delay to allow board to boot in bootloader mode
                            // required to detect if a DFU device appears
                            setTimeout(function() {
                                // refresh device list
                                PortHandler.check_usb_devices(function(dfu_available) {
                                    if(dfu_available) {
                                        STM32DFU.connect(usbDevices.STM32DFU, hex, options);
                                    } else {
                                        serial.connect(port, {bitrate: self.baud, parityBit: 'even', stopBits: 'one'}, function (openInfo) {
                                            if (openInfo) {
                                                self.initialize();
                                            } else {
                                                GUI.connect_lock = false;
                                                GUI.log(i18n.getMessage('serialPortOpenFail'));
                                            }
                                        });
                                    }
                                });
                            }, 1000);
                        } else {
                            GUI.connect_lock = false;
                        }
                    });
                });
            } else {
                GUI.log(i18n.getMessage('serialPortOpenFail'));
            }
        });
    }
};

// initialize certain variables and start timers that oversee the communication
STK500_protocol.prototype.initialize = function () {
    var self = this;

    // reset and set some variables before we start
    self.receive_buffer = [];
    self.verify_hex = [];

    self.upload_time_start = new Date().getTime();
    self.upload_process_alive = false;

    // reset progress bar to initial state
    self.progress_bar_e = $('.progress');
    self.progress_bar_e.val(0);
    self.progress_bar_e.removeClass('valid invalid');

    // lock some UI elements TODO needs rework
    $('select[name="release"]').prop('disabled', true);

    serial.onReceive.addListener(function (info) {
        self.read(info);
    });

    GUI.interval_add('STK500_timeout', function () {
        if (self.upload_process_alive) { // process is running
            self.upload_process_alive = false;
        } else {
            console.log('STK500 - timed out, programming failed ...');

            $('span.progressLabel').text(i18n.getMessage('stk500TimedOut'));
            self.progress_bar_e.addClass('invalid');

            // protocol got stuck, clear timer and disconnect
            GUI.interval_remove('STK500_timeout');

            // exit
            self.upload_procedure(99);
        }
    }, 2000);

    self.upload_procedure(1);
};

// no input parameters
// this method should be executed every 1 ms via interval timer
STK500_protocol.prototype.read = function (readInfo) {
    // routine that fills the buffer
    var data = new Uint8Array(readInfo.data);

    for (var i = 0; i < data.length; i++) {
        this.receive_buffer.push(data[i]);
    }

    // routine that fetches data from buffer if statement is true
    if (this.receive_buffer.length >= this.bytes_to_read && this.bytes_to_read != 0) {
        var data = this.receive_buffer.slice(0, this.bytes_to_read); // bytes requested
        this.receive_buffer.splice(0, this.bytes_to_read); // remove read bytes

        this.bytes_to_read = 0; // reset trigger

        this.read_callback(data);
    }
};

// we should always try to consume all "proper" available data while using retrieve
STM32_protocol.prototype.retrieve = function (n_bytes, callback) {
    if (this.receive_buffer.length >= n_bytes) {
        // data that we need are there, process immediately
        var data = this.receive_buffer.slice(0, n_bytes);
        this.receive_buffer.splice(0, n_bytes); // remove read bytes

        callback(data);
    } else {
        // still waiting for data, add callback
        this.bytes_to_read = n_bytes;
        this.read_callback = callback;
    }
};

// Array = array of bytes that will be send over serial
// bytes_to_read = received bytes necessary to trigger read_callback
// callback = function that will be executed after received bytes = bytes_to_read
STK500_protocol.prototype.send = function (Array, bytes_to_read, callback) {
    // flip flag
    this.upload_process_alive = true;

    var bufferOut = new ArrayBuffer(Array.length);
    var bufferView = new Uint8Array(bufferOut);

    // set Array values inside bufferView (alternative to for loop)
    bufferView.set(Array);

    // update references
    this.bytes_to_read = bytes_to_read;
    this.read_callback = callback;

    // empty receive buffer before next command is out
    this.receive_buffer = [];

    // send over the actual data
    serial.send(bufferOut, function (writeInfo) {});
};

// val = single byte to be verified
// data = response of n bytes from mcu (array)
// result = true/false
STK500_protocol.prototype.verify_response = function (val, data) {
    var self = this;
    
    if (val != data[0]) {
        var message = 'STM32 Communication failed, wrong response, expected: ' + val + ' (0x' + val.toString(16) + ') received: ' + data[0] + ' (0x' + data[0].toString(16) + ')';
        console.error(message);
        $('span.progressLabel').text(i18n.getMessage('stm32WrongResponse',[val, val.toString(16), data[0], data[0].toString(16)]));
        self.progress_bar_e.addClass('invalid');

        // disconnect
        this.upload_procedure(99);

        return false;
    }

    return true;
};


STK500_protocol.prototype.verify_avr_signature = function (val, data) {
    for (var m = 0; m < val.length; m++) {
        if(val[m] != data[m]) {
            console.error('Chip signature is not valid');
            return false;
        }
    }
    console.log('Chip signature is OK');
    return true;
};

// first_array = usually hex_to_flash array
// second_array = usually verify_hex array
// result = true/false
STK500_protocol.prototype.verify_flash = function (first_array, second_array) {
    for (var i = 0; i < first_array.length; i++) {
        if (first_array[i] != second_array[i]) {
            console.log('Verification failed on byte: ' + i + ' expected: 0x' + first_array[i].toString(16) + ' received: 0x' + second_array[i].toString(16));
            return false;
        }
    }

    console.log('Verification successful, matching: ' + first_array.length + ' bytes');

    return true;
};

// step = value depending on current state of upload_procedure
STK500_protocol.prototype.upload_procedure = function (step) {
    var self = this;


    switch (step) {
        case 1:
            // initialize serial interface on the MCU side, auto baud rate settings
            $('span.progressLabel').text(i18n.getMessage('stm32ContactingBootloader'));

            serial.setControlSignals({ dtr: false, rts: false }, function (result) {
                if(result)
                {

                }
            });
            sleep(250);
            serial.setControlSignals({ dtr: true, rts: true }, function (result) {
                if(result)
                {

                }
            });
            sleep(50);

            var send_counter = 0;
            GUI.interval_add('stk500_initialize_mcu', function () { // 200 ms interval (just in case mcu was already initialized), we need to break the 2 bytes command requirement
                self.send([self.const.STK_GET_SYNC, self.const.CRC_EOP], 2, function (reply) {
                    console.log(parseInt(reply[0].toString(16) + ' ' + parseInt(reply[1].toString(16))));
                    if (reply[0] == self.const.STK_INSYNC && reply[1] == self.const.STK_OK) {
                        GUI.interval_remove('stk500_initialize_mcu');
                        console.log('STK500 - Serial interface initialized on the MCU side');

                        // proceed to next step
                        self.upload_procedure(2);
                    } else {
                        $('span.progressLabel').text(i18n.getMessage('stk500ContactingBootloaderFailed'));
                        self.progress_bar_e.addClass('invalid');

                        GUI.interval_remove('stk500_initialize_mcu');

                        // disconnect
                        self.upload_procedure(99);
                    }
                });

                if (send_counter++ > 3) {
                    // stop retrying, its too late to get any response from MCU
                    console.log('STK500 - no response from bootloader, disconnecting');

                    $('span.progressLabel').text(i18n.getMessage('stk500ResponseBootloaderFailed'));
                    self.progress_bar_e.addClass('invalid');

                    GUI.interval_remove('stk500_initialize_mcu');
                    GUI.interval_remove('STK500_timeout');

                    // exit
                    self.upload_procedure(99);
                }
            }, 250, true);
            break;
        case 2:
            // get ID (device signature)
            self.send([self.const.STK_READ_SIGN, self.const.CRC_EOP], 4, function (data) {
                data.shift(); //remove first element from response
                if (self.verify_avr_signature(self.signature.ATMEGA328, data)) {
                    console.log('Chip signature is: ' + data[0].toString(16) + ' ' + data[1].toString(16) + ' ' + data[2].toString(16));
                    self.upload_procedure(3);
                }
                else
                {
                    // disconnect
                    self.upload_procedure(99);
                }
            });
            break;
        case 3:
            // Initialize device
            self.send([self.const.STK_GET_PARAMETER, self.const.STK_PARM_SW_MAJOR, self.const.CRC_EOP], 3, function (data) {
                if (data[2] == self.const.STK_FAILED || data[0] != self.const.STK_INSYNC) {
                    console.log('Retrieving parameter ' + self.const.STK_PARM_SW_MAJOR.toString(16) + ' failed');
                    self.upload_procedure(99);
                }
                else if (data[2] != self.const.STK_OK || data[0] != self.const.STK_INSYNC)
                {
                    console.log('General protocol error while retrieving parameter ' + self.const.STK_PARM_SW_MAJOR.toString(16) );
                    // disconnect
                    self.upload_procedure(99);
                }
                self.majorVersion = data[1];
                self.upload_procedure(4);
            });
            break;
        case 4:
            self.send([self.const.STK_GET_PARAMETER, self.const.STK_PARM_SW_MINOR, self.const.CRC_EOP], 3, function (data) {
                if (data[2] == self.const.STK_FAILED || data[0] != self.const.STK_INSYNC) {
                    console.log('Retrieving parameter ' + self.const.STK_PARM_SW_MINOR.toString(16) + ' failed');
                    self.upload_procedure(99);
                }
                else if (data[2] != self.const.STK_OK || data[0] != self.const.STK_INSYNC)
                {
                    console.log('General protocol error while retrieving parameter ' + self.const.STK_PARM_SW_MINOR.toString(16) );
                    // disconnect
                    self.upload_procedure(99);
                }
                self.minorVersion = data[1];
                console.log('Retrieved software version: ' + self.majorVersion.toString(10) + '.' +  self.minorVersion.toString(10));
                console.log('Setting device programming parameters...');
                self.upload_procedure(45);
            });
            break;
        case 45:
            // SetDeviceProgrammingParametersRequest
            var Bytes = [];
            var flashSize = 32 * 1024;
            var epromSize = 1024;

            Bytes[0] = self.const.STK_SET_DEVICE;
            Bytes[1] = 0x86;//mcu.DeviceCode;
            Bytes[2] = 0x00;//mcu.DeviceRevision;
            Bytes[3] = 0x00;//mcu.ProgType;
            Bytes[4] = 0x01;//mcu.ParallelMode;
            Bytes[5] = 0x01;//mcu.Polling;
            Bytes[6] = 0x01//mcu.SelfTimed;
            Bytes[7] = 0x01;//mcu.LockBytes;
            Bytes[8] = 0x03;//mcu.FuseBytes;
            Bytes[9] = 0xff;//flashMem.PollVal1;
            Bytes[10] = 0xff;//flashMem.PollVal2;
            Bytes[11] = 0xff;//eepromMem.PollVal1;
            Bytes[12] = 0xff;//eepromMem.PollVal2;
            Bytes[13] = ((self.PAGE_SIZE >> 8) & 0xff);
            Bytes[14] = (self.PAGE_SIZE & 0xff);
            Bytes[15] = ((epromSize >> 8) & 0xff);
            Bytes[16] = (epromSize & 0xff);
            Bytes[17] = ((flashSize >> 24) & 0xff);
            Bytes[18] = ((flashSize >> 16) & 0xff);
            Bytes[19] = ((flashSize >> 8) & 0xff);
            Bytes[20] = (flashSize & 0xff);
            Bytes[21] = self.const.CRC_EOP;

            self.send(Bytes, 2, function (data) {
                if (data[1] != self.const.STK_OK) {
                    console.log('Unable to set device programming parameters!');
                    self.upload_procedure(99);
                }
                else {

                }
                console.log('Device programming parameters are set.');
                self.upload_procedure(46);
            });

            break;
        case 46:
            //Enabling programming mode
            self.send([self.const.STK_ENTER_PROGMODE, self.const.CRC_EOP], 2, function (data) {
                if (data[1] != self.const.STK_OK) {
                    console.log('Unable to enable programming mode on the device!');
                    self.upload_procedure(99);
                }
                else {

                }
                console.log('Programming mode set!');
                self.upload_procedure(5);
            });
            break;
        case 5:
            // upload
            console.log('Writing data ...');
            $('span.progressLabel').text(i18n.getMessage('stk500Flashing'));

            var blocks = self.hex.data.length - 1,
                flashing_block = 0,
                address = self.hex.data[flashing_block].address,
                bytes_flashed = 0,
                bytes_flashed_total = 0, // used for progress bar
                progCount = 0;

            var write = function () {
                var startPos = self.PAGE_SIZE * progCount;
                var progData = new Array(self.PAGE_SIZE);
                self.pageCount = Math.round(Math.round(((self.hex.data[0].bytes)))/self.PAGE_SIZE);

                for(var b = 0; b < self.PAGE_SIZE; b++){
                    if( (startPos + b) < self.hex.data[0].bytes){
                        progData[b] = self.hex.data[0].data[startPos + b];
                    } else {
                        progData[b] = (0xff);
                    }
                }
                var cmdProg = [];
                cmdProg = cmdProg.concat(self.const.STK_PROG_PAGE);
                cmdProg = cmdProg.concat((progData.length >> 8) & 0xFF);
                cmdProg = cmdProg.concat((progData.length) & 0xFF);
                cmdProg = cmdProg.concat(0x46); // "F", Flash
                cmdProg = cmdProg.concat(progData);
                cmdProg = cmdProg.concat(self.const.CRC_EOP);

                bytes_flashed_total += self.PAGE_SIZE;

                self.send(cmdProg, 2, function (reply) {
                    if(reply[1] == self.const.STK_OK && progCount <= self.pageCount)
                    {
                        var startPos = self.PAGE_SIZE * progCount; // next page is after 128byte

                        var high = ((startPos/2) >> 8) & 0xff;
                        var low = (startPos/2) & 0xff;
                        var cmdLoadAddress = [];
                        cmdLoadAddress = cmdLoadAddress.concat(self.const.STK_LOAD_ADDRESS);
                        cmdLoadAddress = cmdLoadAddress.concat(low);
                        cmdLoadAddress = cmdLoadAddress.concat(high);
                        cmdLoadAddress = cmdLoadAddress.concat(self.const.CRC_EOP);
                        console.log('Written page ' + progCount);

                        // update progress bar
                        self.progress_bar_e.val(Math.round(bytes_flashed_total / (self.hex.bytes_total * 2) * 100));

                        //cmdStatus = STATUS_LOAD_ADDRESS_FOR_WRITE;
                        self.send(cmdLoadAddress, 2, function (reply) {
                            if(reply[1] == self.const.STK_OK)
                                write();
                        });
                    }
                    else
                    {
                        self.upload_procedure(6);
                    }

                });

                progCount++;
            }

            // start writing
            write();
            break;
        case 6:
            // verify
            console.log('Verifying data ...');
            $('span.progressLabel').text(i18n.getMessage('stk500Verifying'));

            var blocks = self.hex.data.length - 1,
                reading_block = 0,
                address = self.hex.data[reading_block].address,
                bytes_verified = 0,
                bytes_verified_total = 0; // used for progress bar

            // initialize arrays
            for (var i = 0; i <= blocks; i++) {
                self.verify_hex.push([]);
            }

            var progCount = 0;
            self.verify_hex[0] = [];

            var reading = function () {
                var startPos = self.PAGE_SIZE * progCount;

                var high = ((startPos/2) >> 8) & 0xff;
                var low = (startPos/2) & 0xff;
                var cmdLoadAddressForRead = [];
                cmdLoadAddressForRead = cmdLoadAddressForRead.concat(self.const.STK_LOAD_ADDRESS);
                cmdLoadAddressForRead = cmdLoadAddressForRead.concat(low);
                cmdLoadAddressForRead = cmdLoadAddressForRead.concat(high);
                cmdLoadAddressForRead = cmdLoadAddressForRead.concat(self.const.CRC_EOP);

                console.log("Sending load address request: " + startPos);

                self.send(cmdLoadAddressForRead, 2, function (reply) {
                    if(reply[1] == self.const.STK_OK)
                    {
                        var cmdRead = [];
                        cmdRead = cmdRead.concat(self.const.STK_READ_PAGE);
                        cmdRead = cmdRead.concat((self.PAGE_SIZE >> 8) & 0xff);
                        cmdRead = cmdRead.concat(self.PAGE_SIZE & 0xff);
                        cmdRead = cmdRead.concat(0x46); // "F", Flash
                        cmdRead = cmdRead.concat(self.const.CRC_EOP);

                        console.log('Read page ' + progCount);
                        progCount++;
                        bytes_verified_total +=  self.PAGE_SIZE;

                        // update progress bar
                        self.progress_bar_e.val(Math.round((self.hex.bytes_total + bytes_verified_total) / (self.hex.bytes_total * 2) * 100));

                        self.send(cmdRead, self.PAGE_SIZE+2, function (reply) {
                            if(reply[self.PAGE_SIZE+1] == self.const.STK_OK)
                            {
                                reply.shift();
                                for (var i = 0; i < self.PAGE_SIZE; i++) {
                                    self.verify_hex[0].push(reply[i]);
                                }

                                if(progCount <= self.pageCount)
                                {
                                    reading();
                                }
                                else
                                {
                                    self.send([self.const.STK_LEAVE_PROGMODE, self.const.CRC_EOP], 2, function (data) {
                                        if (data[1] != self.const.STK_OK) {
                                            console.log('Unable to leave programming mode on the device!');
                                            self.upload_procedure(99);
                                        }
                                        else {

                                        }
                                        console.log('Programming mode left!');


                                        // all blocks read, verify

                                        var verify = true;
                                        for (var i = 0; i <= blocks; i++) {
                                            verify = self.verify_flash(self.hex.data[i].data, self.verify_hex[i]);

                                            if (!verify) break;
                                        }

                                        if (verify) {
                                            console.log('Programming: SUCCESSFUL');
                                            $('span.progressLabel').text(i18n.getMessage('stm32ProgrammingSuccessful'));

                                            // update progress bar
                                            self.progress_bar_e.addClass('valid');

                                            // proceed to next step
                                            self.upload_procedure(7);
                                        } else {
                                            console.log('Programming: FAILED');
                                            $('span.progressLabel').text(i18n.getMessage('stm32ProgrammingFailed'));

                                            // update progress bar
                                            self.progress_bar_e.addClass('invalid');

                                            // disconnect
                                            self.upload_procedure(99);
                                        }

                                        self.upload_procedure(7);
                                    });

                                }
                            }
                            else
                            {
                                console.log('Error reading device!');
                            }

                        });
                    }
                    else
                    {

                    }

                });

            }

            // start reading
            reading();
            break;
        case 7:
            // go
            console.log('Resetting');
            serial.setControlSignals({ dtr: false, rts: false }, function (result) {
                if(result)
                {

                }
            });
            sleep(250);
            serial.setControlSignals({ dtr: true, rts: true }, function (result) {
                if(result)
                {

                }
            });
            sleep(50);
            self.upload_procedure(99);

            break;
        case 99:
            // disconnect
            GUI.interval_remove('STK500_timeout'); // stop STM32 timeout timer (everything is finished now)

            // close connection
            if (serial.connectionId) {
                serial.disconnect(self.cleanup);
            } else {
                self.cleanup();
            }

            break;
    }
};

STK500_protocol.prototype.cleanup = function () {
    PortUsage.reset();

    // unlocking connect button
    GUI.connect_lock = false;

    // unlock some UI elements TODO needs rework
    $('select[name="release"]').prop('disabled', false);

    // handle timing
    var timeSpent = new Date().getTime() - self.upload_time_start;

    console.log('Script finished after: ' + (timeSpent / 1000) + ' seconds');

    if (self.callback) {
        self.callback();
    }
}

// initialize object
var STK500 = new STK500_protocol();
