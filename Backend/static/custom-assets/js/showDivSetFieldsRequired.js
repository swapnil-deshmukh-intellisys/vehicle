function showDivSetFieldsRequired(event) {
    let checkboxes = document.querySelectorAll("input[data-div-id]");

    checkboxes.forEach(checkbox => {
        let divIds = checkbox.dataset.divId ? checkbox.dataset.divId.split(",") : [];
        let show = checkbox.checked;

        divIds.forEach(divId => {
            let trimmedDivId = divId.trim();
            let targetDiv = document.getElementById(trimmedDivId);

            if (targetDiv) {
                targetDiv.style.display = show ? "block" : "none";

                // Find input fields inside the div and toggle "required" attribute
                let inputs = targetDiv.querySelectorAll("input, select, textarea");
                inputs.forEach(input => {
                    input.required = show;
                });
            } else {
                console.warn(`Element with ID '${trimmedDivId}' not found.`);
            }
        });
    });
}

// Run function on page load and attach event listeners to checkboxes
document.addEventListener("DOMContentLoaded", function () {
    showDivSetFieldsRequired(); // Run on page load
    document.querySelectorAll("input[data-div-id]").forEach(checkbox => {
        checkbox.addEventListener("change", showDivSetFieldsRequired); // Run on change
    });
});

//usecase: data-div-id="1divid" || data-div-id="1divid,2divid,......"
