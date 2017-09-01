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

    // click event
    gs.on("click", function (e) {
        console.log(e)
    })

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
                .data(plasmaScale.range())
                .enter().append("stop")
                .attr("offset", function (d, i) { return i / (plasmaScale.range().length - 1); })
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
    .style("background", "rgba(255,255,255,1)")
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

var plasmaScale = d3.scale.linear()
    .domain(new Array(256).fill().map((d, i) => i / 256 * 100))
    .range(["#0d0887", "#100788", "#130789", "#16078a", "#19068c", "#1b068d", "#1d068e", "#20068f", "#220690", "#240691", "#260591", "#280592", "#2a0593", "#2c0594", "#2e0595", "#2f0596", "#310597", "#330597", "#350498", "#370499", "#38049a", "#3a049a", "#3c049b", "#3e049c", "#3f049c", "#41049d", "#43039e", "#44039e", "#46039f", "#48039f", "#4903a0", "#4b03a1", "#4c02a1", "#4e02a2", "#5002a2", "#5102a3", "#5302a3", "#5502a4", "#5601a4", "#5801a4", "#5901a5", "#5b01a5", "#5c01a6", "#5e01a6", "#6001a6", "#6100a7", "#6300a7", "#6400a7", "#6600a7", "#6700a8", "#6900a8", "#6a00a8", "#6c00a8", "#6e00a8", "#6f00a8", "#7100a8", "#7201a8", "#7401a8", "#7501a8", "#7701a8", "#7801a8", "#7a02a8", "#7b02a8", "#7d03a8", "#7e03a8", "#8004a8", "#8104a7", "#8305a7", "#8405a7", "#8606a6", "#8707a6", "#8808a6", "#8a09a5", "#8b0aa5", "#8d0ba5", "#8e0ca4", "#8f0da4", "#910ea3", "#920fa3", "#9410a2", "#9511a1", "#9613a1", "#9814a0", "#99159f", "#9a169f", "#9c179e", "#9d189d", "#9e199d", "#a01a9c", "#a11b9b", "#a21d9a", "#a31e9a", "#a51f99", "#a62098", "#a72197", "#a82296", "#aa2395", "#ab2494", "#ac2694", "#ad2793", "#ae2892", "#b02991", "#b12a90", "#b22b8f", "#b32c8e", "#b42e8d", "#b52f8c", "#b6308b", "#b7318a", "#b83289", "#ba3388", "#bb3488", "#bc3587", "#bd3786", "#be3885", "#bf3984", "#c03a83", "#c13b82", "#c23c81", "#c33d80", "#c43e7f", "#c5407e", "#c6417d", "#c7427c", "#c8437b", "#c9447a", "#ca457a", "#cb4679", "#cc4778", "#cc4977", "#cd4a76", "#ce4b75", "#cf4c74", "#d04d73", "#d14e72", "#d24f71", "#d35171", "#d45270", "#d5536f", "#d5546e", "#d6556d", "#d7566c", "#d8576b", "#d9586a", "#da5a6a", "#da5b69", "#db5c68", "#dc5d67", "#dd5e66", "#de5f65", "#de6164", "#df6263", "#e06363", "#e16462", "#e26561", "#e26660", "#e3685f", "#e4695e", "#e56a5d", "#e56b5d", "#e66c5c", "#e76e5b", "#e76f5a", "#e87059", "#e97158", "#e97257", "#ea7457", "#eb7556", "#eb7655", "#ec7754", "#ed7953", "#ed7a52", "#ee7b51", "#ef7c51", "#ef7e50", "#f07f4f", "#f0804e", "#f1814d", "#f1834c", "#f2844b", "#f3854b", "#f3874a", "#f48849", "#f48948", "#f58b47", "#f58c46", "#f68d45", "#f68f44", "#f79044", "#f79143", "#f79342", "#f89441", "#f89540", "#f9973f", "#f9983e", "#f99a3e", "#fa9b3d", "#fa9c3c", "#fa9e3b", "#fb9f3a", "#fba139", "#fba238", "#fca338", "#fca537", "#fca636", "#fca835", "#fca934", "#fdab33", "#fdac33", "#fdae32", "#fdaf31", "#fdb130", "#fdb22f", "#fdb42f", "#fdb52e", "#feb72d", "#feb82c", "#feba2c", "#febb2b", "#febd2a", "#febe2a", "#fec029", "#fdc229", "#fdc328", "#fdc527", "#fdc627", "#fdc827", "#fdca26", "#fdcb26", "#fccd25", "#fcce25", "#fcd025", "#fcd225", "#fbd324", "#fbd524", "#fbd724", "#fad824", "#fada24", "#f9dc24", "#f9dd25", "#f8df25", "#f8e125", "#f7e225", "#f7e425", "#f6e626", "#f6e826", "#f5e926", "#f5eb27", "#f4ed27", "#f3ee27", "#f3f027", "#f2f227", "#f1f426", "#f1f525", "#f0f724", "#f0f921"]
        .reverse())
var plasma100Scale = (s) => plasmaScale(s / 100 * 256);