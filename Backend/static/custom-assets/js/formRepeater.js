document.addEventListener('DOMContentLoaded', function() {
    const formContainer = document.getElementById('lead-contact-repeater-container');
    
    document.addEventListener('click', function(event) {
       if (event.target.classList.contains('lead-contact-repeater-add')) {
          // Clone the form
          const newForm = formContainer.querySelector('.lead-contact-repeater').cloneNode(true);
          
          // Clear input fields of the cloned form
          const inputs = newForm.querySelectorAll('input');
          inputs.forEach(input => input.value = '');
          
          // Append the new form
          formContainer.appendChild(newForm);
       }
       
       // Handle form removal when the "Close" button is clicked
       if (event.target.classList.contains('lead-contact-repeater-remove')) {
          const formToRemove = event.target.closest('.lead-contact-repeater');
          
          // Only remove if there is more than one form
          if (formContainer.querySelectorAll('.lead-contact-repeater').length > 1) {
             formToRemove.remove();
          } else {
             toastr['error']('You cannot remove the last form.', 'ERROR', {
               closeButton: true,
               tapToDismiss: false,
               progressBar: true,
               showMethod: 'fadeIn',
               hideMethod: 'fadeOut',
               // positionClass: 'toast-top-left',
               timeOut: 5000
           });
          }
       }
    });
 });
 