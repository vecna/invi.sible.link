function prepareDisplayTrends(graphContainerId, titleContainerId) {
    var x = window.location.pathname.split('/');
    var domaindottld = x.pop();
    console.log("Extracted domaindottld", domaindottld);
    displayTrends(graphContainerId, titleContainerId, domaindottld);
}

function displayTrends(graphContainerId, titleContainerId, domaindottld) {

    console.log("displayTrends",
        graphContainerId, titleContainerId, domaindottld);

    var url = "/api/v1/history/" + domaindottld;
    d3.json(url, function(byDay) {

        $(titleContainerId).text(domaindottld);

        if(_.size(byDay) === 1) {
            $(graphContainerId).html("<h2>Impossible render a graph for "+
                url+", only one day is available</h2>");
            return;
        }

        if(_.size(byDay) === 0) {
            $(graphContainerId).html("<h2>Impossible render a graph for "+
                url+": Zero day available!</h2>");
            return;
        }

        $(graphContainerId).html("<h2>Recent historical trends of " + 
            domaindottld + "</h2>");

        console.log(byDay);

        var transfdata = _.reduce(byDay, function(memo, day) {
            var daySt = moment(day[0].when).format('YYYY-MM-DD');
            console.log(daySt);
            var trg = _.find(day, {target: true});
            if(!trg.phantom)
                console.warn("Error ahead!");

            var companies = _.reduce(day, function(memo, d) {
                var r = _.get(d, 'company');
                if(r)
                    memo.push(r);
                return memo;
            }, []);

            var cookies = _.reduce(day, function(memo, d) {
                var c = _.get(d, 'cookies');
                if (c)
                    memo.push(c);
                return memo;
            }, []);

            console.log(companies);

            var a = {
                x: daySt,
                inclusions: _.size(day) -1,
                companies: _.size(_.uniq(companies)),
                cookies: _.size(_.uniq(cookies)),
                timings: trg.phantom,
                site: trg.url
            };
            memo.push(a);
            return memo;
        }, []);

        console.log(transfdata);

        return c3.generate({
            bindto: graphContainerId,
            data: {
                json: transfdata,
                keys: {
                    x: 'x',
                    value: [ 'inclusions', 'companies', 'cookies' ]
                },
                colors: { 'companies': '#339199', 'inclusions': '#83ffe3', 'cookies': '#AA00BB' },
                types: {
                    inclusions: 'bar',
                    companies: 'spline',
                    cookies: 'spline'
                },
                axes: {
                    inclusions: 'y',
                    companies: 'y2',
                    cookies: 'y2'
                }
            },
            axis: {
                x: {
                    type: 'timeseries'
                },
                y2: {
                    show: true,
                    label: 'third parties'
                }
            }
        });
    });
}

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

