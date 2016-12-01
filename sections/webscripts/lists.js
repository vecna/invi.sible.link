var displayLists = function(containerId) {
    var url = '/api/v1/lists';

    console.log("Using https://www.datatables.net/ with", url);

    $.getJSON(url, function(collections) {

        /* convert collections with basic shape explained here 
         * https://datatables.net/manual/data/ */
        var converted = _.map(collections, function(list) {
            /* order matter, so I want to be sure here */
            return [
                list.name,
                'type',
                list.source,
                list.lastUpdate,
                list.siteCount
            ];
        });
        $(containerId).DataTable( {
            data: converted
        });
    });
};

