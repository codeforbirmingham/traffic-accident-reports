(function () {
    "use strict";

    Socrata.query({
        $select: "location,coordinates,crash_date,day_of_week",
        $limit: Socrata.limit
    }, function (err, result) {

        var data, coordinates, years, monthNames, months, dayOfWeekNames,
            daysOfWeek, baseLayer, clusterLayer, map, redraw;

     // Hide loader and show map.
        $("#loader").hide();
        $("#mainframe").css("visibility", "visible");

     // Filter out accidents without location. Socrata doesn't seem
     // to understand `$where=coordinates IS NOT NULL`.
        result = result.filter(function (trafficAccident) {
            return trafficAccident.hasOwnProperty("coordinates");
        });

     // Add data to Crossfilter.
        data = crossfilter(result);

     // Create dimensions.
        coordinates = data.dimension(function (record) {
            return [record.coordinates.latitude, record.coordinates.longitude];
        });
        years = data.dimension(function (record) {
            var date;
            date = new Date(record.crash_date);
            return date.getFullYear();
        });
        monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        months = data.dimension(function (record) {
            var date;
            date = new Date(record.crash_date);
            return date.getMonth();
        });
        dayOfWeekNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        daysOfWeek = data.dimension(function (record) {
         // Reformat for sorting.
            return dayOfWeekNames.indexOf(record.day_of_week);
        });

     // Prepare map.
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

        clusterLayer = L.markerClusterGroup({
            singleMarkerMode: true
        });

        map = L.map("map", {
            center: L.latLng(33.5250, -86.8130),
            zoom: 12,
            minZoom: 12,
            layers: [baseLayer, clusterLayer]
        });

        redraw = function () {
            clusterLayer.clearLayers();
            coordinates.top(Infinity).forEach(function (record) {
                var mark;
                mark = L.marker([record.coordinates.latitude, record.coordinates.longitude]);
                clusterLayer.addLayer(mark);
            });
        };

     // Prepare charts.
        dc.pieChart("#year-selector")
          .dimension(years)
          .group(years.group())
          .title(function (d) {
              return d.value;
           })
          .on("filtered", redraw);

        dc.rowChart("#month-selector")
          .dimension(months)
          .group(months.group())
          .elasticX(true)
          .label(function (d) {
              return monthNames[d.key].substr(0, 3);
           })
          .title(function (d) {
              return d.value;
           })
          .on("filtered", redraw)
          .margins({
              top: 0,
              left: 5,
              bottom: 30,
              right: 10
           })
          .xAxis().ticks(4);

        dc.rowChart("#day-of-week-selector")
          .dimension(daysOfWeek)
          .group(daysOfWeek.group())
          .elasticX(true)
          .label(function (d) {
              return dayOfWeekNames[d.key].substr(0, 3);
           })
          .title(function (d) {
              return d.value;
           })
          .on("filtered", redraw)
          .margins({
              top: 0,
              left: 5,
              bottom: 30,
              right: 10
           })
          .xAxis().ticks(4);

        redraw();
        dc.renderAll();

    });

}());
