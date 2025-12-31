document.addEventListener("input", ({ target }) => {
    if (["password", "cpassword"].includes(target.id)) checkPasswordMatch();
  });
  
  function checkPasswordMatch() {
    const userPassword = document.getElementById("password").value,
          confirmPassword = document.getElementById("cpassword").value,
          submitButton = document.querySelector('button[type="submit"]'),
          checkCpasswordMsg = document.getElementById("check-cpassword-msg");
  
    if (userPassword && confirmPassword) {
      const match = userPassword === confirmPassword;
      checkCpasswordMsg.style.color = match ? "green" : "red";
      checkCpasswordMsg.textContent = match ? "Passwords matched." : "Passwords do not match.";
      submitButton.disabled = !match;
    }
  }
  