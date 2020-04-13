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

            home0[0] = $("#simulator-home-lat").val();
            home0[1] = $("#simulator-home-lon").val();

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



            if (protocol == protocols.MFD)
                NMEAGPGGA = setHome2MFD();
            else if($("#simulation-type").val() !== '3')
                NMEAGPGGA = buildPacket(p1.lat, p1.lon, altitude, 0, 0, speed, roll, pitch);

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
                }
                altitude = $("#simulator-altitude").val();
				speed = $("#simulator-speed").val() * 0.539957;
                if (new Date().getTime() - sendHomeTimer < 10000) {
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
                roll = 5 * (coursePrev - unwrap(coursePrev * Math.PI/180.0, course * Math.PI/180.0) * 180.0/Math.PI) * (Math.PI / 180.0);
                roll = rollPrev + 0.1 * (roll - rollPrev);
                pitch = 5 * (altitude - altitudePrev) * (Math.PI / 180.0);
                pitch = pitchPrev + 0.05 * (pitch - pitchPrev);
                coursePrev = course;
                altitudePrev = altitude;
                rollPrev = roll;
                pitchPrev = pitch;

                $("#course").val(Math.round(course * 10) / 10);
                lastPoint.lat = p2.lat;
                lastPoint.lon = p2.lon;
                distance2Home = home.distanceTo(p2);
                NMEAGPGGA = buildPacket(p2.lat, p2.lon, altitude, distance2Home, course, speed, roll, pitch);

                //showPacket(NMEAGPGGA);

                p1 = p2;
                calculateDistanceTimer = new Date().getTime();

                // Update Map
                TABS.sim.updateSimMap(p2.lat, p2.lon, altitude, $("#simulator-speed").val(), distance2Home, $("#simulator-sats").val(), true, course);

            }, $("#simulation-frequency").val(), false);

        });


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
        
		$("#simulator-home-lat").on('change',function(){
			TABS.sim.storeCustomLatLon();
		});
		
		$("#simulator-home-lon").on('change',function(){
			TABS.sim.storeCustomLatLon();
		});
		
		chrome.storage.local.get('userHomeLatLon', function (result) {
			if (result.userHomeLatLon) {
				var latlon = result.userHomeLatLon.split(',');
				$("#simulator-home-lat").val(latlon[0]);
				$("#simulator-home-lon").val(latlon[1]);
			}
		});		

        GUI.content_ready(callback);
        
    });

};

}


TABS.sim.updateSimMap = function (lat, lon, alt, speed, distHome, sats, fix, course) {

    var message = {
        action: 'center',
        lat: lat,
        lon: lon,
        course: course * (3.14/180.0)
    };

    var frame = document.getElementById('map');
    frame.contentWindow.postMessage(message, '*');
}

TABS.sim.cleanup = function (callback) {
    if (callback)
        callback();
};

TABS.sim.storeCustomLatLon = function (){
	var lat = $("#simulator-home-lat").val();
	var lon = $("#simulator-home-lon").val();
	var latlon = lat + ',' + lon;
	chrome.storage.local.set({'userHomeLatLon': latlon});
};
