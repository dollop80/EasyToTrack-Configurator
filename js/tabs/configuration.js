'use strict';
TABS.configuration = {
    lastCommand: ""
};
TABS.configuration = {
    lastCommandDone: true
};
TABS.configuration.initialize = function (callback) {
    var self = this;
    if (GUI.active_tab != 'configuration') {
        GUI.active_tab = 'configuration';
    }

    $('#content').load("./tabs/configuration.html", function () {
        // translate to user-selected language
        i18n.localizePage();

        // Solicitamos datos
        TABS.configuration.getData();

        // SAVE
        $("#configurationButtonSave").click(function () {
            GTS.save();
			GUI.setLastBaud();
            GUI.reboot();
        });
		
        $('#azimuth_min-slider').on('input', function () {
            $('#azimuth_min-output').val($('#azimuth_min-slider').val());
	    TABS.configuration.moveServo(1);
        });
        $('#azimuth_min-output').on('input', function () {
            if ($('#azimuth_min-output').val() !== $('#azimuth_min-slider').val()) {
                $('#azimuth_min-slider').val($('#azimuth_min-output').val());
		TABS.configuration.moveServo(1);
            }
        });

        $('#azimuth_max-slider').on('input', function () {
            $('#azimuth_max-output').val($('#azimuth_max-slider').val());
            TABS.configuration.moveServo(2);
        });
        $('#azimuth_max-output').on('input', function () {
            if ($('#azimuth_max-output').val() !== $('#azimuth_max-slider').val()) {
                $('#azimuth_max-slider').val($('#azimuth_max-output').val());
                TABS.configuration.moveServo(2);
            }
        });

        $('#elevation_min-slider').on('input', function () {
            $('#elevation_min-output').val($('#elevation_min-slider').val());
            TABS.configuration.moveServo(3);
        });
        $('#elevation_min-output').on('input', function () {
            if ($('#elevation_min-output').val() !== $('#elevation_min-slider').val()) {
                $('#elevation_min-slider').val($('#elevation_min-output').val());
                TABS.configuration.moveServo(3);
            }
        });

        $('#elevation_max-slider').on('input', function () {
            $('#elevation_max-output').val($('#elevation_max-slider').val());
            TABS.configuration.moveServo(4);
        });
        $('#elevation_max-output').on('input', function () {
            if ($('#elevation_max-output').val() !== $('#elevation_max-slider').val()) {
                $('#elevation_max-slider').val($('#elevation_max-output').val());
                TABS.configuration.moveServo(4);
            }
        });


        $("#saveServoLimits").click(function () {
            //GUI.calibrate_lock = true;
            self.moveServo(6); // Save servo settings
        });

        $("#save_srv_config").click(function () {
            //GUI.calibrate_lock = true;
            self.sendParamsPacket(); // Save servo parameters
        });
        $("#saveAzimuthCorrection").click(function () {
            //GUI.calibrate_lock = true;
            self.sendAzimuthCorrection(1); // Save servo parameters
        });


        $('#azimuth_correction-slider').on('input', function () {
            $('#azimuth_correction-output').val($('#azimuth_correction-slider').val());
            AzimuthCorrectionValue = $('#azimuth_correction-slider').val();
            TABS.configuration.sendAzimuthCorrection(0);
        });
        $('#azimuth_correction-output').on('input', function () {
            if ($('#azimuth_correction-output').val() !== $('#azimuth_correction-slider').val()) {
                $('#azimuth_correction-slider').val($('#azimuth_correction-output').val());
                AzimuthCorrectionValue = $('#azimuth_correction-output').val();
                TABS.configuration.sendAzimuthCorrection(0);
            }
        });


        $('input[id="azimuth360mode-checkbox"]').prop("disabled", true);
        $('input[id="azimuth_min-slider"]').prop("disabled", true);
        $('input[id="azimuth_min-output"]').prop("disabled", true);

        $('input[id="azimuth_max-slider"]').prop("disabled", true);
        $('input[id="azimuth_max-output"]').prop("disabled", true);

        $('input[id="elevation_min-slider"]').prop("disabled", true);
        $('input[id="elevation_min-output"]').prop("disabled", true);

        $('input[id="elevation_max-slider"]').prop("disabled", true);
        $('input[id="elevation_max-output"]').prop("disabled", true);

        $('input[id="saveServoLimits"]').prop("disabled", true);

        GUI.content_ready(callback);
        
    });

};
TABS.configuration.loadData = function (data) {

    $("[id*='-spinner']").each(function () {

        var paramId = $(this).attr('id');
        var param = paramId.slice(0, paramId.indexOf("-spinner"));
        if (data.startsWith(param + " = ")) {

            var paramValue = data.getParamValue(param + " = ");
            $(this).val(paramValue.replace(/(\r\n|\n|\r)/gm, ""));
            $(this).on("change", function (event, ui) {
                GTS.set(param, this.value);
            });
        }

    });
    $("[id*='-select']").each(function () {
        var thisSelect = $(this);
        var paramId = $(this).attr('id');
        var param = paramId.slice(0, paramId.indexOf("-select"));
        if (data.startsWith(param + " = ")) {
            var paramValue = data.getParamValue(param + " = ");
            paramValue = paramValue.replace(/[\s\n\r]/g, '');
            $("#" + paramId + " option").each(function () {
                $(this).attr('selected', false);
                if ($(this).val() === paramValue) {
                    $(thisSelect).val(paramValue);
                }
            });
            $("#" + paramId + " option[value='" + paramValue + "']").attr("selected", true);
            $(this).on("change", function (event, ui) {
                GTS.set(param, this.value);
				if(param == 'telemetry_baud'){
					var baud = $('#' + $(thisSelect).attr('id') + ' :selected').text();
					GUI.connected_baud = baud;
				}
            });
        }

    });
    $("[id*='-checkbox']").each(function () {

        var paramId = $(this).attr('id');
        var param = paramId.slice(0, paramId.indexOf("-checkbox"));
        if (data.startsWith(param + " = ")) {

            var paramValue = data.getParamValue(param + " = ");
            paramValue = paramValue.replace(/[\s\n\r]/g, '');
            paramValue = (paramValue === "ON" || paramValue === "1") ? true : false;
            $("#" + paramId).val(paramValue);
            GUI.switcheries[paramId].setPosition(paramValue);
        }

    });
    // Ejecutamos solo una vez el parseo de los FEATURES
    if (data.contains('Enabled: ')) {

        $("[id*='-feature']").each(function () {

            var paramId = $(this).attr('id');
            var param = paramId.slice(0, paramId.indexOf("-feature"));
            var paramValue = (data.contains(param)) ? true : false;
            $("#" + paramId).val(paramValue);
            GUI.switcheries[paramId].setPosition(paramValue);
        });
    }

    if (data.startsWith('serial') && GUI.active_tab == "settings") {

        // Parseamos linea Serial
        var portNumber = data.split(' ')[1];
        var portFunction = Number(data.split(' ')[2]);
        var portProtocol = Number(data.split(' ')[3]);
        var portBaudRate = Number(data.split(' ')[5]);

        if (portNumber > 1) {

            GUI.softserial_count++;

            var selectProtocolID = "softserial" + GUI.softserial_count + "-protocol";
            var selectBaudrateID = "softserial" + GUI.softserial_count + "-baudrate";

            // Add port row
            $('#portsTable tr:last').after('<tr>\n\
                                            <td>Softserial ' + GUI.softserial_count + '</td>\n\
                                            <td>\n\
                                                <select id="' + selectProtocolID + '">\n\
                                                    <option value="0" >Select protocol</option>\n\
                                                    <option value="256">MFD</option>\n\
                                                    <option value="512">MAVLINK</option>\n\
                                                    <option value="1024">NMEA</option>\n\
                                                    <option value="2048">LTM</option>\n\
                                                </select>\n\
                                            </td>\n\
                                            <td>\n\
                                                <select id="' + selectBaudrateID + '">\n\
                                                    <option value="0" >Select baudrate</option>\n\
                                                    <option value="1200">1200</option>\n\
                                                    <option value="2400">2400</option>\n\
                                                    <option value="4800">4800</option>\n\
                                                    <option value="9600">9600</option>\n\
                                                    <option value="19200">19200</option>\n\
                                                    <option value="38400">38400</option>\n\
                                                    <option value="57600">57600</option>\n\
                                                    <option value="115200">115200</option>\n\
                                                    <option value="230400">230400</option>\n\
                                                    <option value="250000">250000</option>\n\
                                                </select>\n\
                                            </td>\n\
                                        </tr>');

            $("#" + selectProtocolID + " option[value=" + portFunction + "]").attr('selected', 'selected');
            $("#" + selectBaudrateID + " option[value=" + portBaudRate + "]").attr('selected', 'selected');

            $("#" + selectProtocolID).on('change', function () {
                GTS.setSerial(portNumber, $("#" + selectProtocolID).val(), $("#" + selectBaudrateID).val());
            });

            $("#" + selectBaudrateID).on('change', function () {
                GTS.setSerial(portNumber, $("#" + selectProtocolID).val(), $("#" + selectBaudrateID).val());
            });

        }

        if (!GUI.softserial_count) {
            $("#portsTable").hide();
            $("#notePortsTable").show();
        } else {
            $("#portsTable").show();
            $("#notePortsTable").hide();
        }

    }



};
TABS.configuration.buildServoReqPacket = function(){
    var SYN_UART = 0x5a;
    var crc = 0;
    var j = 0;
    var msgBuffer = [];


    msgBuffer[j++] = SYN_UART;
    msgBuffer[j++] = 0x03;
    crc = 0x03;
    msgBuffer[j++] = 0x01;
    crc ^= 1;
    for (var i = 0; i < 3; i++)
    {
        crc ^= SYN_UART;
        msgBuffer[j++] = SYN_UART;
    }
    msgBuffer[j++] = crc;
    msgBuffer[j++] = '\r'.charCodeAt();
    msgBuffer[j] = '\n'.charCodeAt();

    var bytes = new Uint8Array(msgBuffer.length);
    for (var i = 0; i < msgBuffer.length; ++i) {
        bytes[i] = msgBuffer[i];
    }
    return bytes;
}

