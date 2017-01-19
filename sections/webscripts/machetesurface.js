
/*

subjectList: create a DataTable with basic information on the subject under analysis
lastOne: create a DataTable with basic information on the analysis performed on the subjects
lastTrends: create a c3 simple graph with the top 10/? websites from the last analysis

 */

var subjectList= function(containerId, iso3166) {
    var url = '/api/v1/campaign/' + iso3166;

    $.getJSON(url, function(response) {

        console.log(response);
        var inserted = moment
            .duration(moment() - moment(response.info.creationTime) )
            .humanize() + " ago";

        console.log(inserted);
        $(containerId).DataTable( {
            data: response.table
        });
    });
};


function lastOne(containerId, campaignName) {

    var url = '/api/v1/surface/' + campaignName;

    $.getJSON(url, function(data) {

        var tablized = _.map(data, function(e) {
            var when = moment
                .duration(moment() - moment(e.when) )
                .humanize() + " ago";
            return [ e.url, e.VP, e.javascripts, _.size(e.unique), when ];
        });

        $(containerId).DataTable( {
            data: tablized
        });
    });
};

function mostUniqueTrackers(containerId, campaignName) {

    var url= '/api/v1/mostUniqueTrackers/' + campaignName;

    console.log(url);
    d3.json(url, function(data) {

        console.log(data);
        return c3.generate({
            bindto: containerId,
            size: {
                height: 800
            },
            data: {
                keys: {
                    x: 'url',
                    value: data.trackers
                },
                json: data.content,
                type: 'scatter',
            },
            axis: {
                x: {
                    type: 'category'
                }, 
                y: {
                    show: false
                },
            },
            grid: {
                x: {
                    show: true
                }
            },
            point: {
                  r: 5
            }
        });
    });
};


function mostCompanies(containerId, campaignName) {

    var url = '/api/v1/byCompanies/' + campaignName;

    $.getJSON(url, function(data) {
        _.each(data, function(site, i) {
            console.log(i);
            console.log(site);
            var HT = [ 
                '<div class="text">',
                '<h4>', i + 1, " • ", site.url, 
                    '<i>  • ', moment(site.requestTime).format("DD-MM-YY"), '  • </i>', 
                    ' companies:', _.size(site.companies), 
                '</h4>',
                '<small>', _.reduce(site.companies, function(memo, c) {
                    if(memo)
                        memo += ", " + c;
                    else
                        memo = c;
                    return memo;
                }, null), '</small>', '</div>' ];
            $(containerId).append(HT.join(''));
        });
    });
}
