if (!window.d3) {
    window.d3 = require("d3");
    require("d3-queue");
}

window.addEventListener("dogDataLoaded", function () {
    root= loadedData["dogsT"];
    update();
});

var width=740, height=500,root;
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
var linksdata = [
    {"source":  0, "target":  1},
    {"source":  1, "target":  2},
    {"source":  2, "target":  0},
    {"source":  1, "target":  3},
    {"source":  3, "target":  2},
    {"source":  3, "target":  4},
    {"source":  4, "target":  5},
    {"source":  5, "target":  6},
    {"source":  5, "target":  7},
    {"source":  6, "target":  7},
    {"source":  6, "target":  8},
    {"source":  7, "target":  8},
    {"source":  9, "target":  4},
    {"source":  9, "target": 11},
    {"source":  9, "target": 10},
    {"source": 10, "target": 11},
    {"source": 11, "target": 12},
    {"source": 12, "target": 10}
    ];

    //var nodes = {};
    // // compute nodes from links data
    // linksdata.forEach(function(link) {
    //     link.source = nodes[link.source] ||
    //         (nodes[link.source] = {name: link.source});
    //     link.target = nodes[link.target] ||
    //         (nodes[link.target] = {name: link.target});        
    // });

    var svg=d3.select("#vis3").append('svg')
    .attr('width', width)
    .attr('height', height)
    ;

    // var force =d3.layout.force()
    // .size([width, height]) //specified earlier
    // .nodes(d3.values(nodes)) //add nodes
    // .links(linksdata) //add links
    // .on("tick", tick) //what to do
    // .linkDistance(35) //set for proper svg size
    // .charge(-50)
    // .gravity(0.1)
    // .start(); 

    var force = d3.layout.force()
    .size([width, height])
    .linkDistance(40)
    .charge(-100)
    .gravity(0.1)
    .on("tick", tick)
    ;

    var link = svg.selectAll(".link"),
        node = svg.selectAll(".node");
    
     
    function tick(e) {
        node.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });
        text.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });

        node.attr('cx', function(d) { return d.x; })
            .attr('cy', function(d) { return d.y; })
            .on("dblclick", dblclick)
            .call(dragnode);
            
        link.attr('x1', function(d) { return d.source.x; })
            .attr('y1', function(d) { return d.source.y; })
            .attr('x2', function(d) { return d.target.x; })
            .attr('y2', function(d) { return d.target.y; });
    }

    var dragnode = force.drag()
    .on("dragstart", dragstart);

    function dblclick(d) {
        d3.select(this).classed("fixed", d.fixed = false);
      }
      
      function dragstart(d) {
        d3.select(this).classed("fixed", d.fixed = true);
      }

    // Toggle children on click.
    function Togglechildren(d) {
        if (!d3.event.defaultPrevented) {
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

      // Returns a list of all nodes under the root.
        function flatten(root) {
            //console.log("flatten(root):");
            var nodes = [], i = 0;
        
            //console.log(root);
            root.forEach(function recurse(node, index, array) {
                // console.log("node");
                // console.log(node);
            if (node.children)
                 node.children.forEach(recurse);
            if (!node.id)
                 node.id = ++i;
            nodes.push(node);
            });
        
         
            return nodes;
        }
  
        function color(d) {
            return d._children ? "#3182bd" : d.children ? "#c6dbef" : "#fd8d3c";
          }

          function update() {
            // console.log("update():");
            // console.log(root);
            var nodes = flatten(root),
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

                node.on("dblclick.zoom", function(d) { d3.event.stopPropagation();
                    var dcx = (window.innerWidth/2-d.x*zoom.scale());
                    var dcy = (window.innerHeight/2-d.y*zoom.scale());
                    zoom.translate([dcx,dcy]);
                     g.attr("transform", "translate("+ dcx + "," + dcy  + ")scale(" + zoom.scale() + ")");
                     
                     
                    });

            var tocolor = "fill";
            var towhite = "stroke";
            if (outline) {
                tocolor = "stroke"
                towhite = "fill"
            }

            var text = g.selectAll(".text")
            .data(graph.nodes)
            .enter().append("text")
            .attr("dy", ".35em")
            .style("font-size", nominal_text_size + "px")

            if (text_center)
                text.text(function(d) { return d.id; })
               .style("text-anchor", "middle");
            else 
               text.attr("dx", function(d) {return (size(d.size)||nominal_base_node_size);})
               .text(function(d) { return '\u2002'+d.id; });
           
            node.on("mouseover", function(d) {
               set_highlight(d);})
                .on("mousedown", function(d) {
                    d3.event.stopPropagation();
                    focus_node = d;
                    set_focus(d)
                    if (highlight_node === null) set_highlight(d)})
                .on("mouseout", function(d) {
                   exit_highlight();});
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

            function resize() {
                var width = window.innerWidth, height = window.innerHeight;
                svg.attr("width", width).attr("height", height);
                
                force.size([force.size()[0]+(width-w)/zoom.scale(),force.size()[1]+(height-h)/zoom.scale()]).resume();
                w = width;
                h = height;
                }

