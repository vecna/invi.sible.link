
function subjectList(containerId, iso3166) {
    var url = '/api/v1/campaign/' + iso3166;

    $.getJSON(url, function(response) {

        console.log(response);
        $(containerId).DataTable( {
            data: response.table
        });
    });
};

function mostUniqueTrackers(containerId, campaignName) {

    var url= '/api/v1/mostUniqueTrackers/' + campaignName;

    console.log("mostUniqueTrackers", url);
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

    console.log("mostCompanies", url);
    $.getJSON(url, function(data) {
        _.each(data, function(site, i) {
            console.log("mostCompanies: append of ", site.url);
            var HT = [ 
                '<div class="text">', '<h4>', 
                i + 1, " • ", site.url, '<i>  • ',
                moment(site.requestTime).format("DD-MM-YY"), '  • </i>', 
                ' companies:', _.size(site.companies), '</h4>',
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
