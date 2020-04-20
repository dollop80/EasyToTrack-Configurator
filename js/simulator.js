var simulatorTimer = 0;
var calculateDistanceTimer = 0;
var radius; // m
var altitude = 0; // m
var altitudePrev = 0;
var distance;
var startDistance = 0;
var sendHomeTimer = 0;
var simulationStarted = false;
var accDistance = 0;
var countFrames = 0;
var protocol = 2;
var home0 = [0, 0];
var homePosition;
var lastPoint;
var course = 0.0;
var coursePrev = 0;
var speed = 0;
var vspeed = 0;
var mavPackCnt = 0;
var roll = 0;
var rollPrev = 0;
var pitch = 0;
var pitchPrev = 0;
var simStartTime = 0;
var vehicleType = 'plane';
var armed = false;
var protocols = {
    NMEA: 1,
    MAVLINK: 2,
    PITLAB: 3,
    MFD: 4,
    MSP: 5
};

function Speed(value) {
    var speed = (value / 3600) * 1000;
    return speed
}

function showPacket(packet) {
    countFrames++;
    if (countFrames > 300) {
        countFrames = 0;
        $("#simulator-log").html('');
    }
    $("#simulator-log").append(packet + '\n');
    $(".window").scrollTop($('#simulator-log')[0].scrollHeight);
    
}

function buildPacket(lat, lon, altitude, distance, heading, speed, vspeed, roll, pitch) {
    var packet;
	
    var forceError = $("#simulator-force-error").prop('checked');
    
    if (protocol == protocols.NMEA) {
		packet = buildGPGGA(lat, lon, altitude+parseInt($("#simulator-gs-home-alt").val(),10), forceError);
		GTS.send(packet + '\r\n');
		packet = buildGPRMC(lat, lon, altitude+parseInt($("#simulator-gs-home-alt").val(),10), course, speed, forceError);
		GTS.send(packet + '\r\n');
		packet = buildGSA();
		GTS.send(packet + '\r\n');
		
    } else if (protocol == protocols.MAVLINK) {

        packet = build_mavlink_msg_gps_raw_int(lat, lon, altitude+parseInt($("#simulator-gs-home-alt").val(),10), Speed(speed / 0.539957), heading, forceError);
        GTS.send(String.fromCharCode.apply(null, new Uint8Array(packet)));
/*
        packet = build_mavlink_msg_ahrs2(roll, pitch, heading * (Math.PI / 180.0), altitude + +$("#simulator-altitude").val(), lat, lon);
        GTS.send(String.fromCharCode.apply(null, new Uint8Array(packet)));

        packet = build_mavlink_msg_altitude($("#simulator-altitude").val(), $("#simulator-altitude").val(), altitude+$("#simulator-altitude").val(), altitude+$("#simulator-altitude").val(), 0, 0);
        GTS.send(String.fromCharCode.apply(null, new Uint8Array(packet)));
*/
        packet = build_mavlink_msg_gps_global_position_int(lat, lon, altitude+parseInt($("#simulator-gs-home-alt").val(),10), altitude, 0, 0, vspeed, heading);
        GTS.send(String.fromCharCode.apply(null, new Uint8Array(packet)));

        packet = build_mavlink_msg_attitude(roll,pitch,heading * (Math.PI / 180.0), forceError );
        GTS.send(String.fromCharCode.apply(null, new Uint8Array(packet)));

        packet = build_mavlink_msg_vfr_hud(speed / 0.539957 * 0.278, speed / 0.539957 * 0.278, altitude+parseInt($("#simulator-gs-home-alt").val(),10), vspeed, heading, 50);
        GTS.send(String.fromCharCode.apply(null, new Uint8Array(packet)));


        var period = Math.round(1000/$("#simulation-frequency").val());
        if((mavPackCnt++ % period) == 0) {
            var vehicle = 0;
            switch (vehicleType) {
                case "copter":
                    vehicle = 2;
                    break;
                case "plane":
                    vehicle = 1;
                    break;
                case "rover":
                    vehicle = 10;
                    break;
            }
            packet = build_mavlink_msg_heartbeat(vehicle, armed);
            GTS.send(String.fromCharCode.apply(null, new Uint8Array(packet)));

            //packet = build_mavlink_msg_gps_global_origin(home0[0], home0[1], 0);
            //GTS.send(String.fromCharCode.apply(null, new Uint8Array(packet)));

            packet = build_mavlink_msg_sys_status($("#simulator-voltage").val(), $("#simulator-current").val(), 87);
            GTS.send(String.fromCharCode.apply(null, new Uint8Array(packet)));

            //packet = build_mavlink_msg_home_position(home0[0], home0[1], 0);
            //GTS.send(String.fromCharCode.apply(null, new Uint8Array(packet)));

        }

    } else if (protocol == protocols.PITLAB) {
        packet = Data2Pitlab(11, altitude, lat, lon);
        if (!debugEnabled)
            GTS.send(packet + '\n');
    } else if (protocol == protocols.MFD) {
        packet = Data2MFD(distance, altitude, heading, forceError);
        if (!debugEnabled)
            GTS.send(packet + '\n');
    } else if (protocol == protocols.MSP) {
        packet = build_msp_attitude(roll, pitch, heading);
        GTS.send(String.fromCharCode.apply(null, new Uint8Array(packet)));

        packet = build_msp_analog($("#simulator-voltage").val(), 100, $("#simulator-rssi").val(), $("#simulator-current").val());
        GTS.send(String.fromCharCode.apply(null, new Uint8Array(packet)));

        packet = build_msp_raw_gps($("#simulation-fixtype").val(), $("#simulation-sats").val(), lat, lon, altitude+parseInt($("#simulator-gs-home-alt").val(),10), speed / 0.539957 * 0.278, heading);
        GTS.send(String.fromCharCode.apply(null, new Uint8Array(packet)));

        packet = build_msp_altitude(altitude+parseInt($("#simulator-gs-home-alt").val(),10), vspeed);
        GTS.send(String.fromCharCode.apply(null, new Uint8Array(packet)));
    }
    return packet;
}

