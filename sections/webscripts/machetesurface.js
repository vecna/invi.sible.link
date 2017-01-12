
/*

subjectList: create a DataTable with basic information on the subject under analysis
lastOne: create a DataTable with basic information on the analysis performed on the subjects
lastTrends: create a c3 simple graph with the top 10/? websites from the last analysis

 */

var x = " table#lastBrasil.display(cellspacing='0', width='100%') thead tr th website th 3rd party domains th external scrips th Last test tfoot tr th Campaign th Tests th Last test ";


console.log(x);

var subjectList= function(containerId) {
    var url = '/api/v1/subjects/brasil';

    $.getJSON(url, function(collections) {

		$(containerId).html(x);

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


function subjectList(containerId, campaignName) {
}

function lastOne(containerId, campaignName) {
};

function lastTrends(containerId, campaignName) {
};

// subjectList('#brasilSubject', 'Brasil-test');
// lastOne('#lastBrasil', 'Brasil-test');
// lastTrends('#brasilTrends', 'Brasil-test');



function byDay(something, containerId) {

    var url = '/api/v1/' + _.nth(kindMap[kind], 0);
    var renderF = _.nth(kindMap[kind], 1);

    console.log("Fetching for", kind, "in", url);
    d3.json(url, function(something) {
        var chart = renderF(something, containerId);
        /* eventually, we can manage updates of this chart */
    });

    return c3.generate({
        bindto: containerId,
        data: {
            json: something,
            keys: {
                x: 'date',
                value: ['htmls','impressions','timelines']
            },
            axes: {
                htmls: 'y',
                impressions: 'y',
                timelines: 'y2'
            },
            types: {
                htmls: 'line',
                impressions: 'line',
                timelines: 'area'
            },
            colors: {
                timelines: '#f0e971'
            }
        },
        axis: {
            x: {
                type: 'timeseries',
                tick: {
                    format: '%Y-%m-%d'
                }
            },
            y2: { show: true }
        }
    });
};



function lastOne(kind, containerId) {

    var url = '/api/v1/' + _.nth(kindMap[kind], 0);
    var renderF = _.nth(kindMap[kind], 1);

    console.log("Fetching for", kind, "in", url);
    d3.json(url, function(something) {
        var chart = renderF(something, containerId);
        /* eventually, we can manage updates of this chart */
    });

}



