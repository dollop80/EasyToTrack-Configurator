var GTS = {
    last_received_timestamp: null,
    read: function (readInfo) {

        ParseStream(new Uint8Array(readInfo.data));

        this.lineBuffer += String.fromCharCode.apply(null, new Uint8Array(readInfo.data));

        var index;

        while ((index = this.lineBuffer.indexOf('\n')) >= 0) {

            var line = this.lineBuffer.substr(0, index + 1);
            var showOnConsole = true;



            // ------- DIRECCIONAMOS LOS MSG ----------- //

            // Welcome msg from cli entering
            if (line.contains('Entering')) {
                CONFIGURATOR.connectionValid = true;
                TABS.cli.cli_enter_msg = line;
                GTS.send("version\n");
            }

            // Si recivimos versión
            if (line.contains('u360gts') || line.contains('amv-open360tracker')) {
    
                GUI.log(line);
                /*var i = 0;
                var version_line = line.split(' ');
				version_line.forEach(function (x) {
					console.log('i: ' + i + ' x: ' + x);
                    i++;
                });*/
				this.parseConfigFirmwareInfo(line.split(' '));
            }
			
            // Update Status array
            if (line.contains('# status')) {
                showOnConsole = false;
            }
			if (line.contains('System Uptime')) {
				GUI.status['uptime'] = parseStatus(line,"Uptime",": ")[0].replace(/^\s+|\s+$/g, '');
				showOnConsole = false;
			}
			if (line.contains('Voltage')) {
				GUI.status['vbat'] = parseStatus(line,"Voltage",": ")[0].replace(/^\s+|\s+$/g, '');
				showOnConsole = false;
			}
            if (line.contains('CPU Clock')) {
                GUI.status['cpu'] = parseStatus(line,"CPU Clock","=")[0];
                showOnConsole = false;
            }
            if (line.contains('MAG')) {
                GUI.status['mag'] =  parseStatus(line,"MAG","=")[0];
                showOnConsole = false;
            }
            if (line.contains('GPS')) {
                GUI.status['gps'] =  parseStatus(line,"GPS","=")[0];
                showOnConsole = false;
            }
			if (line.contains('Cycle Time')) {
                GUI.status['cycle'] =  parseStatus(line,"Time",":")[0];
				GUI.status['i2c'] =  parseStatus(line,"Errors",":")[0];
				GUI.status['config'] =  parseStatus(line,"size",":")[0];
                showOnConsole = false;
            }

            // Acciones al recibir estando en la pestaña Configuration o Settings
            if (GUI.active_tab === 'configuration' || GUI.active_tab === 'settings') {

                switch (TABS.configuration.lastCommand) {

                    case "set":
                        TABS.configuration.loadData(line);
                        break;

                    case "calibrate pan":
                        TABS.configuration.parseCalibratePan(line);
                        break;

                    case "calibrate mag":
                        if (line.contains("Calibration finished")) {
                            TABS.configuration.setCheckBox("mag_calibrated-checkbox", true);
                            GUI.log(i18n.getMessage("configurationCalibrationFinishedMessage"));
                            GUI.calibrate_lock = false;
                        }
                        break;
					case "tilt":
					case "heading":
						if (!line.startsWith("#"))
							TABS.configuration.lastCommandDone = true;
					break;
                }
            }

            // ------- --------------------- ----------- //

            this.lineBuffer = this.lineBuffer.substr(index + 1);

            if (showOnConsole && line.length > 2) {
                console.log("<<: " + line);
            }

            showOnLog = true;
        }



        this.last_received_timestamp = Date.now();

    },
    send: function (line, callback, showOnConsole) {

        var bufferOut = new ArrayBuffer(line.length);
        var bufView = new Uint8Array(bufferOut);

        for (var c_key = 0; c_key < line.length; c_key++) {
            bufView[c_key] = line.charCodeAt(c_key);
        }
/*
        if (!line.contains("status")) {
            console.log(">>: " + line);
        }
*/
        serial.send(bufferOut, callback);

    },
    sendGs: function (line, callback, showOnConsole) {

        var bufferOut = new ArrayBuffer(line.length);
        var bufView = new Uint8Array(bufferOut);

        for (var c_key = 0; c_key < line.length; c_key++) {
            bufView[c_key] = line.charCodeAt(c_key);
        }

        serialGs.send(bufferOut, callback);
    },
    set: function (param, value) {

        var command = 'set ' + param + ' = ' + value + '\n';

        console.log(command);
        this.send(command);

    },
    save: function () {

        this.send("save\n");

    },
    feature: function (param, value) {

        var command;

        if (value) {
            command = 'feature ' + param + '\n';
        } else {
            command = 'feature -' + param + '\n';
        }

        console.log(command);
        this.send(command);

    },
    setSerial: function (portNumber, portFunction, portBaudrate) {

        this.send("serial " + portNumber + " " + portFunction + " 115200 57600 " + portBaudrate + " 115200\n");

    },
    getStatus: function () {
        this.send("status\n");
    },
	parseConfigFirmwareInfo: function(data){
	    CONFIG.firmwareName = data[1];
        CONFIG.targetName = data[3];
        CONFIG.firmwareVersion = data[4];
        CONFIG.buildMonth = data[5];
        CONFIG.buildDay = data[6];
        CONFIG.buildYear = data[7];
        CONFIG.buildDate = data[9];
        CONFIG.buildId = data[10];
	}

};

