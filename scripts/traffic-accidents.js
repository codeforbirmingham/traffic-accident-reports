(function () {
   "use strict";

   var getAllRows, getTrafficAccidents;

   getAllRows = function (callback) {
        Socrata.query({
            $limit: Socrata.limit
        }, callback);
    };

    getTrafficAccidents = function (callback) {
        Socrata.query({
            $select: "location,coordinates",
            $limit: Socrata.limit
        }, function (err, data) {
            if (err !== null) {
                callback(err, null);
            } else {
             // Filter out accidents without location. Socrata doesn't seem
             // to understand `$where=coordinates IS NOT NULL`.
                data = data.filter(function (trafficAccident) {
                    return trafficAccident.hasOwnProperty("coordinates");
                });
                callback(null, data);
            }
        });
    };

    window["TrafficAccidents"] =  {
        getAllRows: getAllRows,
        getTrafficAccidents: getTrafficAccidents
    };

}());
