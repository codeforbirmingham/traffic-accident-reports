(function () {
   "use strict";

    var data, dimensions, fetch, filterByYear, getHeatmapData, getHeatmapMax;

    data = crossfilter();
    dimensions = {};

    fetch = function (callback) {
        Socrata.query({
            $select: "location,coordinates,crash_date",
            $limit: Socrata.limit
        }, function (err, result) {
            if (err !== null) {
                callback(err);
            } else {
             // Filter out accidents without location. Socrata doesn't seem
             // to understand `$where=coordinates IS NOT NULL`.
                result = result.filter(function (trafficAccident) {
                    return trafficAccident.hasOwnProperty("coordinates");
                });
             // Add data to Crossfilter.
                data.add(result);
             // Create dimensions.
                dimensions.location = data.dimension(function (trafficAccident) {
                    return trafficAccident.location;
                });
                dimensions.coordinates = data.dimension(function (trafficAccident) {
                    return [trafficAccident.coordinates.latitude, trafficAccident.coordinates.longitude];
                });
                dimensions.year = data.dimension(function (trafficAccident) {
                    var date;
                    date = new Date(trafficAccident.crash_date);
                    return date.getFullYear();
                });
                callback(null);
            }
        });
    };

    filterByYear = function (year) {
        if (year === "") {
            year = null;
        }
        dimensions.year.filter(year);
    };

    getHeatmapData = function () {
        return dimensions.coordinates.top(Infinity);
    };

    getHeatmapMax = function () {
        return dimensions.coordinates.group().reduceCount().top(1)[0].value;
    };

    window["TrafficAccidents"] = {
        fetch: fetch,
        filterByYear: filterByYear,
        getHeatmapData: getHeatmapData,
        getHeatmapMax: getHeatmapMax
    };

}());
