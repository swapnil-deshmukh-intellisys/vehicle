(function() {
    // Function to toggle visibility of the attachment form and set the 'required' attribute on fields
    window.showHideFormDiv = function(yesRadioSelector, noRadioSelector, hiddenDivSelector, requiredFieldsSelectors) {
        const yesRadio = document.querySelector(yesRadioSelector);
        const noRadio = document.querySelector(noRadioSelector);
        const hiddenDiv = document.querySelector(hiddenDivSelector);
        const requiredFields = document.querySelectorAll(requiredFieldsSelectors);

        // Function to show/hide the div and set/remove 'required' attributes
        const toggleHiddenDiv = () => {
            const isYesChecked = yesRadio.checked;
            hiddenDiv.style.display = isYesChecked ? "block" : "none";

            // Set the 'required' attribute for the fields inside the div when "Yes" is selected
            requiredFields.forEach(field => {
                field.required = isYesChecked;
            });
        };

        // Event listeners for changes on radio buttons
        yesRadio.addEventListener("change", toggleHiddenDiv);
        noRadio.addEventListener("change", toggleHiddenDiv);

        // Initialize the form state on page load
        toggleHiddenDiv();
    };
})();

//<script>
//    document.addEventListener("DOMContentLoaded", function () {
//        showHideFormDiv(
//            '#taskcommentattachmentyes{{task.id}}',
//            '#taskcommentattachmentno{{task.id}}',
//            '#taskcommentattachmenthiddendiv{{task.id}}',
//            '#taskcommentattachmenthiddendivinput{{task.id}}'
//        );
//    });
//</script> 
