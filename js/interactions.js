let parsetsLabels = new Set(["Passed", "Breed & Color Code", "Gender"]);

// Event Listeners
window.addEventListener("dogDataLoaded", function () {
    buildParsets(parsetsLabels);
});

window.addEventListener("testDataLoaded", function () {
    visualizeTests();
    visualizeTestsScale();
});

window.addEventListener("resize", function () {
    if (window.dataLoaded) {
        buildParsets(parsetsLabels);
        visualizeTests();
        visualizeTestsScale();
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

// Tests Interactions
//document.getElementById("tests-searchbox").addEventListener("input", function (e) {
//visualizeTests(e.target.value);
//})
let opts = {};
$('#tests-sidebar').on('keyup change', ':input', function (e) {
    let optionsData = $("#tests-sidebar").serializeArray();
    optionsData.forEach(d => opts[d.name] = d.value)
    visualizeTests(opts);
});