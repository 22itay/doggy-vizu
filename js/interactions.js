let parsetsLabels = new Set(["Passed", "Breed & Color Code", "Gender"]);
let opts = { filter: "", useLabels: true, display: "dist_percent" };

// functions
function buildBreedsView() {
    let breedControls = d3.select("#test-side-breedfilter")
        .selectAll("li")
        .data(loadedData["dogBreeds"]);

    let labels = breedControls.enter()
        .append("li")
        .attr("class", "list-group-item")
        .append("label");

    labels.append("input")
        .attr("type", "checkbox")
        .attr("name", "breed-check")
        .attr("value", (d) => d)
        .attr("checked", true);

    labels
        .append("span")
        .text((d) => d === "" ? " (Undefined)" : "" + d);


    breedCheckboxes = Array.from(document.forms['tests-sidebar'].elements["breed-check"]);
    defaultBreeds = getSelectedBreeds();
}

function getSelectedBreeds() {
    return breedCheckboxes.reduce(function (arr, elem) {
        if (elem.checked)
            arr.push(elem.value);
        return arr;
    }, [])
}

function reloadCurrentLegend() {
    if (window.dataLoaded) {
        if (currentTab === "famtree-tab")
            visualizeTreeScale(famtreeCurrent);
        else if (currentTab === "testmain-tab")
            visualizeTestsScale(opts);
    }
}

// Event Listeners
let currentTab = "testmain-tab";
window.addEventListener("dogDataLoaded", function () {
    buildBreedsView();
    buildParsets(parsetsLabels);
});

window.addEventListener("testDataLoaded", function () {
    visualizeTests(opts);
    visualizeTestsScale(opts);
})

window.addEventListener("resize", function () {
    if (window.dataLoaded) {
        buildParsets(parsetsLabels);
        visualizeTests(opts);
        reloadCurrentLegend();
    }
})
$('a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
    currentTab = e.target.id;
    reloadCurrentLegend();
})

// Parsets Interactions
$("#parsets-toggles input").click(function (event) {
    let data = $(this).parent().text().substring(1);
    console.log(parsetsLabels);

    // maintain set
    if (parsetsLabels.has(data))
        if (parsetsLabels.size == 2) {
            $(this).attr('checked', true);
            event.preventDefault();
            alert("you must have 2 selected at a time");
        }
        else
            parsetsLabels.delete(data);
    else
        parsetsLabels.add(data);

    // re-render
    buildParsets(parsetsLabels);
})

// Tests interactions
let form = document.forms['tests-sidebar'];
let breedCheckboxes, defaultBreeds;
let changeFunc = function (e) {
    // compile options
    opts.filter = form.elements['filter'].value;
    opts.useLabels = form.elements['use_labels'].checked;
    opts.display = form.elements['display'].value;

    // prepare for filters
    filters = [];

    // male-female filter
    let show_male = form.elements['gender-check-male'].checked;
    let show_female = form.elements['gender-check-female'].checked;
    if (!show_female || !show_male) {
        let gender_values = [];
        if (show_male) gender_values.push("Male");
        if (show_female) gender_values.push("Female");
        filters.push({ key: "Gender", values: gender_values });
    }

    // breeds filter
    if (JSON.stringify(defaultBreeds) !== JSON.stringify(getSelectedBreeds()))
        filters.push({ key: "Breed & Color Code", values: getSelectedBreeds() });

    // refilter data if needed
    filterSummarizeData(filters);

    // reload visualizations
    visualizeTests(opts);
    visualizeTestsScale(opts);
}
$('#tests-sidebar').on('keyup change', ':input', changeFunc);

let famtreeForm = document.forms["famtree-controls"];
let famtreeCurrent = "heatmap";
$('#famtree-controls').on('keyup change', ':input', function () {
    // toggle controls
    famtreeCurrent = famtreeForm.elements['famtree_display'].value;
    visualizeTreeScale(famtreeCurrent);
    change_famtree_colors(famtreeForm.elements['famtree_display'].value)

    // toggle views
    console.log(famtreeForm.elements['famtree_show_mothers'].checked);
    console.log(famtreeForm.elements['famtree_show_fathers'].checked);
    console.log(famtreeForm.elements['famtree_show_orphans'].checked);
    toggle_famtree("mothers", famtreeForm.elements['famtree_show_mothers'].checked)
    toggle_famtree("fathers", famtreeForm.elements['famtree_show_fathers'].checked)
    toggle_famtree("orphans", famtreeForm.elements['famtree_show_orphans'].checked)

    // trigger update
});