
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
        data: {
            json: jsonData,
            keys: {
                x: 'date',
                value: fields
            },
            xFormat: '%Y-%m-%d %H:%M',
            type: 'spline',
            names: _.zipObject(fields, displayName)
        },
        axis: {
            x: {
                type: 'timeseries',
                tick: {
                    format: '%d ፨ %H:%M'
                },
            }
        }
    });
};

function lastHours(config) {

    var fieldSet = {
        'loadavg': [ 'load-0', 'load-1'], //, 'load-2' ],
        'memory': [ 'free' ], // , 'total' ],
        'mongo': [ 'saved' ] // , 'accesses' ]
    };
    var VPs = [ 'HK', 'WS', 'AMS' ];
    var url = '/api/v1/stats/' + config.hours;

    console.log("Fetching last", config.hours, "from", url);

    d3.json(url, function(content) {

        console.log(content);

        if(config.memory)
            var memoryChart = renderStats(content.memory, config.memory, VPs, fieldSet.memory);

        if(config.loadavg)
            var loadavgChart = renderStats(content.loadavg, config.loadavg, VPs, fieldSet.loadavg);

        if(config.mongo)
            var mongoChart = renderStats(content.mongo, config.mongo, VPs, fieldSet.mongo);
    });

}


function tasksInsertion(containerId) {

    var url = '/api/v1/activeTasks';

    /* this API return the currently active tasks directed by Vigile, so
     * it take in account the window of the last 48 hours by default, returnin
     * grouped by today - yesterday - daybefore */

    console.log("tasksInsertion in ", containerId);
    d3.json(url, function(data) {

        var fields = _.keys(_.reduce(data, function(memo, daily) {
            _.each(daily, function(value, key) {
                if(!_.get(memo, key))
                    _.set(memo, key, true);
            });
            return memo;
        }, []));

        console.log(fields);
        console.log(data);

        return c3.generate({
            bindto: containerId,
            data: {
                json: data,
                keys: {
                    x: 'when',
                    value: fields
                },
                type: 'bar',
            },
            axis: {
                x: {
                    type: 'category',
                }
            }
        });
        console.log(data);

    });
};
