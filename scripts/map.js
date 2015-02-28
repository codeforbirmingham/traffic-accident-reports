(function () {
    "use strict";

    var baseLayer, clusterLayer, map, redraw;

    baseLayer = L.tileLayer('http://{s}.{base}.maps.cit.api.here.com/maptile/2.1/maptile/{mapID}/normal.day/{z}/{x}/{y}/256/png8?app_id={app_id}&app_code={app_code}', {
        attribution: 'Map &copy; 1987-2014 <a href="http://developer.here.com">HERE</a>',
        subdomains: '1234',
        mapID: 'newest',
        app_id: 'oBrjPtnB5CZNkvOVmmqw',
        app_code: 'TPBtO9fTES--LhkVo5sKeA',
        base: 'base',
        minZoom: 0,
        maxZoom: 20
    });

    clusterLayer = L.markerClusterGroup();

    map = L.map("map", {
        center: L.latLng(33.5250, -86.8130),
        zoom: 12,
        minZoom: 12,
        layers: [baseLayer, clusterLayer]
    });

    redraw = function () {
        clusterLayer.clearLayers();
        TrafficAccidents.getLocations().forEach(function (location) {
            var mark;
            mark = L.marker([location.coordinates.latitude, location.coordinates.longitude]);
            clusterLayer.addLayer(mark);
        });
    };

 // Fetch initial data.
    TrafficAccidents.fetch(function () {
     // Hide loader and show map.
        $("#loader").hide();
        $("#mainframe").css("visibility", "visible");
        redraw();
    });

 // Assign handlers.
    $("#select-year").on("change", function () {
        var year;
        year = $(this).val();
        TrafficAccidents.filterByYear(year);
        redraw();
    });

}());
