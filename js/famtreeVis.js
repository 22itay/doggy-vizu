var w = 800;
var h = 600;

var showCh = true,showOr =true, showFa = true, showMo = true;
var focus_node = null, highlight_node = null;

var text_center = true;//false;

var min_score = 0;
var max_score = 10;

var color = d3.scale.linear()
	.domain([min_score, (min_score + max_score) / 2, max_score])
	.range(["lime", "yellow", "red"]);

var highlight_color = "blue";
var highlight_trans = 0.1;

var size = d3.scale.pow().exponent(1)
	.domain([1, 100])
	.range([8, 24]);

var force = d3.layout.force()
	.linkDistance(100)
	.charge(-800)
	.gravity(.6)
	.size([w, h]);

var default_node_color = "#ccc";
var default_link_color = "#888";
var nominal_base_node_size = 8;
var nominal_text_size = 10;
var max_text_size = 24;
var nominal_stroke = 1.5;
var max_stroke = 4.5;
var max_base_node_size = 36;
var min_zoom = 0.1;
var max_zoom = 7;
var svg = d3.select("#vis-famtree").append("svg").style("cursor", "move");
var zoom = d3.behavior.zoom().scaleExtent([min_zoom, max_zoom]);
var g = svg.append("g");

var link, node, text, circle;
var linkedByIndex = {};
window.addEventListener("dogDataLoaded", function () {

	graph.links.forEach(function (d) {
		linkedByIndex[d.source + "," + d.target] = true;
	});

	force.nodes(graph.nodes)
		.links(graph.links)
		.start();

	link = g.selectAll(".link")
		.data(graph.links)
		.enter().append("line")
		.attr("class", "link")
		.style("stroke-width", nominal_stroke)
		.style("stroke", function (d) {//todo
			if (isNumber(d.score) && d.score >= 0) return color(d.score);
			else return default_link_color;
		})


	node = g.selectAll(".node")
		.data(graph.nodes)
		.enter().append("g")
		.attr("class", "node")
		.call(force.drag);


	node.on("dblclick.zoom", function (d) {
		d3.event.stopPropagation();
		var dcx = (w / 2 - d.x * zoom.scale());
		var dcy = (h / 2 - d.y * zoom.scale());
		zoom.translate([dcx, dcy]);
		g.attr("transform", "translate(" + dcx + "," + dcy + ")scale(" + zoom.scale() + ")");
	});

	circle = node.append("path")
		.attr("d", d3.svg.symbol()
			.size(function (d) { return Math.PI * Math.pow(size(d.size) || nominal_base_node_size, 2); })
			.type(function (d) { return d.type; }))

		.style("fill", currentcolorFn)
		.style("stroke-width", nominal_stroke)
		.style("stroke", "white");


	text = g.selectAll(".text")
		.data(graph.nodes)
		.enter().append("text")
		.attr("dy", ".35em")
		.style("font-size", nominal_text_size + "px")

	if (text_center)
		text.text(function (d) { return d.name+'\u000d'+d.id; })
			.style("text-anchor", "middle");
	else
		text.attr("dx", function (d) { return (size(d.size) || nominal_base_node_size); })
			.text(function (d) { return '\u2002' + d.name; });

	node.on("mouseover", function (d) {
		set_highlight(d);
	})
		.on("mousedown", function (d) {
			d3.event.stopPropagation();
			focus_node = d;
			set_focus(d)
			if (highlight_node === null) set_highlight(d)

		}).on("mouseout", function (d) {
			exit_highlight();

		});

	d3.select(window).on("mouseup",
		function () {
			if (focus_node !== null) {
				focus_node = null;
				if (highlight_trans < 1) {

					circle.style("opacity", 1);
					text.style("opacity", 1);
					link.style("opacity", 1);
				}
			}

			if (highlight_node === null) exit_highlight();
		});

	zoom.on("zoom", function () {

		var stroke = nominal_stroke;
		if (nominal_stroke * zoom.scale() > max_stroke) stroke = max_stroke / zoom.scale();
		link.style("stroke-width", stroke);
		circle.style("stroke-width", stroke);

		var base_radius = nominal_base_node_size;
		if (nominal_base_node_size * zoom.scale() > max_base_node_size) base_radius = max_base_node_size / zoom.scale();
		circle.attr("d", d3.svg.symbol()
			.size(function (d) { return Math.PI * Math.pow(size(d.size) * base_radius / nominal_base_node_size || base_radius, 2); })
			.type(function (d) { return d.type; }))

		if (!text_center) text.attr("dx", function (d) { return (size(d.size) * base_radius / nominal_base_node_size || base_radius); });

		var text_size = nominal_text_size;
		if (nominal_text_size * zoom.scale() > max_text_size) text_size = max_text_size / zoom.scale();
		text.style("font-size", text_size + "px");

		g.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
	});

	svg.call(zoom);

	resize();
	d3.select(window).on("resize", resize).on("keydown", keydown);

	force.on("tick", function () {

		node.attr("transform", function (d) { return "translate(" + d.x + "," + d.y + ")"; });
		text.attr("transform", function (d) { return "translate(" + d.x + "," + d.y + ")"; });

		link.attr("x1", function (d) { return d.source.x; })
			.attr("y1", function (d) { return d.source.y; })
			.attr("x2", function (d) { return d.target.x; })
			.attr("y2", function (d) { return d.target.y; });

		node.attr("cx", function (d) { return d.x; })
			.attr("cy", function (d) { return d.y; });
	});
	function keydown() {
		if (d3.event.keyCode == 32) { force.stop(); }
		else if (d3.event.keyCode >= 48 && d3.event.keyCode <= 90 && !d3.event.ctrlKey && !d3.event.altKey && !d3.event.metaKey) {
			switch (String.fromCharCode(d3.event.keyCode)) {
				case "T": keyt = !keyt; break;
				case "X": keyx = !keyx; break;
				case "D": keyd = !keyd; break;
				case "L": keyl = !keyl; break;
				case "M": keym = !keym; break;
				case "H": keyh = !keyh; break;
				case "1": key1 = !key1; break;
				case "2": key2 = !key2; break;
				case "3": key3 = !key3; break;
				case "0": key0 = !key0; break;
			}
			update_famtree_view()
		}
	}

});//end 
//function start
	//filter_API start
	var colorfunctions = {
		"passed": function (d) {
			return trueFalseColorScale(d.passed);
		}, "breed": function (d) {
			return breedColorScale(d.breed);
		}, "heatmap": function (d) {
			return plasmaScale((256 * d.totalPassed / d.totalChildren) || 0);
		}, "norm": function (d) {
			if (isNumber(d.color) && d.color >= 0)
				return color(d.color);
			else
				return default_node_color;
		}
	};
	function change_famtree_colors(colorfunction) {
		currentcolorFn = colorfunctions[colorfunction] || colorfunctions["heatmap"];
		//update_famtree_view();
		circle.style("fill", currentcolorFn);
	}
	var currentcolorFn = colorfunctions["heatmap"];
	function toggle_famtree(toggle, value) {
		switch (toggle) {
			case "mothers":
				showMo = value;
				break;
			case "fathers":
				showFa = value;
				break;
			case "children":
				showCh = value;
				break;
			case "orphans":
				showOr = value;
				break;
			default:
				return;
		}
		update_famtree_view();
	}
	//filter_API end

