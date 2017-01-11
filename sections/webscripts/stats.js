
/* This is one of the few C2 graph not using a daily timeserier but a minutae
 *          "AMS ",
 *          "HK ",
 *          "WS ",
 *          "Core ",
 */



function renderStats(jsonData, containerId, linesInfo) {

    var fields = _.flatten(_.map(linesInfo.vantagePoints, function(vpname) {
        return _.map(linesInfo.keywords, function(kw) {
            return vpname + kw;
        });
    }));

    var displayName = _.flatten(_.map(linesInfo.vantagePoints, function(vpname) {
        return _.map(linesInfo.keywords, function(kw) {
            return vpname + ' ' + kw;
        });
    }));

    return c3.generate({
        bindto: containerId,
        data: {
            json: something,
            keys: {
                x: 'date',
                value: fields
                /* [ 
                    "AMSsaved", "HKsaved", "WSsaved", 
                    "AMSaccesses", "HKaccesses", "WSaccesses", "Coreaccesses",
                    "AMSfree", "HKfree", "WSfree", "Corefree",
                    "AMStotal", "HKtotal", "WStotal", "Coretotal"
                ] */
            },
            xFormat: '%Y-%m-%d %H:%M',
            names: _.zipObject(fields, displayName)
                /*
            {
                AMSsaved: "AMS saved",
                HKsaved: "HK saved",
                WSsaved: "WS saved", 
                AMSaccesses: "AMS accesses",
                HKaccesses: "HK accesses",
                WSaccesses: "WS accesses",
                Coreaccesses: "Core accesses",
                AMSfree: "AMS free",
                HKfree: "HK free",
                WSfree: "WS free",
                Corefree: "Core free",
                AMStotal: "AMS total", 
                HKtotal: "HK total", 
                WStotal: "WS total", 
                Coretotal: "Core total"
            },   
            */
        },
        color: {
            pattern: ['#1f77b4', '#aec7e8', '#ff7f0e', '#ffbb78',
                      '#2ca02c', '#98df8a', '#d62728', '#ff9896',
                      '#9467bd', '#c5b0d5', '#8c564b', '#c49c94',
                      '#e377c2', '#f7b6d2', '#7f7f7f' ]
        },
        axis: {
            x: {
                type: 'timeseries',
                tick: {
                    format: '%d %H:%M'
                },
            }
        }
    });
};

function lastHours(config) {

    var url = '/api/v1/stats/' + config.hours;
    console.log("Fetching last", config.hours, "from", url);
    d3.json(url, function(content) {
        console.log(content);

        if(config.memory)
            var memoryChart = renderStats(content.memory, containerId);

        if(config.loadavg)
            var loadavgChart = renderStats(content.loadavg, containerId);

        if(config.database)
            var databaseChart = renderStats(content.database, containerId);

    });

}