function buildGSA()
{
    var retV = "";
    retV += "$GPGSA,A,3,19,28,14,18,27,22,31,39,,,,,1.7,1.0,1.3*34";
    return retV;
}

function buildGPRMC(lat, lon, altitude, course, speed)
{
    var dateObj = new Date();

    var year = dateObj.getUTCFullYear();
    var month = dateObj.getUTCMonth() + 1;
    var day = dateObj.getUTCDate();

    var hour = dateObj.getUTCHours();
    var minute = dateObj.getUTCMinutes();
    var second = dateObj.getSeconds();

    var latDeg = Math.floor(Math.abs(lat));
    var latMin = (Math.abs(lat) - latDeg) * 60;
    latMin = latMin.toFixed(4);
    latMin = latMin.toString();

    var degStr = "00000" + latDeg;
    degStr = degStr.substring(degStr.length - 2);

    var minStr = "000" + latMin;
    minStr = minStr.substring(minStr.length - 7);

    var latStr = degStr + minStr;

    var lonDeg = Math.floor(Math.abs(lon));
    var lonMin = (Math.abs(lon) - lonDeg) * 60;
    lonMin = lonMin.toFixed(4);
    lonMin = lonMin.toString();

    var degStr = "00000" + lonDeg;
    degStr = degStr.substring(degStr.length - 3);

    var minStr = "000" + lonMin;
    minStr = minStr.substring(minStr.length - 7);


    var lonStr = degStr + minStr;

    var ns = "N";
    if (lat < 0)
        ns = "S";

    var ew = "E";
    if (lon < 0)
        ew = "W";

    var d = new Date(year, month, day, hour, minute, second, 0);


    var theTime = String("0" + hour).slice(-2);
    theTime += String("0" + minute).slice(-2);
    theTime += String("0" + second).slice(-2);
    //theTime += ".000";

    var theDate = "";
    theDate += String("0" + day).slice(-2);
    theDate += String("0" + month).slice(-2); //javascript does month 0-11 not 1-12
    theDate += String("0" + year - 2000).slice(-2);

    var retV = "";
    retV += "$GPRMC";
    retV += "," + theTime;//timestamp
    retV += ",A";//valid 
    retV += "," + latStr;//lat
    retV += "," + ns;// N or S
    retV += "," + lonStr; //lon
    retV += "," + ew;// E or W
    retV += "," + speed;//speed in Knots
    retV += "," + course;//course
    retV += "," + theDate;//date
    retV += ",0.0";// magnetic variation
    retV += ",W*";//magnetic variation E or W

    checksum = nmeaChecksum(retV.substring(1, retV.length - 1));

    retV += "" + checksum.toString(16);
    return retV;
}

