/**
 * Creates a function that goes in constant steps (auto-y etc)
 * @param {Number} step the step size
 * @param {Number} start the start of step
 */
function stepper(step, start = 0) {
    counter = 0;
    return () => start + step * counter++;
}

/**
 * Builds the first visualization
 */
function buildParsets(categories) {
    // recreate chart
    let width = visualWidth() * 9 / 12;
    let sorted = Array.from(categories).sort();
    chart2 = d3.parsets().dimensions(sorted).width(width);

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

function visualizeTests(opts) {
    // visual options
    let stepSize = opts.useLabels ? 70 : 30;
    let barsShift = opts.useLabels ? 30 : 0;
    let barsHeight = opts.useLabels ? 70 : 30;

    // TODO: more sophisticated filtering
    let data = [];
    switch (opts.display) {
        case "dist_disqualification":
            data = loadedData["summed_disqualifications"].filter(d => d.info.Description.includes(opts.filter));
            break;
        case "dist_cat":
        case "dist_percent":
        default:
            data = loadedData["subtests_summed_scores"].filter(d => d.info.Description.includes(opts.filter));;
            break;
    }
    let getY = stepper(stepSize);

    // preperations
    vis2.selectAll("g").remove();
    let dataElem = vis2.selectAll("g")
        .data(data);
    vis2.attr("height", data.length * barsHeight);

    let gs = dataElem.enter()
        .append("g")
        .attr("height", barsHeight)
        .attr("transform", () => "translate(0," + getY() + ")");

    // Adds labels
    if (opts.useLabels) {
        let labels = gs.append("text")
            .attr("x", "0")
            .attr("y", "20")
            .text(function (d) {
                return `${d.info.Description}`
            });

    }

    // Adds stacked bar charts
    let stackedBars = gs.selectAll("g")
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
        .attr("width", (d, i, j) => { return percentScale(d.values) + "%" })
        .attr("y", barsShift)
        .attr("x", (d, i, j) => { return percentScale(d.cumsum) + "%" });

    // color using the options
    switch (opts.display) {
        case "dist_cat":
            stackedBars
                .attr("fill", (d, i) => categorialColorScale(d.key));
            break;
        case "dist_percent":
            stackedBars
                .attr("fill", (d, i) => linearColorScale(percentScale(d.values)));
            break;
        case "dist_disqualification":
            stackedBars
                .attr("fill", (d, i) => { return trueFalseColorScale(d.key) });
            break;
    }

    // Add tooltip events
    stackedBars
        .on("mouseover", function (d) {
            tooltip
                .html(`${!opts.useLabels ? "Test: " + d.info.Description + "<br>" : ""}` +
                `Option: "${d.key}"<br>` +
                `Tests: ${d.values} (${percentScale(d.values).toFixed(2)}%)<br>` +
                `Culmulated: ${d.cumsum + d.values} (${percentScale(d.cumsum + d.values).toFixed(2)}%)`
                )
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

    // click event
    gs.on("click", function (e) {
        console.log(e)
    })

    dataElem.exit()
        .remove();
}

/**
 * Creates the scale
 */
// TODO: support visualization switching.
function visualizeTestsScale(opts) {
    let totalWidth = $("#vis-tests-legend").parent().width();
    let margin = 25;
    let scaleWidth = totalWidth - 2 * margin;

    // remove previous elements
    vis2_legend.attr("width", totalWidth).selectAll("*").remove();

    switch (opts.display) {
        case "dist_percent":
            // define the axis
            let axisScale = d3.scale.linear()
                .domain([0, 100])
                .range([0, scaleWidth]);

            // create the gradient
            let defs = vis2_legend.append("defs");
            let gradient = defs.append("linearGradient")
                .attr("id", "gradient");
            gradient.selectAll("stop")
                .data(linearColorScale.range())
                .enter().append("stop")
                .attr("offset", function (d, i) { return i / (linearColorScale.range().length - 1); })
                .attr("stop-color", function (d) { return d; });

            // create the scale itself
            scale = vis2_legend
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
            break;

        //
        case "dist_cat":
            getTranX = stepper(totalWidth / googleColorsScaleData.length, 0);
            scale = vis2_legend.selectAll("g")
                .data(googleColorsScaleData)
                .enter()
                .append("g")
                .attr("transform", (d) => `translate(${getTranX()},5)`)
            scale
                .append("rect")
                .attr("height", 12).attr("width", 12).attr("fill", d => d.color);
            scale
                .append("text").attr("y", 25)
                .attr("text-anchor", "middle")
                .attr("x", 5)
                .style("font-size", "12px")
                .text(d => d.i);
            break;

        //
        case "dist_disqualification":
            getTranX = stepper(totalWidth / 2, 0);
            scale = vis2_legend.selectAll("g")
                .data(Object.entries(tfScaleData))
                .enter()
                .append("g").attr("transform", (d) => `translate(${getTranX()},5)`);
            scale.append("rect").attr("height", 15).attr("width", 15).attr("fill", (d) => d[1]);
            scale.append("text").attr("y", 12).attr("x", 20).text((d) => d[0]);
            break;
    }
}


// visual elements definition
let vis1 = d3.select("#vis1");
let vis2 = d3.select("#vis-tests").append("svg").attr("class", "w-100");
let vis2_legend = d3.select("#vis-tests-legend").append("svg").attr("height", "40");
let visualWidth = () => $(".custom-tabs").innerWidth() - 6 * 12;

// event listeners
window.addEventListener("testDataLoaded", function () {
    let maxValue = d3.max(loadedData["subtests_summed_scores"], d => d.values.reduce((sum, x) => sum + x.values, 0));
    percentScale.domain([0, maxValue]);
    percentScale.range([0, 100]);
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
let percentScale = d3.scale.linear();
let linearColorScale = d3.scale.linear()
    .domain([0, 50, 100])
    .range(["#2d0f41", "#a73b8f", "#f9cdac"])
    .interpolate(d3.interpolateHcl);

// google scale code taken from:
let colores_g = ["#3366cc", "#dc3912", "#ff9900", "#109618", "#990099", "#0099c6", "#dd4477", "#66aa00", "#b82e2e", "#316395", "#994499"];
let googleColorsScaleData = colores_g.map((color, i, gc) => { return { i: i, color: color }; });
let categorialColorScale = function (n) {
    return colores_g[n % colores_g.length];
}

let tfScaleData = { "true": "#3366cc", "false": "#dc3912" };
let trueFalseColorScale = d3.scale.ordinal().domain(Object.keys(tfScaleData)).range(Object.values(tfScaleData));