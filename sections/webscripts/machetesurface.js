
/*

subjectList: create a DataTable with basic information on the subject under analysis
lastOne: create a DataTable with basic information on the analysis performed on the subjects
lastTrends: create a c3 simple graph with the top 10/? websites from the last analysis

 */

function subjectlist(containerId, campaignName) {
}

function lastOne(containerId, campaignName) {
};

function lastTrends(containerId, campaignName) {
};

    table#lastBrasil.display(cellspacing='0', width='100%')
      thead
        tr
          th website
          th inclusions
          th Last test
      tfoot
        tr
          th Campaign
          th Tests
          th Last test



'#brasilSubject', 'Brasil-test'); lastOne('#lastBrasil', 'Brasil-test'); lastTrends('#brasilTrends', 'Brasil-test');")



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

var kindMap = {
    'brasil': [ 'daily/impressions', renderImpression ],
    'users': [ 'daily/users', renderUsers ],
    'metadata': [ 'daily/metadata', renderMetadata ]
};



function lastOne(kind, containerId) {

    if( _.size(kindMap[kind]) !== 2 ) {
        console.log("not yet supported", kind);
        return;
    }

    var url = '/api/v1/' + _.nth(kindMap[kind], 0);
    var renderF = _.nth(kindMap[kind], 1);

    console.log("Fetching for", kind, "in", url);
    d3.json(url, function(something) {
        var chart = renderF(something, containerId);
        /* eventually, we can manage updates of this chart */
    });

}

