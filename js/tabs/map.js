// create a layer with the OSM source
var layer = new ol.layer.Tile({
    source: new ol.source.OSM()
});

// center on london, transforming to map projection
var center = ol.proj.transform([39.171114, 48.741589], 'EPSG:4326', 'EPSG:3857');

// view, starting at the center
var view = new ol.View({
    center: center,
    zoom: 15
});

var iconFeatures = [];

var iconFeature = new ol.Feature({
    geometry: new ol.geom.Point(ol.proj.transform([39.171114, 48.741589], 'EPSG:4326', 'EPSG:3857')),
    name: 'Aircraft'
});

iconFeatures.push(iconFeature);


var iconStyle = new ol.style.Style({
    image: new ol.style.Icon(/** @type {olx.style.IconOptions} */ ({
        anchor: [0.5, 0.5],
        anchorXUnits: 'fraction',
        anchorYUnits: 'fraction',
        scale: 0.08,
		src: '/images/icons/tracker-map-icon.png',
    }))
});


var vectorSource = new ol.source.Vector({
    features: iconFeatures //add an array of features
});


var vectorLayer = new ol.layer.Vector({
    source: vectorSource,
    style: iconStyle
});



///////////////////////////
//create layer for Home Marker
let homeStyle = new ol.style.Style({
    image: new ol.style.Icon(({
        anchor: [0.5, 1.0],
        opacity: 0.8,
        scale: 0.3,
        src: '/images/icons/tracker-map-home.png',
    }))
});

homeGeo = new ol.geom.Point(ol.proj.fromLonLat([90, 0]));

let homeFeature = new ol.Feature({
    geometry: homeGeo
});

homeFeature.setStyle(homeStyle);

let homeVector = new ol.source.Vector({
    features: [homeFeature]
});
let homeLayer = new ol.layer.Vector({
    source: homeVector
});




// finally, the map with our custom interactions, controls and overlays
var map = new ol.Map({
    target: 'map',
    layers: [layer, vectorLayer],
    view: view
});

var markers = [];





function addMarker(_pos, _alt, click) {
    if(markers.length !=0 )
    {
        map.removeLayer(markers[0])
        markers = [];
    }
    var iconFeature = new ol.Feature({
        geometry: new ol.geom.Point(_pos),
        name: 'Null Island',
        population: 4000,
        rainfall: 500
    });

    var point = new ol.geom.Point(ol.proj.toLonLat([_pos[0], _pos[1]]));
    var message = {
        action: 'home',
        lon: point.flatCoordinates[0],
        lat: point.flatCoordinates[1]
    };

    mainWindow.postMessage(message, '*');

    //iconFeature.setStyle(getPointIcon());

    var vectorSource = new ol.source.Vector({
        features: [iconFeature]
    });

    var vectorLayer = new ol.layer.Vector({
        source: vectorSource
    });

    vectorLayer.alt = _alt;
    vectorLayer.number = markers.length;

    markers.push(vectorLayer);
    return vectorLayer;
}

map.on('click', function (evt) {
    map.addLayer(addMarker(evt.coordinate, 0));
})


function setIconImage(type)
{
    var res = '/images/icons/tracker-map-icon.png';
    switch (type) {
        case "copter":
            res = '/images/icons/tracker-map-copter.png';
            break;
        case "plane":
            res = '/images/icons/tracker-map-icon.png';
            break;
        case "rover":
            res = '/images/icons/tracker-map-rover.png';
            break;
    }
    return res;
}

window.addEventListener('message', function (e) {
    var data = e.data;
    var origin = e.origin;
});
var mainWindow;
window.addEventListener('message', function (e) {
    mainWindow = e.source;
    //console.log(e.source);
    var result = '';
    try {
        switch (e.data.action) {
            case 'ping':
                var homeCoords = ol.proj.fromLonLat([parseFloat(e.data.home[1]), parseFloat(e.data.home[0])]);
                map.addLayer(addMarker(homeCoords, 0));
                iconFeature.setGeometry(new ol.geom.Point(homeCoords));

                iconStyle = new ol.style.Style({
                    image: new ol.style.Icon(/** @type {olx.style.IconOptions} */ ({
                        anchor: [0.5, 0.5],
                        anchorXUnits: 'fraction',
                        anchorYUnits: 'fraction',
                        scale: 0.08,
                        src: setIconImage(e.data.type),
                        rotation: e.data.course
                    }))
                });

                vectorLayer.setStyle(iconStyle);
                view.setCenter(homeCoords);

                var message = {
                    action: 'pong',
                };
                mainWindow.postMessage(message, '*');
                break;
            case 'zoom_in':
                var zoom = map.getZoom();
                zoom++;
                map.setZoom(zoom);
                break;
            case 'zoom_out':
                var zoom = map.getZoom();
                zoom--;
                map.setZoom(zoom);
                break;
            case 'center':
                iconFeature.setGeometry(new ol.geom.Point(ol.proj.transform([e.data.lon, e.data.lat], 'EPSG:4326', 'EPSG:3857')));

                iconStyle = new ol.style.Style({
                    image: new ol.style.Icon(/** @type {olx.style.IconOptions} */ ({
                        anchor: [0.5, 0.5],
                        anchorXUnits: 'fraction',
                        anchorYUnits: 'fraction',
                        scale: 0.08,
                        src: setIconImage(e.data.type),
                        rotation: e.data.course
                    }))
                });

                vectorLayer.setStyle(iconStyle);
                //var homeCoords = ol.proj.fromLonLat([parseFloat(e.data.home[1]), parseFloat(e.data.home[0])]);
                //addMarker(homeCoords);

                view.setCenter(ol.proj.transform([e.data.lon, e.data.lat], 'EPSG:4326', 'EPSG:3857'));
        }
    } catch (e) {
        console.log('message error');
    }
});