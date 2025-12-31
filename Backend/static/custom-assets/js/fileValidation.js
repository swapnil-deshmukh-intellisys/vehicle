document.addEventListener("DOMContentLoaded", function () {
    function validateFile(inputId, submitBtnId, allowedExtensions) {
        const fileInput = document.getElementById(inputId);
        const fileMessage = document.getElementById(inputId + "-message");
        const submitBtn = document.getElementById(submitBtnId);

        if (!fileInput || !submitBtn) {
            console.error("File input or submit button not found!");
            return;
        }

        fileInput.addEventListener("change", function () {
            if (fileInput.files.length === 0) {
                showMessage("Please select a file.", "text-danger");
                disableSubmit(true);
                return;
            }

            const fileName = fileInput.files[0].name;
            const fileExtension = fileName.substring(fileName.lastIndexOf(".")).toLowerCase();

            if (!allowedExtensions.includes(fileExtension)) {
                showMessage(`Invalid file type. Allowed types: ${allowedExtensions.join(", ")}`, "text-danger");
                disableSubmit(true);
            } else {
                showMessage("Valid file selected! ✅", "text-success");
                disableSubmit(false);
            }
        });

        function showMessage(text, className) {
            fileMessage.style.display = "block";
            fileMessage.innerText = text;
            fileMessage.className = className;
        }

        function disableSubmit(state) {
            submitBtn.disabled = state;
        }
    }

    // Auto-apply validation for elements with "data-validate" attribute
    document.querySelectorAll("[data-validate]").forEach(function (input) {
        const allowedTypes = input.getAttribute("data-validate").split(",");
        const submitBtn = input.getAttribute("data-submit");
        validateFile(input.id, submitBtn, allowedTypes);
    });
});
