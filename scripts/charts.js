(function () {
    "use strict";

    Socrata.query({
        $select: "location,coordinates,crash_date,day_of_week",
        $limit: Socrata.limit
    }, function (err, result) {

        var data, coordinates, years, monthNames, months, days, dayOfWeekNames,
            daysOfWeek, baseLayer, clusterLayer, map, redraw, chartColor, charts;

     // Hide loader and show map.
        $("#loader").hide();
     // leaflet doesn't work with display: none
        $("#mainframe").css("visibility", "visible");
     // visibility: hidden on mainframe doesn't reach collapse
        $(".collapse.in").css("visibility", "visible");

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
        days = data.dimension(function (record) {
            var date;
            date = new Date(record.crash_date);
            return date.getDate();
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
            minZoom: 10,
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

        chartColor = d3.scale.ordinal().range(["#44afe1"]);

     // Prepare charts.
        charts = {};

        charts.yearSelector = dc.pieChart("#year-selector");
        charts.yearSelector.dimension(years)
                           .group(years.group())
                           .title(function (d) {
                               return d.value;
                            })
                           .colors(chartColor)
                           .on("filtered", redraw);

        charts.monthSelector = dc.rowChart("#month-selector");
        charts.monthSelector.height(336)
                            .dimension(months)
                            .group(months.group())
                            .elasticX(true)
                            .label(function (d) {
                                return monthNames[d.key].substr(0, 3);
                             })
                            .title(function (d) {
                                return d.value;
                             })
                            .colors(chartColor)
                            .margins({
                                top: 0,
                                left: 5,
                                bottom: 30,
                                right: 10
                             })
                            .on("filtered", redraw);
        charts.monthSelector.xAxis().ticks(4);

        charts.daySelector = dc.rowChart("#day-selector");
        charts.daySelector.height(868)
                          .dimension(days)
                          .group(days.group())
                          .elasticX(true)
                          .label(function (d) {
                              return d.key;
                           })
                          .title(function (d) {
                              return d.value;
                           })
                          .colors(chartColor)
                          .margins({
                              top: 0,
                              left: 5,
                              bottom: 30,
                              right: 10
                           })
                          .on("filtered", redraw);
        charts.daySelector.xAxis().ticks(4);

        charts.dayOfWeekSelector = dc.rowChart("#day-of-week-selector");
        charts.dayOfWeekSelector.dimension(daysOfWeek)
                                .group(daysOfWeek.group())
                                .elasticX(true)
                                .label(function (d) {
                                    return dayOfWeekNames[d.key].substr(0, 3);
                                 })
                                .title(function (d) {
                                    return d.value;
                                 })
                                .colors(chartColor)
                                .margins({
                                    top: 0,
                                    left: 5,
                                    bottom: 30,
                                    right: 10
                                 })
                                .on("filtered", redraw);
        charts.dayOfWeekSelector.xAxis().ticks(4);

     // Prepare reset buttons.
        $(".chart a").on("click", function () {
            var chart;
            chart = $(this).data("chart");
            charts[chart].filterAll();
            dc.redrawAll();
        });

        redraw();
        dc.renderAll();

    });

}());
