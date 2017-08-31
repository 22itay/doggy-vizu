if (!window.d3) {
    window.d3 = require("d3");
    require("d3-queue");
}


function toDate(dateStr, delimeter = '/') {
    const [day, month, year] = dateStr.split(delimeter);
    return new Date(+year, +month - 1, +day, 0, 0, 0, 0);
}

function analyzeDogs(err, data) {
    dogTable = {};

    data.forEach(function (dogEntry) {
        dogEntry.ID = +dogEntry.ID;
        dogEntry.FatherID = +dogEntry.FatherID;
        dogEntry.MotherID = +dogEntry.MotherID;
        dogEntry["Age at Training"] = +dogEntry["Age at Training"];
        dogEntry.Birthday = toDate(dogEntry.Birthday);
        dogEntry.Passed = statuses.indexOf(dogEntry.Status) !== -1;
        dogEntry.children = [];
        dogTable[dogEntry.ID] = dogEntry;
    });
    loadedData["dogs"] = data;

    var tamp = [];
    data.forEach(function (dogEntry) {
        if (dogTable[dogEntry.FatherID]) {
            dogTable[dogEntry.FatherID].children.push(dogEntry);
            tamp.push(+dogEntry.ID)
        }

        if (dogTable[dogEntry.MotherID]) {
            dogTable[dogEntry.MotherID].children.push(dogEntry);
            console.log(dogEntry.ID);
            tamp.push(+dogEntry.ID)
        }
    });

    loadedData["dogsT"] = data.filter(function (dogEntry) {
        return !tamp.includes(+dogEntry.ID);
    });

    window.dispatchEvent(dogDataLoaded);
}

function analyzeTests(error, subtests_descs, subtests_results) {
    subtests_results.forEach(function (resultEntry) {
        resultEntry.SubTestID = +resultEntry.SubTestID;
        resultEntry.TestID = +resultEntry.TestID;
        resultEntry.SubTestKind = +resultEntry.SubTestKind;
        resultEntry.Score = +resultEntry.Score;
        resultEntry.Disqualified = +resultEntry.Disqualified === 1;
    });

    subtests = {}
    subtests_descs.forEach(function (testEntry) {
        testEntry.ID = +testEntry.ID;
        testEntry.ColumnID = +testEntry.ColumnID;
        subtests[testEntry.ID] = testEntry;
    });

    loadedData["subtests"] = subtests;
    loadedData["subtest_results"] = subtests_results;
    loadedData["subtests_descs"] = subtests_descs;

    summed_scores = d3.nest()
        .key(d => d.SubTestKind)
        .key(d => d.Score)
        .rollup(v => v.length)
        .entries(subtests_results);

    summed_disqualifications = d3.nest()
        .key(d => d.SubTestKind)
        .key(d => d.Disqualified)
        .rollup(v => v.length)
        .entries(subtests_results);

    console.log(summed_disqualifications);

    summed_scores.forEach(function (entry) {
        entry.info = subtests[entry.key];
        console.log(entry.info);
        console.log(entry.values)
    })

    loadedData["subtests_summed_scores"] = summed_scores;

    window.dispatchEvent(testDataLoaded);
}

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

/////

let statuses = ["guiding"];
var loadedData = {};
let dogDataLoaded = new Event("dogDataLoaded");
let testDataLoaded = new Event("testDataLoaded");

// data loading queue
d3.queue()
    .defer(d3.csv, "/data/dogs.csv")
    .await(analyzeDogs);
d3.queue()
    .defer(d3.csv, "/data/subtest-desc.csv")
    .defer(d3.csv, "/data/subtests.csv")
    .await(analyzeTests);

// visual elements definition
vis1 = d3.select("#vis1");
vis2 = d3.select("#vis-tests").append("svg").attr("class", "w-100");
vis2_legend = d3.select("#vis-tests-legend").append("svg").attr("width", "600").attr("height", "40");

//// 
window.addEventListener("dogDataLoaded", function () {
    buildParsets(["Passed", "Breed & Color Code", "Gender"]);
});

window.addEventListener("testDataLoaded", function () {
    let maxValue = d3.max(loadedData["subtests_summed_scores"], d => d.values.reduce((sum, x) => sum + x.values, 0));
    wScale.domain([0, maxValue]);
    wScale.range([0, 100]);

    visualizeTests();
    visualizeTestsScale();
});

function yIncreaser(step) {
    counter = 0;
    return () => step * counter++;
}


/// TOOLTIP
var tooltip = d3.select("body")
    .append("div")
    .style("background", "rgba(255,255,255,1)")
    .style("border", "1px solid #000")
    .style("padding", "1rem")
    .style("position", "absolute")
    .style("z-index", "10")
    .style("visibility", "hidden")
    .text("a simple tooltip");

let wScale = d3.scale.linear();
let cScale = d3.scale.linear()
    .domain([0, 100])
    .range(["#FFFFDD", "#3E9583", "#1F2D86"].reverse())
    .interpolate(d3.interpolateHcl);

function visualizeTests(filterStr = "") {
    let getY = yIncreaser(70);
    let data = loadedData["subtests_summed_scores"].filter(d => d.info.Description.includes(filterStr));
    let colorScale = d3.scale.category10();

    vis2.attr("height", data.length * 70);
    vis2.selectAll("g").remove();

    let dataElem = vis2.selectAll("g")
        .data(data);

    dataElem.enter()
        .append("g")
        .attr("height", 80)
        .attr("transform", () => "translate(0," + getY() + ")")
        .append("text")
        .attr("x", "0")
        .attr("y", "20")
        .text(function (d) {
            return `${d.info.Description}`
        });

    dataElem.selectAll("g")
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
        .attr("fill", (d, i) => cScale(wScale(d.values)))
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

function visualizeTestsScale() {
    let axisScale = d3.scale.linear()
        .domain([0, 100])
        .range([0, 500]);

    // create the gradient
    var defs = vis2_legend.append("defs");
    var gradient = defs.append("linearGradient")
        .attr("id", "gradient");

    //Append multiple color stops by using D3's data/enter step
    gradient.selectAll("stop")
        .data(cScale.range())
        .enter().append("stop")
        .attr("offset", function (d, i) { return i / (cScale.range().length - 1); })
        .attr("stop-color", function (d) { return d; });

    // create the scale itself
    let scale = vis2_legend
        .append("g")
        .attr("transform", "translate(50,0)")
        .attr("width", 500);
    scale.append("rect")
        .attr("height", "15")
        .attr("width", "500")
        .attr("fill", "url(#gradient)");
    scale
        .append("g")
        .attr("transform", "translate(0,20)")
        .attr("class", "axis")
        .call(d3.svg.axis()
            .scale(axisScale).tickFormat(d => d + "%"));
}