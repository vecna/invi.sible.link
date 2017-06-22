
function displayTrends(graphContainerId, titleContainerId, domaindottld) {

    if(!domaindottld) {
        var x = window.location.pathname.split('/');
        console.log(x);
        domaindottld = x.pop();
    }

    console.log("displayTrends", 
        graphContainerId, titleContainerId, domaindottld);

    d3.json("/api/v1/history/" + domaindottld, function(byDay) {

        console.log("preliminaryViz of campaign " + campaignName + 
                " dest " + destId + " surface #" + _.size(collections) );

        $(titleContainerId).text(domaindottld);

        if(_.size(byDay) === 1) {
            $(graphContainerId).html("<h2>Impossible render a graph for "+
                hrefname+", only one day is available</h2>");
            return;
        }

        if(_.size(byDay) === 0) {
            $(graphContainerId).html("<h2>Impossible render a graph for "+
                hrefname+": Zero day available!</h2>");
            return;
        }

        $(graphContainerId).html("<h2>Recent historical trends of " + 
            domaindottld + "</h2>");

        console.log(byDay);
/*
        return c3.generate({
            bindto: destId,
            data: {
                json: cookiesInfo,
                keys: {
                    x: 'site',
                    value: [ 'cookies', 'notattributed', 'companies' ]
                },
                type: 'bar',
                colors: { 'cookies': '#339199' }

            },
            size: { height: 1000 },
            legend: { show: false },
            axis: {
                x: {
                    type: 'categories',
                },
                rotated: true
            }
        });
        */
    });
};

function subjectList(containerId, cname) {
    var url = '/api/v1/campaign/' + cname;

    console.log("subjectList+siteList", url);

    $.getJSON(url, function(response) {

        console.log(response);
        $(containerId).DataTable( {
            data: response.table
        });
    });
};

