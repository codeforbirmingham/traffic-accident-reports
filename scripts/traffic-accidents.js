(function () {
   "use strict";

    var data, dimensions, fetch, groupByLocation;

    data = crossfilter();
    dimensions = {};

    fetch = function (callback) {
        Socrata.query({
            $select: "location,coordinates",
            $limit: Socrata.limit
        }, function (err, result) {
            if (err !== null) {
                callback(err, null);
            } else {
             // Filter out accidents without location. Socrata doesn't seem
             // to understand `$where=coordinates IS NOT NULL`.
                result = result.filter(function (trafficAccident) {
                    return trafficAccident.hasOwnProperty("coordinates");
                });
                data.add(result);
             // Create dimension on location.
                dimensions.location = data.dimension(function (trafficAccident) {
                    return trafficAccident.location;
                });
                callback(null);
            }
        });
    };

    groupByLocation = function () {
        var byLocation;
     // MapReduce: group by location, reduce to count while keeping lat and lng.
        byLocation = dimensions.location.group().reduce(function (p, v) {
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
        });
        return byLocation.all();
    };

    window["TrafficAccidents"] = {
        fetch: fetch,
        groupByLocation: groupByLocation
    };

}());
