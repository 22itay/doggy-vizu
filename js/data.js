
function toDate(dateStr, delimeter = '/') {
    const [day, month, year] = dateStr.split(delimeter);
    return new Date(+year, +month - 1, +day, 0, 0, 0, 0);
}

function analyzeDogs(err, data) {
    dogs = {};

    data.forEach(function (dogEntry) {
        dogEntry.ID = +dogEntry.ID;
        dogEntry.FatherID = +dogEntry.FatherID;
        dogEntry.MotherID = +dogEntry.MotherID;
        dogEntry["Age at Training"] = +dogEntry["Age at Training"];
        dogEntry.Birthday = toDate(dogEntry.Birthday);
        dogEntry.Passed = statuses.indexOf(dogEntry.Status) !== -1;
        dogEntry.children = [];
        dogEntry._children = [];
        dogEntry.x = 5;
        dogs[dogEntry.ID] = dogEntry;
    });
    loadedData["dogs"] = data;
    loadedData["dogsTable"] = dogs;

    dogTree = {};
    data.forEach(function (dogEntry) {
        let father_id = dogEntry.FatherID;
        let mother_id = dogEntry.MotherID;
        let father = dogs[father_id] || { "ID": father_id, "children": [] };
        let mother = dogs[mother_id] || { "ID": mother_id, "children": [] };

        if (!dogTree[father_id])
            dogTree[father_id] = father;

        if (!dogTree[mother_id]) {
            dogTree[mother_id] = mother;
        }

        dogTree[father_id].children.push(dogEntry);
        dogTree[mother_id].children.push(dogEntry);
    });
    console.log(dogTree);
    console.log("------")
    loadedData["dogsT"] = dogTree;
    window.dispatchEvent(dogDataLoaded);
}

function analyzeTests(error, tests, subtests_descs, subtests_results) {
    testsTable = {}
    tests.forEach(function (testEntry) {
        testEntry.TestID = +testEntry.TestID;
        testEntry.DogID = +testEntry.DogID;
        testsTable[testEntry.TestID] = testEntry;
    });

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

    loadedData["tests"] = testsTable;
    loadedData["subtests"] = subtests;
    loadedData["subtest_results"] = subtests_results;
    loadedData["subtests_descs"] = subtests_descs;

    filterSummarizeData([]);

    window.dispatchEvent(testDataLoaded);
    window.dataLoaded = true;
}

// filter definition: {key: "dogProperty", values=["val1","val2",...]};
// if value list is empty, the filter will decline everything.
// assumes property exists on the dog object.
function filterSummarizeData(filters) {
    let filteredTests = filterTestsByParticipants(filters);

    let summed_scores = d3.nest()
        .key(d => d.SubTestKind)
        .key(d => d.Score)
        .rollup(v => v.length)
        .entries(filteredTests);

    let summed_disqualifications = d3.nest()
        .key(d => d.SubTestKind)
        .key(d => d.Disqualified)
        .rollup(v => v.length)
        .entries(filteredTests);

    summed_scores.forEach(function (entry) {
        entry.info = loadedData["subtests"][entry.key];
    })
    summed_disqualifications.forEach(function (entry) {
        entry.info = loadedData["subtests"][entry.key];
    })

    loadedData["subtests_summed_scores"] = summed_scores;
    loadedData["summed_disqualifications"] = summed_disqualifications;
}

function filterTestsByParticipants(filters) {
    return loadedData["subtest_results"].filter(function (entry) {
        // get the dog entry
        let dog = loadedData["dogsTable"][loadedData["tests"][entry.TestID].DogID];

        // run through the filters
        return filters.reduce(function (result, filter) {
            return result && filter.values.indexOf(dog[filter.key]) != -1;
        }, true);
    });
}

let statuses = ["guiding"];
var loadedData = {};
window.dataLoaded = false;
let dogDataLoaded = new Event("dogDataLoaded");
let testDataLoaded = new Event("testDataLoaded");

// data loading queue
d3.queue()
    .defer(d3.csv, "/data/dogs.csv")
    .await(analyzeDogs);
d3.queue()
    .defer(d3.csv, "/data/tests.csv")
    .defer(d3.csv, "/data/subtest-desc.csv")
    .defer(d3.csv, "/data/subtests.csv")
    .await(analyzeTests);