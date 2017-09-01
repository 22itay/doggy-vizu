if (!window.d3) {
    window.d3 = require("d3");
    require("d3-queue");
}

window.addEventListener("dogDataLoaded", function () {
    //root = Object.values(loadedData["dogsT"]);
     root =Object.values(loadedData["dogsT"]);
    //  root.pop();
    //  root.pop();
    //  root.pop();
    //  root.pop();
    //  root.pop();
    //  root.pop();
    //  root.pop();
    //  root.pop();
    //  root.pop();
    //  root.pop();
    //  root.pop();
    //  root.pop();
    //  root.pop();
    root.forEach(function (currentValue, index, array) {
        currentValue.x = (width * index) / root.length;
        //currentValue.fixed = true;
    });
    
    //root.push(root2);
    console.log(root);
    Sup();
});

var keyc = true, keys = true, keyt = true,
    keyr = true, keyx = true, keyd = true,
    keyl = true, keym = true, keyh = true,
    key1 = true, key2 = true, key3 = true,
    key0 = true

var focus_node = null, highlight_node = null;

var text_center = false,outline = false,
    highlight_color = "blue",
    highlight_trans = 0.1;


var width = 1800,
    height = 500;
var root = [];
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
var zoom = d3.behavior.zoom().scaleExtent([min_zoom,max_zoom])
var svg = d3.select("#vis3").append('svg')
            .attr('width', width)
            .attr('height', height);
var g = svg.append("g");
svg.style("cursor","move");

var linkedByIndex = {};

function isConnected(a, b) {//ref v?
    return  linkedByIndex[a.name + "," + b.name] ||
            linkedByIndex[b.name + "," + a.name] ||
            a.name == b.name;
}

function hasConnections(a) {//ref
    for (var property in linkedByIndex) {
            s = property.split(",");
            if ((s[0] == a.index || s[1] == a.index) && linkedByIndex[property]) 					return true;
    }
return false;
}

var force = d3.layout.force()
    .linkDistance(50)
    .charge(-600)
    .gravity(.6)
    .size([width, height]);



var link = g.selectAll(".link"),
    node = g.selectAll(".node");

var nodes = [];
var links=[];

function Sup() {
    root.forEach(function (currentValue, index, array) {
        let x=flatten(currentValue);
        Array.prototype.push.apply(nodes,x);
        links.push(d3.layout.tree().links(x));
    });
    
    links = d3.layout.tree().links(nodes);
    console.log(links);
    links.forEach(function(d) {//ref
        linkedByIndex[d.source.name + "," + d.target.name] = true;
    });
    console.log(linkedByIndex);
    
    nodes.forEach(function(d, i) {
      
        if(!d.fixed){
        d.x = width/2 + i;
        d.y = 200*d.depth + 150;
        }
    });
    
    force.nodes(nodes)
        .links(links)
        .on("tick", tick)
        .start();

    link.data(links)
        .enter().append("line")
        .attr("class", "link")
        .style("stroke-width",nominal_stroke)
        .style("stroke", function(d) { 
             return default_link_color; });
    
    node.data(nodes)
        .enter().append("g")
        .attr("class", "node")
        .call(force.drag);

    node.on("dblclick.zoom", function(d) {
         d3.event.stopPropagation();
        var dcx = (window.innerWidth/2-d.x*zoom.scale());
        var dcy = (window.innerHeight/2-d.y*zoom.scale());
        zoom.translate([dcx,dcy]);
        g.attr("transform", "translate("+ dcx + "," + dcy  + ")scale(" + zoom.scale() + ")");
	});
    //  link = svg.selectAll("line")
    //     .data(links)
    //     .enter()
    //     .insert("svg:line")
    //     .attr("class", "link");

    //  node = svg.selectAll(".node")
    //     .data(nodes)
    //     .enter()
    //     .append("svg:circle")
    //     .attr("r", 10)
    //     .attr("class", "node")
    //     //.on("click", Togglechildren)
    //     .call(force.drag);

        // var circle = node.append("path")
        //     .attr("d", d3.svg.symbol()
        //     .type(function(d) { return d.type; }))
        //Sup();
}

