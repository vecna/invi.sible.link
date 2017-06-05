
function displayCampaign(containerId) {

    $.getJSON("/api/v1/campaignNames", function(data) {
        console.log(data);

        _.each(data, function(cname) {
            $(containerId).append('<li><a href="#" class="entries" id="' + cname + '">' + cname + '</a></li>');
        });

        $(".entries").click(function(e, a) {
            console.log("Click on ", e.currentTarget.id);
            preliminaryViz(e.currentTarget.id);
        });
    });
};


function preliminaryViz(campaignName) {

    var destId = '#preliminaryGraph';
    var titleId = '#preliminaryName';

    $(titleId).text(campaignName);

    $(destId).html("");
    $("#previewDump").html("");

    console.log("preliminaryViz of", campaignName, destId);

    d3.json("/api/v1/surface/" + campaignName, function(collections) {

        console.log("preliminaryViz of campaign " + campaignName + 
                " dest " + destId + " surface #" + _.size(collections) );

        var cookiesInfo = _.reduce(collections, function(memo, site) {

            console.log(site);
            if(!(_.size(site.leaders) || _.size(site.unrecognized) || _.size(site.cookies) )) {
                console.log("Throwing away:");
                console.log(site);
                return memo;
            }

            memo.push({
                site: site.domaindottld,
                url: site.url,
                companies: _.size(site.leaders),
                leaders: site.leaders,
                notattributed: _.size(site.unrecognized),
                unrecognized: site.unrecognized,
                cookies: _.size(site.cookies),
                cookiesInfo: site.cookies
            });
            return memo;
        }, []);

        _.each(cookiesInfo, function(info) {
            $("#previewDump").append('<p class="details" id="' + info.site + '">' + info.url + 
                    '</p><pre class="reduced">' + 
                    JSON.stringify(info, undefined, 2) + 
                    '</pre>');
        });

        cookiesInfo = _.reverse(_.orderBy(cookiesInfo, 'cookies'));

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
    });
};


function doPreliminary(campaignName, destId) {

    d3.json("/api/v1/surface/" + campaignName, function(collections) {

        console.log("trexCompanyRank: campaign " + campaignName + 
                " dest " + destId + " surface #" + _.size(collections) );

        var leaders = _.reduce(collections, function(memo, site) {
            _.each(site.leaders, function(l) {
                if(l.p < 10)
                    return memo;

                var x = _.find(memo, {company: l.company });

                if(!x)
                    memo.push(l);
            });
            return memo;
        }, []);

        leaders = _.reverse(_.orderBy(leaders, 'p'));

        return c3.generate({
            bindto: destId,
            data: {
                json: leaders,
                keys: {
                    x: 'company',
                    value: [ 'p' ]
                },
                colors: { 'p': '#C44F9D' },
                type: 'bar',
                names: {
                    p: 'frequenza in percentuale %'
                }
            },
            size: { height: 800 },
            legend: { show: false },
            axis: {
                x: {
                    type: 'categories'
                },
                rotated: true
            },
            grid: {
                y: {
                    lines: [
                        { value: 50, text: '50%', position: 'middle' }
                    ]
                }
            }
        });
    });
};

