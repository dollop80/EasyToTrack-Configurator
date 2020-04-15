'use strict';
/*global $*/

TABS.sim = {};


TABS.sim.initialize = function (callback) {
    var self = this;

    if (GUI.active_tab !== 'sim') {
        GUI.active_tab = 'sim';

    function set_online() {
        $('#connect').hide();
        //$('#waiting').show();
        $('#loadmap').show();
    }

    function set_offline() {
        $('#connect').show();
        $('#waiting').hide();
        $('#loadmap').hide();
    }

    $('#content').load("./tabs/sim.html", function () {
        // translate to user-selected language
        i18n.localizePage();

        if (GUI.simModeEnabled) {
            $('#simDisableDiv').hide();
            $('#simDiv').show();
        }

        $(".simulator-start").on('click', function (e) {

            $("#simulator-log").html('');

            $('.simulator-start').hide();
            $('.simulator-stop').show();

            vehicleType = $("#vehicle-type").val();

            accDistance = 0;
            radius = $("#simulator-distance").val();
            altitude = $("#simulator-altitude").val();
            startDistance = radius; // Revisar
            simulationStarted = true;
            sendHomeTimer = new Date().getTime();
            lastPoint = new LatLon(home0[0], home0[1]);
            course = 0;
            protocol = $("#simulation-protocol").val();
            roll = 0.0;
            pitch = 0.0;

            var timerInterval = $("#simulation-frequency").val();
            var home = new LatLon(home0[0], home0[1]);
            var homeForEight =  [home.destinationPoint(radius, 180).lat, home.destinationPoint(radius, 180).lon];
            var home1 = home.destinationPoint(radius * 2, 180);
            var home2 = home;
            var p1 = new LatLon(home.lat, home.lon);
            var directions = {left: 1, right: 2};
            var direction = directions.right;
            var navDistance = 0;
            var NMEAGPGGA;
            var distance2Home = 0;

            var p2 = new LatLon(home.lat, home.lon);
            var heading = 0;

            var swithced = false;
            var firstRun = true;

            simStartTime = new Date().getTime();

            if (protocol == protocols.MFD)
                NMEAGPGGA = setHome2MFD();
            else if($("#simulation-type").val() !== '3')
                NMEAGPGGA = buildPacket(p1.lat, p1.lon, altitude, 0, 0, speed, vspeed, roll, pitch);

            GTS.send(NMEAGPGGA + '\n');
            $("#simulator-log").append(NMEAGPGGA + '\n');

            // SIM LOOP
            GUI.interval_add("sim_interval", function () {
                radius = $("#simulator-distance").val();
                home1 = home2.destinationPoint(radius * 2, 180);
                if($("#simulation-type").val() == '3' && firstRun)
                {
                    firstRun = false;
                    home = home1;


                    var message = {
                        action: 'ping',
                        home: homeForEight,
                        type: vehicleType
                    };

                    var frame = document.getElementById('map');
                    if(frame) {
                        frame.contentWindow.postMessage(message, '*');
                    }

                }
                altitude = $("#simulator-altitude").val();
				speed = $("#simulator-speed").val() * 0.539957;
                if (new Date().getTime() - sendHomeTimer < 10000) {
                    if(new Date().getTime() - sendHomeTimer > 5000)
                        armed = true;

                    distance = 1.0;
                    heading = 0;
					speed = 0.0;
                    if($("#simulation-type").val() == '3')
                    {
                        distance = radius;
                        heading = 0;
                    }
                    p2 = home.destinationPoint(distance, heading);

                } else {
                    // Speed
                    var varTime = (new Date().getTime() - calculateDistanceTimer);
                    if (calculateDistanceTimer == 0)
                        varTime = 0;//timerInterval;
                    distance = Speed($("#simulator-speed").val()) * (varTime / 1000);

                    if($("#simulation-type").val() == '3')
                    {
                        accDistance = startDistance;
                    }

                    if (accDistance < startDistance) {
                        heading = 0;
                        accDistance += distance;
                        p2 = p1.destinationPoint(distance, heading);
                    } else {
                        switch ($("#simulation-type").val()) {

                            case '1': //Circular
                                if (direction == directions.right) {
                                    heading += degreesPerSecond(distance, radius);
                                    if (heading >= 360 * 2)
                                        direction = directions.left;
                                } else if (direction == directions.left) {
                                    heading -= degreesPerSecond(distance, radius);
                                    if (heading <= 0)
                                        direction = directions.right;
                                }
                                p2 = home.destinationPoint(radius, heading);
                                break;

                            case '2': //Parallel
                                if (navDistance <= 300)
                                    navDistance += distance;
                                else {
                                    navDistance = -300;
                                    if (direction == directions.left)
                                        direction = directions.right;
                                    else if (direction == directions.right)
                                        direction = directions.left;
                                }
                                if (direction == directions.right)
                                    heading = 90;
                                else if (direction == directions.left)
                                    heading = 270;
                                p2 = p1.destinationPoint(distance, heading);
                                break;

                            case '3': //Eight
                                if (direction == directions.right) {
                                    heading += degreesPerSecond(distance, radius);
                                    if (heading >= 360) {
                                        direction = directions.left;
                                        heading = 180;
                                        home = home2;
                                        swithced = true;
                                    }

                                } else if (direction == directions.left) {
                                    heading -= degreesPerSecond(distance, radius);
                                    if (heading <= -180) {
                                        direction = directions.right;
                                        heading = 0;
                                        home = home1;
                                        swithced = true;
                                    }
                                }
                                p2 = home.destinationPoint(radius, heading);
                                //if (accDistance == 0) {}
                                break;
                        }
                    }
                }


                if(swithced) {
                    swithced = false;
                }
                else
                    course = lastPoint.bearingTo(p2);

                //Very simple roll and pitch approximation. Only to get variable data for the values :)
                switch (vehicleType) {
                    case "copter":
                        roll = -(1000.0/$("#simulation-frequency").val()) * (coursePrev - unwrap(coursePrev * Math.PI/180.0, course * Math.PI/180.0) * 180.0/Math.PI) * (Math.PI / 180.0);
                        if(roll < -30 * (Math.PI / 180.0)) roll = -30 * (Math.PI / 180.0);
                        if(roll > 30 * (Math.PI / 180.0)) roll = 30 * (Math.PI / 180.0);
                        roll = rollPrev + 0.1 * (roll - rollPrev);

                        pitch = -speed * (Math.PI / 180.0);
                        if(pitch < -50 * (Math.PI / 180.0)) pitch = -50 * (Math.PI / 180.0);
                        if(pitch > 50 * (Math.PI / 180.0)) pitch = 50 * (Math.PI / 180.0);
                        pitch = pitchPrev + 0.05 * (pitch - pitchPrev);
                        break;
                    case "plane":
                        roll = -(1000.0/$("#simulation-frequency").val()) * (coursePrev - unwrap(coursePrev * Math.PI/180.0, course * Math.PI/180.0) * 180.0/Math.PI) * (Math.PI / 180.0);
                        if(roll < -50 * (Math.PI / 180.0)) roll = -50 * (Math.PI / 180.0);
                        if(roll > 50 * (Math.PI / 180.0)) roll = 50 * (Math.PI / 180.0);
                        roll = rollPrev + 0.1 * (roll - rollPrev);

                        pitch = (1000.0/$("#simulation-frequency").val()) * (altitude - altitudePrev) * (Math.PI / 180.0);
                        if(pitch < -80 * (Math.PI / 180.0)) pitch = -80 * (Math.PI / 180.0);
                        if(pitch > 80 * (Math.PI / 180.0)) pitch = 80 * (Math.PI / 180.0);
                        pitch = pitchPrev + 0.05 * (pitch - pitchPrev);
                        break;
                    case "rover":
                        roll = getRndInteger(-100, 100) / 20.0 * (Math.PI / 180.0);
                        roll = rollPrev + 0.1 * (roll - rollPrev);
                        pitch = getRndInteger(-100, 100) / 20.0 * (Math.PI / 180.0);
                        pitch = pitchPrev + 0.05 * (pitch - pitchPrev);
                        break;
                }

                vspeed = (altitude - altitudePrev) / (varTime / 1000);

                coursePrev = course;
                altitudePrev = altitude;
                rollPrev = roll;
                pitchPrev = pitch;

                $("#course").val(Math.round(course * 10) / 10);
                lastPoint.lat = p2.lat;
                lastPoint.lon = p2.lon;
                distance2Home = home.distanceTo(p2);
                NMEAGPGGA = buildPacket(p2.lat, p2.lon, altitude, distance2Home, course, speed, vspeed, roll, pitch);

                //showPacket(NMEAGPGGA);

                p1 = p2;
                calculateDistanceTimer = new Date().getTime();

                $("#simulator-home-lat").val(p2.lat.toFixed(8));
                $("#simulator-home-lon").val(p2.lon.toFixed(8));

                // Update Map
                TABS.sim.updateSimMap(p2.lat, p2.lon, altitude, $("#simulator-speed").val(), distance2Home, $("#simulator-sats").val(), true, course, home0, vehicleType);

            }, $("#simulation-frequency").val(), false);


            //Simulate static position NMEA messages for serial portGs
            GUI.interval_add("sim_interval-Gs", function () {
                var packet;
                if(GUI.connected_toGs) {
                    var lat = $("#simulator-gs-home-lat").val();
                    var lon = $("#simulator-gs-home-lon").val();
                    var alt = $("#simulator-gs-home-alt").val();

                    packet = buildGPGGA(lat, lon, alt, false);
                    GTS.sendGs(packet + '\r\n');
                    packet = buildGPRMC(lat, lon, alt, 0, 0, false);
                    GTS.sendGs(packet + '\r\n');
                    packet = buildGSA();
                    GTS.sendGs(packet + '\r\n');
                }

            }, $("#simulation-frequency-Gs").val(), false);

        });


        GUI.interval_add("sim_map_ping", function () {
            console.log('pinging...');
            console.log(home0);
            var message = {
                action: 'ping',
                home: home0,
                type: vehicleType
            };

            var frame = document.getElementById('map');
            if(frame) {
                frame.contentWindow.postMessage(message, '*');
            }
        }, 100, false);



        $(".simulator-stop").on('click', function (e) {
            simulationStarted = false;
            GUI.interval_kill_all(false);
            $('.simulator-stop').hide();
            $('.simulator-start').show();
        });


        //check for internet connection on load
        if (navigator.onLine) {
            console.log('Online');
            set_online();
        } else {
            console.log('Offline');
            set_offline();
        }

        var frame = document.getElementById('map');

        $('#zoom_in').click(function () {
            console.log('zoom in');
            var message = {
                action: 'zoom_in'
            };
            frame.contentWindow.postMessage(message, '*');
        });

        $('#zoom_out').click(function () {
            console.log('zoom out');
            var message = {
                action: 'zoom_out'
            };
            frame.contentWindow.postMessage(message, '*');
        });

        $('#update_map').click(function () {
            console.log('update map');
            var defaultHome = new LatLon($("#simulator-home-lat").val(), $("#simulator-home-lon").val());
            var message = {
                action: 'center',
                lat: defaultHome.lat,
                lon: defaultHome.lon
            };
            frame.contentWindow.postMessage(message, '*');
        });
        
		$("#simulator-gs-home-lat").on('change',function(){
			TABS.sim.storeCustomLatLon();
		});
		
		$("#simulator-gs-home-lon").on('change',function(){
			TABS.sim.storeCustomLatLon();
		});

        $("#simulator-gs-home-alt").on('change',function(){
            TABS.sim.storeCustomLatLon();
        });

        $("#vehicle-type").on('change',function(){
            //TABS.sim.storeCustomLatLon();
            vehicleType = $("#vehicle-type").val();

            var message = {
                action: 'ping',
                home: home0,
                type: vehicleType
            };

            var frame = document.getElementById('map');
            if(frame) {
                frame.contentWindow.postMessage(message, '*');
            }
        });

		chrome.storage.local.get('userHomeLatLonAlt', function (result) {
		    console.log(result);
			if (result.userHomeLatLonAlt) {
				var latlon = result.userHomeLatLonAlt.split(',');
				$("#simulator-gs-home-lat").val(latlon[0]);
				$("#simulator-gs-home-lon").val(latlon[1]);
                $("#simulator-gs-home-alt").val(latlon[2]);

                $("#simulator-home-lat").val(latlon[0]);
                $("#simulator-home-lon").val(latlon[1]);

                home0[0] = latlon[0];
                home0[1] = latlon[1];
			}
		});



        GUI.content_ready(callback);
        
    });
};

}


