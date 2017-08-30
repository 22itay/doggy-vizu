if (!window.d3) {
    window.d3 = require("d3");
    require("d3-queue");
}

var width=740, height=500;

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


    // create empty nodes array
    var nodes = {};

    // compute nodes from links data
    linksdata.forEach(function(link) {
        link.source = nodes[link.source] ||
            (nodes[link.source] = {name: link.source});
        link.target = nodes[link.target] ||
            (nodes[link.target] = {name: link.target});        
    });

    var force =d3.layout.force()
    .size([width, height]) //specified earlier
    .nodes(d3.values(nodes)) //add nodes
    .links(linksdata) //add links
    .on("tick", tick) //what to do
    .linkDistance(35) //set for proper svg size
    .charge(-400)
    .start(); 

    var svg=d3.select("#vis3").append('svg')
    .attr('width', width)
    .attr('height', height);
    
           // add the links
    var link = svg.selectAll('.link')
        .data(linksdata)
        .enter().append('line')
        .attr('class', 'link'); 

        // add the nodes
    var node = svg.selectAll('.node')
        .data(force.nodes()) //add
        .enter().append('circle')
        .attr('class', 'node')
        .attr('r', width * 0.01)
        .call(dragnode); //radius of circle


    function tick(e) {
        
        node.attr('cx', function(d) { return d.x; })
            .attr('cy', function(d) { return d.y; })
            .on("dblclick", dblclick);
            //.call(force.drag);
            
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