TABS.configuration.buildDataPacket = function(type, inbuff, cnt){
    var crc;
    var j = 0;
    var SYN_UART = 0x5a;
    var outbuff = [];

    outbuff[j++]=SYN_UART;
    outbuff[j++]=cnt;
    crc=cnt;
    outbuff[j++]=type;
    crc^=type;
    for(var i=0; i<cnt; i++)
    {
        crc^=inbuff[i];
        outbuff[j++]=inbuff[i];
    }
    outbuff[j++]=crc;
    outbuff[j++]='\r'.charCodeAt();
    outbuff[j]='\n'.charCodeAt();

    var bytes = new Uint8Array(outbuff.length);
    for (var i = 0; i < outbuff.length; ++i) {
        bytes[i] = outbuff[i];
    }
    return bytes;
}

TABS.configuration.getData = function () {
    TABS.configuration.lastCommand = "set";
    var packet = TABS.configuration.buildServoReqPacket();
    GTS.send(String.fromCharCode.apply(null, new Uint8Array(packet)));
};

TABS.configuration.encodeServoData = function(outbuff, mode) {
    outbuff[1]= Math.round($('input[id="azimuth_min-output"]').val() * 2.5) & 0xFF;
    outbuff[0]= Math.round($('input[id="azimuth_min-output"]').val() * 2.5) >>8;
    outbuff[3]= Math.round($('input[id="elevation_min-output"]').val() * 2.5) & 0xFF;
    outbuff[2]= Math.round($('input[id="elevation_min-output"]').val() * 2.5) >>8;
    outbuff[5]= Math.round($('input[id="azimuth_max-output"]').val() * 2.5) & 0xFF;
    outbuff[4]= Math.round($('input[id="azimuth_max-output"]').val() * 2.5) >>8;
    outbuff[7]= Math.round($('input[id="elevation_max-output"]').val() * 2.5) & 0xFF;
    outbuff[6]= Math.round($('input[id="elevation_max-output"]').val() * 2.5) >>8;
    if($('input[id="azimuth360mode-checkbox"]').val()=== "true")
        outbuff[9]=1;
    else
        outbuff[9]=0;
    outbuff[8]=mode;
}

