let parsetsLabels = new Set(["Passed", "Breed & Color Code", "Gender"]);

$("#parsets-toggle button").click(function () {
    let data = $(this).attr("data-toggleid");

    // maintain set
    if (parsetsLabels.has(data))
        parsetsLabels.delete(data);
    else
        parsetsLabels.add(data);

    // re-render
    buildParsets(parsetsLabels);
})