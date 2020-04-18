var fs = require('fs');
var p = require('./param-v1.js');

var RATE_STK500V1 = 115200;
var DEBUG = false;
var isConnecting = false;
var serialPort;
var portDir;
var dataDir;
var PAGE_SIZE = 128;
var myHex = [];
var progCount;

var hexLines;
var unusedBytes;
var pageCount;

// command.
var CMD_STK_GET_SYNC = [p.STK_GET_SYNC, p.CRC_EOP];
var CMD_GET_MAJOR = [p.STK_GET_PARAMETER, 0x81, p.CRC_EOP];
var CMD_GET_MINOR = [p.STK_GET_PARAMETER, 0x82, p.CRC_EOP];
var CMD_SET_DEVICE = [p.STK_SET_DEVICE,
    0x86,  // device code
    0x00,  // revision
    0x00,  // progtype
    0x01,  // parmode
    0x01,  // polling
    0x01,  // selftimed
    0x01,  // lockbytes
    0x03,  // fusebytes
    0xFF,  // flashpollval1
    0xFF,  // flashpollval2
    0xFF,  // eeprompollval1
    0xFF,  // eeprompollval2
    0x00,  // pagesizehigh
    0x80,  // pagesizelow
    0x04,  // eepromsizehigh
    0x00,  // eepromsizelow
    0x00,  // flashsize4
    0x00,  // flashsize3
    0x80,  // flashsize2
    0x00,  // flashsize1
    p.CRC_EOP
];
var CMD_SET_DEVICE_EXT = [p.STK_SET_DEVICE_EXT,
    0x05,  // commandsize
    0x04,  // eeprompagesize
    0xD7,  // signalpagel
    0xC2,  // signalbs2:
    0x00,  // ResetDisable
    p.CRC_EOP
];
var CMD_READ_SIG = [p.STK_READ_SIGN, p.CRC_EOP];
var CMD_UNIVERSAL = [p.STK_UNIVERSAL, 0xac, 0x80, 0x00, 0x00, p.CRC_EOP];
var CMD_ENTER_PROGRAM_MODE = [p.STK_ENTER_PROGMODE, p.CRC_EOP];
var CMD_LOAD_ADDRESS = [p.STK_LOAD_ADDRESS];
var CMD_PROG_PAGE = [p.STK_PROG_PAGE];
var CMD_READ_PAGE = [p.STK_READ_PAGE];
var CMD_LEAVE_PROGRAM_MODE = [p.STK_LEAVE_PROGMODE, p.CRC_EOP];
var cmdLoadAddress;
var cmdLoadAddressForRead
var cmdProg;
var cmdRead;
var cmdStatus;

var STATUS_STK_GET_SYNC = 1;
var STATUS_GET_MAJOR = 2;
var STATUS_GET_MINOR = 3;
var STATUS_SET_DEVICE = 4;
var STATUS_SET_DEVICE_EXT = 5;
var STATUS_ENTER_PROGRAM_MODE = 6;
var STATUS_READ_SIG = 7;
var STATUS_LOAD_ADDRESS_FOR_WRITE = 8;
var STATUS_PROG_PAGE = 9;
var STATUS_LOAD_ADDRESS_FOR_READ = 10;
var STATUS_READ_PAGE = 11;
var STATUS_LEAVE_PROGRAM_MODE = 12;
var STATUS_FINISH = 13;

module.exports.enableDebug = function() {
    DEBUG = true;
};

