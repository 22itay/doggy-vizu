let parsetsLabels = new Set(["Passed", "Breed & Color Code", "Gender"]);

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
        visualizeTestsScale();
    }
})

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

document.getElementById("tests-searchbox").addEventListener("input", function (e) {
    console.log(e.target.value);
    visualizeTests(e.target.value);
})