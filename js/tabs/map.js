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
    name: 'Tracker'
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

// finally, the map with our custom interactions, controls and overlays
var map = new ol.Map({
    target: 'map',
    layers: [layer, vectorLayer],
    view: view
});


window.addEventListener('message', function (e) {
    var data = e.data;
    var origin = e.origin;
});

window.addEventListener('message', function (e) {
    var mainWindow = e.source;
    var result = '';
    try {
        switch (e.data.action) {
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
                        src: '/images/icons/tracker-map-icon.png',
                        rotation: e.data.course
                    }))
                });

                vectorLayer.setStyle(iconStyle);
                view.setCenter(ol.proj.transform([e.data.lon, e.data.lat], 'EPSG:4326', 'EPSG:3857'));
        }
    } catch (e) {
        console.log('message error');
    }
});