TABS.configuration.encodeParamsData = function(outbuff, mode) {
    outbuff[1]= 0x00;
    outbuff[0]= Math.round($('input[id="servo_slowdown-spinner"]').val() * 24.0);
    if($('input[id="save_curr_pos_servo-checkbox"]').val() === "true")
    {
        outbuff[1]= 0x01;
    }
    outbuff[2]= mode;
}

TABS.configuration.encodeEncodeAzimuthData = function(outbuff, mode) {
    outbuff[1]= AzimuthCorrectionValue & 0xFF;
    outbuff[0]= (AzimuthCorrectionValue >> 8) & 0xFF;
    outbuff[2]= mode;
}


TABS.configuration.switcheryChange = function (elem) {

    var elemID = $(elem).attr('id');
    if (elemID.contains("-checkbox")) {

        var param = elemID.slice(0, elemID.indexOf("-checkbox"));

        if(elemID.contains("enableServoLimitsEdit"))
        {
            if ($(elem).val() === "true")
            {
                $('input[id="azimuth360mode-checkbox"]').prop("disabled", true);
                $('input[id="azimuth_min-slider"]').prop("disabled", true);
                $('input[id="azimuth_min-output"]').prop("disabled", true);

                $('input[id="azimuth_max-slider"]').prop("disabled", true);
                $('input[id="azimuth_max-output"]').prop("disabled", true);

                $('input[id="elevation_min-slider"]').prop("disabled", true);
                $('input[id="elevation_min-output"]').prop("disabled", true);

                $('input[id="elevation_max-slider"]').prop("disabled", true);
                $('input[id="elevation_max-output"]').prop("disabled", true);

                $('input[id="saveServoLimits"]').prop("disabled", true);

                TABS.configuration.moveServo(0);
            }
            else
            {
                $('input[id="azimuth360mode-checkbox"]').prop("disabled", false);
                $('input[id="azimuth_min-slider"]').prop("disabled", false);
                $('input[id="azimuth_min-output"]').prop("disabled", false);

                $('input[id="azimuth_max-slider"]').prop("disabled", false);
                $('input[id="azimuth_max-output"]').prop("disabled", false);

                $('input[id="elevation_min-slider"]').prop("disabled", false);
                $('input[id="elevation_min-output"]').prop("disabled", false);

                $('input[id="elevation_max-slider"]').prop("disabled", false);
                $('input[id="elevation_max-output"]').prop("disabled", false);

                $('input[id="saveServoLimits"]').prop("disabled", false);
            }


        }

        if (elemID.contains("mag_calibrated") || elemID.contains("pan0_calibrated")) {

            var ON = "1";
            var OFF = "0";
        } else {

            var ON = "ON";
            var OFF = "OFF";
        }

        if ($(elem).val() === "true") {
            $("#" + elemID).val("false");
            GTS.set(param, OFF);
        } else {
            $("#" + elemID).val("true");
            GTS.set(param, ON);
        }

    }

    if (elemID.contains("-feature")) {

        var param = elemID.slice(0, elemID.indexOf("-feature"));
        if ($(elem).val() === "true") {
            $("#" + elemID).val("false");
            GTS.feature(param, false);
        } else {
            $("#" + elemID).val("true");
            GTS.feature(param, true);
        }

    }

};

