(function () {
   "use strict";

    var data, dimensions, fetch, filterByYear, groupByLocation, cutoff, setCutoff;

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

    groupByLocation = function () {
        return dimensions.location.group().reduce(function (p, v) {
            p.lat = v.coordinates.latitude;
            p.lng = v.coordinates.longitude;
            p.count = p.count + 1;
            return p;
        }, function (p, v) {
            p.count = p.count - 1;
            return p;
        }, function () {
            return {
                count: 0
            }
        }).top(cutoff);
    };

    cutoff = 50;

    setCutoff = function (value) {
        cutoff = value;
    };

    window["TrafficAccidents"] = {
        fetch: fetch,
        filterByYear: filterByYear,
        groupByLocation: groupByLocation,
        setCutoff: setCutoff
    };

}());
