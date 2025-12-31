function startEndDatetimeValidation(startDateSelector, endDateSelector, submitButtonSelector) {
    const startDateInput = document.querySelector(startDateSelector);
    const endDateInput = document.querySelector(endDateSelector);
    const submitButton = document.querySelector(submitButtonSelector);

    if (!startDateInput || !endDateInput || !submitButton) {
        console.warn("Date Validation: One or more selectors are invalid.");
        return;
    }

    // Function to validate dates and handle styling
    function validateDates() {
        const startDate = new Date(startDateInput.value);
        const endDate = new Date(endDateInput.value);

        if (endDate <= startDate) {
            // Set red border if end date is invalid
            endDateInput.style.borderColor = 'red';
            submitButton.disabled = true;
        } else {
            // Reset border color if end date is valid
            endDateInput.style.borderColor = '';
            submitButton.disabled = false;
        }
    }

    // When the start date changes
    startDateInput.addEventListener('change', function () {
        endDateInput.setAttribute('min', startDateInput.value); // Set min for end date
        endDateInput.style.borderColor = 'red'; // Set red border on end date initially
        validateDates(); // Validate dates immediately
    });

    // When the end date changes
    endDateInput.addEventListener('change', validateDates);
}