function buildGPGGA(lat, lon, altitude, force_error)
{
    var dateObj = new Date();

    var year = dateObj.getUTCFullYear();
    var month = dateObj.getUTCMonth() + 1;
    var day = dateObj.getUTCDate();

    var hour = dateObj.getUTCHours();
    var minute = dateObj.getUTCMinutes();
    var second = dateObj.getSeconds();

    var latDeg = Math.floor(Math.abs(lat));
    var latMin = (Math.abs(lat) - latDeg) * 60;
    latMin = latMin.toFixed(4);
    latMin = latMin.toString();

    var degStr = "00000" + latDeg;
    degStr = degStr.substring(degStr.length - 2);

    var minStr = "000" + latMin;
    minStr = minStr.substring(minStr.length - 7);

    var latStr = degStr + minStr;

    var lonDeg = Math.floor(Math.abs(lon));
    var lonMin = (Math.abs(lon) - lonDeg) * 60;
    lonMin = lonMin.toFixed(4);
    lonMin = lonMin.toString();

    var degStr = "00000" + lonDeg;
    degStr = degStr.substring(degStr.length - 3);

    var minStr = "000" + lonMin;
    minStr = minStr.substring(minStr.length - 7);


    var lonStr = degStr + minStr;

    var ns = "N";
    if (lat < 0)
        ns = "S";

    var ew = "E";
    if (lon < 0)
        ew = "W";

    var d = new Date(year, month, day, hour, minute, second, 0);


    var theTime = String("0" + hour).slice(-2);
    theTime += String("0" + minute).slice(-2);
    theTime += String("0" + second).slice(-2);
    //theTime += ".000";

    var theDate = "";
    theDate += String("0" + day).slice(-2);
    theDate += String("0" + month).slice(-2);//javascript does month 0-11 not 1-12
    theDate += String("0" + year - 2000).slice(-2);

    var fixquality = $("#simulation-fixtype").val();
    var sats = $("#simulation-sats").val();
    var hordilution = "0.9";
    var altitude1 = altitude * 1.0;
    var altitude2 = altitude * 1.0;

    var retV = "";
    retV += "$GPGGA";
    retV += "," + theTime;//timestamp
    retV += "," + latStr;//lat
    retV += "," + ns;// N or S
    retV += "," + lonStr; //lon
    retV += "," + ew;// E or W
    retV += "," + fixquality;
    retV += "," + sats;
    retV += "," + hordilution;
    retV += "," + altitude1;
    retV += "," + "M";
    retV += "," + altitude2;
    retV += "," + "M";
    retV += ",";
    retV += ",";

    checksum = nmeaChecksum(retV.substring(1, retV.length));

    if (force_error)
        checksum = 0xff;
	
    retV += "*" + checksum.toString(16);
    return retV;
}

function nmeaChecksum(sentence)
{

    var debugString = "";

    var checksum = 0;
    for (var i = 0; i < sentence.length; i++)
    {
        var oneChar = sentence.charCodeAt(i);
        checksum = checksum ^ oneChar;
        var tv = String.fromCharCode(oneChar);
        debugString += tv;

    }
    return checksum;
}

function unwrap(previous_angle, new_angle) {
    var d = new_angle - previous_angle;
    d = d > Math.PI ? d - 2 * Math.PI : (d < -Math.PI ? d + 2 * Math.PI : d);
    return previous_angle + d;
}


function degreesPerSecond(speed, radius) {
    var degrees = speed / (0.0174533 * radius);
    return degrees;
}

function sendMessageToMissionPlanner(action) {
    var frame = document.getElementById('map');
    var message = {action: action, home: home0};
    var home = frame.contentWindow.postMessage(message, '*');
}

handleResponseFromMissionPlanner = function (e) {

    var action = e.data.action;
    if (action == 'setHome') {
        homePosition = e.data.home;
        $("#simulator-home-position").text("Home: " + homePosition.x + "," + homePosition.y);
    } else if (action == 'setPath') {
        var mypath = e.data.path;
        var aaa = 0;
    } else {
        console.log("Unknown message: " + e.data);
    }

}