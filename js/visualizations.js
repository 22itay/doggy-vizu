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
    
    dogTable2 = {};
    var tamp=[],tPid=[],tAll=[];

    data.forEach(function (dogEntry) {
        tAll.push(+dogEntry.ID);
        if (dogTable[dogEntry.FatherID]){
            if (!dogTable2[dogEntry.FatherID])
                dogTable2[dogEntry.FatherID]=dogTable[dogEntry.FatherID];
            dogTable2[dogEntry.FatherID].children.push(dogEntry);
            //tamp.push(+dogEntry.ID)
        }else{
            if (!dogTable2[dogEntry.FatherID])
                dogTable2[dogEntry.FatherID]={
                    "ID":dogEntry.FatherID,
                    "children":[]
                };
            dogTable2[dogEntry.FatherID].children.push(dogEntry);
        }


        if (dogTable[dogEntry.MotherID]){
            if (!dogTable2[dogEntry.MotherID])
                dogTable2[dogEntry.MotherID]=dogTable[dogEntry.MotherID];
            dogTable2[dogEntry.MotherID].children.push(dogEntry);
            console.log(dogEntry.ID);
            tamp.push(+dogEntry.ID)
        }else{
            if (!dogTable2[dogEntry.MotherID])
                dogTable2[dogEntry.MotherID]={
                    "ID":dogEntry.MotherID,
                    "children":[]
                };
            dogTable2[dogEntry.MotherID].children.push(dogEntry);
        }
    });
    console.log("dogTable2");
    console.log(dogTable2);
    console.log(dogTable2.length);
    // loadedData["dogsT"]=data.filter(function (dogEntry) {
    //     return !tamp.includes(+dogEntry.ID);
    // });
    loadedData["dogsT"]=dogTable2;
    window.dispatchEvent(dogDataLoaded);
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

    loadedData["subtests"] = subtests;
    loadedData["subtest_results"] = subtests_results;
    loadedData["subtests_descs"] = subtests_descs;

    summarized = d3.nest()
        .key(function (d) { return d.SubTestKind; })
        .key(function (d) { return d.Score; })
        .rollup(function (v) { return v.length; })
        .entries(subtests_results)

    summarized.forEach(function (entry) {
        entry.info = subtests[entry.key];
    })

    loadedData["subtests_summed"] = summarized;

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

//// 
window.addEventListener("dogDataLoaded", function () {
    buildParsets(["Passed", "Breed & Color Code", "Gender"]);
});

window.addEventListener("testDataLoaded", function () {
    visualizeTests();
});

function yIncreaser(step) {
    counter = 0;
    return () => step * counter++;
}

let wScale = d3.scale.linear();
// wScale.domain([0, d3.max(loadedData["subtests_summed"], d => d.values.reduce((sum, x) => sum + x.values, 0))]);
wScale.range([0, 100]);

function visualizeTests(filterStr = "") {
    let getY = yIncreaser(70);
    let data = loadedData["subtests_summed"].filter(d => d.info.Description.includes(filterStr));
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
        .attr("fill", (d, i) => colorScale(i)).attr("dx", 0)

    dataElem.exit()
        .remove();

}