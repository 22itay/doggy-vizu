if (!window.d3) {
    window.d3 = require("d3");
    require("d3-queue");
}

window.addEventListener("dogDataLoaded", function () {



var width = 800,
height = 500;

var force = d3.layout.force()
.gravity(.2)
.charge(-200)
.size([width, height]);

var svg = d3.select("#vis3").append("svg:svg")
.attr("width", width)
.attr("height", height);

var root= (loadedData["dogsT"]);
console.log(root);
var root2=getData();
console.log(root2);
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

function getData() {
    return {
        "name": "flare",
            "children": [{
            "name": "analytics",
                "children": [{
                "name": "cluster",
                    "children": [{
                    "name": "AgglomerativeCluster",
                    "size": 3938
                }, {
                    "name": "CommunityStructure",
                    "size": 3812
                }, {
                    "name": "HierarchicalCluster",
                    "size": 6714
                }, {
                    "name": "MergeEdge",
                    "size": 743
                }]
            }, {
                "name": "graph",
                    "children": [{
                    "name": "BetweennessCentrality",
                    "size": 3534
                }, {
                    "name": "LinkDistance",
                    "size": 5731
                }, {
                    "name": "MaxFlowMinCut",
                    "size": 7840
                }, {
                    "name": "ShortestPaths",
                    "size": 5914
                }, {
                    "name": "SpanningTree",
                    "size": 3416
                }]
            }, {
                "name": "optimization",
                    "children": [{
                    "name": "AspectRatioBanker",
                    "size": 7074
                }]
            }]
        }, {
            "name": "animate",
                "children": [{
                "name": "interpolate",
                    "children": [{
                    "name": "ArrayInterpolator",
                    "size": 1983
                }, {
                    "name": "ColorInterpolator",
                    "size": 2047
                }, {
                    "name": "DateInterpolator",
                    "size": 1375
                }, {
                    "name": "Interpolator",
                    "size": 8746
                }, {
                    "name": "MatrixInterpolator",
                    "size": 2202
                }, {
                    "name": "NumberInterpolator",
                    "size": 1382
                }, {
                    "name": "ObjectInterpolator",
                    "size": 1629
                }, {
                    "name": "PointInterpolator",
                    "size": 1675
                }, {
                    "name": "RectangleInterpolator",
                    "size": 2042
                }]
            }, {
                "name": "ISchedulable",
                "size": 1041
            }, {
                "name": "Parallel",
                "size": 5176
            }, {
                "name": "Pause",
                "size": 449
            }, {
                "name": "Scheduler",
                "size": 5593
            }, {
                "name": "Sequence",
                "size": 5534
            }, {
                "name": "Transition",
                "size": 9201
            }, {
                "name": "Transitioner",
                "size": 19975
            }, {
                "name": "TransitionEvent",
                "size": 1116
            }, {
                "name": "Tween",
                "size": 6006
            }]
        }, {
            "name": "data",
                "children": [{
                "name": "converters",
                    "children": [{
                    "name": "Converters",
                    "size": 721
                }, {
                    "name": "DelimitedTextConverter",
                    "size": 4294
                }, {
                    "name": "GraphMLConverter",
                    "size": 9800
                }, {
                    "name": "IDataConverter",
                    "size": 1314
                }, {
                    "name": "JSONConverter",
                    "size": 2220
                }]
            }, {
                "name": "DataField",
                "size": 1759
            }, {
                "name": "DataSchema",
                "size": 2165
            }, {
                "name": "DataSet",
                "size": 586
            }, {
                "name": "DataSource",
                "size": 3331
            }, {
                "name": "DataTable",
                "size": 772
            }, {
                "name": "DataUtil",
                "size": 3322
            }]
		}]
	}
};