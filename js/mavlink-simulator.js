var magic_number = 254;
var seq = -1;
/*$(document).ready(function(){
	var system_id = 100;
	var component_id = 200;
	var seq = 0;
	var timeUsec = 0; //new Date().getTime() * 1000;
	var fixType = 2;
	var latitude = 474035790;
	var longitude = 85358460;
	var altitude = 0;
	var eph = 0;
	var epv = 0;
	var vel = 1000;
	var cog = 0;
	var satellites = 7;
	msg = new mavlink_msg_gps_raw_int(system_id,component_id,seq,timeUsec,fixType,latitude,longitude,altitude,eph,epv,vel,cog,satellites);
	$.each(msg.buffer,function(e){
		$("body").append('<p>' + msg.buffer[e] + '</p>')
	});
})*/


function build_mavlink_msg_gps_raw_int(lat,lon,alt,ground_speed,force_error){
	var system_id = 100;
	var component_id = 200;
	var timeUsec = 0; //new Date().getTime() * 1000;
	var fixType = $("#simulation-fixtype").val();
	var latitude = lat * 10000000; //474035790;
	var longitude = lon * 10000000; //85358460;
	var altitude = alt * 1000;
	var eph = 100*(6.0/$("#simulation-sats").val());
	var epv = 100*(8.0/$("#simulation-sats").val());
	var vel = ground_speed * 100;
	var cog = 0;
	var satellites = $("#simulation-sats").val();

	seq++;
	if(seq > 255) seq = 0;

	msg = new mavlink_msg_gps_raw_int(system_id,component_id,seq,timeUsec,fixType,latitude,longitude,altitude,eph,epv,vel,cog,satellites,force_error);
	return msg;	
}

function build_mavlink_msg_attitude(roll,pitch,yaw,force_error){
	var system_id = 100;
	var component_id = 200;
	var timeUsec = 0; //new Date().getTime() * 1000;


	seq++;
	if(seq > 255) seq = 0;

	msg = new mavlink_msg_attitude(system_id,component_id,seq,timeUsec,roll,pitch,yaw,force_error);
	return msg;
}

function build_mavlink_msg_vfr_hud(airspeed, groundspeed, alt, climb, heading, throttle){
	var system_id = 100;
	var component_id = 200;
	var timeUsec = 0; //new Date().getTime() * 1000;


	seq++;
	if(seq > 255) seq = 0;

	msg = new mavlink_msg_vfr_hud(system_id, component_id, seq, airspeed, groundspeed, alt, climb, heading, throttle);
	return msg;
}

function build_mavlink_msg_sys_status(_voltage, _current, remain){
	var system_id = 100;
	var component_id = 200;
	var timeUsec = 0; //new Date().getTime() * 1000;
 	var voltage = _voltage * 1000;
 	var current = _current * 100;

	seq++;
	if(seq > 255) seq = 0;

	msg = new mavlink_msg_sys_status(system_id, component_id, seq, voltage, current, remain);
	return msg;
}



function build_mavlink_msg_heartbeat(){
	var system_id = 100;
	var component_id = 200;
	var timeUsec = 0; //new Date().getTime() * 1000;


	seq++;
	if(seq > 255) seq = 0;

	msg = new mavlink_msg_heartbeat(system_id,component_id,seq,timeUsec);
	return msg;
}
	
