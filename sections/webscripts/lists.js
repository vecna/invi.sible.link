var displayLists = function(containerId) {
    var url = '/api/v1/lists';

    console.log("Using https://www.datatables.net/ with", url);

    $.getJSON(url, function(lists) {
        $(containerId).DataTable(lists);
    });
};

