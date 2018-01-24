
function renderStats(jsonData, containerId, VPs, keywords) {

    var fields = _.flatten(_.map(VPs, function(vpname) {
        return _.map(keywords, function(kw) {
            return vpname + kw;
        });
    }));

    var displayName = _.flatten(_.map(VPs, function(vpname) {
        return _.map(keywords, function(kw) {
            return vpname + ' ' + kw;
        });
    }));

    console.log(fields);
    console.log(displayName);
    console.log(jsonData);

    return c3.generate({
        bindto: containerId,
        size: { height: 400 },
        data: {
            json: jsonData,
            keys: {
                x: 'date',
                value: fields
            },
            xFormat: '%Y-%m-%d %H:%M',
            names: _.zipObject(fields, displayName)
        },
        axis: {
            x: {
                type: 'timeseries',
                tick: {
                    format: '[%d] %H:%M'
                },
            }
        },
        point: {
            r: 1.5,
            focus: {
               expand: { r: 5 }
            }
        },
        subchart: { show: true },
        grid: {
            x: {
               lines: [
                   { value:
                        moment().startOf('day').format("YYYY-MM-DD HH:mm"),
                     text: 'midnight' },
                   { value:
                        moment().startOf('day').subtract(1, 'd').format("YYYY-MM-DD HH:mm"),
                     text: 'midnight' }
               ]
            }
        }
    });
};

function lastHours(config) {

    var fieldSet = {
        'loadavg': [ 'load-0', 'load-1'], //, 'load-2' ],
        'memory': [ 'free' ], // , 'total' ],
        'phantom': [ 'saved' ],
        'badger': [ 'badger' ],
        'accesses': [ 'accesses' ]
    };
    var VPs = [ 'HK', 'WS', 'AMS' ];
    var url = '/api/v1/stats/' + config.hours;

    console.log("Fetching last", config.hours, "from", url);

    d3.json(url, function(content) {
        var memoryChart = renderStats(content.memory, config.memory, VPs, fieldSet.memory);
        var loadavgChart = renderStats(content.loadavg, config.loadavg, VPs, fieldSet.loadavg);
        var phantomChart = renderStats(content.mongo, config.phantom, VPs, fieldSet.phantom);
        var badgerChart = renderStats(content.mongo, config.badger, VPs, fieldSet.badger);
        var accessesChart = renderStats(content.mongo, config.accesses, VPs, fieldSet.accesses);
    });
}

/* small library function used to generate stats for every campaign */
var campaignList = [{
    title: "Chupadados analysis",
    match: [ "clinics-MX", "clinics-CL", "clinics-CO", "clinics-BR" ],
    idn: "clinicsBlock"
},{
    title: "amtrex",
    match: [ "travel", "culture", "halal", "mosques" ],
    idn: "amtrexBlock"
},{
    title: "National based analysis",
    match: [ "irantrex", "gptrex", "itatopex" ],
    idn: "remainingBlock"
}];

function filterStats(data, campMatch) {

    var filtered = _.filter(data, function(o) {
        return (campMatch.indexOf(o.campaign) !== -1)
    });
    // _.reject(data, _.startWith(campMatch, campaign));
    console.log(filtered);
    var nd = _.reduce(filtered, function(memo, e) {

        var o = { date: e.date };
        var keyname = e.campaign + '-' + e.kind;

        if(e.kind === 'promises')
            return memo;

        memo.kn.push(keyname);

        if(e.kind === 'evidences') {
            _.set(memo.ax, keyname, 'y2');
            _.set(memo.ty, keyname, 'line');
        }
        else {
            _.set(memo.ax, keyname, 'y');
            _.set(memo.ty, keyname, 'bar');
        }

        _.set(o, keyname, e.amount);
        memo.v.push(o);

        return memo;
    }, { kn: [], v: [], ax: {}, ty: {} });

    /* meh, to create a big object with only one date */
    nd.v = _.reduce(_.groupBy(nd.v, 'date'), function(memo, s, d) {
        var x = { date: d };
        _.each(s, function(o) {
            var co = _.omit(o, [ 'date' ]);
            _.set(x, _.first(_.keys(co)), _.first(_.values(co)) );
        });
        memo.push(x);
        return memo;
    }, []);

    return nd;
};
function c3Append(destId, nd) {

    return c3.generate({
        bindto: destId,
        data: {
            json: nd.v,
            keys: {
                x: 'date',
                value: _.uniq(nd.kn)
            },
            types: nd.ty,
            axes: nd.ax
        },
        legend: { show: false },
        axis: {
            x: {
                type: 'timeseries',
                xFormat: "day %d"
            },
            y2: {
                show: true,
            }
        }
    });
}
/* end */

function tasksInsertion(containerId) {

    var url = '/api/v1/subjects';

    /* this API return the daily stats for campaign and for collection */
    console.log("tasksInsertion in ", containerId);
    d3.json(url, function(data) {

        _.each(campaignList, function(C) {
            d3.select(containerId)
                .append('h2')
                .text(C.title)
                .append('div')
                .attr('id', C.idn);
            var cleanData = filterStats(data, C.match);
            c3Append('#' + C.idn, cleanData);
        });

    });
};


/* this function has to represent the number of:
 *
 * sankey
 * evidences
 * surface
 * details
 * promises
 */

function localInfo(containerId) {
    var url = '/api/v1/orchestrationStats';
    d3.json(url, function(data) {
        console.log(data);
    });
};