mavlink_msg_gps_raw_int = function(system_id, component_id, seq, timeUsec, fixType, latitude, longitude, altitude, eph, epv, vel, cog, satellites, force_error) {

	var payload_length = 30;
	var crc = 65535;
	var msg_id = 24; // MSG_ID_GPS_RAW_INT_CRC
    var crc_extra = 24; // MSG_ID_GPS_RAW_INT_CRC
	var header = [magic_number];
	var msgBuffer = [];
	var msgIndex = 0;

	var tmp = "";

	msgBuffer = packToBuffer(numberToBuffer(payload_length,1), msgBuffer);
	msgBuffer = packToBuffer(numberToBuffer(seq,1), msgBuffer);
	msgBuffer = packToBuffer(numberToBuffer(system_id,1), msgBuffer);
	msgBuffer = packToBuffer(numberToBuffer(component_id,1), msgBuffer);
	msgBuffer = packToBuffer(numberToBuffer(msg_id,1), msgBuffer);
	msgBuffer = packToBuffer(numberToBuffer(timeUsec,8), msgBuffer);
	msgBuffer = packToBuffer(numberToBuffer(latitude,4), msgBuffer);
	msgBuffer = packToBuffer(numberToBuffer(longitude,4), msgBuffer);
	msgBuffer = packToBuffer(numberToBuffer(altitude,4), msgBuffer);
	msgBuffer = packToBuffer(numberToBuffer(eph,2), msgBuffer);
	msgBuffer = packToBuffer(numberToBuffer(epv,2), msgBuffer);
	msgBuffer = packToBuffer(numberToBuffer(vel,2), msgBuffer);
	msgBuffer = packToBuffer(numberToBuffer(cog,2), msgBuffer);
	msgBuffer = packToBuffer(numberToBuffer(fixType,1), msgBuffer);
	msgBuffer = packToBuffer(numberToBuffer(satellites,1), msgBuffer);

	if(force_error)
		crc = 0xab01;
	
	crc = calculateCRC(msgBuffer,crc)
	crc = calculateCRC([crc_extra],crc)
	
	msgBuffer = packToBuffer(numberToBuffer(crc,2), msgBuffer);
	
	msgBuffer = header.concat(msgBuffer);

	var bytes = new Uint8Array(msgBuffer.length);
	for (var i = 0; i < msgBuffer.length; ++i) {
		bytes[i] = msgBuffer[i];
	}
	return bytes;
}

mavlink_msg_attitude = function(system_id, component_id, seq, timeUsec, roll, pitch, yaw, force_error) {

	var payload_length = 28;
	var crc = 65535;
	var msg_id = 30; // MSG_ID_GPS_RAW_INT_CRC
	var crc_extra = 39; // MSG_ID_GPS_RAW_INT_CRC
	var header = [magic_number];
	var msgBuffer = [];
	var msgIndex = 0;

	var tmp = "";
	var rollspeed = 0.0;
	var pitchspeed = 0.0;
	var yawspeed = 0.0;

	msgBuffer = packToBuffer(numberToBuffer(payload_length,1), msgBuffer);
	msgBuffer = packToBuffer(numberToBuffer(seq,1), msgBuffer);
	msgBuffer = packToBuffer(numberToBuffer(system_id,1), msgBuffer);
	msgBuffer = packToBuffer(numberToBuffer(component_id,1), msgBuffer);
	msgBuffer = packToBuffer(numberToBuffer(msg_id,1), msgBuffer);
	msgBuffer = packToBuffer(numberToBuffer(timeUsec,4), msgBuffer);
	msgBuffer = packToBuffer(floatToBuffer(roll), msgBuffer);
	msgBuffer = packToBuffer(floatToBuffer(pitch), msgBuffer);
	msgBuffer = packToBuffer(floatToBuffer(yaw), msgBuffer);
	msgBuffer = packToBuffer(floatToBuffer(rollspeed), msgBuffer);
	msgBuffer = packToBuffer(floatToBuffer(pitchspeed), msgBuffer);
	msgBuffer = packToBuffer(floatToBuffer(yawspeed), msgBuffer);

	if(force_error)
		crc = 0xab01;

	crc = calculateCRC(msgBuffer,crc)
	crc = calculateCRC([crc_extra],crc)

	msgBuffer = packToBuffer(numberToBuffer(crc,2), msgBuffer);

	msgBuffer = header.concat(msgBuffer);

	var bytes = new Uint8Array(msgBuffer.length);
	for (var i = 0; i < msgBuffer.length; ++i) {
		bytes[i] = msgBuffer[i];
	}
	return bytes;
}

