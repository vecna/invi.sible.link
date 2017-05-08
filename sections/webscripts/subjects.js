var displaySubjects = function(containerId) {
    var url = '/api/v1/subjects';

    $.getJSON(url, function(collections) {

        /* convert collections with basic shape explained here 
         * https://datatables.net/manual/data/ */
        var converted = _.map(collections, function(list) {
            var inserted = moment
                .duration(moment() - moment(list.creationTime) )
                .humanize() + " ago";
            /* order matter, so I want to be sure here */
            return [
                list.name,
                list.kind,
                moment(list.trueOn).format("YYYY-MM-DD"),
                inserted,
                list.siteCount
            ];
        });

        $(containerId).DataTable( {
            data: converted
        });
    });
};

