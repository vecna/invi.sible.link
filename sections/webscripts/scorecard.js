function rendert() {
	console.log("begin rendert");

	var width = 700;
	var height = 400;

	/* svgContainer is the whole figure */
        var svgContainer = d3
		.select("#container")
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

	// content
	var inputO = {
		name: "www.repubblica.it",
		totalNjs: 40, // from privacy badger 
		post: true,
		canvas: false,
		reply: false,
		storage: true,
		companies: 6,
		score: 81
	};

	// big score 
	svgContainer.append("text")
		.attr("x", 240)
		.attr("y", 300)
		.attr("class", "francois")
		.style("font-size", 170)
		.text(inputO.score);

	// name in the header
	svgContainer.append("text")
		.attr("x", 50 + 10)
		.attr("y", 120)
		.attr("class", "francois")
		.style("font-size", function() {
			// improvised hand tested function to scale font based on name lenght
			var x = (1 / inputO.name.length);
			return x * 1050;
		})
		.text(inputO.name);

	// number of scripts
	svgContainer.append("text")
		.attr("x", 570)
		.attr("y", 120)
		.attr("class", "francois")
		.style("font-size", 60)
		.text(inputO.totalNjs);
	
	svgContainer.append("text")
		.attr("x", 570)
		.attr("y", 330)
		.attr("class", "francois")
		.style("font-size", 60)
		.text(inputO.companies);

	/* square boxes, post, canvas, store, reply */
	var post = d3.path();
	post.rect(560, 170, 40, 40); 
	svgContainer.append("path").attr("d", post.toString())
		.attr("fill", function() {
			return inputO.post ? "red" : "lightgrey";
		});

	var canvas = d3.path();
	canvas.rect(600, 170, 40, 40); 
	svgContainer.append("path").attr("d", canvas.toString())
		.attr("fill", function() {
			return inputO.canvas ? "red" : "lightgrey";
		});

	var storage = d3.path();
	storage.rect(600, 210, 40, 40); 
	svgContainer.append("path").attr("d", storage.toString())
		.attr("fill", function() {
			return inputO.storage ? "red" : "lightgrey";
		});

	var reply = d3.path();
	reply.rect(560, 210, 40, 40); 
	svgContainer.append("path").attr("d", reply.toString())
		.attr("fill", function() {
			return inputO.reply ? "red" : "lightgrey";
		});

};
