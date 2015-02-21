(function () {
   "use strict";

    var endpoint, token, req;

    endpoint = "https://brigades.opendatanetwork.com/resource/caz5-9y2j.json";
    token = "iqxU70pZzU1Bo0swgGR4Ad93m";

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
            req({}, callback);
        }
    };

}());
