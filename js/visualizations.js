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
    let comma = d3.format(",f");
    let percent = d3.format("%");
    let width = visualWidth() * 9 / 12;
    let sorted = Array.from(categories).sort();
    chart2 = d3.parsets()
        .dimensions(sorted)
        .width(width)
        .tooltip(function defaultTooltip(d) {
            var count = d.count,
                path = [];
            while (d.parent) {
                console.log(d);
                if (d.name) path.unshift("<strong>" + d.dimension + "</strong>: " + d.name);
                d = d.parent;
            }
            return path.join(" → ") + "<br>" + comma(count) + " entries (" + percent(count / d.count) + ")";
        });

    // remove old svg
    parsetsVis.selectAll("svg").remove();
    let svg1 = parsetsVis.append("svg")
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
    let stepSize = 35;
    let barsShift = opts.useLabels ? 30 : 0;
    let barsHeight = stepSize;

    // update percentScale
    let maxValue = d3.max(loadedData["subtests_summed_scores"], d => d.values.reduce((sum, x) => sum + x.values, 0));
    percentScale.domain([0, maxValue]);
    percentScale.range([0, 100]);

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
    testsVis.selectAll("g").remove();
    let dataElem = testsVis.selectAll("g")
        .data(data);
    testsVis.attr("height", data.length * barsHeight);

    let gs = dataElem.enter()
        .append("g")
        .attr("height", barsHeight)
        .attr("transform", () => "translate(0," + getY() + ")");

    // Adds labels
    if (opts.useLabels) {
        let labels = gs.append("text")
            .attr("x", "100%")
            .attr("text-anchor", "end")
            .attr("y", "20")
            .text(function (d) {
                return `${d.info.Description}`
            });
    }

    // Adds stacked bar charts
    let stackedBars = gs
        .append("svg")
        .attr("width", opts.useLabels ? "65%" : "100%")
        .selectAll("g")
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
        .attr("width", (d, i, j) => { return globalPercentScale(d.values) + "%" })
        .attr("y", 0)
        .attr("x", (d, i, j) => { return globalPercentScale(d.cumsum) + "%" });

    // color using the options
    switch (opts.display) {
        case "dist_cat":
            stackedBars
                .attr("fill", (d, i) => categorialColorScale(d.key));
            break;
        case "dist_percent":
            stackedBars
                .attr("fill", (d, i) => testsColorScale(percentScale(d.values)));
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

    dataElem.exit()
        .remove();
}

/**
 * Creates the scale for the tests view
 */
function visualizeTestsScale(opts) {
    let totalWidth = $("#vis-tests-legend").parent().width();
    let margin = 25;
    let scaleWidth = totalWidth - 2 * margin;

    // remove previous elements
    testsVisLegend.attr("width", totalWidth).selectAll("*").remove();

    switch (opts.display) {
        case "dist_percent":
            // define the axis
            let axisScale = d3.scale.linear()
                .domain([0, 100])
                .range([0, scaleWidth]);

            // create the gradient
            let defs = testsVisLegend.append("defs");
            let gradient = defs.append("linearGradient")
                .attr("id", "gradient");
            gradient.selectAll("stop")
                .data(testsColorScale.range())
                .enter().append("stop")
                .attr("offset", function (d, i) { return i / (testsColorScale.range().length - 1); })
                .attr("stop-color", function (d) { return d; });

            // create the scale itself
            scale = testsVisLegend
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
            scale = testsVisLegend.selectAll("g")
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
            scale = testsVisLegend.selectAll("g")
                .data(Object.entries(tfScaleData))
                .enter()
                .append("g").attr("transform", (d) => `translate(${getTranX()},5)`);
            scale.append("rect").attr("height", 15).attr("width", 15).attr("fill", (d) => d[1]);
            scale.append("text").attr("y", 12).attr("x", 20).text((d) => d[0]);
            break;
    }
}