TABS.configuration.cleanup = function (callback) {
    console.log("cleanup config");

    GUI.softserial_count = 0;

    if (callback)
        callback();
};

TABS.configuration.calibratePan = function () {
    //TABS.configuration.setCheckBox("mag_calibrated-checkbox", false);
    TABS.configuration.setCheckBox("pan0_calibrated-checkbox", false);
    TABS.configuration.lastCommand = "calibrate pan";
    GUI.log(i18n.getMessage("configurationPanCalibrationStartedLogMessage"));
    GTS.send('calibrate pan\n');
};

TABS.configuration.calibrateMag = function () {
    TABS.configuration.setCheckBox("mag_calibrated-checkbox", false);
    TABS.configuration.lastCommand = "calibrate mag";
    GTS.send('calibrate mag\n');
    GUI.log(i18n.getMessage("configurationMagCalibrationStartedLogMessage"));
    GUI.interval_add("calibratemag_interval", function () {
        TABS.configuration.setCheckBox("mag_calibrated-checkbox", true);
        GUI.interval_remove("calibratemag_interval");
        GUI.log(i18n.getMessage("configurationCalibrationFinishedLogMessage"));
        GUI.calibrate_lock = false;
    }, 12000);
};

TABS.configuration.setCheckBox = function (id, value) {
    $("#" + id).prop("checked", value);//$("#"+id).prop("checked", "" + value + "");
    GUI.switcheries[id].setPosition(false);//$(id).button("refresh");
};