mavlink_msg_vfr_hud = function(system_id, component_id, seq, airspeed, groundspeed, alt, climb, heading, throttle) {

	var payload_length = 20;
	var crc = 65535;
	var msg_id = 74; // MAVLINK_MSG_ID_VFR_HUD
	var crc_extra = 20; // MAVLINK_MSG_ID_VFR_HUD
	var header = [magic_number];
	var msgBuffer = [];


	msgBuffer = packToBuffer(numberToBuffer(payload_length,1), msgBuffer);
	msgBuffer = packToBuffer(numberToBuffer(seq,1), msgBuffer);
	msgBuffer = packToBuffer(numberToBuffer(system_id,1), msgBuffer);
	msgBuffer = packToBuffer(numberToBuffer(component_id,1), msgBuffer);
	msgBuffer = packToBuffer(numberToBuffer(msg_id,1), msgBuffer);
	msgBuffer = packToBuffer(floatToBuffer(airspeed), msgBuffer);
	msgBuffer = packToBuffer(floatToBuffer(groundspeed), msgBuffer);
	msgBuffer = packToBuffer(floatToBuffer(alt), msgBuffer);
	msgBuffer = packToBuffer(floatToBuffer(climb), msgBuffer);
	msgBuffer = packToBuffer(numberToBuffer(heading, 2), msgBuffer);
	msgBuffer = packToBuffer(numberToBuffer(throttle, 2), msgBuffer);


	crc = calculateCRC(msgBuffer,crc)
	crc = calculateCRC([crc_extra],crc)

	msgBuffer = packToBuffer(numberToBuffer(crc,2), msgBuffer);

	msgBuffer = header.concat(msgBuffer);

	var bytes = new Uint8Array(msgBuffer.length);
	for (var i = 0; i < msgBuffer.length; ++i) {
		bytes[i] = msgBuffer[i];
	}
	return bytes;
}


mavlink_msg_sys_status = function(system_id, component_id, seq, voltage, current, remain) {

	var payload_length = 31;
	var crc = 65535;
	var msg_id = 1; // MAVLINK_MSG_ID_SYS_STATUS
	var crc_extra = 124; // MAVLINK_MSG_ID_SYS_STATUS
	var header = [magic_number];
	var msgBuffer = [];
	var tmp = [1, 2, 3 ,4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15 ];


	msgBuffer = packToBuffer(numberToBuffer(payload_length,1), msgBuffer);
	msgBuffer = packToBuffer(numberToBuffer(seq,1), msgBuffer);
	msgBuffer = packToBuffer(numberToBuffer(system_id,1), msgBuffer);
	msgBuffer = packToBuffer(numberToBuffer(component_id,1), msgBuffer);
	msgBuffer = packToBuffer(numberToBuffer(msg_id,1), msgBuffer);
	msgBuffer = packToBuffer(numberToBuffer(255, 4), msgBuffer);
	msgBuffer = packToBuffer(numberToBuffer(255, 4), msgBuffer);
	msgBuffer = packToBuffer(numberToBuffer(0, 4), msgBuffer);
	msgBuffer = packToBuffer(numberToBuffer(0, 2), msgBuffer);
	msgBuffer = packToBuffer(numberToBuffer(voltage, 2), msgBuffer);
	msgBuffer = packToBuffer(numberToBuffer(current, 2), msgBuffer);
	msgBuffer = packToBuffer(numberToBuffer(0, 2), msgBuffer);
	msgBuffer = packToBuffer(numberToBuffer(0, 2), msgBuffer);
	msgBuffer = packToBuffer(numberToBuffer(0, 2), msgBuffer);
	msgBuffer = packToBuffer(numberToBuffer(0, 2), msgBuffer);
	msgBuffer = packToBuffer(numberToBuffer(0, 2), msgBuffer);
	msgBuffer = packToBuffer(numberToBuffer(0, 2), msgBuffer);
	msgBuffer = packToBuffer(numberToBuffer(remain, 1), msgBuffer);


	crc = calculateCRC(msgBuffer,crc);
	crc = calculateCRC([crc_extra],crc);

	msgBuffer = packToBuffer(numberToBuffer(crc,2), msgBuffer);

	msgBuffer = header.concat(msgBuffer);

	var bytes = new Uint8Array(msgBuffer.length);
	for (var i = 0; i < msgBuffer.length; ++i) {
		bytes[i] = msgBuffer[i];
	}
	return bytes;
}

