const inputField = document.querySelector('.trimwhitespace');
if (inputField) {
  inputField.addEventListener('keydown', function(event) {
    if (event.keyCode === 32) {
      event.preventDefault();
    }
  });
}