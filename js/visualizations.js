if (!window.d3) {
    window.d3 = require("d3");
    require("d3-queue");
}

function toDate(dateStr, delimeter = '/') {
    const [day, month, year] = dateStr.split(delimeter);
    return new Date(+year, +month - 1, +day, 0, 0, 0, 0);
}

// load data
d3.queue()
    .defer(d3.csv, "/data/dogs.csv")
    .await(analyzeDogs);
d3.queue()
    .defer(d3.csv, "/data/subtest-desc.csv")
    .defer(d3.csv, "/data/subtests.csv")
    .await(analyzeTests);

var loadedData = {};

function visualizeTests(tests, results, summed) {
    let counter = 0;
    let getY = () => 45 * counter++;

    let allGs = vis2.selectAll("g")
        .data(summed)
        .enter()
        .append("g")
        .attr("transform", () => "translate(0," + getY() + ")")
    allGs.append("rect")
        .attr("height", "40px")
        .attr("width", "40px")
        .attr("fill", "blue");
    allGs.append("text")
        .attr("x", "50")
        .attr("y", "20")
        .text(function (d) {
            return `${d.key}: ${Object.keys(d.values)}`
        });
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
        dogTable[dogEntry.ID] = dogEntry;
    });

    loadedData["dogs"] = data;

    buildParsets(["Passed", "Breed & Color Code", "Gender"]);
}

function analyzeTests(error, subtests_descs, subtests_results) {
    subtests_results.forEach(function (resultEntry) {
        resultEntry.SubTestID = +resultEntry.SubTestID;
        resultEntry.TestID = +resultEntry.TestID;
        resultEntry.SubTestKind = +resultEntry.SubTestKind;
        resultEntry.Score = +resultEntry.Score;
        resultEntry.Revoked = +resultEntry.Revoked === 1;
    });

    subtests = {}
    subtests_descs.forEach(function (testEntry) {
        testEntry.ID = +testEntry.ID;
        testEntry.ColumnID = +testEntry.ColumnID;
        subtests[testEntry.ID] = testEntry;
    });

    loadedData["subtest_results"] = subtests_results;
    loadedData["subtests_descs"] = subtests_descs;

    summarized = d3.nest()
        .key(function (d) { return d.SubTestKind; })
        .key(function (d) { return d.Score; })
        .rollup(function (v) { return v.length; })
        .entries(subtests_results);

    loadedData["subtests_summed"] = summarized;

    visualizeTests(subtests, subtests_results, summarized);
}

function buildParsets(categories) {
    // recreate chart
    let sorted = Array.from(categories).sort();
    chart2 = d3.parsets().dimensions(sorted);

    // remove old svg
    vis1.selectAll("svg").remove();
    let svg1 = vis1.append("svg")
        .attr("width", chart2.width())
        .attr("height", chart2.height());

    svg1.datum(loadedData["dogs"]).call(chart2);
}

/////

statuses = ["guiding"];

vis1 = d3.select("#vis1");

vis2 = d3.select("#vis2")
    .append("svg")
    .attr("width", chart.width())
    .attr("height", chart.height())
    .call(d3.behavior.zoom()
        .on("zoom", function () {
            let translate = d3.event.translate;
            translate[0] = 0;
            vis2.attr("transform", "translate(" + translate + ") scale(" + d3.event.scale + ")")
        }))
    .append("g");;