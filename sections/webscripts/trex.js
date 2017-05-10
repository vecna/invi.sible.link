var defaultCampaign = null;
var initiativePrefix = null;

function initializeLanding(where, defaultC, initiativeP, containerId) {

    if(defaultC)
        defaultCampaign = defaultC;

    if(initiativeP)
        initiativePrefix = initiativeP;

    var validP = [ 'landing', 'what-to-do', 'about', 'archive' ];

    if(!where) {
        where = window.location.href.split('/').pop();

        if(validP.indexOf(where) == -1) {
            console.log("Unknown location, forcing to 'landing'");
            where = 'landing';
        }
    }

    $("#content").load('/direct/' + where, function () {
        if(where === 'landing')
            trexRender(defaultCampaign, containerId);

        $('.' + where).addClass('active');
    });
};

function loadPage(containerId, destpage) {

    $('li').removeClass('active');
    $('.' + destpage).addClass('active');

    $("#content").load("/direct/" + destpage, function () {

        /* if a script need to be executed at the load, here it is fired */
        if(destpage === 'landing') {
            trexRender(defaultCampaign, '#table');
        }
        if(destpage === 'archive') {
            trexArchive(defaultCampaign, '#archivetable', '#subjects');
        }

        console.log("Loading and recording as: " + initiativePrefix + " " + destpage);
        history.pushState({'nothing': true}, initiativePrefix + " " + destpage, destpage);
    });
};

