let parsetsLabels = new Set(["Passed", "Breed & Color Code", "Gender"]);

$("#parsets-toggle button").click(function (e) {
    let data = $(this).attr("data-toggleid");

    // maintain set
    if (parsetsLabels.has(data))
        if (parsetsLabels.size == 2) {
            alert("you must have 2 selected at a time");
            $(this).button('toggle');
        }
        else
            parsetsLabels.delete(data);
    else
        parsetsLabels.add(data);

    // re-render
    buildParsets(parsetsLabels);
})