function mspPrepareMsg(messageID, payload, size){
	var data = [];
	var cnt = 0;
	data[cnt++] = 0x24; //'$';
	data[cnt++] = 0x4d; //'M';
	data[cnt++] = 0x3e; // '>'; 0x3c; //'<';
	data[cnt++] = size;
	data[cnt++] = messageID;
	var checksum = size ^ messageID;
	for (var i = 0; i < size; i++)
	{
		data[cnt++] = payload[i];
		checksum ^= payload[i];
	}
	data[cnt++] = checksum;
	return data;
}

function build_msp_altitude(_estAltitude, _estVertVel){

	var estAltitude = _estAltitude * 100;
	var estVertVel = _estVertVel * 100;
	var baroAlt = estAltitude;

	var msgBuffer = [];
	var MSP_ALTITUDE = 109;

	msgBuffer = packToBuffer(numberToBuffer(estAltitude,4), msgBuffer);
	msgBuffer = packToBuffer(numberToBuffer(estVertVel,2), msgBuffer);
	msgBuffer = packToBuffer(numberToBuffer(baroAlt,4), msgBuffer);

	var bytes = new Uint8Array(msgBuffer.length);
	for (var i = 0; i < msgBuffer.length; ++i) {
		bytes[i] = msgBuffer[i];
	}

	return mspPrepareMsg(MSP_ALTITUDE, bytes, bytes.length);
}

function build_msp_attitude(_roll, _pitch, _yaw){

	var roll = _roll * 1000;
	var pitch = _pitch * 1000;
	var yaw = _yaw * 1000;

	var msgBuffer = [];
	var MSP_ATTITUDE = 108;

	msgBuffer = packToBuffer(numberToBuffer(roll,2), msgBuffer);
	msgBuffer = packToBuffer(numberToBuffer(pitch,2), msgBuffer);
	msgBuffer = packToBuffer(numberToBuffer(yaw,2), msgBuffer);

	var bytes = new Uint8Array(msgBuffer.length);
	for (var i = 0; i < msgBuffer.length; ++i) {
		bytes[i] = msgBuffer[i];
	}

	return mspPrepareMsg(MSP_ATTITUDE, bytes, bytes.length);
}


function build_msp_analog(_vbat, _mAhDrawn, _rssi, _amperage){

	var vbat = _vbat*10;
	var mAhDrawn = _mAhDrawn;
	var rssi = _rssi;
	var amperage = amperage;

	var msgBuffer = [];
	var MSP_ANALOG = 110;

	msgBuffer = packToBuffer(numberToBuffer(vbat,1), msgBuffer);
	msgBuffer = packToBuffer(numberToBuffer(mAhDrawn,2), msgBuffer);
	msgBuffer = packToBuffer(numberToBuffer(rssi,2), msgBuffer);
	msgBuffer = packToBuffer(numberToBuffer(amperage,2), msgBuffer);

	var bytes = new Uint8Array(msgBuffer.length);
	for (var i = 0; i < msgBuffer.length; ++i) {
		bytes[i] = msgBuffer[i];
	}

	return mspPrepareMsg(MSP_ANALOG, bytes, bytes.length);
}


function build_msp_raw_gps(_fixType, numSat, _lat, _lon, _alt, _groundSpeed, _groundCourse){

	var lat = _lat * 10000000;
	var lon = _lon * 10000000;
	var alt = _alt;
	var groundSpeed = _groundSpeed * 100;
	var groundCourse = _groundCourse * 10;
	var hdop = 100*(6.0/$("#simulation-sats").val());

	var msgBuffer = [];
	var MSP_RAW_GPS = 106;

	var fixType = 0;
	if(_fixType < 2) fixType = 0;
	else if (_fixType == 2) fixType = 1;
	else fixType = 3;

	msgBuffer = packToBuffer(numberToBuffer(fixType,1), msgBuffer);
	msgBuffer = packToBuffer(numberToBuffer(numSat,1), msgBuffer);
	msgBuffer = packToBuffer(numberToBuffer(lat,4), msgBuffer);
	msgBuffer = packToBuffer(numberToBuffer(lon,4), msgBuffer);
	msgBuffer = packToBuffer(numberToBuffer(alt,2), msgBuffer);
	msgBuffer = packToBuffer(numberToBuffer(groundSpeed,2), msgBuffer);
	msgBuffer = packToBuffer(numberToBuffer(groundCourse,2), msgBuffer);
	msgBuffer = packToBuffer(numberToBuffer(hdop,2), msgBuffer);

	var bytes = new Uint8Array(msgBuffer.length);
	for (var i = 0; i < msgBuffer.length; ++i) {
		bytes[i] = msgBuffer[i];
	}

	return mspPrepareMsg(MSP_RAW_GPS, bytes, bytes.length);
}