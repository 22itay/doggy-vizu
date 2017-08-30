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

function visualizeTests(tests, results, summed) {
    let counter = 0;
    let getY = () => 45 * counter++;

    summed.forEach(d => console.log(d.values))

    let allGs = vis2.selectAll("g")
        .data(summed)
        .enter()
        .append("g")
        /*.attr("transform", () => "translate(0," + getY() + ")")
        allGs.append("rect")
            .attr("height", "40px")
            .attr("width", "40px")
            .attr("fill", "blue");
        allGs.append("text")
            .attr("x", "50")
            .attr("y", "20")*/
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

    console.log(Object.keys(data[0]));
    vis1.datum(data).call(chart);

}

function analyzeTests(error, subtests_descs, subtests_results) {
    console.log(subtests_results);

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

    summarized = d3.nest()
        .key(function (d) { return d.SubTestKind; })
        .key(function (d) { return d.Score; })
        .rollup(function (v) { return v.length; })
        .entries(subtests_results);

    visualizeTests(subtests, subtests_results, summarized);
}

statuses = ["guiding"];

chart = d3.parsets()
    .dimensions(["Passed", "Breed & Color Code", "Gender"]);

vis1 = d3.select("#vis1")
    .append("svg")
    .attr("width", chart.width())
    .attr("height", chart.height());

vis2 = d3.select("#vis2")
    .append("svg")
    .attr("width", chart.width())
    .attr("height", chart.height())
    .call(d3.behavior.zoom()
        .on("zoom", function () {
            let translate = d3.event.translate;
            translate[0] = 0;
            console.log(translate);
            vis2.attr("transform", "translate(" + translate + ") scale(" + d3.event.scale + ")")
        }))
    .append("g");;