
function displayRecent(containerId) {

    $.getJSON("/api/v1/recent", function(data) {
        _.each(data, function(d) {
            var seq = [ '<div>', '<h2>', d.name, '</h2>',
                '<p>', 'last activity: ', d.dayStr, ' [',
                moment.duration( moment(d.dayStr) - moment() ).humanize(), 
                ' ago], objects in the same day ', d.count,
                '</p><pre>', JSON.stringify(d.last, undefined, 2), '</pre>',
                '</div>' ];
            $(containerId).append(seq.join(''));
        });
    });

    $('.secondaryDetails').addClass('hidden');
};

function displayCampaign(containerId) {

    var C = { 'itatopex': 'Italian Top websites',
              'halal': 'few Halal food shop US',
              'travel': 'Travel agency for religious trip',
              'mosques': 'Mosques in US and Canada',
              'culture': 'Websites of Islamic culture (Alexa)',
              'irantrex': 'Iran websites https://github.com/vecna/irantrex',
              'chuptrex': 'Chupadados research' };

    $.getJSON("/api/v1/campaignNames", function(data) {

        _.each(C, function(displayN, cname) {
            if(data.indexOf(cname) == -1) {
                $(containerId).append('<li>Missing from configuration '+cname +'</li>');
            } else {
                $(containerId).append('<li><a href="#" class="entries" id="' + cname + '">' + displayN + '</a></li>');
            }
        });

        $(".entries").click(function(e, a) {
            console.log("Just clicked on ", e.currentTarget.id);

            preliminaryViz(e.currentTarget.id);
            subjectList('#executedList','#historyGraph',e.currentTarget.id);
        });
    });
};

function preliminaryViz(campaignName) {

    var destId = '#preliminaryGraph';
    var titleId = '#preliminaryName';

    $(titleId).text(campaignName);

    $(destId).html("");
    $("#previewDump").html("");
    $(".secondaryDetails").removeClass('hidden');

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

