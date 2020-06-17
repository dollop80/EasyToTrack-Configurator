function ltmPrepareMsg(payload, size){
	var data = [];
	var cnt = 0;
	data[cnt++] = 0x24; //'$';
	data[cnt++] = 0x54; //'T';
	var checksum = 0;
	for (var i = 0; i < size; i++)
	{
		data[cnt++] = payload[i];
		if(i>0)
			checksum ^= payload[i];
	}
	data[cnt++] = checksum;
	return data;
}

function build_ltm_Oframe(_lat, _lon, _alt){

	var lat = _lat * 10000000;
	var lon = _lon * 10000000;
	var alt = 0;//_alt * 100; //according to https://github.com/iNavFlight/inav/wiki/Lightweight-Telemetry-(LTM)


	var msgBuffer = [];

	var ID = 0x4F; //O
	msgBuffer = packToBuffer(numberToBuffer(ID,1), msgBuffer);
	msgBuffer = packToBuffer(numberToBuffer(lat,4), msgBuffer);
	msgBuffer = packToBuffer(numberToBuffer(lon,4), msgBuffer);
	msgBuffer = packToBuffer(numberToBuffer(alt,4), msgBuffer);
	msgBuffer = packToBuffer(numberToBuffer(1,1), msgBuffer);
	msgBuffer = packToBuffer(numberToBuffer(1,1), msgBuffer);

	var bytes = new Uint8Array(msgBuffer.length);
	for (var i = 0; i < msgBuffer.length; ++i) {
		bytes[i] = msgBuffer[i];
	}

	return ltmPrepareMsg(bytes, bytes.length);
}

function build_ltm_Aframe(_roll, _pitch, _heading){

	var roll = _roll * 180.0/3.14;
	var pitch = _pitch * 180.0/3.14;
	var heading = _heading;

	var msgBuffer = [];

	var ID = 0x41; //A
	msgBuffer = packToBuffer(numberToBuffer(ID,1), msgBuffer);
	msgBuffer = packToBuffer(numberToBuffer(pitch,2), msgBuffer);
	msgBuffer = packToBuffer(numberToBuffer(roll,2), msgBuffer);
	msgBuffer = packToBuffer(numberToBuffer(heading,2), msgBuffer);

	var bytes = new Uint8Array(msgBuffer.length);
	for (var i = 0; i < msgBuffer.length; ++i) {
		bytes[i] = msgBuffer[i];
	}

	return ltmPrepareMsg(bytes, bytes.length);
}


function build_ltm_Sframe(_vbat, _mAhDrawn, _rssi, _armed){

	var vbat = _vbat*1000;
	var mAhDrawn = _mAhDrawn;
	var rssi = _rssi;
	var airspeed = 0;
	var status = _armed ? 1: 0;

	var msgBuffer = [];

	var ID = 0x53; //S
	msgBuffer = packToBuffer(numberToBuffer(ID,1), msgBuffer);
	msgBuffer = packToBuffer(numberToBuffer(vbat,2), msgBuffer);
	msgBuffer = packToBuffer(numberToBuffer(mAhDrawn,2), msgBuffer);
	msgBuffer = packToBuffer(numberToBuffer(rssi,1), msgBuffer);
	msgBuffer = packToBuffer(numberToBuffer(airspeed,1), msgBuffer);
	msgBuffer = packToBuffer(numberToBuffer(status,1), msgBuffer);

	var bytes = new Uint8Array(msgBuffer.length);
	for (var i = 0; i < msgBuffer.length; ++i) {
		bytes[i] = msgBuffer[i];
	}

	return ltmPrepareMsg(bytes, bytes.length);
}


function build_ltm_Gframe(_fixType, numSat, _lat, _lon, _alt, _groundSpeed){

	var lat = _lat * 10000000;
	var lon = _lon * 10000000;
	var alt = _alt * 100;
	var groundSpeed = _groundSpeed;
	var sats = (parseInt(_fixType) & 0xFF) | ((parseInt(numSat) << 2) & 0xFF);

	var msgBuffer = [];

	var ID = 0x47; //G
	msgBuffer = packToBuffer(numberToBuffer(ID,1), msgBuffer);
	msgBuffer = packToBuffer(numberToBuffer(lat,4), msgBuffer);
	msgBuffer = packToBuffer(numberToBuffer(lon,4), msgBuffer);
	msgBuffer = packToBuffer(numberToBuffer(groundSpeed,1), msgBuffer);
	msgBuffer = packToBuffer(numberToBuffer(alt,4), msgBuffer);
	msgBuffer = packToBuffer(numberToBuffer(sats,1), msgBuffer);

	var bytes = new Uint8Array(msgBuffer.length);
	for (var i = 0; i < msgBuffer.length; ++i) {
		bytes[i] = msgBuffer[i];
	}

	return ltmPrepareMsg(bytes, bytes.length);
}