zoom.on("zoom", function() {
    
      var stroke = nominal_stroke;
      if (nominal_stroke*zoom.scale()>max_stroke) stroke = max_stroke/zoom.scale();
      link.style("stroke-width",stroke);
      circle.style("stroke-width",stroke);
         
      var base_radius = nominal_base_node_size;
      if (nominal_base_node_size*zoom.scale()>max_base_node_size) base_radius = max_base_node_size/zoom.scale();
          circle.attr("d", d3.svg.symbol()
          .size(function(d) { return Math.PI*Math.pow(size(d.size)*base_radius/nominal_base_node_size||base_radius,2); })
          .type(function(d) { return d.type; }))
          
      //circle.attr("r", function(d) { return (size(d.size)*base_radius/nominal_base_node_size||base_radius); })
      if (!text_center) text.attr("dx", function(d) { return (size(d.size)*base_radius/nominal_base_node_size||base_radius); });
      
      var text_size = nominal_text_size;
      if (nominal_text_size*zoom.scale()>max_text_size) text_size = max_text_size/zoom.scale();
      text.style("font-size",text_size + "px");
  
      g.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
      });
       
    svg.call(zoom);	  
      
    resize();

force.on("tick", function() {
    
  node.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });
  text.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });

  link.attr("x1", function(d) { return d.source.x; })
    .attr("y1", function(d) { return d.source.y; })
    .attr("x2", function(d) { return d.target.x; })
    .attr("y2", function(d) { return d.target.y; });
      
  node.attr("cx", function(d) { return d.x; })
    .attr("cy", function(d) { return d.y; });
  });

  function set_focus(d)
  {	
  if (highlight_trans<1)  {
      circle.style("opacity", function(o) {
                  return isConnected(d, o) ? 1 : highlight_trans;
              });
  
              text.style("opacity", function(o) {
                  return isConnected(d, o) ? 1 : highlight_trans;
              });
              
              link.style("opacity", function(o) {
                  return o.source.index == d.index || o.target.index == d.index ? 1 : highlight_trans;
              });		
      }
  }
  
  function exit_highlight()
  {
          highlight_node = null;
      if (focus_node===null)
      {
          svg.style("cursor","move");
          if (highlight_color!="white")
      {
          circle.style(towhite, "white");
        text.style("font-weight", "normal");
        link.style("stroke", function(o) {return (isNumber(o.score) && o.score>=0)?color(o.score):default_link_color});
   }
              
      }
  }
  
  function set_highlight(d)
  {
      svg.style("cursor","pointer");
      if (focus_node!==null) d = focus_node;
      highlight_node = d;
  
      if (highlight_color!="white")
      {
            circle.style(towhite, function(o) {
                  return isConnected(d, o) ? highlight_color : "white";});
              text.style("font-weight", function(o) {
                  return isConnected(d, o) ? "bold" : "normal";});
              link.style("stroke", function(o) {
                return o.source.index == d.index || o.target.index == d.index ? highlight_color : ((isNumber(o.score) && o.score>=0)?color(o.score):default_link_color);
  
              });
      }
  }

  function resize() {
    var width = window.innerWidth, height = window.innerHeight;
	svg.attr("width", width).attr("height", height);
    
	force.size([force.size()[0]+(width-w)/zoom.scale(),force.size()[1]+(height-h)/zoom.scale()]).resume();
    w = width;
	h = height;
	}


function flatten(root) {
    var nodes = [], i = 0;
    function recurse(node, depth) {
        if (node.children) {
            node.children.forEach(function (child) {
                recurse(child, depth + 1);
            });
        }
        node.depth = depth;
        node.id = ++i
        nodes.push(node);
    }
    recurse(root, 1);
    return nodes;
}
// var dragnode = force.drag()
//     .on("dragstart", dragstart);


function update() {
    nodes = [];
    root.forEach(function (currentValue, index, array) {
        Array.prototype.push.apply(nodes, flatten(currentValue));
    });
    links = d3.layout.tree().links(nodes);

    // Restart the force layout.
    force
        .nodes(nodes)
        .links(links)
        .start();

    // Update the links…
    link = link.data(links, function (d) { return d.target.id; });

    // Exit any old links.
    link.exit().remove();

    // Enter any new links.
    link.enter().insert("line", ".node")
        .attr("class", "link")
        .attr("x1", function (d) { return d.source.x; })
        .attr("y1", function (d) { return d.source.y; })
        .attr("x2", function (d) { return d.target.x; })
        .attr("y2", function (d) { return d.target.y; });

    // Update the nodes…
    node = node.data(nodes, function (d) { return d.id; }).style("fill", color);

    // Exit any old nodes.
    node.exit().remove();

    // Enter any new nodes.
    node.enter().append("circle")
        .attr("class", "node")
        .attr("cx", function (d) { return d.x; })
        .attr("cy", function (d) { return d.y; })
        .attr("r", function (d) { return 4.5; }) //Math.sqrt(d.size) /
        .style("fill", color)
        //.on("click", Togglechildren)
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