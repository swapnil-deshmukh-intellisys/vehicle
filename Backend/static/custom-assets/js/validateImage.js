function validateImage(allowedFormats, requiredWidth, requiredHeight, inputId, msgId, submitBtnId) {
    const fileInput = document.getElementById(inputId);
    const errorText = document.getElementById(msgId);
    const submitButton = document.getElementById(submitBtnId);
    const file = fileInput.files[0];

    errorText.textContent = ""; // Clear previous messages
    submitButton.disabled = true; // Disable submit button initially

    if (!file) {
        errorText.textContent = "Please select a file.";
        errorText.style.color = "red";
        return false;
    }

    // Validate file format
    if (!allowedFormats.includes(file.type)) {
        errorText.textContent = `Allowed formats: ${allowedFormats.join(", ")}.`;
        errorText.style.color = "red";
        fileInput.value = ""; // Clear the file input
        submitButton.disabled = true;
        return false;
    }

    const img = new Image();
    const objectURL = URL.createObjectURL(file);

    img.onload = function () {
        URL.revokeObjectURL(objectURL);

        // Validate dimensions
        if (img.width !== requiredWidth || img.height !== requiredHeight) {
            errorText.textContent = `Image dimensions must be ${requiredWidth}x${requiredHeight} pixels.`;
            errorText.style.color = "red";
            fileInput.value = ""; // Clear the file input
            submitButton.disabled = true;
        } else {
            errorText.textContent = "Image is valid.";
            errorText.style.color = "green";
            submitButton.disabled = false;
        }
    };

    img.src = objectURL;
}



// USECASE:
//<input type="file" class="form-control" name="favicon" id="validateImg"
  //     accept="image/*" required
    //   onchange="validateImage(['image/jpeg', 'image/png'], 100, 100, 'validateImg', 'validateImgMsg', 'submitButton')">
//<small id="validateImgMsg" class="form-text"></small>
//<button type="submit" class="btn btn-sm btn-success" id="submitButton">Submit</button>
