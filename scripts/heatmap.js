(function () {
    "use strict";

    var baseLayer, map;

    baseLayer = L.tileLayer("http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "...",
        maxZoom: 18
    });

    map = L.map("heatmap", {
        center: L.latLng(33.5250, -86.8130),
        zoom: 10,
        layers: [baseLayer]
    });

}());
