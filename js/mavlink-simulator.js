var magic_number = 254;
var seq = -1;


function getRndInteger(min, max) {
	return Math.floor(Math.random() * (max - min) ) + min;
}

function build_mavlink_msg_gps_raw_int(lat,lon,alt,ground_speed,heading,force_error){
	var system_id = 1;
	var component_id = 1;
	var fixType = $("#simulation-fixtype").val();
	var latitude = lat * 10000000; //474035790;
	var longitude = lon * 10000000; //85358460;
	var altitude = alt * 1000;
	var eph = 100*(6.0/$("#simulation-sats").val());
	var epv = 100*(8.0/$("#simulation-sats").val());
	var vel = ground_speed * 100;
	var cog = heading * 100;
	var satellites = $("#simulation-sats").val();

	seq++;
	if(seq > 255) seq = 0;

	msg = new mavlink_msg_gps_raw_int(system_id,component_id,seq,fixType,latitude,longitude,altitude,eph,epv,vel,cog,satellites,force_error);
	return msg;	
}

function build_mavlink_msg_attitude(roll,pitch,yaw,force_error){
	var system_id = 1;
	var component_id = 1;


	seq++;
	if(seq > 255) seq = 0;

	msg = new mavlink_msg_attitude(system_id,component_id,seq,roll,pitch,yaw,force_error);
	return msg;
}

function build_mavlink_msg_vfr_hud(airspeed, groundspeed, alt, climb, heading, throttle){
	var system_id = 1;
	var component_id = 1;
    var climbr = climb + getRndInteger(-1,1)/10.0;

	seq++;
	if(seq > 255) seq = 0;

	msg = new mavlink_msg_vfr_hud(system_id, component_id, seq, airspeed, groundspeed, alt, climbr, heading, throttle);
	return msg;
}

function build_mavlink_msg_sys_status(_voltage, _current, remain){
	var system_id = 1;
	var component_id = 1;
 	var voltage = _voltage * 1000 + getRndInteger(-100, 100);
 	var current = _current * 100 +  getRndInteger(-10, 10);

	seq++;
	if(seq > 255) seq = 0;

	msg = new mavlink_msg_sys_status(system_id, component_id, seq, voltage, current, remain);
	return msg;
}

function build_mavlink_msg_ahrs2(roll, pitch, yaw, altitude, lat, lon){
	var system_id = 1;
	var component_id = 1;

	var latitude = lat * 10000000;
	var longitude = lon * 10000000;

	seq++;
	if(seq > 255) seq = 0;

	msg = new mavlink_msg_ahrs2(system_id, component_id, seq, roll, pitch, yaw, altitude, latitude, longitude);
	return msg;
}


function build_mavlink_msg_altitude(alt_m, alt_a, alt_l, alt_r, alt_t, bott_clr){
	var system_id = 10;
	var component_id = 1;

	seq++;
	if(seq > 255) seq = 0;

	msg = new mavlink_msg_altitude(system_id, component_id, seq, alt_m, alt_a, alt_l, alt_r, alt_t, bott_clr);
	return msg;
}


function build_mavlink_msg_gps_global_origin(lat, lon, alt){
	var system_id = 1;
	var component_id = 1;
	var latitude = lat * 10000000;
	var longitude = lon * 10000000;
	var altitude = alt * 1000;

	seq++;
	if(seq > 255) seq = 0;

	msg = new mavlink_msg_gps_global_origin(system_id, component_id,  seq, latitude, longitude, altitude);
	return msg;
}


function build_mavlink_msg_gps_global_position_int(lat, lon, alt, rel_alt, vx, vy, vz, hdg){
	var system_id = 1;
	var component_id = 1;
	var latitude = lat * 10000000;
	var longitude = lon * 10000000;
	var altitude = alt * 1000;
	var rel_altitude = rel_alt * 1000;
	var headg = hdg * 100;

	seq++;
	if(seq > 255) seq = 0;

	msg = new mavlink_msg_gps_global_position_int(system_id, component_id,  seq, latitude, longitude, altitude, rel_altitude, vx, vy, vz, headg);
	return msg;
}

function build_mavlink_msg_home_position(lat, lon, alt){
	var system_id = 1;
	var component_id = 1;
	var latitude = lat * 10000000;
	var longitude = lon * 10000000;
	var altitude = alt * 1000;

	seq++;
	if(seq > 255) seq = 0;

	msg = new mavlink_msg_home_position(system_id, component_id,  seq, latitude, longitude, altitude);
	return msg;
}


