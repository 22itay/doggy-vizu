let parsetsLabels = new Set(["Passed", "Breed & Color Code", "Gender"]);
let opts = { filter: "", useLabels: true, display: "dist_percent" };

// Event Listeners
window.addEventListener("dogDataLoaded", function () {
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
        visualizeTestsScale(opts);
    }
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
let changeFunc = function (e) {
    opts.filter = form.elements['filter'].value;
    opts.useLabels = form.elements['use_labels'].checked;
    opts.display = form.elements['display'].value;
    visualizeTests(opts);
    visualizeTestsScale(opts);
}
$('#tests-sidebar').on('keyup change', ':input', changeFunc);