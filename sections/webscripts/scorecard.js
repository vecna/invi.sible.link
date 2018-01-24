
function initialize(cardContainer, sourceapi) {
    console.log("renderScoreCards", cardContainer, sourceapi);
    d3.json(sourceapi, function(data) {
        cache = data;
        renderScoreCards(cardContainer);
    });
};

var cache = [];

function renderJsDetail(detailsContainer) {

};

function explanation(event) {
    /* this is supposed to trap a click on the 'github/upload the file' section, explaining
     * the procedure and the requestements */
    console.log(event);
};

function fetchSiteInfo(container, subjectId, campaignName) {
    // this is called when sections/site.pug get rendered in the browser

    /* subjectId it is supposed to be part of the
     * 'worst' 10-100 ranks. This API is used only as link to the scorecards, the
     * website reported here are for sure part of the 'worst' list. This API do 
     * not permit to got back in time, and is implemented in getSiteInfo route */
    var sourceapi = '/api/v1/siteinfo/' + subjectId;
    d3.json(sourceapi, function(data) {
        /* data is a mixed content: judgment + details */

        console.log(data);
        cache = data;
        return renderSiteCard(container, data.judgmentrank);
    });
};

function renderScoreCards(containerRoot) {
    /* look if the URL ends with 'cards' or with 'expert'
     * in such case, render a different visualization in containerId */
    console.log("renderScoreCards", containerRoot);

    _.each(cache.ranks, function(site, i) {
        var divId = containerRoot + i;
        renderSiteCard(divId, site);
    });
};

function renderSiteCard(containerId, data) {
	/* data structure {
		name: "www.repubblica.it",
		totalNjs: 40, // from privacy badger 
		post: true,
		canvas: false,
		reply: false,
		storage: true,
		companies: 6,
		measure: 81
	}; */
	console.log("begin renderSiteCard", containerId, data);

	var width = 700;
	var height = 400;

	/* svgContainer is the whole figure */
        var svgContainer = d3
		.select(containerId)
	        .append("svg")
	        .attr("width", width)
	        .attr("height", height);

	var rectangle = svgContainer
		.append("rect")
		.attr("x", 50)
		.attr("y", 50)
		.attr("width", 600)
		.attr("height", 300)
		.style("fill", "#dafdd5");

	var border = d3.path();
	border.rect(50, 50, 600, 300); 

	svgContainer.append("path")
		.attr("d", border.toString())
		.attr("stroke", "grey")
		.attr("stroke-width", 2)
		.attr("fill", "none");

	var header = d3.path();
	header.moveTo(50, 150);
	header.lineTo(550, 150);
	header.closePath();

	svgContainer.append("path")
		.attr("d", header.toString())
		.attr("stroke", "grey")
		.attr("stroke-width", 1)
		.attr("fill", "none");

	var cutter = d3.path();
	cutter.moveTo(550, 50);
	cutter.lineTo(550, 350);
	cutter.closePath();

	svgContainer.append("path")
		.attr("d", cutter.toString())
		.attr("stroke", "grey")
		.attr("stroke-width", 1)
		.attr("fill", "none");

	// is not really white
	var whiteL1 = d3.path();
	whiteL1.moveTo(551, 150); // +1
	whiteL1.lineTo(649, 150); // -1
	whiteL1.closePath();

	svgContainer.append("path")
		.attr("d", whiteL1.toString())
		.attr("stroke", "grey")
		.attr("stroke-width", 1)
		.attr("fill", "none");

	// big score 
	svgContainer.append("text")
		.attr("x", 240)
		.attr("y", 300)
		.attr("class", "francois")
		.style("font-size", 170 / 16 + "em")
		.text(data.measure);

	// name in the header
	svgContainer.append("text")
		.attr("x", 50 + 10)
		.attr("y", 120)
		.attr("class", "francois")
		.style("font-size", function() {
			var x = (1 / data.name.length);
			return (x * 1050) / 16 + "em";
		})
		.text(data.name);

	// number of scripts
	svgContainer.append("text")
		.attr("x", 570)
		.attr("y", 120)
		.attr("class", "francois")
		.style("font-size", 60 / 16 + "em")
		.text(data.totalNjs);
	
	svgContainer.append("text")
		.attr("x", 570)
		.attr("y", 330)
		.attr("class", "francois")
		.style("font-size", 60 / 16 + "em")
		.text(data.companies);

	/* square boxes, post, canvas, store, reply */
	var post = d3.path();
	post.rect(560, 170, 40, 40); 
	svgContainer.append("path").attr("d", post.toString())
		.attr("fill", function() {
			return data.post ? "red" : "lightgrey";
		});

	var canvas = d3.path();
	canvas.rect(600, 170, 40, 40); 
	svgContainer.append("path").attr("d", canvas.toString())
		.attr("fill", function() {
			return data.canvas ? "red" : "lightgrey";
		});

	var storage = d3.path();
	storage.rect(600, 210, 40, 40); 
	svgContainer.append("path").attr("d", storage.toString())
		.attr("fill", function() {
			return data.storage ? "red" : "lightgrey";
		});

	var reply = d3.path();
	reply.rect(560, 210, 40, 40); 
	svgContainer.append("path").attr("d", reply.toString())
		.attr("fill", function() {
			return data.reply ? "red" : "lightgrey";
		});
};
