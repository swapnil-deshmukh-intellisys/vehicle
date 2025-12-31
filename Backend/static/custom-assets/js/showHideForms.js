function showHideForm(formId, formClass) {
    // Hide all forms with the specified class, remove 'required' attribute, and clear values
    const forms = document.querySelectorAll(`.${formClass}`);
    forms.forEach(form => {
        form.style.display = 'none';

        // Remove 'required' attribute and clear values of all input and textarea fields in each form
        const inputs = form.querySelectorAll('input, textarea');
        inputs.forEach(input => {
            input.removeAttribute('required');
            input.value = ''; // Clear the input value
        });
    });

    // Show the selected form and add 'required' attribute to its fields
    const selectedForm = document.getElementById(formId);
    if (selectedForm) {
        selectedForm.style.display = 'block';

        // Add 'required' attribute to all input and textarea fields in the selected form
        const inputs = selectedForm.querySelectorAll('input, textarea');
        inputs.forEach(input => input.setAttribute('required', 'true'));
    }
}

// <button type="button" class="btn btn-outline-success waves-effect mb-25" onclick="showHideForm('callForm', 'leadToggleForms')"></button>
// <form method="post" action="#" id="callForm" class="leadToggleForms" style="display: none;"></form>
