if (!window.d3) {
    window.d3 = require("d3");
    require("d3-queue");
}

window.addEventListener("dogDataLoaded", function () {
    root= objectToArray(loadedData["dogsT"]);
    console.log("root");
    console.log(root);
root.forEach(function(currentValue, index, array){
    // console.log(width);
    // console.log(index);
   // console.log((width*index)/root.length);
   currentValue.x=110;
    currentValue.fixed = true;
    currentValue.y=100;
});
console.log("roo");
console.log(root);
    Sup();
    //update();
});
var objectToArray = function(obj) {
    var arr =[];
    for(let o in obj) {
      if (obj.hasOwnProperty(o)) {
        arr.push(obj[o]);
      }
    }
    return arr;
  };

var width = 800,
height = 500;
var root=[];

var force = d3.layout.force()
.linkDistance(40)
.gravity(.2)
.charge(-200)
.size([width, height]);

var svg = d3.select("#vis3").append('svg')
.attr('width', width)
.attr('height', height)
;

var link = svg.selectAll(".link"),
    node = svg.selectAll(".node");

    var nodes=[];
    var links;

 function Sup(){
    


    root.forEach(function(currentValue, index, array){
       Array.prototype.push.apply(nodes,flatten(currentValue));
   });
   console.log(nodes);
    links = d3.layout.tree().links(nodes);
    
    nodes.forEach(function(d, i) {
        if(!d.fixed){
        d.x = width/2 + i;
        d.y = 100*d.depth + 100;
    }
    });
    
    force.nodes(nodes)
    .links(links)
    .on("tick", tick)
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
    .on("click", Togglechildren)
    .call(force.drag);
}

function tick(e) {
    var ky = e.alpha;
    links.forEach(function(d, i) {
    d.target.y += (d.target.depth * 100 - d.target.y) * 5 * ky;
    });

    nodes.forEach(function(d, i) {
        if(d.children) {
            if(i>0) {
                var childrenSumX = 1;//0
                d.children.forEach(function(d, i) {
                    childrenSumX += d.x;
                });
                var childrenCount = d.children.length;
                d.x += ((childrenSumX/childrenCount) - d.x) * 5 * ky;
            }
            else {
                d.x += (width/2 - d.x) * 5 * ky;
                console.log("else");
            };
        };
    });

    link.attr("x1", function(d) { return d.source.x; })
        .attr("y1", function(d) { return d.source.y; })
        .attr("x2", function(d) { return d.target.x; })
        .attr("y2", function(d) { return d.target.y; });

    node.attr("cx", function(d) { return d.x; })
        .attr("cy", function(d) { return d.y; })
        // .on("click", Togglechildren)
        // .on("dblclick", dblclick)
        // .call(dragnode);
};
function dblclick(d) {
    d3.select(this).classed("fixed", d.fixed = false);
  }
  
function dragstart(d) {
    d3.select(this).classed("fixed", d.fixed = true);
  }
function flatten(root) {
    var nodes = [], i = 0;
    function recurse(node, depth) {
        if (node.children) {
            node.children.forEach(function(child) {
                recurse(child, depth + 1);
            });
        }
        node.depth = depth;
        node.id=++i
        nodes.push(node);
    }
    recurse(root, 1);
    return nodes;
}
var dragnode = force.drag()
.on("dragstart", dragstart);


function update() {
    // console.log("update():");
    // console.log(root);
    var nodes=[];
    root.forEach(function(currentValue, index, array){
       Array.prototype.push.apply(nodes,flatten(currentValue));
   });
   console.log(nodes);
    links = d3.layout.tree().links(nodes);
  
    // Restart the force layout.
    force
        .nodes(nodes)
        .links(links)
        .start();
  
    // Update the links…
    link = link.data(links, function(d) { return d.target.id; });
  
    // Exit any old links.
    link.exit().remove();
  
    // Enter any new links.
    link.enter().insert("line", ".node")
        .attr("class", "link")
        .attr("x1", function(d) { return d.source.x; })
        .attr("y1", function(d) { return d.source.y; })
        .attr("x2", function(d) { return d.target.x; })
        .attr("y2", function(d) { return d.target.y; });
  
    // Update the nodes…
    node = node.data(nodes, function(d) { return d.id; }).style("fill", color);
  
    // Exit any old nodes.
    node.exit().remove();
  
    // Enter any new nodes.
    node.enter().append("circle")
        .attr("class", "node")
        .attr("cx", function(d) { return d.x; })
        .attr("cy", function(d) { return d.y; })
        .attr("r", function(d) { return  4.5; }) //Math.sqrt(d.size) /
        .style("fill", color)
        .on("click", Togglechildren)
        .call(force.drag);//?;

  }

  function color(d) {
    return d._children ? "#3182bd" : d.children ? "#c6dbef" : "#fd8d3c";
  }

      // Toggle children on click.
      function Togglechildren(d) {
          console.log("Togglechildren");
        if (!d3.event.defaultPrevented) {
            console.log("Togglechildren V2");
        if (d.children) {
            d._children = d.children;
            d.children = null;
        } else {
            d.children = d._children;
            d._children = null;
        }
        update();
        }
    }