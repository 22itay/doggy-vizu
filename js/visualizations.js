/**
 * Creates a function that goes in constant steps (auto-y etc)
 * @param {Number} step the step size
 * @param {Number} start the start of step
 */
function stepper(step, start = 0) {
    counter = start;
    return () => step * counter++;
}

/**
 * Builds the first visualization
 */
function buildParsets(categories) {
    // recreate chart
    let sorted = Array.from(categories).sort();
    chart2 = d3.parsets().dimensions(sorted).width(800);

    // remove old svg
    vis1.selectAll("svg").remove();
    let svg1 = vis1.append("svg")
        .attr("width", chart2.width())
        .attr("height", chart2.height());

    svg1.datum(loadedData["dogs"]).call(chart2);
}

/**
 * creates the Tests visualization.
 * @param {string} filterStr String used for filtering
 */
function visualizeTests(filterStr = "") {
    let getY = stepper(70);
    let data = loadedData["subtests_summed_scores"].filter(d => d.info.Description.includes(filterStr));
    let colorScale = d3.scale.category10();

    vis2.attr("height", data.length * 70);
    vis2.selectAll("g").remove();

    // Remove old elements
    let dataElem = vis2.selectAll("g")
        .data(data);

    // Adds labels
    // TODO: switch data source for "passed/not passed"
    // TODO: label toggle
    let labels = dataElem.enter()
        .append("g")
        .attr("height", 80)
        .attr("transform", () => "translate(0," + getY() + ")")
        .append("text")
        .attr("x", "0")
        .attr("y", "20")
        .text(function (d) {
            return `${d.info.Description}`
        });

    // Adds stacked bar charts
    // TODO: switch data representation for passed/not passed
    let stackedBars = dataElem.selectAll("g")
        .data((d, i) => {
            let sum = 0;
            return d.values.map(k => {
                k.info = d.info
                k.cumsum = sum;
                sum += k.values;
                return k;
            });
        }).enter()
        .append("rect")
        .attr("height", 30)
        .attr("width", (d, i, j) => { return wScale(d.values) + "%" })
        .attr("y", 30)
        .attr("x", (d, i, j) => { return wScale(d.cumsum) + "%" })
        .attr("fill", (d, i) => cScale(wScale(d.values)));

    // Add tooltip events
    stackedBars
        .on("mouseover", function (d) {
            tooltip
                .html(`Option: "${d.key}"<br>Votes: ${d.values} (${wScale(d.values).toFixed(3)}%)`)
                .style("visibility", "visible");
        })
        .on("mousemove", function () {
            tooltip
                .style("top", (event.pageY - 10) + "px")
                .style("left", (event.pageX + 10) + "px");
        })
        .on("mouseout", function () {
            tooltip.style("visibility", "hidden");
        });


    dataElem.exit()
        .remove();
}

/**
 * Creates the scale
 */
// TODO: support visualization switching.
function visualizeTestsScale() {
    let totalWidth = $("#vis-tests-legend").parent().width();
    let margin = 25;
    let scaleWidth = totalWidth - 2 * margin;

    let axisScale = d3.scale.linear()
        .domain([0, 100])
        .range([0, scaleWidth]);

    // create the gradient
    var defs = vis2_legend.append("defs");
    var gradient = defs.append("linearGradient")
        .attr("id", "gradient");
    gradient.selectAll("stop")
        .data(cScale.range())
        .enter().append("stop")
        .attr("offset", function (d, i) { return i / (cScale.range().length - 1); })
        .attr("stop-color", function (d) { return d; });

    // create the scale itself
    let scale = vis2_legend
        .attr("width", totalWidth)
        .append("g")
        .attr("transform", "translate(" + margin + ",0)")
        .attr("width", scaleWidth);
    scale.append("rect")
        .attr("height", "15")
        .attr("width", scaleWidth)
        .attr("fill", "url(#gradient)");
    scale
        .append("g")
        .attr("transform", "translate(0,20)")
        .attr("class", "axis")
        .call(d3.svg.axis()
            .scale(axisScale).ticks(5).tickFormat(d => d + "%"));
}

// visual elements definition
let vis1 = d3.select("#vis1");
let vis2 = d3.select("#vis-tests").append("svg").attr("class", "w-100");
let vis2_legend = d3.select("#vis-tests-legend").append("svg").attr("height", "40");

// event listeners
window.addEventListener("dogDataLoaded", function () {
    buildParsets(["Passed", "Breed & Color Code", "Gender"]);
});

window.addEventListener("testDataLoaded", function () {
    let maxValue = d3.max(loadedData["subtests_summed_scores"], d => d.values.reduce((sum, x) => sum + x.values, 0));
    wScale.domain([0, maxValue]);
    wScale.range([0, 100]);

    // call the visualizations
    visualizeTests();
    visualizeTestsScale();
});

/// TOOLTIP
let tooltip = d3.select("body")
    .append("div")
    .style("background", "rgba(255,255,255,1)")
    .style("border", "1px solid #000")
    .style("padding", "1rem")
    .style("position", "absolute")
    .style("z-index", "10")
    .style("visibility", "hidden")
    .text("a simple tooltip");

// Scales
let wScale = d3.scale.linear();
let cScale = d3.scale.linear()
    .domain([0, 50, 100])
    .range(["#2d0f41", "#a73b8f", "#f9cdac"])
    .interpolate(d3.interpolateHcl);