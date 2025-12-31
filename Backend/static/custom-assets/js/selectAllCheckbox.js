const selectAllCheckbox = document.querySelector('#selectAllCheckbox');

// Select only checkboxes NOT inside a .form-switch div
const checkboxList = document.querySelectorAll(
  'input[type="checkbox"]:not(#selectAllCheckbox):not(.form-switch input)'
);

if (selectAllCheckbox) {
  selectAllCheckbox.addEventListener('change', (event) => {
    checkboxList.forEach((checkbox) => {
      checkbox.checked = event.target.checked;
    });
  });
}
