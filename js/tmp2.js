if (!window.d3) {
    window.d3 = require("d3");
    require("d3-queue");
}

window.addEventListener("dogDataLoaded", function () {
var root= loadedData["dogsT"][636];


var width = 800,
height = 500;

var force = d3.layout.force()
.gravity(.2)
.charge(-200)
.size([width, height]);

var svg = d3.select("#vis3").append("svg:svg")
.attr("width", width)
.attr("height", height);

//var root = getData();
var nodes = flatten(root),
links = d3.layout.tree().links(nodes);

nodes.forEach(function(d, i) {
d.x = width/2 + i;
d.y = 100*d.depth + 100;
});

root.fixed = true;
root.x = width / 2;
root.y = 100;

force.nodes(nodes)
.links(links)
.start();

var link = svg.selectAll("line")
.data(links)
.enter()
.insert("svg:line")
.attr("class", "link");

var node = svg.selectAll("circle.node")
.data(nodes)
.enter()
.append("svg:circle")
.attr("r", 4.5)
.attr("class", "node")
.call(force.drag);

force.on("tick", function(e) {

var ky = e.alpha;
links.forEach(function(d, i) {
  d.target.y += (d.target.depth * 100 - d.target.y) * 5 * ky;
});
nodes.forEach(function(d, i) {
	if(d.children) {
		if(i>0) {
			var childrenSumX = 0;
			d.children.forEach(function(d, i) {
				childrenSumX += d.x;
			});
			var childrenCount = d.children.length;
			d.x += ((childrenSumX/childrenCount) - d.x) * 5 * ky;
		}
		else {
			d.x += (width/2 - d.x) * 5 * ky;
		};
	};
});

link.attr("x1", function(d) { return d.source.x; })
	.attr("y1", function(d) { return d.source.y; })
	.attr("x2", function(d) { return d.target.x; })
	.attr("y2", function(d) { return d.target.y; });

node.attr("cx", function(d) { return d.x; })
	.attr("cy", function(d) { return d.y; });
});

function flatten(root) {
var nodes = [];
function recurse(node, depth) {
	if (node.children) {
		node.children.forEach(function(child) {
			recurse(child, depth + 1);
		});
	}
	node.depth = depth;
	nodes.push(node);
}
recurse(root, 1);
return nodes;
}


});