function parseStatus(line, search, operator) {
    var result = [];
    var i = 0;
    line.split(', ').forEach(function (x) {
		if(x.contains(search)){
			var arr = x.split(search + operator);
			result[0] = arr[1];
		}
        i++;
    });
    return result;
}

var f_syn = 0;
var len = 0;
var crc = 0;
var cnt = 0;
var buff = [];

const FROMHOST_MSG_ID_SETUP = 0x00;
const SERVO_REQ_MSG_ID = 0x01;
const FROMHOST_AZIMUTH_MSG_ID = 0x02;
const FROMHOST_SOUND_MSG_ID = 0x03;
const FROMHOST_MANUAL_AZIMUTH_MSG_ID = 0x04;
const FROMHOST_PARAMS_ID_SETUP = 0x05;
const HOST2GS_POWEROFF_ID = 0x06;
const HOST2GS_HOST_HOME_ID = 0x07;
const GS2HOST_RSSI_ID = 0x09;
const HOST2GS_RSSI_ID = 0x08;
const GS2HOST_ADDITIONAL_DATA_ID = 0x0A;
const VIDEO_SETTINGS_ID = 0x0B;
const EXT_TELEM_SETTINGS_ID = 0x0C;

function ParseStream(received_data)
{
    var ch;
    for (var i = 0; i < received_data.length; i++)
    {
        ch = received_data[i];
        if (f_syn == 0)
        {
            if (ch == 0x5a)
                f_syn = 1;
        }
        else if (f_syn == 1)
        {
            if (ch < 2 || ch > 90)
                f_syn = 0;
            else
            {
                len = ch;
                crc = ch;
                cnt = 0;
                f_syn = 2;
            }
        }
        else
        {
            if (cnt > len)
            {
                f_syn = 0;
                if (crc == ch)
                {
                    var res = pack_params(buff);
                    switch (res) {
                        case 2:
                            TABS.configuration.loadServoCalibValues(AzimuthMinValue, AzimuthMaxValue, ElevationMinValue, ElevationMaxValue, Mode360Value, delay_change_ppm, TrSoundEnableValue, AzimuthCorrectionValue);
                            break;

                    }
                }
            }
            else
            {
                buff[cnt++] = ch;
                crc ^= ch;
            }
        }
    }
}


//Data coming from host
var TrackAzimuth = 0;
var  TrackElevation = 0;
var GPSlat = 0.0;
var GPSlon = 0.0;
var  GPScourse = 0;
var  Altitude = 0;
var  GPSspeed = 0;
var APmode = 0;
var ControlRssi = 0;
var RollAngle = 0;
var PitchAngle = 0;
var BattVoltage = 0.0;
var BattCurrent = 0.0;
var BattCapacity = 0.0;
var AnalogVideoRssi = 0;
var AnalogVideoErrors = 0;
var Airspeed = 0;
var HomeGPSlat = 0.0;
var HomeGPSlon = 0.0;
var LocBattVoltage = 0;
var DistanceToHome = 0.0;
var ID = 0;
var delay_change_ppm = 0.5;

var AzimuthMinValue;
var AzimuthMaxValue;
var ElevationMinValue;
var ElevationMaxValue;
var Mode360Value = false;

var AzimuthCorrectionValue;
var TrSoundEnableValue = false;
var AzimuthManualValue;
var ElevationManualValue;

var AzimuthFromHostValue;
var ElevationFromHostValue;
var HostLatValue = 0.0;
var HostLonValue = 0.0;


var GroundStationVersion = -1;
var SenderVersion = -1;
var SenderType = -1;


var GPSlatL;
var GPSlonL;

var RSSImax;
var RSSImin;
var RSSIcurr;

var AdditionalDataPresent = false; //Is true only whe additional data packet receved from GS. Starting from GS v1.7
var DistanceTraveled = 0.0;

var VideoStandard;
var VideoTelemThreshhold;

var ExtTelemetryType = -1;
var ExtTelemetryBaud = -1;