function visualizeTreeScale(display) {
    // totally not a copy-paste from the other function
    let totalWidth = $("#legend-famtree").parent().width();
    let margin = 25;
    let scaleWidth = totalWidth - 2 * margin;

    // remove previous elements
    famtreeVisLegend.attr("width", totalWidth).selectAll("*").remove();

    switch (display) {
        case "heatmap":
            let axisScale = d3.scale.linear()
                .domain([0, 100])
                .range([0, scaleWidth]);

            // create the gradient
            let defs = famtreeVisLegend.append("defs");
            let gradient = defs.append("linearGradient")
                .attr("id", "gradient-fam");
            gradient.selectAll("stop")
                .data(testsColorScale.range())
                .enter().append("stop")
                .attr("offset", function (d, i) { return i / (testsColorScale.range().length - 1); })
                .attr("stop-color", function (d) { return d; });

            // create the scale itself
            scale = famtreeVisLegend
                .append("g")
                .attr("transform", "translate(" + margin + ",0)")
                .attr("width", scaleWidth);
            scale.append("rect")
                .attr("height", "15")
                .attr("width", scaleWidth)
                .attr("fill", "url(#gradient-fam)");
            scale
                .append("g")
                .attr("transform", "translate(0,20)")
                .attr("class", "axis")
                .call(d3.svg.axis()
                    .scale(axisScale).ticks(5).tickFormat(d => d + "%"));
            break;

        // this display is divided to two rows
        case "breed":
            getTranX = stepper(totalWidth / 4, 0);
            lastX = 0;
            scale = famtreeVisLegend.selectAll("svg")
                .data(Object.entries(breedScale))
                .enter()
                .append("svg")
                .attr("x", function (d, i) {
                    if (i % 2 === 0)
                        lastX = getTranX();
                    return lastX;
                })
                .attr("y", (d, i) => i % 2 ? 20 : 0);

            scale.append("rect")
                .attr("height", 10)
                .attr("width", 10)
                .attr("fill", (d) => d[1]);
            scale.append("text")
                .attr("y", 10)
                .attr("x", 12)
                .style("font-size", 12)
                .text((d) => d[0] === "" ? "?" : d[0]);
            break;

        case "passed":
            getTranX = stepper(totalWidth / 2, 0);
            scale = famtreeVisLegend.selectAll("g")
                .data(Object.entries(tfScaleData))
                .enter()
                .append("g").attr("transform", (d) => `translate(${getTranX()},5)`);
            scale.append("rect")
                .attr("height", 15)
                .attr("width", 15)
                .attr("fill", (d) => d[1]);
            scale.append("text")
                .attr("y", 12)
                .attr("x", 20)
                .text((d) => d[0] === "true" ? "Passed" : "Not Passed");
            break;
    }
}

// visual elements definition
let parsetsVis = d3.select("#vis1");
let testsVis = d3.select("#vis-tests").append("svg").attr("class", "w-100");
let testsVisLegend = d3.select("#vis-tests-legend").append("svg").attr("height", "40");
let famtreeVisLegend = d3.select("#legend-famtree").append("svg").attr("height", "40");
let visualWidth = () => $(".custom-tabs").innerWidth() - 6 * 12;

// event listeners
window.addEventListener("testDataLoaded", function () {
    let maxValue = d3.max(loadedData["subtests_summed_scores"], d => d.values.reduce((sum, x) => sum + x.values, 0));
    globalPercentScale.domain([0, maxValue]);
    globalPercentScale.range([0, 100]);
});

/// TOOLTIP
let tooltip = d3.select("body")
    .append("div")
    .style("background", "#fff")
    .style("border", "1px solid #000")
    .style("padding", "1rem")
    .style("position", "absolute")
    .style("z-index", "10")
    .style("visibility", "hidden")
    .text("a simple tooltip");

// Scales
let percentScale = d3.scale.linear();
let globalPercentScale = d3.scale.linear();
let testsColorScale = d3.scale.linear()
    .domain([0, 50, 100])
    .range(["#f9cdac", "#a73b8f", "#2d0f41"])
    .interpolate(d3.interpolateHcl);

// google scale code taken from:
let colores_g = ["#3366cc", "#dc3912", "#ff9900", "#109618", "#990099", "#0099c6", "#dd4477", "#66aa00", "#b82e2e", "#316395", "#994499"];
let googleColorsScaleData = colores_g.map((color, i, gc) => { return { i: i, color: color }; });
let categorialColorScale = function (n) {
    return colores_g[n % colores_g.length];
}

// tfscale
let tfScaleData = { "true": "#3366cc", "false": "#dc3912" };
var trueFalseColorScale = d3.scale.ordinal()
    .domain(Object.keys(tfScaleData))
    .range(Object.values(tfScaleData));

// heatmap scale
let heatmapScale;

// breedscale
let breedScale = {
    "": "#1f77b4",
    "BLB": "#ff7f0e",
    "BLB*GRT": "#2ca02c",
    "GRT": "#d62728",
    "GSD": "#9467bd",
    "LAB": "#8c564b",
    "LAB*GRT": "#e377c2",
    "OTHER": "#7f7f7f"
};
var breedColorScale = d3.scale.ordinal()
    .domain(Object.keys(breedScale))
    .range(Object.values(breedScale));

var plasmaScale = (s) => testsColorScale(s / 256 * 100);
var plasma100Scale = (s) => plasmaScale(s / 100 * 256);