function build_mavlink_msg_heartbeat(type, armed){
	var system_id = 1;
	var component_id = 1;

	seq++;
	if(seq > 255) seq = 0;

	msg = new mavlink_msg_heartbeat(system_id, component_id, seq, type, armed);
	return msg;
}
	
mavlink_msg_gps_raw_int = function(system_id, component_id, seq, fixType, latitude, longitude, altitude, eph, epv, vel, cog, satellites, force_error) {

	var payload_length = 30;
	var crc = 65535;
	var msg_id = 24; // MSG_ID_GPS_RAW_INT_CRC
    var crc_extra = 24; // MSG_ID_GPS_RAW_INT_CRC
	var header = [magic_number];
	var msgBuffer = [];
	var timeUsec = new Date().getTime() * 1000;

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

mavlink_msg_attitude = function(system_id, component_id, seq, roll, pitch, yaw, force_error) {

	var payload_length = 28;
	var crc = 65535;
	var msg_id = 30; // MSG_ID_GPS_RAW_INT_CRC
	var crc_extra = 39; // MSG_ID_GPS_RAW_INT_CRC
	var header = [magic_number];
	var msgBuffer = [];
	var timeMsec = new Date().getTime() - simStartTime;

	var tmp = "";
	var rollspeed = 0.0;
	var pitchspeed = 0.0;
	var yawspeed = 0.0;

	msgBuffer = packToBuffer(numberToBuffer(payload_length,1), msgBuffer);
	msgBuffer = packToBuffer(numberToBuffer(seq,1), msgBuffer);
	msgBuffer = packToBuffer(numberToBuffer(system_id,1), msgBuffer);
	msgBuffer = packToBuffer(numberToBuffer(component_id,1), msgBuffer);
	msgBuffer = packToBuffer(numberToBuffer(msg_id,1), msgBuffer);
	msgBuffer = packToBuffer(numberToBuffer(timeMsec,4), msgBuffer);
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


	msgBuffer = packToBuffer(numberToBuffer(payload_length,1), msgBuffer);
	msgBuffer = packToBuffer(numberToBuffer(seq,1), msgBuffer);
	msgBuffer = packToBuffer(numberToBuffer(system_id,1), msgBuffer);
	msgBuffer = packToBuffer(numberToBuffer(component_id,1), msgBuffer);
	msgBuffer = packToBuffer(numberToBuffer(msg_id,1), msgBuffer);
	msgBuffer = packToBuffer(numberToBuffer(255, 4), msgBuffer);
	msgBuffer = packToBuffer(numberToBuffer(255, 4), msgBuffer);
	msgBuffer = packToBuffer(numberToBuffer(0xFFFFFFFF, 4), msgBuffer);
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

mavlink_msg_ahrs2 = function(system_id, component_id, seq, roll, pitch, yaw, altitude, lat, lon) {

	var payload_length = 24;
	var crc = 65535;
	var msg_id = 178; // MAVLINK_MSG_ID_AHRS2
	var crc_extra = 47; // MAVLINK_MSG_ID_AHRS2
	var header = [magic_number];
	var msgBuffer = [];


	msgBuffer = packToBuffer(numberToBuffer(payload_length,1), msgBuffer);
	msgBuffer = packToBuffer(numberToBuffer(seq,1), msgBuffer);
	msgBuffer = packToBuffer(numberToBuffer(system_id,1), msgBuffer);
	msgBuffer = packToBuffer(numberToBuffer(component_id,1), msgBuffer);
	msgBuffer = packToBuffer(numberToBuffer(msg_id,1), msgBuffer);
	msgBuffer = packToBuffer(floatToBuffer(roll), msgBuffer);
	msgBuffer = packToBuffer(floatToBuffer(pitch), msgBuffer);
	msgBuffer = packToBuffer(floatToBuffer(yaw), msgBuffer);
	msgBuffer = packToBuffer(floatToBuffer(altitude), msgBuffer);
	msgBuffer = packToBuffer(numberToBuffer(lat, 4), msgBuffer);
	msgBuffer = packToBuffer(numberToBuffer(lon, 4), msgBuffer);

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


mavlink_msg_altitude = function(system_id, component_id, seq, alt_m, alt_a, alt_l, alt_r, alt_t, bott_clr) {

	var payload_length = 32;
	var crc = 65535;
	var msg_id = 141; // MAVLINK_MSG_ID_ALTITUDE
	var crc_extra = 47; // MAVLINK_MSG_ID_ALTITUDE
	var header = [magic_number];
	var msgBuffer = [];
	var timeUsec = new Date().getTime() * 1000;


	msgBuffer = packToBuffer(numberToBuffer(payload_length,1), msgBuffer);
	msgBuffer = packToBuffer(numberToBuffer(seq,1), msgBuffer);
	msgBuffer = packToBuffer(numberToBuffer(system_id,1), msgBuffer);
	msgBuffer = packToBuffer(numberToBuffer(component_id,1), msgBuffer);
	msgBuffer = packToBuffer(numberToBuffer(msg_id,1), msgBuffer);
	msgBuffer = packToBuffer(numberToBuffer(timeUsec,8), msgBuffer);
	msgBuffer = packToBuffer(floatToBuffer(alt_m), msgBuffer);
	msgBuffer = packToBuffer(floatToBuffer(alt_a), msgBuffer);
	msgBuffer = packToBuffer(floatToBuffer(alt_l), msgBuffer);
	msgBuffer = packToBuffer(floatToBuffer(alt_r), msgBuffer);
	msgBuffer = packToBuffer(floatToBuffer(alt_t), msgBuffer);
	msgBuffer = packToBuffer(floatToBuffer(bott_clr), msgBuffer);

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


mavlink_msg_gps_global_origin = function(system_id, component_id, seq, lat, lon, alt) {

	var payload_length = 12;
	var crc = 65535;
	var msg_id = 49; // MAVLINK_MSG_ID_GPS_GLOBAL_ORIGIN
	var crc_extra = 39; // MAVLINK_MSG_ID_GPS_GLOBAL_ORIGIN
	var header = [magic_number];
	var msgBuffer = [];


	msgBuffer = packToBuffer(numberToBuffer(payload_length,1), msgBuffer);
	msgBuffer = packToBuffer(numberToBuffer(seq,1), msgBuffer);
	msgBuffer = packToBuffer(numberToBuffer(system_id,1), msgBuffer);
	msgBuffer = packToBuffer(numberToBuffer(component_id,1), msgBuffer);
	msgBuffer = packToBuffer(numberToBuffer(msg_id,1), msgBuffer);
	msgBuffer = packToBuffer(numberToBuffer(lat, 4), msgBuffer);
	msgBuffer = packToBuffer(numberToBuffer(lon, 4), msgBuffer);
	msgBuffer = packToBuffer(numberToBuffer(alt, 4), msgBuffer);


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

mavlink_msg_gps_global_position_int = function(system_id, component_id, seq, lat, lon, alt, rel_alt, vx, vy, vz, hdg) {

	var payload_length = 28;
	var crc = 65535;
	var msg_id = 33; // MAVLINK_MSG_ID_GLOBAL_POSITION_INT
	var crc_extra = 104; // MAVLINK_MSG_ID_GLOBAL_POSITION_INT
	var header = [magic_number];
	var msgBuffer = [];
	var timeMsec = new Date().getTime() - simStartTime;


	msgBuffer = packToBuffer(numberToBuffer(payload_length,1), msgBuffer);
	msgBuffer = packToBuffer(numberToBuffer(seq,1), msgBuffer);
	msgBuffer = packToBuffer(numberToBuffer(system_id,1), msgBuffer);
	msgBuffer = packToBuffer(numberToBuffer(component_id,1), msgBuffer);
	msgBuffer = packToBuffer(numberToBuffer(msg_id,1), msgBuffer);
	msgBuffer = packToBuffer(numberToBuffer(timeMsec, 4), msgBuffer);
	msgBuffer = packToBuffer(numberToBuffer(lat, 4), msgBuffer);
	msgBuffer = packToBuffer(numberToBuffer(lon, 4), msgBuffer);
	msgBuffer = packToBuffer(numberToBuffer(alt, 4), msgBuffer);
	msgBuffer = packToBuffer(numberToBuffer(rel_alt, 4), msgBuffer);
	msgBuffer = packToBuffer(numberToBuffer(vx, 2), msgBuffer);
	msgBuffer = packToBuffer(numberToBuffer(vy, 2), msgBuffer);
	msgBuffer = packToBuffer(numberToBuffer(vz, 2), msgBuffer);
	msgBuffer = packToBuffer(numberToBuffer(hdg, 2), msgBuffer);



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



mavlink_msg_home_position = function(system_id, component_id, seq, lat, lon, alt) {

	var payload_length = 52;
	var crc = 65535;
	var msg_id = 242; // MAVLINK_MSG_ID_GLOBAL_POSITION_INT
	var crc_extra = 104; // MAVLINK_MSG_ID_GLOBAL_POSITION_INT
	var header = [magic_number];
	var msgBuffer = [];


	msgBuffer = packToBuffer(numberToBuffer(payload_length,1), msgBuffer);
	msgBuffer = packToBuffer(numberToBuffer(seq,1), msgBuffer);
	msgBuffer = packToBuffer(numberToBuffer(system_id,1), msgBuffer);
	msgBuffer = packToBuffer(numberToBuffer(component_id,1), msgBuffer);
	msgBuffer = packToBuffer(numberToBuffer(msg_id,1), msgBuffer);
	msgBuffer = packToBuffer(numberToBuffer(lat, 4), msgBuffer);
	msgBuffer = packToBuffer(numberToBuffer(lon, 4), msgBuffer);
	msgBuffer = packToBuffer(numberToBuffer(alt, 4), msgBuffer);
	msgBuffer = packToBuffer(floatToBuffer(0), msgBuffer);
	msgBuffer = packToBuffer(floatToBuffer(0), msgBuffer);
	msgBuffer = packToBuffer(floatToBuffer(0), msgBuffer);
	msgBuffer = packToBuffer(floatToBuffer(0), msgBuffer);
	msgBuffer = packToBuffer(floatToBuffer(0), msgBuffer);
	msgBuffer = packToBuffer(floatToBuffer(0), msgBuffer);
	msgBuffer = packToBuffer(floatToBuffer(0), msgBuffer);
	msgBuffer = packToBuffer(floatToBuffer(0), msgBuffer);
	msgBuffer = packToBuffer(floatToBuffer(0), msgBuffer);
	msgBuffer = packToBuffer(floatToBuffer(0), msgBuffer);



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


mavlink_msg_heartbeat = function(system_id, component_id, seq, type, armed) {

	var payload_length = 9;
	var crc = 65535;
	var msg_id = 0; // MSG_ID_GPS_RAW_INT_CRC
	var crc_extra = 50; // MSG_ID_GPS_RAW_INT_CRC
	var header = [magic_number];
	var msgBuffer = [];
	var msgIndex = 0;

	var tmp = "";

	var custom_mode = 15; /*<  A bitfield for use for autopilot-specific flags*/
	//var type = 1; /*<  Vehicle or component type. For a flight controller component the vehicle type (quadrotor, helicopter, etc.). For other components the component type (e.g. camera, gimbal, etc.). This should be used in preference to component id for identifying the component type.*/
	var autopilot = 3; /*<  Autopilot type / class. Use MAV_AUTOPILOT_INVALID for components that are not flight controllers.*/
	var base_mode = armed == true ? 0x58 | 0x80 : 0x58;//89; /*<  System mode bitmap.*/
	var system_status = 4; /*<  System status flag.*/
	var mavlink_version = 3; /*<  MAVLink version, not writable by user, gets added by protocol because of magic data type: uint8_t_mavlink_version*/


	msgBuffer = packToBuffer(numberToBuffer(payload_length,1), msgBuffer);
	msgBuffer = packToBuffer(numberToBuffer(seq,1), msgBuffer);
	msgBuffer = packToBuffer(numberToBuffer(system_id,1), msgBuffer);
	msgBuffer = packToBuffer(numberToBuffer(component_id,1), msgBuffer);
	msgBuffer = packToBuffer(numberToBuffer(msg_id,1), msgBuffer);
	msgBuffer = packToBuffer(numberToBuffer(custom_mode,4), msgBuffer);
	msgBuffer = packToBuffer(numberToBuffer(type,1), msgBuffer);
	msgBuffer = packToBuffer(numberToBuffer(autopilot,1), msgBuffer);
	msgBuffer = packToBuffer(numberToBuffer(base_mode,1), msgBuffer);
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

