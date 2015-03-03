(function () {
    "use strict";

    Socrata.query({
        $select: "location,coordinates,crash_date,day_of_week",
        $limit: Socrata.limit
    }, function (err, result) {

        var data, dimensions, monthNames, dayOfWeekNames, baseLayer,
            clusterLayer, map, updateActiveSectionFilters, redraw,
            chartColor, charts, rowChartHeight;

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

     // Create dimensions (charts and dimensions share the same name).
        dimensions = {};

        dimensions.coordinates = data.dimension(function (record) {
            return [record.coordinates.latitude, record.coordinates.longitude];
        });

        dimensions.year = data.dimension(function (record) {
            var date;
            date = new Date(record.crash_date);
            return date.getFullYear();
        });

        monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        dimensions.month = data.dimension(function (record) {
            var date;
            date = new Date(record.crash_date);
            return date.getMonth();
        });

        dimensions.day = data.dimension(function (record) {
            var date;
            date = new Date(record.crash_date);
            return date.getDate();
        });

        dayOfWeekNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        dimensions.dayOfWeek = data.dimension(function (record) {
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

        updateActiveSectionFilters = function () {
            $(".active-filters").each(function () {
                var filters, sectionCharts, chartLabels;
                filters = [];
                sectionCharts = $(".reset", $(this).parents(".panel")).map(function () {
                    return {
                        chart: $(this).data("chart"),
                        label: $(this).prev().text()
                    };
                }).get();
                sectionCharts.forEach(function (sectionChart) {
                    var chart;
                    chart = charts[sectionChart.chart];
                    if (chart !== undefined && chart.hasFilter() === true) {
                        filters.push(sectionChart.label + ": " + chart.filters().join(", "));
                    }
                });
                if (filters.length > 0) {
                    $(this).html(" | " + filters.join("; "));
                } else {
                    $(this).html("");
                }
            });
        };

        redraw = function () {
            clusterLayer.clearLayers();
            dimensions.coordinates.top(Infinity).forEach(function (record) {
                var mark;
                mark = L.marker([record.coordinates.latitude, record.coordinates.longitude]);
                clusterLayer.addLayer(mark);
            });
        };

     // Prepare charts (charts and dimensions share the same name).
        charts = {};
        chartColor = d3.scale.ordinal().range(["#44afe1"]);
        rowChartHeight = 28;

        charts.year = dc.pieChart("#year-selector");
        charts.year.dimension(dimensions.year)
                   .group(dimensions.year.group())
                   .colors(chartColor)
                   .on("filtered", function () {
                       updateActiveSectionFilters();
                       redraw();
                    });

        charts.month = dc.rowChart("#month-selector");
        charts.month.height(dimensions.month.group().size() * rowChartHeight)
                    .dimension(dimensions.month)
                    .group(dimensions.month.group())
                    .elasticX(true)
                    .label(function (d) {
                        return monthNames[d.key].substr(0, 3);
                     })
                    .title(function (d) {
                        return monthNames[d.key] + ": " + d.value;
                     })
                    .colors(chartColor)
                    .margins({
                        top: 0,
                        left: 5,
                        bottom: 30,
                        right: 10
                     })
                    .on("filtered", function () {
                        updateActiveSectionFilters();
                        redraw();
                     });
        charts.month.xAxis().ticks(4);

        charts.day = dc.rowChart("#day-selector");
        charts.day.height(dimensions.day.group().size() * rowChartHeight)
                  .dimension(dimensions.day)
                  .group(dimensions.day.group())
                  .elasticX(true)
                  .title(function (d) {
                      return "Day " + d.key + ": " + d.value;
                   })
                  .colors(chartColor)
                  .margins({
                      top: 0,
                      left: 5,
                      bottom: 30,
                      right: 10
                   })
                  .on("filtered", function () {
                      updateActiveSectionFilters();
                      redraw();
                   });
        charts.day.xAxis().ticks(4);

        charts.dayOfWeek = dc.rowChart("#day-of-week-selector");
        charts.dayOfWeek.height(dimensions.dayOfWeek.group().size() * rowChartHeight)
                        .dimension(dimensions.dayOfWeek)
                        .group(dimensions.dayOfWeek.group())
                        .elasticX(true)
                        .label(function (d) {
                            return dayOfWeekNames[d.key].substr(0, 3);
                         })
                        .title(function (d) {
                            return dayOfWeekNames[d.key] + ": " + d.value;
                         })
                        .colors(chartColor)
                        .margins({
                            top: 0,
                            left: 5,
                            bottom: 30,
                            right: 10
                         })
                        .on("filtered", function () {
                            updateActiveSectionFilters();
                            redraw();
                         });
        charts.dayOfWeek.xAxis().ticks(4);

     // Prepare reset buttons.
        $(".chart a").on("click", function () {
            var chart;
            chart = $(this).data("chart");
            charts[chart].filterAll();
            dc.redrawAll();
        });

     // Start with 2014 because clustering markers is slow.
        charts.year.filter(2014);

        redraw();
        dc.renderAll();

    });

}());