TABS.configuration.getCalibrationStatus = function (line, lookat, paramId, message) {
    var paramValue = line.getParamValue(lookat);
    $("#" + paramId).val(paramValue.replace(/(\r\n|\n|\r)/gm, ""));
    GUI.log(message + " " + paramValue);
}
TABS.configuration.parseCalibratePan = function (line) {
    if (line.contains('min ')) {
        TABS.configuration.getCalibrationStatus(line, "min ", "pan0-spinner", i18n.getMessage("configurationCalibrationMinPulseLogMessage"));
    } else if (line.contains('max ')) {
        TABS.configuration.getCalibrationStatus(line, "max ", "pan0-spinner", i18n.getMessage("configurationCalibrationMaxPulseLogMessage"));
    } else if (line.contains('pan0=')) {
        TABS.configuration.getCalibrationStatus(line, "pan0=", "pan0-spinner", i18n.getMessage("configurationCalibrationPan0PulseLogMessage"));
    } else if (line.contains('min_pan_speed=')) {
        TABS.configuration.getCalibrationStatus(line, "min_pan_speed=", "min_pan_speed-spinner", i18n.getMessage("configurationCalibrationMinPanSpeedLogMessage"));
    } else if (line.contains('pan0_calibrated=0')) {
        TABS.configuration.setCheckBox("pan0_calibrated-checkbox", false);
    } else if (line.contains('pan0_calibrated=1')) {
        TABS.configuration.setCheckBox("mag_calibrated-checkbox", true);
        TABS.configuration.setCheckBox("pan0_calibrated-checkbox", true);
        GUI.log(i18n.getMessage("configurationCalibrationCalibratedLogMessage"));
    } else if (line.contains("has finished")) {
        GUI.log(i18n.getMessage("configurationCalibrationFinishedLogMessage"));
        GUI.calibrate_lock = false;
    }
}

TABS.configuration.loadServoCalibValues = function (AzimuthMinValue, AzimuthMaxValue, ElevationMinValue, ElevationMaxValue,
                                                    Mode360Value, delay_change_ppm, TrSoundEnableValue, AzimuthCorrectionValue) {
    $('#azimuth_min-slider').val(Math.round(AzimuthMinValue / 2.5)); $('#azimuth_min-output').val(Math.round(AzimuthMinValue / 2.5));
    $('#azimuth_max-slider').val(Math.round(AzimuthMaxValue / 2.5)); $('#azimuth_max-output').val(Math.round(AzimuthMaxValue / 2.5));
    $('#elevation_min-slider').val(Math.round(ElevationMinValue / 2.5)); $('#elevation_min-output').val(Math.round(ElevationMinValue / 2.5));
    $('#elevation_max-slider').val(Math.round(ElevationMaxValue / 2.5)); $('#elevation_max-output').val(Math.round(ElevationMaxValue / 2.5));
    $('#azimuth360mode-checkbox').prop('checked', Mode360Value);
    $('#servo_slowdown-spinner').val(delay_change_ppm);
    $('#azimuth_correction-slider').val(AzimuthCorrectionValue); $('#azimuth_correction-output').val(AzimuthCorrectionValue);
}

TABS.configuration.moveServo = function(mode){
    var encodedbuff = [];
    var cnt = 10;
    var type = FROMHOST_MSG_ID_SETUP;

    TABS.configuration.encodeServoData(encodedbuff, mode);
    var packet = TABS.configuration.buildDataPacket(type, encodedbuff, cnt);
    GTS.send(String.fromCharCode.apply(null, new Uint8Array(packet)));
}

TABS.configuration.sendParamsPacket = function(){
    var encodedbuff = [];
    var mode = 0;
    var cnt = 3;
    var type = FROMHOST_PARAMS_ID_SETUP;

    TABS.configuration.encodeParamsData(encodedbuff, mode);
    var packet = TABS.configuration.buildDataPacket(type, encodedbuff, cnt);
    GTS.send(String.fromCharCode.apply(null, new Uint8Array(packet)));
}

TABS.configuration.sendAzimuthCorrection = function(mode){
    var encodedbuff = [];
    var cnt = 3;
    var type = FROMHOST_AZIMUTH_MSG_ID;

    TABS.configuration.encodeEncodeAzimuthData(encodedbuff, mode);
    var packet = TABS.configuration.buildDataPacket(type, encodedbuff, cnt);
    GTS.send(String.fromCharCode.apply(null, new Uint8Array(packet)));
}