function trexRender(campaignName, containerId) {

    console.log("trexRender of " + campaignName);
    $(containerId).html("");
    $('.nav-justified li p').removeClass('selected');
    $('.nav-justified li#' + campaignName + ' p').addClass('selected');

    var margin = {top: 30, right: 30, bottom: 30, left: 30},
        width = $('#table').width() - margin.left - margin.right,
        height = 900 - margin.top - margin.bottom;

    var nodeWidth = 5;
    var nodePadding = 12;

    d3.json("/api/v1/surface/" + campaignName, function(data) {

        if(!data.length) {
            console.log("Error: no data available for this visualization");
            console.log("API: /api/v1/surface/" + campaignName );
            $(containerId).html("<b>No data available for this visualization</b><br>");
            height = 30;
        }

        var formatNumber = d3.format(",.0f"),
            format = function(d) { return formatNumber(d); };

        var g = d3
            .select(containerId)
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
              .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.bottom + ")");

        var maxNodes = 10;

        var sankey = d3.sankey()
            .nodeWidth(nodeWidth)
            .nodePadding(nodePadding)
            .size([width, height]);

        var path = sankey.link();

        sankey
            .nodes(data.nodes)
            .links(data.links)
            .layout(32);

        // Re-sorting nodes
        nested = d3.nest()
            .key(function(d){ return d.group; })
            .map(data.nodes)

        d3.values(nested)
            .forEach(function (d){
                var y = ( height - d3.sum(d,function(n){ return n.dy+sankey.nodePadding();}) ) / 2 + sankey.nodePadding()/2;
                d.sort(function (a,b){
                    return b.dy - a.dy;
                })
                d.forEach(function (node){
                    node.y = y;
                    y += node.dy +sankey.nodePadding();
                })
            })

        // Resorting links
        d3.values(nested).forEach(function (d){
            d.forEach(function (node){
                var ly = 0;
                node.sourceLinks
                    .sort(function (a,b){
                        return a.target.y - b.target.y;
                    })
                    .forEach(function (link){
                        link.sy = ly;
                        ly += link.dy;
                    })

                ly = 0;
                node.targetLinks
                    .sort(function(a,b){
                        return a.source.y - b.source.y;
                    })
                    .forEach(function (link){
                        link.ty = ly;
                        ly += link.dy;
                    })
            })
        })

        var colors = d3.scale.category20();

        var link = g.append("g").selectAll(".link")
            .data(data.links)
               .enter().append("path")
                    .attr("class", "link")
                    .attr("d", path )
                    .style("stroke-width", function(d) { return Math.max(1, d.dy); })
                    .style("fill","none")
                    .style("stroke", function (d){ return colors(d.source.name); })
                    .style("stroke-opacity",".4")
                    .sort(function(a, b) { return b.dy - a.dy; })
                    .append("title")
                    .text(function(d) { return d.value });

        var node = g.append("g").selectAll(".node")
            .data(data.nodes)
            .enter().append("g")
                .attr("class", "node")
                .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; })

        node.append("rect")
            .attr("height", function(d) { return d.dy; })
            .attr("width", sankey.nodeWidth())
            .style("fill", function (d) { return d.sourceLinks.length ? colors(d.name) : "#666"; })
            .append("title")
            .text(function(d) { return d.name + "\n" + format(d.value); });

        node
            .append("text")
            .attr("x", -6)
            .attr("y", function (d) { return d.dy / 2; })
            .attr("dy", ".35em")
            .attr("text-anchor", "end")
            .attr("transform", null)
            .text(function(d) { return d.name; })
            .style("font-size","11px")
            .style("font-family","Arial, Helvetica")
            .style("pointer-events","none")
            .filter(function(d) { return d.x < width / 2; })
            .attr("x", 6 + sankey.nodeWidth())
            .attr("text-anchor", "start");

        node.filter(function(d) { return d.group === "site" })
            .append("foreignObject")
            .attr("x", 6 + sankey.nodeWidth())
            .attr("y", function (d) { return d.dy / 2; })
            .attr("dy", ".35em")
            .attr("width", "100%")
            .attr("text-anchor", "start")
            .attr("transform", null)
            /* in theory I've d.href with http or https, but in practice I'm loosing that attribute with sankey mangling */
            /* note: I was putting a simple link here, but on mobile platform was not display, so I'll removed and bon. */
            .html(function(d) { return "<a target='_blank' href='http://" + d.name + "'>-----------</a>"; })
            .style("font-weight", "bolder")
            .style("background-color", "#ffffff")
            .style("font-size","11px")
            .style("font-family","Arial, Helvetica");
        g
            .selectAll(".label")
            .data([
                { x: 14, name: 'site' },
                { x: 590, name: 'third party' },
                { x: 1080, name: 'responds to' }
            ])
            .enter()
            .append("text")
            .attr("class", "label")
            .attr("y", -8)
            .attr("x", function (d) { return d.x; })
            .attr("dy", ".35em")
            .attr("text-anchor", "end")
            .attr("transform", null)
            .text(function(d) { return d.name; })
            .style("text-transform", "capitalize")
            .style("font-size","14px")
            .style("font-family", "'Work Sans', sans-serif")
            .style("pointer-events","none");

    });
};

function trexArchive(campaignName, archiveTable, subjectTable) {

    console.log("trexArchive");

    $.getJSON("/api/v1/surface/" + campaignName, function(collections) {

        console.log("surface");
        console.log(collections);

        var converted = _.map(collections, function(list) {
            var inserted = moment
                .duration(moment() - moment(list.creationTime) )
                .humanize() + " ago";

            /* order matter, so I want to be sure here */
            return [
                list.name,
                list.kind,
                moment(list.trueOn).format("YYYY-MM-DD"),
                inserted,
                list.siteCount
            ];
        });

        $(archiveTable).DataTable( {
            data: converted
        });
    });

    $.getJSON("/api/v1/campaign/" + campaignName, function(collections) {

        console.log("campaign");
        console.log(collections);

        var converted = _.map(collections, function(list) {
            var inserted = moment
                .duration(moment() - moment(list.creationTime) )
                .humanize() + " ago";

            /* order matter, so I want to be sure here */
            return [
                list.name,
                list.kind,
                moment(list.trueOn).format("YYYY-MM-DD"),
                inserted,
                list.siteCount
            ];
        });

        $(subjectTable).DataTable( {
            data: converted
        });
    });

};
