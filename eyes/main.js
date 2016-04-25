
var EXPERIMENT1 = function() {

    var links = [
      {source: "Microsoft", target: "Amazon", type: "licensing"},
      {source: "Microsoft", target: "HTC", type: "licensing"},
      {source: "Samsung", target: "Apple", type: "suit"},
      {source: "Motorola", target: "Apple", type: "suit"},
      {source: "Nokia", target: "Apple", type: "resolved"},
      {source: "HTC", target: "Apple", type: "suit"},
      {source: "Kodak", target: "Apple", type: "suit"},
      {source: "Microsoft", target: "Barnes & Noble", type: "suit"},
      {source: "Microsoft", target: "Foxconn", type: "suit"},
      {source: "Oracle", target: "Google", type: "suit"},
      {source: "Apple", target: "HTC", type: "suit"},
      {source: "Microsoft", target: "Inventec", type: "suit"},
      {source: "Samsung", target: "Kodak", type: "resolved"},
      {source: "LG", target: "Kodak", type: "resolved"},
      {source: "RIM", target: "Kodak", type: "suit"},
      {source: "Sony", target: "LG", type: "suit"},
      {source: "Kodak", target: "LG", type: "resolved"},
      {source: "Apple", target: "Nokia", type: "resolved"},
      {source: "Qualcomm", target: "Nokia", type: "resolved"},
      {source: "Apple", target: "Motorola", type: "suit"},
      {source: "Microsoft", target: "Motorola", type: "suit"},
      {source: "Motorola", target: "Microsoft", type: "suit"},
      {source: "Huawei", target: "ZTE", type: "suit"},
      {source: "Ericsson", target: "ZTE", type: "suit"},
      {source: "Kodak", target: "Samsung", type: "resolved"},
      {source: "Apple", target: "Samsung", type: "suit"},
      {source: "Kodak", target: "RIM", type: "suit"},
      {source: "Nokia", target: "Qualcomm", type: "suit"}
    ];

    var nodes = {};

    // Compute the distinct nodes from the links.
    links.forEach(function(link) {
      link.source = nodes[link.source] || (nodes[link.source] = {name: link.source});
      link.target = nodes[link.target] || (nodes[link.target] = {name: link.target});
    });

    var width = 960,
        height = 500;

    var force = d3.layout.force()
        .nodes(d3.values(nodes))
        .links(links)
        .size([width, height])
        .linkDistance(60)
        .charge(-300)
        .on("tick", tick)
        .start();

    var svg = d3.select("body").append("svg")
        .attr("width", width)
        .attr("height", height);

    // Per-type markers, as they don't inherit styles.
    svg.append("defs").selectAll("marker")
        .data(["suit", "licensing", "resolved"])
      .enter().append("marker")
        .attr("id", function(d) { return d; })
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", 15)
        .attr("refY", -1.5)
        .attr("markerWidth", 6)
        .attr("markerHeight", 6)
        .attr("orient", "auto")
      .append("path")
        .attr("d", "M0,-5L10,0L0,5");

    var path = svg.append("g").selectAll("path")
        .data(force.links())
      .enter().append("path")
        .attr("class", function(d) { return "link " + d.type; })
        .attr("marker-end", function(d) { return "url(#" + d.type + ")"; });

    var circle = svg.append("g").selectAll("circle")
        .data(force.nodes())
      .enter().append("circle")
        .attr("r", 6)
        .call(force.drag);

    var text = svg.append("g").selectAll("text")
        .data(force.nodes())
      .enter().append("text")
        .attr("x", 8)
        .attr("y", ".31em")
        .text(function(d) { return d.name; });

    // Use elliptical arc path segments to doubly-encode directionality.
    function tick() {
      path.attr("d", linkArc);
      circle.attr("transform", transform);
      text.attr("transform", transform);
    }

    function linkArc(d) {
      var dx = d.target.x - d.source.x,
          dy = d.target.y - d.source.y,
          dr = Math.sqrt(dx * dx + dy * dy);
      return "M" + d.source.x + "," + d.source.y + "A" + dr + "," + dr + " 0 0,1 " + d.target.x + "," + d.target.y;
    }

    function transform(d) {
      return "translate(" + d.x + "," + d.y + ")";
    }

};


