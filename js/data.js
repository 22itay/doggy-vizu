
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
        dogs[dogEntry.ID] = dogEntry;
    });

    loadedData["dogBreeds"] = Array.from(new Set(data.map(d => d["Breed & Color Code"]))).sort();
    loadedData["dogs"] = data;
    loadedData["dogsTable"] = dogs;

    graph = {
        "graph": [],
        "links": [],
        "nodes": [],
        "directed": false,
        "multigraph": false
    };
    let indexInNodes = {}; // associative array.

    function insertDogToGraph(dog) {
        let index = graph.nodes.push(dog) - 1; // index of dog
        indexInNodes[dog.id] = index;
        return index;
    }

    function formatDogName(dname, did) {
        if (dname === "" || !dname)
            return "[" + did + "]";
        else
            return dname;
    }

    data.forEach(function (dogEntry) {
        insertDogToGraph({
            "id": dogEntry.ID || 0,
            "gender": dogEntry.Gender,
            "breed": dogEntry["Breed & Color Code"],
            "passed": dogEntry.Passed,
            "type": "circle",
            "size": 80,
            "color": 7,
            "score": 0,
            "totalChildren": -1,
            "totalPassed": 0,
            "name": formatDogName(dogEntry["Name (English)"], dogEntry.ID),
            "orphans": (dogEntry.FatherID || 0 + dogEntry.MotherID || 0)==0?true:false
        });
    });

    data.forEach(function (dogEntry) {
        let father_id = dogEntry.FatherID || 0;
        let mother_id = dogEntry.MotherID || 0;

        if (father_id != 0) {
            if (!indexInNodes[father_id]) {
                insertDogToGraph({
                    "id": father_id,
                    "type": "square",
                    "gender": "Male",
                    "passed": true,
                    "size": 60,
                    "color": 2,
                    "totalChildren": 1,
                    "totalPassed": 0,
                    "name": formatDogName("", father_id)
                });
            } else {
                graph.nodes[indexInNodes[father_id]].type = "square";
                graph.nodes[indexInNodes[father_id]].totalChildren++;
            }
            if (dogEntry.Passed) {
                graph.nodes[indexInNodes[father_id]].totalPassed++;
            }
            graph.links.push({ "source": indexInNodes[father_id], "target": indexInNodes[dogEntry.ID], "ty": "father" })
        }
        if (mother_id != 0) {
            if (!indexInNodes[mother_id]) {
                insertDogToGraph({
                    "id": mother_id,
                    "type": "diamond",
                    "gender": "Female",
                    "passed": true,
                    "size": 60,
                    "color": 4,
                    "totalChildren": 1,
                    "totalPassed": 0,
                    "name": formatDogName("", mother_id)
                });
            } else {
                graph.nodes[indexInNodes[mother_id]].type = "diamond";
                graph.nodes[indexInNodes[mother_id]].totalChildren++;
            }
            if (dogEntry.Passed) {
                graph.nodes[indexInNodes[mother_id]].totalPassed++;
            }
            graph.links.push({ "source": indexInNodes[mother_id], "target": indexInNodes[dogEntry.ID], "ty": "mother" })
        }
    });

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
        resultEntry.Disqualified = !(+resultEntry.Disqualified === 1);
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
        entry.values = entry.values.sort((a, b) => a.key < b.key);
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
    .defer(d3.csv, "./data/dogs.csv")
    .await(analyzeDogs);
d3.queue()
    .defer(d3.csv, "./data/tests.csv")
    .defer(d3.csv, "./data/subtest-desc.csv")
    .defer(d3.csv, "./data/subtests.csv")
    .await(analyzeTests);