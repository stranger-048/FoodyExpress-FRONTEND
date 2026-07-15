function byId(id) {
  return document.getElementById(id);
}

function showMessage(element, message, type) {
  if (!element) return;
  element.textContent = message;
  element.className = `message ${type}`;
}

function clearMessage(element) {
  if (!element) return;
  element.textContent = "";
  element.className = "message hidden";
}

function setFieldError(fieldName, message) {
  const field = byId(fieldName);
  const error = byId(`${fieldName}Error`);
  if (field) field.classList.toggle("input-error", Boolean(message));
  if (error) error.textContent = message;
}

function clearFieldErrors(names) {
  names.forEach((name) => setFieldError(name, ""));
}

function setButtonLoading(button, loading, loadingText, normalText) {
  if (!button) return;
  button.disabled = loading;
  button.textContent = loading ? loadingText : normalText;
}

const navToggle = byId("navToggle");
const navLinks = byId("navLinks");

if (navToggle && navLinks) {
  navToggle.addEventListener("click", () => navLinks.classList.toggle("open"));
}

const loginForm = byId("loginForm");

if (loginForm) {
  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const message = byId("loginMessage");
    const button = byId("loginButton");
    const email = byId("email").value.trim();
    const password = byId("password").value;
    const role = byId("role").value;

    clearMessage(message);
    clearFieldErrors(["email", "password"]);

    let valid = true;

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setFieldError("email", "Please enter a valid email.");
      valid = false;
    }

    if (!password.trim()) {
      setFieldError("password", "Password is required.");
      valid = false;
    }

    if (!valid) return;

    try {
      setButtonLoading(button, true, "PLEASE WAIT...", "Login");

      const data = await API.login({ email, password, role });
      const sessionKey = data?.key ?? data?.privateKey;
      const sessionUserId =
        data?.userId ?? data?.customerId ?? data?.adminId ?? data?.id;
      const sessionRole = String(data?.role ?? role).toLowerCase();

      if (!sessionKey || sessionUserId == null || !sessionRole) {
        throw new Error(
          "Login must return the generated session key and logged-in user ID. " +
          "Expected key/privateKey and userId/customerId/adminId."
        );
      }

      sessionStorage.setItem("key", sessionKey);
      sessionStorage.setItem("userId", String(sessionUserId));
      sessionStorage.setItem("role", sessionRole);

      showMessage(message, data?.message || "Login successful.", "success");

      setTimeout(() => {
        window.location.href =
          sessionRole === "admin" ? "admin/dashboard.html" : "restaurants.html";
      }, 500);
    } catch (error) {
      showMessage(message, error.message || "Unable to login.", "error");
    } finally {
      setButtonLoading(button, false, "PLEASE WAIT...", "Login");
    }
  });
}

const registerForm = byId("registerForm");

if (registerForm) {
  registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const message = byId("registerMessage");
    const button = byId("registerButton");

    const customer = {
      firstName: byId("firstName").value.trim(),
      lastName: byId("lastName").value.trim(),
      age: Number(byId("age").value),
      gender: byId("gender").value,
      mobileNumber: byId("mobileNumber").value.trim(),
      email: byId("email").value.trim(),
      password: byId("password").value
    };

    const fields = [
      "firstName", "lastName", "age", "gender",
      "mobileNumber", "email", "password"
    ];

    clearMessage(message);
    clearFieldErrors(fields);

    let valid = true;

    if (!customer.firstName) {
      setFieldError("firstName", "First name is required.");
      valid = false;
    }

    if (!customer.lastName) {
      setFieldError("lastName", "Last name is required.");
      valid = false;
    }

    if (!Number.isInteger(customer.age) || customer.age < 1 || customer.age > 120) {
      setFieldError("age", "Please enter a valid age.");
      valid = false;
    }

    if (!customer.gender) {
      setFieldError("gender", "Please select a gender.");
      valid = false;
    }

    if (!/^\d{10}$/.test(customer.mobileNumber)) {
      setFieldError("mobileNumber", "Mobile number must contain exactly 10 digits.");
      valid = false;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email)) {
      setFieldError("email", "Please enter a valid email.");
      valid = false;
    }

    if (!customer.password.trim()) {
      setFieldError("password", "Password is required.");
      valid = false;
    }

    if (!valid) return;

    try {
      setButtonLoading(button, true, "PLEASE WAIT...", "Register");
      await API.registerCustomer(customer);

      registerForm.reset();
      showMessage(
        message,
        "Account created successfully. You can now go to login.",
        "success"
      );
    } catch (error) {
      showMessage(message, error.message || "Unable to create account.", "error");
    } finally {
      setButtonLoading(button, false, "PLEASE WAIT...", "Register");
    }
  });
}