mavlink_msg_heartbeat = function(system_id, component_id, seq, timeUsec) {

	var payload_length = 9;
	var crc = 65535;
	var msg_id = 0; // MSG_ID_GPS_RAW_INT_CRC
	var crc_extra = 50; // MSG_ID_GPS_RAW_INT_CRC
	var header = [magic_number];
	var msgBuffer = [];
	var msgIndex = 0;

	var tmp = "";

	var custom_mode = 0; /*<  A bitfield for use for autopilot-specific flags*/
	var type = 0; /*<  Vehicle or component type. For a flight controller component the vehicle type (quadrotor, helicopter, etc.). For other components the component type (e.g. camera, gimbal, etc.). This should be used in preference to component id for identifying the component type.*/
	var autopilot = 0; /*<  Autopilot type / class. Use MAV_AUTOPILOT_INVALID for components that are not flight controllers.*/
	var base_mode = 0; /*<  System mode bitmap.*/
	var system_status = 0; /*<  System status flag.*/
	var mavlink_version = 1; /*<  MAVLink version, not writable by user, gets added by protocol because of magic data type: uint8_t_mavlink_version*/


	msgBuffer = packToBuffer(numberToBuffer(payload_length,1), msgBuffer);
	msgBuffer = packToBuffer(numberToBuffer(seq,1), msgBuffer);
	msgBuffer = packToBuffer(numberToBuffer(system_id,1), msgBuffer);
	msgBuffer = packToBuffer(numberToBuffer(component_id,1), msgBuffer);
	msgBuffer = packToBuffer(numberToBuffer(msg_id,1), msgBuffer);
	//msgBuffer = packToBuffer(numberToBuffer(timeUsec,8), msgBuffer);
	msgBuffer = packToBuffer(numberToBuffer(type,1), msgBuffer);
	msgBuffer = packToBuffer(numberToBuffer(autopilot,1), msgBuffer);
	msgBuffer = packToBuffer(numberToBuffer(base_mode,1), msgBuffer);
	msgBuffer = packToBuffer(numberToBuffer(custom_mode,4), msgBuffer);
	msgBuffer = packToBuffer(numberToBuffer(system_status,1), msgBuffer);
	msgBuffer = packToBuffer(numberToBuffer(mavlink_version,1), msgBuffer);


	crc = calculateCRC(msgBuffer,crc)
	crc = calculateCRC([crc_extra],crc)

	msgBuffer = packToBuffer(numberToBuffer(crc,2), msgBuffer);

	msgBuffer = header.concat(msgBuffer);

	var bytes = new Uint8Array(msgBuffer.length);
	for (var i = 0; i < msgBuffer.length; ++i) {
		bytes[i] = msgBuffer[i];
	}
	return bytes;
}

function floatToBuffer(number) {
	var bytes = [];
	var farr = new Float32Array(1);
	farr[0] = number;
	var barr = new Uint8Array(farr.buffer);
	for (var i = 0; i<4; i++)
	{
		bytes[i] = barr[3-i];
	}
	return bytes;
}

function numberToBuffer(number,byteslenght){
	    var bytes = [];
	    var i = byteslenght;
	    do {
		    bytes[--i] = number & (255);
		    number = number >> 8;
	    } while (i)
	    return bytes;
}

function packToBuffer(bufferIn,bufferOut){
	var packet = "";
	var index = bufferOut.length;
	c = 0;
	for(i = 0;i < bufferIn.length;i++){
		bufferOut[index] = bufferIn[bufferIn.length - i - 1];
		index++;
	}
	return bufferOut;
}

function calculateCRC(buffer, crc) {
    var bytes = buffer;
    var crcAccum = crc || 0xffff;
	var tmp;
    $.each(bytes, function(e) {
		tmp = bytes[e] ^ (crcAccum & 0xff);
		tmp ^= (tmp << 4) & 0xff;
		crcAccum = (crcAccum >> 8) ^ (tmp << 8) ^ (tmp << 3) ^ (tmp >> 4);
		crcAccum = crcAccum & 0xffff;
    });
    return crcAccum;
}

