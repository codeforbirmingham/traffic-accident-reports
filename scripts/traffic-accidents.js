(function () {
   "use strict";

    var endpoint, token, limit, req;

    endpoint = "https://brigades.opendatanetwork.com/resource/caz5-9y2j.json";
    token = "iqxU70pZzU1Bo0swgGR4Ad93m";
    limit = 50000;

    req = function (query, callback) {
        var urlParams;
        urlParams = "";
        Object.keys(query).forEach(function (clause, index) {
            if (index === 0) {
                urlParams = urlParams + "?";
            } else {
                urlParams = urlParams + "&"
            }
            urlParams = urlParams + clause + "=" + encodeURIComponent(query[clause]);
        });
        jQuery.ajax({
            url: endpoint + urlParams,
            headers: {
                "X-App-Token": token
            }
        }).fail(function (jqXHR, textStatus, errorThrown) {
            callback(errorThrown, null);
        }).done(function (data) {
            callback(null, data);
        });
    };

    window["TrafficAccidents"] =  {
        getAllRows: function (callback) {
            req({
                $limit: limit
            }, callback);
        },
        getTrafficAccidents: function (callback) {
            req({
                $select: "location,coordinates",
                $limit: limit
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
        }
    };

}());
