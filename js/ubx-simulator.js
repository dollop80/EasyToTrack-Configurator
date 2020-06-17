function ubxPrepareMsg(msgClass, msgID, length, payload){
	var data = [];
	var cnt = 0;
	data[cnt++] = 0xB5; //Header
	data[cnt++] = 0x62; //Header
	data[cnt++] = msgClass;
	data[cnt++] = msgID;
	data[cnt++] = length & 0xFF;
	data[cnt++] = (length >> 8) & 0xFF;
	for (var i = 0; i < length; i++)
	{
		data[cnt++] = payload[i];
	}

	var checksum = update_checksum(data, length + 6);
	data[cnt++] = checksum[0];
	data[cnt++] = checksum[1];
	return data;
}

function update_checksum(data, len)
{
	var ck_a = 0, ck_b = 0;
	for(var i = 2; i < len; i++)
	{
		ck_a = (ck_a + data[i]) & 0xFF;
		ck_b = (ck_b + ck_a) & 0xFF;
	}
	return [ck_a, ck_b];
}


function build_ubx_nav_posllh(_time, _lat, _lon, _height, _hacc){

	var lon = _lon * 1e7;
	var lat = _lat * 1e7;
	var height = _height * 1000.0;
	var hmsl = height;
	var hacc = _hacc;
	var vacc = hacc + 10;

	var msgBuffer = [];

	msgBuffer = packToBuffer(numberToBuffer(_time,4), msgBuffer);
	msgBuffer = packToBuffer(numberToBuffer(lon,4), msgBuffer);
	msgBuffer = packToBuffer(numberToBuffer(lat,4), msgBuffer);
	msgBuffer = packToBuffer(numberToBuffer(height,4), msgBuffer);
	msgBuffer = packToBuffer(numberToBuffer(hmsl,4), msgBuffer);
	msgBuffer = packToBuffer(numberToBuffer(hacc,4), msgBuffer);
	msgBuffer = packToBuffer(numberToBuffer(vacc,4), msgBuffer);

	var bytes = new Uint8Array(msgBuffer.length);
	for (var i = 0; i < msgBuffer.length; ++i) {
		bytes[i] = msgBuffer[i];
	}

	return ubxPrepareMsg(0x01, 0x02, bytes.length, bytes);
}

var ttff = 0;
function build_ubx_nav_status(_time, _fix){

	var flags = 0x0F;
	var fixStat =0;
	var flags2 = 0;
	var ttff = _time / 1000;//(ttff++ * 100);
	var msgBuffer = [];

	msgBuffer = packToBuffer(numberToBuffer(_time,4), msgBuffer);
	msgBuffer = packToBuffer(numberToBuffer(_fix,1), msgBuffer);
	msgBuffer = packToBuffer(numberToBuffer(flags,1), msgBuffer);
	msgBuffer = packToBuffer(numberToBuffer(fixStat,1), msgBuffer);
	msgBuffer = packToBuffer(numberToBuffer(flags2,1), msgBuffer);
	msgBuffer = packToBuffer(numberToBuffer(ttff,4), msgBuffer);

	var bytes = new Uint8Array(msgBuffer.length);
	for (var i = 0; i < msgBuffer.length; ++i) {
		bytes[i] = msgBuffer[i];
	}

	return ubxPrepareMsg(0x01, 0x03, bytes.length, bytes);
}