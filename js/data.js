
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
    loadedData["dogs"] = data;
    loadedData["dogsTable"] = dogs;

    // dogTree = {};
    // data.forEach(function (dogEntry) {
    //     let father_id = dogEntry.FatherID;
    //     let mother_id = dogEntry.MotherID;
    //     let father = { "name": father_id, "children": [],"y":10,"fixed":true,"type":"square","size": 20 };//dogs[father_id] || 
    //     let mother = { "name": mother_id, "children": [],"y":310,"fixed":true, "type":"circle","size": 20 };//dogs[mother_id] || 

    //     if (!dogTree[father_id])
    //         dogTree[father_id] = father;

    //     if (!dogTree[mother_id]) {
    //         dogTree[mother_id] = mother;
    //     }
    //     let me ={ "name": dogEntry.ID,"y":100,"type":"circle","size": 20 }
    //     dogTree[father_id].children.push(me);
    //     dogTree[mother_id].children.push(me);
    // });
    // dogTree[0]='';
    // //dogTree
    // console.log(dogTree);
    // console.log("------")
    //loadedData["dogsT"] = dogTree;


    graph = {
        "graph": [],
        "links": [],
        "nodes": [],
        "directed": false,
        "multigraph": false
    };//?
    console.log(data);
    data.forEach(function (dogEntry) {

        let father_id = dogEntry.FatherID || 0;
        let mother_id = dogEntry.MotherID || 0;

        let father = { "id": father_id,"type":"square","size": 20,"score": 5,"name":"F" };
        let mother = { "id": mother_id,"type":"circle","size": 20,"score": 5,"name":"M" };
        let me ={ "id": dogEntry.ID||0,"type":"circle","size": 20,"score": 5,"name":"C" };
        graph.nodes.push(me)
        let meIndex = graph.nodes.length - 1;
        let fatherIndex = graph.nodes.indexOf(father);
        if (fatherIndex == -1) {
            fatherIndex += graph.nodes.push(father);
            console.log("fatherIndex");
            console.log(fatherIndex);
        }
        let motherIndex = graph.nodes.indexOf(mother);
        if (motherIndex == -1) {
            motherIndex += graph.nodes.push(mother);
            console.log("motherIndex");
            console.log(motherIndex);
        }
        graph.links.push({ "source": fatherIndex, "target": meIndex })
        graph.links.push({ "source": motherIndex, "target": meIndex })


    });
    console.log(graph);
    //loadedData["dogsT"] = graph;

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