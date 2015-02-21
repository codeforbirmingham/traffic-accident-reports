(function () {
    "use strict";

    var baseLayer, heatmapLayer, map, testData;

    baseLayer = L.tileLayer("http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "...",
        maxZoom: 18
    });

    heatmapLayer = new HeatmapOverlay({});

    map = L.map("heatmap", {
        center: L.latLng(33.5250, -86.8130),
        zoom: 10,
        layers: [baseLayer, heatmapLayer]
    });

    testData = {
        data: [{
            lat: 33.5250,
            lng: -86.8130,
            radius: 24
        }, {
            lat: 33.6250,
            lng: -86.7130,
            radius: 12
        }]
    };

    heatmapLayer.setData(testData);

}());