/*
Fill in the to_host_data with parsed data
*/
function pack_params(buff){
    var temp;
    var res = 0;
    if (buff[0]== FROMHOST_MSG_ID_SETUP) //original ground station packet
    {
        TrackAzimuth =((buff[2]&0xff)<<8)+(buff[1]&0xff);
        TrackElevation=((buff[4]&0xff)<<8)+(buff[3]&0xff);
        GPSlatL = ((((buff[8]&0xff)<<24)+((buff[7]&0xff)<<16)+((buff[6]&0xff)<<8)+(buff[5]&0xff)));
        GPSlonL = ((((buff[12]&0xff)<<24)+((buff[11]&0xff)<<16)+((buff[10]&0xff)<<8)+(buff[9]&0xff)));
        GPSlat=((((buff[8]&0xff)<<24)+((buff[7]&0xff)<<16)+((buff[6]&0xff)<<8)+(buff[5]&0xff)))/100000.0;
        GPSlon=((((buff[12]&0xff)<<24)+((buff[11]&0xff)<<16)+((buff[10]&0xff)<<8)+(buff[9]&0xff)))/100000.0;
        HomeGPSlat=((((buff[16]&0xff)<<24)+((buff[15]&0xff)<<16)+((buff[14]&0xff)<<8)+(buff[13]&0xff)))/100000.0;
        HomeGPSlon=((((buff[20]&0xff)<<24)+((buff[19]&0xff)<<16)+((buff[18]&0xff)<<8)+(buff[17]&0xff)))/100000.0;
        GPScourse=((buff[22]&0xff)<<8)+(buff[21]&0xff);
        Altitude=((buff[24]&0xff)<<8)+(buff[23]&0xff);
        GPSspeed=((buff[26]&0xff)<<8)+(buff[25]&0xff);
        APmode=buff[27]&0xff;
        ControlRssi=buff[28]&0xff;
        RollAngle=((buff[30]&0xff)<<8)+(buff[29]&0xff);
        temp = ((buff[32]&0xff)<<8)+(buff[31]&0xff) & 0xFFFF;
        //TODO to figure out from where goes the inversion in MSV mode
        if (SenderType == 0 || SenderType == 7)
            PitchAngle=-temp & 0xFFFF;
        else
            PitchAngle=temp & 0xFFFF;
        BattVoltage=(((buff[34]&0xff)<<8)+(buff[33]&0xff))/10.0;
        BattCurrent=(((buff[36]&0xff)<<8)+(buff[35]&0xff));
        BattCapacity=(((buff[38]&0xff)<<8)+(buff[37]&0xff));
        AnalogVideoRssi=((((buff[40]&0xff)<<8)+(buff[39]&0xff))); //Starting from GS v1.7 the RSSI is calculated according to min and max values on the GS side
        AnalogVideoErrors=buff[41]&0xff;
        Airspeed=((buff[43]&0xff)<<8)+(buff[42]&0xff);
        //LocBattVoltage=((buff[17]&0xff)<<8)+(buff[16]&0xff);
        GroundStationVersion=buff[44]&0xff;
        SenderType=buff[45]&0xff;   //if 0 - MSV autopilot
        SenderVersion=buff[46]&0xff;
        ID=buff[47]&0xff;
        res = 1;
    }
    else if (buff[0]==SERVO_REQ_MSG_ID)
    {
        AzimuthMinValue = ((buff[2]&0xff)<<8)+(buff[1]&0xff);
        ElevationMinValue = ((buff[4]&0xff)<<8)+(buff[3]&0xff);
        AzimuthMaxValue = ((buff[6]&0xff)<<8)+(buff[5]&0xff);
        ElevationMaxValue = ((buff[8]&0xff)<<8)+(buff[7]&0xff);
        if(buff[9]==1) //9
            Mode360Value=true;
        else
            Mode360Value=false;
        AzimuthCorrectionValue = ((buff[12]&0xff)<<8)+(buff[11]&0xff); //10 , 11
        if(buff[13]==1) //12
            TrSoundEnableValue=true;
        else
            TrSoundEnableValue=false;
        delay_change_ppm = (buff[14]&0xff)/24.0;
        res = 2;
    }

    else if (buff[0]==FROMHOST_AZIMUTH_MSG_ID)//AzElev Packet;
    {
        AzimuthManualValue =((buff[2]&0xff)<<8)+(buff[1]&0xff);
        ElevationManualValue = buff[3]&0xff;

        res = 3;
    }

    else if (buff[0]==GS2HOST_RSSI_ID)//RSSI Packet;
    {
        RSSIcurr = (((buff[4]&0xff)<<8)|(buff[3]&0xff)) & 0xFFFF;
        RSSImax = (((buff[6]&0xff)<<8)|(buff[5]&0xff)) & 0xFFFF;
        RSSImin = (((buff[8]&0xff)<<8)|(buff[7]&0xff)) & 0xFFFF;

        res = 4;
    }

    else if (buff[0]==GS2HOST_ADDITIONAL_DATA_ID)//Additional Data Packet;
    {
        AdditionalDataPresent = true;
        DistanceToHome = 10.0*(((buff[2]&0xff)<<8)+(buff[1]&0xff)); //in meters/10, to fit short. Up to 655km
        DistanceTraveled = 10.0*(((buff[4]&0xff)<<8)+(buff[3]&0xff)); //in meters/10, to fit short. Up to 655km

        res = 4;
    }

    else if (buff[0]==VIDEO_SETTINGS_ID) //Video settings
    {
        VideoStandard = buff[1] & 0xFF;
        VideoTelemThreshhold = buff[2] & 0xFF;

        res = 5;
    }

    else if (buff[0]==EXT_TELEM_SETTINGS_ID) //External telemetry settings
    {
        ExtTelemetryType = buff[1] & 0xFF;
        ExtTelemetryBaud = buff[2] & 0xFF;

        res = 6;
    }

    else
    {
        buff[0]=4;
    }

    return res;
}