TABS.sim.updateSimMap = function (lat, lon, alt, speed, distHome, sats, fix, course, homePos, type) {

    var message = {
        action: 'center',
        lat: lat,
        lon: lon,
        course: course * (Math.PI / 180.0),
        home: homePos,
        type: type
    };

    var frame = document.getElementById('map');
    frame.contentWindow.postMessage(message, '*');
}



TABS.sim.cleanup = function (callback) {
    if (callback)
        callback();
};

TABS.sim.storeCustomLatLon = function (){
	var lat = $("#simulator-gs-home-lat").val();
	var lon = $("#simulator-gs-home-lon").val();
    var alt = $("#simulator-gs-home-alt").val();
	var latlon = lat + ',' + lon + ',' + alt;
	chrome.storage.local.set({'userHomeLatLonAlt': latlon});
};


window.addEventListener('message', function (e) {
    var mainWindow = e.source;
    var result = '';
    try {
        switch (e.data.action) {
            case 'home': //return message to update home position set by clicking on map
                $('#simulator-gs-home-lat').val(e.data.lat.toFixed(8));
                $('#simulator-gs-home-lon').val(e.data.lon.toFixed(8));

                var element = document.getElementById('simulator-gs-home-lat');
                var event = new Event('change');
                element.dispatchEvent(event);

                break;
            case 'pong'://pong return message from map. after this we know that map knows about sim and can send messages
                GUI.interval_remove("sim_map_ping");
                console.log('done...');
                break;
        }
    } catch (e) {
        console.log('message error');
    }
});