module.exports.write = function() {

    // Connect serial port.
    serialPort = new com.SerialPort(portDir, {
        baudrate: RATE_STK500V1,
        parser: com.parsers.raw,
    }, false);

    // Open serial port.
    serialPort.open(function (error) {

        if ( error ) {
            console.log('failed to open: '+error);
        } else {

            isConnecting = true;
            console.log('SerialPort open:' + portDir);
        }

        setTimeout(asserting, 100);
    });

    serialPort.on('data', function(data) {

        if(DEBUG){
            logResponse(data);
        }

        if(cmdStatus == STATUS_STK_GET_SYNC && data[0] == p.STK_INSYNC && data[1] == p.STK_OK) {
            cmdStatus = STATUS_GET_MAJOR;
            setTimeout(sendCommand(CMD_GET_MAJOR), 500);
        }
        else if(cmdStatus == STATUS_GET_MAJOR && data[0] == p.STK_INSYNC && data[2] == p.STK_OK) {
            cmdStatus = STATUS_GET_MINOR;
            setTimeout(sendCommand(CMD_GET_MINOR), 500);
        }
        else if(cmdStatus == STATUS_GET_MINOR && data[0] == p.STK_INSYNC && data[2] == p.STK_OK) {
            cmdStatus = STATUS_SET_DEVICE;
            setTimeout(sendCommand(CMD_SET_DEVICE), 500);
        }
        else if(cmdStatus == STATUS_SET_DEVICE && data[0] == p.STK_INSYNC && data[1] == p.STK_OK) {
            cmdStatus = STATUS_SET_DEVICE_EXT;
            setTimeout(sendCommand(CMD_SET_DEVICE_EXT), 500);
        }
        else if(cmdStatus == STATUS_SET_DEVICE_EXT && data[0] == p.STK_INSYNC && data[1] == p.STK_OK) {
            cmdStatus = STATUS_ENTER_PROGRAM_MODE;
            setTimeout(sendCommand(CMD_ENTER_PROGRAM_MODE), 500);
        }
        else if(cmdStatus == STATUS_ENTER_PROGRAM_MODE && data[0] == p.STK_INSYNC && data[1] == p.STK_OK) {
            cmdStatus = STATUS_READ_SIG;
            setTimeout(sendCommand(CMD_READ_SIG), 500);
        }
        else if(cmdStatus == STATUS_READ_SIG && data[0] == p.STK_INSYNC && data[4] == p.STK_OK) {
            progCount = 0;

            var startPos = 0;

            var high = (startPos >> 8) & 0xff;
            var low = startPos & 0xff;
            cmdLoadAddress = CMD_LOAD_ADDRESS.concat(low);
            cmdLoadAddress = cmdLoadAddress.concat(high);
            cmdLoadAddress = cmdLoadAddress.concat(p.CRC_EOP);
            cmdStatus = STATUS_LOAD_ADDRESS_FOR_WRITE;
            setTimeout(sendCommand(cmdLoadAddress), 500);
        }
        else if(cmdStatus == STATUS_LOAD_ADDRESS_FOR_WRITE && data[0] == p.STK_INSYNC && data[1] == p.STK_OK) {

            var startPos = PAGE_SIZE * progCount;
            var progData = new Array(128);

            for(var b = 0; b < PAGE_SIZE; b++){
                if( (startPos + b) < myHex.length){
                    progData[b] = parseInt(myHex[startPos + b], 16);
                } else {
                    progData[b] = (0xff);
                }
            }

            cmdProg = CMD_PROG_PAGE.concat(0x00);
            cmdProg = cmdProg.concat(progData.length);
            cmdProg = cmdProg.concat(0x46); // "F", Flash
            cmdProg = cmdProg.concat(progData);
            cmdProg = cmdProg.concat(p.CRC_EOP);

            cmdStatus = STATUS_PROG_PAGE;
            setTimeout(sendCommand(cmdProg), 500);
            progCount++;
        }
        else if(cmdStatus == STATUS_PROG_PAGE && data[0] == p.STK_OK) {

            if(progCount <= pageCount) {
                var startPos = PAGE_SIZE * progCount; // next page is after 128byte

                var high = ((startPos/2) >> 8) & 0xff;
                var low = (startPos/2) & 0xff;
                cmdLoadAddress = CMD_LOAD_ADDRESS.concat(low);
                cmdLoadAddress = cmdLoadAddress.concat(high);
                cmdLoadAddress = cmdLoadAddress.concat(p.CRC_EOP);

                cmdStatus = STATUS_LOAD_ADDRESS_FOR_WRITE;
                setTimeout(sendCommand(cmdLoadAddress), 500);
            } else {
                /*
                var startPos = 0;
                progCount = 0;
                var high = (startPos >> 8) & 0xff;
                var low = startPos & 0xff;
                cmdLoadAddressForRead = CMD_LOAD_ADDRESS.concat(low);
                cmdLoadAddressForRead = cmdLoadAddressForRead.concat(high);
                cmdLoadAddressForRead = cmdLoadAddressForRead.concat(p.CRC_EOP);
                cmdStatus = STATUS_LOAD_ADDRESS_FOR_READ;
                setTimeout(sendCommand(cmdLoadAddressForRead), 500);
                */
                cmdStatus = STATUS_LEAVE_PROGRAM_MODE;
                setTimeout(sendCommand(CMD_LEAVE_PROGRAM_MODE), 500);
            }
        }
        else if(cmdStatus == STATUS_LOAD_ADDRESS_FOR_READ && data[0] == p.STK_INSYNC && data[1] == p.STK_OK) {

            cmdRead = CMD_READ_PAGE.concat(0x00);
            cmdRead = cmdRead.concat(0x80);
            cmdRead = cmdRead.concat(0x46); // "F", Flash
            cmdRead = cmdRead.concat(p.CRC_EOP);

            cmdStatus = STATUS_READ_PAGE;
            setTimeout(sendCommand(cmdRead), 500);
            progCount++;

        }
        else if(cmdStatus == STATUS_READ_PAGE) {
            var lastNo = data.length;

            if(data[lastNo-1] == p.STK_OK) {
                if (progCount <= pageCount){
                    var startPos = PAGE_SIZE * progCount; // next page is after 128byte

                    var high = ((startPos/2) >> 8) & 0xff;
                    var low = (startPos/2) & 0xff;
                    cmdLoadAddressForRead = CMD_LOAD_ADDRESS.concat(low);
                    cmdLoadAddressForRead = cmdLoadAddressForRead.concat(high);
                    cmdLoadAddressForRead = cmdLoadAddressForRead.concat(p.CRC_EOP);
                    cmdStatus = STATUS_LOAD_ADDRESS_FOR_READ;
                    setTimeout(sendCommand(cmdLoadAddressForRead), 500);

                }
                else{
                    cmdStatus = STATUS_LEAVE_PROGRAM_MODE;
                    setTimeout(sendCommand(CMD_LEAVE_PROGRAM_MODE), 500);
                }
            }
        }
        else if(cmdStatus == STATUS_LEAVE_PROGRAM_MODE){
            cmdStatus = STATUS_FINISH;
            setTimeout(process.exit(0), 1000);
        }
    });
}