var render = function() {

    var WW = document.body.clientWidth || window.innerWidth
          || document.documentElement.clientWidth;

    var WH = document.body.clientHeight || window.innerHeight
          || document.documentElement.clientHeight;

    var margin = {top: 20, right: 20, bottom: 20, left: 20},
            width = WW - margin.left - margin.right,
            height = WH - margin.top - margin.bottom;

    var newArc = d3.svg.line()
            .x(function(d) { return d.x; })
            .y(function(d) { return d.y; })
            .interpolate("monotone");

    var svg = d3.select("#content")
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var getRandomColor = function() {
        var letters = '0123456789ABCDEF'.split(''),
            color = '#';
        for (var i = 0; i < 6; i++ ) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
    };

    var coordGiver = function(roleOf, positionOf) {
        var RADIUS = 5,
            RIGHTPADDING = 20,
            SITEBOXRIGHTSTART = RIGHTPADDING + 30,
            COMPANYCOLUMN = 300 + RIGHTPADDING,
            COMPANYDOTS2NAME = 20,
            CONSTANTVSPACE = 30,
            TOPSPACING = 40,
            BOXWIDTH = 120,
            BOXHEIGHT = 22;
        switch(roleOf) {
            case 'category':
              return {
                  x: 0, // SITEBOXRIGHTSTART 
                  y: TOPSPACING + CONSTANTVSPACE
              };
            case 'siteName':
              return {
                  x: SITEBOXRIGHTSTART + 10,
                  y: TOPSPACING + (positionOf * CONSTANTVSPACE)
              };
            case 'siteBox':
              return {
                  x: SITEBOXRIGHTSTART - 10,
                  y: TOPSPACING + (positionOf * CONSTANTVSPACE) - 18,
                  width: BOXWIDTH,
                  height: BOXHEIGHT
              };
            case 'siteRank':
              return {
                  x: SITEBOXRIGHTSTART - 28,
                  y: TOPSPACING + (positionOf * CONSTANTVSPACE) - 15 ,
                  width: 28,
                  height: 16 
              };
            case 'siteRankNumber':
              return {
                  x: SITEBOXRIGHTSTART - 24,
                  y: TOPSPACING + (positionOf * CONSTANTVSPACE) - 3
              }
            case 'middlePoint':
              return {
                  x: (COMPANYCOLUMN / 2),
                  y: TOPSPACING + (positionOf * CONSTANTVSPACE)
              };
            case 'companyCircle':
              return {
                  x: COMPANYCOLUMN,
                  y: TOPSPACING + (positionOf * CONSTANTVSPACE),
                  radius: RADIUS
              };
            case 'companyName':
              return {
                  x: COMPANYCOLUMN + COMPANYDOTS2NAME,
                  y: TOPSPACING + (positionOf * CONSTANTVSPACE) + RADIUS
              };
            default:
              throw new Error("invalid roleOf: " + roleOf)
        }
    };

    /* we have already given an hand of Magic White so our canvas is wet
      -- Bob Ross */
    svg.append("rect")
      .attr("fill", "#FFFFFF")
      .attr("x", 0)
      .attr("y", 0)
      .attr("height", height)
      .attr("width", width);

    d3.json("/dotstest.json", function(value) {
      value.sites = _.map(value.sites, function(s) {
          s.siteColor = getRandomColor();
          return s;
      });

      /*
      svg.append("rect")
        .attr("x", coordGiver('siteRank', 0).x)
        .attr("y", coordGiver('siteRank', 0).y)
        .style("height", coordGiver('siteRank', 0).height + 3)
        .style("width", _.size(value.category.name) * 8)
        .style("fill", "white");
    */
      svg.append("text")
        .attr("x", coordGiver('siteRankNumber', 0).x - 8)
        .attr("y", coordGiver('siteRankNumber', 0).y + 18)
        .attr("transform", "rotate(-15)")
        .style("font-style", "italic")
        .text(value.category.name);

      svg.selectAll(".siteBox")
        .data(value.sites)
        .enter()
          .append("rect")
          .attr("class", "siteBox")
          .style("stroke", function(d) {
              return d.siteColor;
          })
          .style("stroke-width", 2)
          .style("rx", 5)
          .style("fill", "#FBFCF7")
          .style("width", function(d) {
              return coordGiver('siteBox', d.position).width;
          })
          .style("height", function(d) {
              return coordGiver('siteBox', d.position).height;
          })
          .attr("x", function(d) {
              return coordGiver('siteBox', d.position).x;
          })
          .attr("y", function(d) {
              return coordGiver('siteBox', d.position).y;
          });

      svg.selectAll(".siteLabel")
        .data(value.sites)
        .enter()
          .append("text")
          .attr("class", "siteLabel")
          .attr("id", function(d) {
              return d.id;
          })
          .attr("dx", function(d) {
              return coordGiver('siteName', d.position).x;
          })
          .attr("dy", function(d) {
              return coordGiver('siteName', d.position).y;
          })
          .text(function(d) {
              return d.label;
          });

      svg.selectAll(".siterank")
        .data(value.sites)
        .enter()
          .append("rect")
          .attr("x", function(d) {
              return coordGiver('siteRank', d.position).x;
          })
          .attr("y", function(d) {
              return coordGiver('siteRank', d.position).y;
          })
          .style("height", function(d) {
              return coordGiver('siteRank', d.position).height;
          })
          .style("width", function(d) {
              return coordGiver('siteRank', d.position).width;
          })
          .attr("class", "siterank");

      svg.selectAll(".siteranknumber")
        .data(value.sites)
        .enter()
          .append("text")
          .attr("class", "siteranknumber")
          .attr("dx", function(d) {
              return coordGiver('siteRankNumber', d.position).x;
          })
          .attr("dy", function(d) {
              return coordGiver('siteRankNumber', d.position).y;
          })
          .text(function(d) {
              if (d.rank >= 100) {
                return "99+";
              } else {
                return d.rank;
              }
          });

      svg.selectAll(".dot")
        .data(value.companies)
        .enter() 
          .append("circle")
          .attr("class", "dot")
          .attr("id", function(d) {
              return d.id;
          })
          .attr("cx", function(d) {
              return coordGiver('companyCircle', d.position).x;
          })
          .attr("cy", function(d) {
              return coordGiver('companyCircle', d.position).y;
          })
          .attr("r", function(d) {
              return coordGiver('companyCircle', d.position).radius;
          });

      svg.selectAll(".companyname")
        .data(value.companies)
        .enter() 
          .append("text")
          .attr("class", "companyname")
          .attr("dx", function(d) {
              return coordGiver('companyName', d.position).x;
          })
          .attr("dy", function(d) {
              return coordGiver('companyName', d.position).y;
          })
          .text(function(d) {
              return d.name + " " + d.percentage + "%";
          });

      /* arcList is a collection of every arc, from sites.companiesID */
      var arcList = _.reduce(value.sites, function(memo, site) {

        var startCoord = coordGiver('siteBox', site.position),
            siteMiddlePoint = coordGiver('middlePoint', site.position),
            arcGroup = 
              _.reduce(site.companiesId, function(m, cid) {
                var companyCircle = coordGiver(
                      'companyCircle',  
                      _.find(value.companies, { id: cid }).position),
                    arc = {
                      coordinates: [ 
                        { x: startCoord.x + startCoord.width,
                          y: startCoord.y + (startCoord.height / 2) },
                        /*
                        { x: siteMiddlePoint.x,
                          y: siteMiddlePoint.y }, */
                        { x: (siteMiddlePoint.x + (siteMiddlePoint.x / 3)) ,
                          y: siteMiddlePoint.y },
                        { x: companyCircle.x,
                          y: companyCircle.y } ],
                      color: site.siteColor
                    };
                m.push(arc);
                return m;
        }, []);

        return memo.concat(arcGroup);

      }, []);

      _.each(arcList, function(singleArc) {
          svg.append("path")
            .attr("class", "line")
            .style("stroke", singleArc.color)
            .attr("d", newArc(singleArc.coordinates));
      });


    });

};

module.exports = {
    render: render
};
