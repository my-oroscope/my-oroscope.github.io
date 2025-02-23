document.addEventListener("DOMContentLoaded", function () {
    const loginForm = document.getElementById("login-form");
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");
    const errorMessageContainer = document.getElementById("error-message");
    const successMessageContainer = document.getElementById("success-message");
  
    loginForm.addEventListener("submit", function (e) {
      e.preventDefault();
      const email = emailInput.value;
      const password = passwordInput.value;
  
      const apiEndpoint = window.fastapiEndpoint + "/token";
      const body = new URLSearchParams({
        username: email,
        password: password,
      });
  
      fetch(apiEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: body,
      })
        .then((response) => response.json())
        .then((data) => {
          if (response.ok) {
            localStorage.setItem("token", data.access_token);
            successMessageContainer.textContent = `Logged in with token: ${data.access_token}`;
            errorMessageContainer.textContent = "";
          } else {
            errorMessageContainer.textContent = data.detail;
            successMessageContainer.textContent = "";
          }
        })
        .catch(() => {
          errorMessageContainer.textContent = "Something went wrong";
          successMessageContainer.textContent = "";
        });
    });
  });
  