sendCommand = function (mCmd){
    var cmd = mCmd;
    serialPort.write(mCmd, function(err, results) {
        if(!err){
            if(DEBUG){
                logCommand(cmd);
            }
        } else {
            console.log(err);
        }
    });
}

logCommand = function(cmd){
    var log_cmd = "[COMMAND: ";
    for(i=0; i<cmd.length; i++) {
        var tmp_str = cmd[i].toString(16);
        if(tmp_str.length == 1){
            tmp_str = "0x0" + tmp_str;
        } else {
            tmp_str = "0x" + tmp_str;
        }

        log_cmd +=  tmp_str + ',';
    }
    log_cmd += "]";
    console.log(log_cmd);
}

logResponse = function(res){
    var log_res = "[";
    for(i=0; i<res.length; i++) {
        var tmp_str = res[i].toString(16);
        if(tmp_str.length == 1){
            tmp_str = "0x0" + tmp_str;
        } else {
            tmp_str = "0x" + tmp_str;
        }

        log_res +=  tmp_str + ',';
    }
    log_res += "]";
    console.log(log_res);
}

// set SerialPort.
module.exports.setPort = function(dir) {
    portDir = dir;
};

// set data of aruduino.
module.exports.setData = function(dir) {
    dataDir = dir;

    var hex = fs.readFileSync(dir, { encoding: 'utf8'}).split("");

    if(!hex || hex.length == 0){
        console.log("Can't open file:" + dir);
        return;
    } else {
        console.log("load file:" + dir);

        // delete 13 bytes from last.
        hex.splice(hex.length - 13, 13);

        // calc line number of data.
        hexLines = Math.ceil(hex.length/45);
        // calc unusedBytes.
        unusedBytes = (45 - 32) * hexLines;
        // calc count of data.
        pageCount = Math.round(Math.round(((hex.length - unusedBytes)/2))/PAGE_SIZE);

        // Converte to binary data.
        for(var l = 0; l < hexLines; l++){
            var nowPos = 45 * l;
            for(var i = 9; i < 41; i+=2){
                if(nowPos + i < hex.length - 4){
                    var msbByte = hex[nowPos + i];
                    var lsbByte = hex[nowPos + i + 1]
                    var strHex = msbByte + lsbByte;
                    myHex.push(strHex);
                }
            }
        }


        console.log("load hex size:" + hex.length);
        console.log("use size:" + (hex.length - unusedBytes));
        console.log("use hex size:" + myHex.length);
        console.log("page size:" + pageCount);

    }
};

module.exports.isConnecting = function() {
    return isConnecting;
};

// rts: fasle, dtr: false
asserting = function() {
    if(DEBUG){
        console.log('USB Init: asserting');
    }
    serialPort.set({rts:false, dtr:false}, function(err, something) {
        if(DEBUG){
            console.log('USB Init: asserted');
        }
        setTimeout(clear, 100);
    });
}

// rts: true, dtr: true
clear = function() {
    if(DEBUG){
        console.log('USB Init: clearing');
    }
    serialPort.set({rts:true, dtr:true}, function(err, something) {
        if(DEBUG){
            console.log('USB Init: clear');
        }
        setTimeout(done, 100);
    });
}

// done usb init.
done = function() {
    if(DEBUG){
        console.log("USB Init: done resetting");
    }
    cmdStatus = STATUS_STK_GET_SYNC;
    setTimeout(sendCommand(CMD_STK_GET_SYNC), 100);
}