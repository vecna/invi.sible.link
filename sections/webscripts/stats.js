
/* This is one of the few C2 graph not using a daily timeserier but a minutae */

        /*
         *          "AMS ",
         *          "HK ",
         *          "WS ",
         *          "Core ",
         */

function renderStats(something, containerId) {
    return c3.generate({
        bindto: containerId,
        data: {
            json: something,
            keys: {
                x: 'date',
                value: [ 
                    "AMSsaved", "HKsaved", "WSsaved", 
                    "AMSaccesses", "HKaccesses", "WSaccesses", "Coreaccesses",
                    "AMSfree", "HKfree", "WSfree", "Corefree",
                    "AMStotal", "HKtotal", "WStotal", "Coretotal"
                ]
            },
            xFormat: '%Y-%m-%d %H:%M',
            names: {
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
            axes: {
                AMSsaved: "y",
                HKsaved: "y",
                WSsaved: "y",
                AMSaccesses: "y",
                HKaccesses: "y",
                WSaccesses: "y",
                Coreaccesses: "y",
                AMSfree: "y2",
                HKfree: "y2",
                WSfree: "y2",
                Corefree: "y2",
                AMStotal: "y2",
                HKtotal: "y2",
                WStotal: "y2",
                Coretotal: "y2"
            },
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
            },
            y2: { 'show': true }
        }
    });
};

function last48hoursStats(containerId) {

    var url = '/api/v1/stats/48';

    console.log("Fetching in", url);
    d3.json(url, function(something) {
        console.log(something);
        console.log(containerId);
        var chart = renderStats(something, containerId);
        /* eventually, we can manage updates of this chart */
    });

}
