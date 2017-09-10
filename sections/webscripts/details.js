function guessCampaignName() {
    var x = window.location.pathname.split('/');
    var cname = x.pop();
    console.log("Extracted campaignName", cname);
    return cname;
};

function P(contstr, cid, tag) {
    $(cid).append('<' + tag + '>' + contstr + '</' + tag + '>');
}


var jsMap = [
    "Date_prototype_getTimezoneOffset",
    "navigator_cpuClass", 
    "navigator_doNotTrack", 
    "navigator_hardwareConcurrency", 
    "navigator_language", 
    "navigator_languages", 
    "navigator_maxTouchPoints", 
    "navigator_platform", 
    "navigator_plugins", 
    "navigator_userAgent", 
    "screen_availWidth", 
    "screen_colorDepth", 
    "screen_width", 
    "window_CanvasRenderingContext2D_prototype_rect", 
    "window_WebGLRenderingContext_prototype_createBuffer", 
    "window_devicePixelRatio", 
    "window_indexedDB", 
    "window_localStorage", 
    "window_openDatabase", 
    "window_sessionStorage"
];

var palette = [
    "#1f77b4",
    "#aec7e8",
    "#ff7f0e",
    "#ffbb78",
    "#2ca02c",
    "#98df8a",
    "#d62728",
    "#ff9896",
    "#9467bd",
    "#c5b0d5",
    "#8c564b",
    "#c49c94",
    "#e377c2",
    "#f7b6d2",
    "#7f7f7f",
    "#c7c7c7",
    "#bcbd22",
    "#dbdb8d",
    "#17becf",
    "#9edae5"
];

function printDetails(containerId, titleId, campaignName) {

    if(!campaignName)
        campaignName = guessCampaignName();

    if(!campaignName) {
        $(containerId).html("<h1>Campaign not defined?</h1>");
        $(titleId).text("- error -");
        return;
    }

    console.log("details",
        containerId, titleId, campaignName);

    $(titleId).text(campaignName);

    var url = "/api/v1/details/" + campaignName;
    var SITENAMESLOT = 40;
    var INCLUSIONSLOT = 30;

    d3.json(url, function(data) {
        console.log("connected to ", url);
        console.log(data);

        var numbers = _.countBy(data, 'href');
        var height = _.reduce(numbers, function(memo, inclusions, site) {
            memo += SITENAMESLOT;
            memo += inclusions * INCLUSIONSLOT;
            return memo;
        }, 0);
        console.log(height);

        console.log(window.innerWidth);
        console.log(document.documentElement.clientWidth);
        console.log(document.body.clientWidth);

        var width = 1000 ; // 800;
       /* window.innerWidth
            || document.documentElement.clientWidth
            || document.body.clientWidth; */

        console.log(width);

        var INCLUSIONWIDTH = 100;
        width -= 30 - 30 - INCLUSIONWIDTH;
        console.log(width);

        var svgContainer = d3
            .select(containerId)
            .append("svg")
            .attr("width", width)
            .attr("height", height);

        var rectangle = svgContainer
            .append("rect")
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", width)
            .attr("height", height)
            .style("fill", "#dafdd5");

        var fixedf = ['inclusion', 'subjectId', 'href',
                      'needName', 'promiseId', 'version',
                      'VP', 'when', 'scriptacts', 'scriptHash',
                      'acquired', 'campaign', 'id', '_id' ];
        var i = 10;
        var currentHref = null;
        var color = d3.scale.ordinal( d3.scale.category10() );

        console.log(data);
        _.each(data, function(e) {
            console.log(e.href, e.inclusion);
            /* */
            if( e.href != currentHref ) {
                i += 5;
                svgContainer
                    .append("text")
                    .attr("x", 5)
                    .attr("y", i)
                    .attr("height", 40)
                    .text(e.href);
                currentHref = e.href;
                i += 10;
            }
            /* */
            svgContainer
                .append("text")
                .attr("x", 30)
                .attr("y", i)
                .attr("height", 40)
                .style("font-size", "0.6em")
                .text(e.inclusion);

            var vals = _.omit(e, fixedf);
            _.map(vals, function(amount, jsName) {
                var ndx = jsMap.indexOf(jsName);
                svgContainer
                    .append('rect')
                    .attr('x', (10 * ndx) + 300)
                    .attr('y', i - 10)
                    .attr('width', 9)
                    .attr('height', 9)
                    .style('fill', palette[amount] )
            });

            i += 10
        });
    });
};