function resize() {
	var width = w, height = h;
	svg.attr("width", width).attr("height", height);

	force.size([force.size()[0] + (width - w) / zoom.scale(), force.size()[1] + (height - h) / zoom.scale()]).resume();
	w = width;
	h = height;
}

function set_highlight(d) {
	svg.style("cursor", "pointer");
	if (focus_node !== null) d = focus_node;
	highlight_node = d;

	if (highlight_color != "white") {
		circle.style("stroke", function (o) {
			return isConnected(d, o) ? highlight_color : "white";
		});
		text.style("font-weight", function (o) {
			return isConnected(d, o) ? "bold" : "normal";
		});
		link.style("stroke", function (o) {
			return o.source.index == d.index || o.target.index == d.index ? highlight_color : ((isNumber(o.score) && o.score >= 0) ? color(o.score) : default_link_color);

		});
	}
}

function exit_highlight() {
	highlight_node = null;
	if (focus_node === null) {
		svg.style("cursor", "move");
		if (highlight_color != "white") {
			circle.style("stroke", "white");
			text.style("font-weight", "normal");
			link.style("stroke", function (o) { return (isNumber(o.score) && o.score >= 0) ? color(o.score) : default_link_color });
		}

	}
}

function set_focus(d) {
	if (highlight_trans < 1) {
		circle.style("opacity", function (o) {
			return isConnected(d, o) ? 1 : highlight_trans;
		});

		text.style("opacity", function (o) {
			return isConnected(d, o) ? 1 : highlight_trans;
		});

		link.style("opacity", function (o) {
			return o.source.index == d.index || o.target.index == d.index ? 1 : highlight_trans;
		});
	}
}

function update_famtree_view() {
	link.style("display", function (d) {
		var flag = vis_by_type(d.source.type,d.target.orphans) && vis_by_type(d.target.type,d.target.orphans) && vis_by_node_score(d.source.score) && vis_by_node_score(d.target.score) && vis_by_link_score(d.score);
		linkedByIndex[d.source.index + "," + d.target.index] = flag;
		return flag ? "inline" : "none";
	});
	node.style("display", function (d) {
		return (key0 || hasConnections(d)) && vis_by_type(d.type,d.orphans) && vis_by_node_score(d.score) ? "inline" : "none";
	});
	text.style("display", function (d) {
		return (key0 || hasConnections(d)) && vis_by_type(d.type,d.orphans) && vis_by_node_score(d.score) ? "inline" : "none";
	});

	if (highlight_node !== null) {
		if ((key0 || hasConnections(highlight_node)) && vis_by_type(highlight_node.type,highlight_node.orphans) && vis_by_node_score(highlight_node.score)) {
			if (focus_node !== null) set_focus(focus_node);
			set_highlight(highlight_node);
		}
		else { exit_highlight(); }
	}
}
function isConnected(a, b) {
	return linkedByIndex[a.index + "," + b.index] || linkedByIndex[b.index + "," + a.index] || a.index == b.index;
}

function hasConnections(a) {
	for (var property in linkedByIndex) {
		s = property.split(",");
		if ((s[0] == a.index || s[1] == a.index) && linkedByIndex[property]) return true;
	}
	return false;
}

function vis_by_type(type,orphans) {
	switch (type) {
		case "square": return showFa;
		case "diamond": return showMo;
		case "circle": return orphans?showOr:showCh;
		default: return true;
	}
}
function vis_by_node_score(score) {
	if (isNumber(score)) {
		if (score >= 0.666) return keyh;
		else if (score >= 0.333) return keym;
		else if (score >= 0) return keyl;
	}
	return true;
}

function vis_by_link_score(score) {
	if (isNumber(score)) {
		if (score >= 0.666) return key3;
		else if (score >= 0.333) return key2;
		else if (score >= 0) return key1;
	}
	return true;
}

function isNumber(n) {
	return !isNaN(parseFloat(n)) && isFinite(n);
}	
//function end

var keyt = true, keyx = true, keyd = true, keyl = true, keym = true, keyh = true, key1 = true, key2 = true, key3 = true, key0 = true
