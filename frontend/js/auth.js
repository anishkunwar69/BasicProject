const API_URL = "http://localhost:5000/api";

async function handleRegister(event) {
  event.preventDefault();
  const messageDiv = document.getElementById("message");
  const form = event.target;
  const submitBtn = form.querySelector('button[type="submit"]');

  try {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="loader"></span> Creating Account...';

    const formData = {
      firstName: form.firstName.value,
      lastName: form.lastName.value,
      email: form.email.value,
      password: form.password.value,
      dob: form.dob.value,
      gender: form.gender.value,
    };

    const response = await fetch(`${API_URL}/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Registration failed");

    messageDiv.className = "message success";
    messageDiv.textContent =
      "Registration successful! Please check your email for verification code.";

    setTimeout(() => {
      window.location.href = `verify-email.html?email=${encodeURIComponent(
        formData.email
      )}`;
    }, 2000);
  } catch (error) {
    messageDiv.className = "message error";
    messageDiv.textContent = error.message;
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Create Account";
  }
}

async function handleLogin(event) {
  event.preventDefault();
  const messageDiv = document.getElementById("message");
  const form = event.target;
  const submitBtn = form.querySelector('button[type="submit"]');

  try {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="loader"></span> Signing in...';

    const response = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: form.email.value,
        password: form.password.value,
      }),
    });

    const data = await response.json();

    if (response.status === 403 && data.code === "EMAIL_NOT_VERIFIED") {
      messageDiv.className = "message info";
      messageDiv.innerHTML = `
                <p>Please verify your email first.</p>
                <button onclick="window.location.href='verify-email.html?email=${encodeURIComponent(
                  form.email.value
                )}'" class="verify-btn">
                    Verify Email
                </button>
            `;
      return;
    }

    if (!response.ok) {
      throw new Error(data.message || "Login failed");
    }

    localStorage.setItem("token", data.token);
    messageDiv.className = "message success";
    messageDiv.textContent = "Login successful! Redirecting...";

    setTimeout(() => {
      window.location.href = "/frontend/dashboard.html";
    }, 1000);
  } catch (error) {
    messageDiv.className = "message error";
    messageDiv.textContent = error.message;
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Login";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const otpInputs = document.querySelectorAll("#otpInputs input");

  if (otpInputs.length > 0) {
    otpInputs[0].focus();

    otpInputs.forEach((input, index) => {
      input.addEventListener("keyup", function (e) {
        if (this.value.length >= 1) {
          this.value = this.value[0];
          if (index < otpInputs.length - 1) {
            otpInputs[index + 1].focus();
          }
        }
      });

      input.addEventListener("keydown", function (e) {
        if (e.key === "Backspace") {
          e.preventDefault();
          if (this.value) {
            this.value = "";
          } else if (index > 0) {
            otpInputs[index - 1].focus();
            otpInputs[index - 1].value = "";
          }
        }
      });

      input.addEventListener("input", function (e) {
        this.value = this.value.replace(/[^0-9]/g, "");
      });

      input.addEventListener("paste", function (e) {
        e.preventDefault();
        const pastedData = (e.clipboardData || window.clipboardData)
          .getData("text")
          .replace(/[^0-9]/g, "")
          .split("");

        for (
          let i = 0;
          i < pastedData.length && i + index < otpInputs.length;
          i++
        ) {
          otpInputs[i + index].value = pastedData[i];
          if (i + index < otpInputs.length - 1) {
            otpInputs[i + index + 1].focus();
          }
        }
      });
    });
  }
});

async function handleVerifyEmail(event) {
  event.preventDefault();

  const messageDiv = document.getElementById("message");
  const form = event.target;
  const submitBtn = form.querySelector('button[type="submit"]');
  const otpInputs = document.querySelectorAll(".otp-inputs input");
  const otp = Array.from(otpInputs)
    .map((input) => input.value)
    .join("");
  const urlParams = new URLSearchParams(window.location.search);
  const email = urlParams.get("email");

  if (otp.length !== 6 || !/^\d+$/.test(otp)) {
    messageDiv.className = "message error";
    messageDiv.textContent = "Please enter a valid 6-digit code";
    return false;
  }

  try {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="loader"></span> Verifying...';

    const response = await fetch(`${API_URL}/auth/verify-email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: email,
        otp: otp,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Verification failed");
    }

    messageDiv.className = "message success";
    messageDiv.textContent = "Email verified successfully! Redirecting...";

    setTimeout(() => {
      window.location.href = "dashboard.html";
    }, 2000);
  } catch (error) {
    messageDiv.className = "message error";
    messageDiv.textContent = error.message;

    otpInputs.forEach((input) => (input.value = ""));
    otpInputs[0].focus();
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Verify Email";
  }

  return false;
}

async function handleResendOTP() {
  const messageDiv = document.getElementById("message");
  const resendLink = document.querySelector(".login-link a");
  const urlParams = new URLSearchParams(window.location.search);
  const email = urlParams.get("email");

  try {
    resendLink.style.pointerEvents = "none";
    resendLink.innerHTML = '<span class="loader"></span> Sending...';

    const response = await fetch(`${API_URL}/auth/resend-otp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to resend OTP");
    }

    messageDiv.className = "message success";
    messageDiv.textContent = "New verification code sent!";
  } catch (error) {
    messageDiv.className = "message error";
    messageDiv.textContent = error.message;
  } finally {
    resendLink.style.pointerEvents = "auto";
    resendLink.textContent = "Resend";
  }
}

document
  .querySelector(".toggle-password")
  ?.addEventListener("click", function () {
    const passwordInput = document.getElementById("password");
    const icon = this;

    if (passwordInput.type === "password") {
      passwordInput.type = "text";
      icon.classList.remove("fa-eye");
      icon.classList.add("fa-eye-slash");
    } else {
      passwordInput.type = "password";
      icon.classList.remove("fa-eye-slash");
      icon.classList.add("fa-eye");
    }
  });

document.getElementById("password")?.addEventListener("input", function () {
  const password = this.value;
  const strength = checkPasswordStrength(password);
  const strengthBar = document.querySelector(".password-strength");

  if (strengthBar) {
    strengthBar.style.setProperty("--strength", `${strength}%`);
    strengthBar.style.backgroundColor = getStrengthColor(strength);
  }
});

function checkPasswordStrength(password) {
  let strength = 0;

  if (password.length >= 8) strength += 25;
  if (password.match(/[a-z]/) && password.match(/[A-Z]/)) strength += 25;
  if (password.match(/\d/)) strength += 25;
  if (password.match(/[^a-zA-Z\d]/)) strength += 25;

  return strength;
}

function getStrengthColor(strength) {
  if (strength < 25) return "#ff4444";
  if (strength < 50) return "#ffbb33";
  if (strength < 75) return "#00C851";
  return "#007E33";
}
