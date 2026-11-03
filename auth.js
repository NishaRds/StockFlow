// STOCKFLOW AUTHENTICATION

const USERS_KEY = "sf_users";

function getUsers() {
  return JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function showMessage(elementId, message, type = "error") {
  const element = document.getElementById(elementId);
  if (!element) return;

  element.textContent = window.stockFlowTranslate
    ? window.stockFlowTranslate(message)
    : message;

  element.className = "message " + type;
}

function clearMessage(elementId) {
  const element = document.getElementById(elementId);
  if (!element) return;

  element.textContent = "";
  element.className = "message hidden";
}

function showView(view) {
  ["login", "register", "forgot"].forEach(name => {
    const section = document.getElementById("view-" + name);

    if (section) {
      section.classList.toggle("hidden", name !== view);
    }
  });

  clearMessage("authMessage");
  clearMessage("registerMessage");
  clearMessage("forgotMessage");
}

let activeRegisterStep = 0;

function showRegisterStep(step) {
  activeRegisterStep = step;

  document.querySelectorAll(".register-step").forEach(panel => {
    panel.classList.toggle(
      "hidden",
      Number(panel.dataset.stepPanel) !== step
    );
  });

  document.querySelectorAll(".register-tab").forEach(tab => {
    const tabStep = Number(tab.dataset.step);

    tab.classList.toggle("active", tabStep === step);
    tab.classList.toggle("completed", tabStep < step);
  });
}

function validateRegisterStep(step) {
  const panel = document.querySelector(
    `.register-step[data-step-panel="${step}"]`
  );

  if (!panel) return true;

  const fields = panel.querySelectorAll("input, select, textarea");

  for (const field of fields) {
    if (!field.value.trim()) {
      field.focus();
      showMessage("registerMessage", "Please fill in all the details.");
      return false;
    }

    if (!field.checkValidity()) {
      field.reportValidity();
      return false;
    }
  }

  if (step === 1) {
    const ownerPhone = document.getElementById("ownerPhone").value.trim();
    const shopPhone = document.getElementById("phone").value.trim();
    const pincode = document.getElementById("pincode").value.trim();

    if (!/^\d{10}$/.test(ownerPhone)) {
      showMessage("registerMessage", "Enter a valid 10-digit owner phone number.");
      return false;
    }

    if (!/^\d{10}$/.test(shopPhone)) {
      showMessage("registerMessage", "Enter a valid 10-digit shop phone number.");
      return false;
    }

    if (!/^\d{6}$/.test(pincode)) {
      showMessage("registerMessage", "Enter a valid 6-digit pincode.");
      return false;
    }
  }

  clearMessage("registerMessage");
  return true;
}

// LOGIN / REGISTER / FORGOT NAVIGATION

document.getElementById("showRegister").addEventListener("click", event => {
  event.preventDefault();
  showView("register");
  showRegisterStep(0);
});

document.getElementById("showForgot").addEventListener("click", event => {
  event.preventDefault();
  showView("forgot");
});

document.getElementById("showLogin").addEventListener("click", event => {
  event.preventDefault();
  showView("login");
});

document.getElementById("registerTopBack").addEventListener("click", event => {
  event.preventDefault();
  showView("login");
});

document.getElementById("backToLogin").addEventListener("click", event => {
  event.preventDefault();
  showView("login");
});

document.querySelectorAll(".register-tab").forEach(tab => {
  tab.addEventListener("click", () => {
    const step = Number(tab.dataset.step);

    if (step <= activeRegisterStep) {
      showRegisterStep(step);
      clearMessage("registerMessage");
    } else if (validateRegisterStep(activeRegisterStep)) {
      showRegisterStep(step);
    }
  });
});

document.querySelectorAll("[data-next]").forEach(button => {
  button.addEventListener("click", () => {
    const nextStep = Number(button.dataset.next);

    if (validateRegisterStep(activeRegisterStep)) {
      showRegisterStep(nextStep);
    }
  });
});

document.querySelectorAll("[data-back]").forEach(button => {
  button.addEventListener("click", () => {
    showRegisterStep(Number(button.dataset.back));
    clearMessage("registerMessage");
  });
});

// CREATE ACCOUNT

document.getElementById("registerForm").addEventListener("submit", event => {
  event.preventDefault();

  if (!validateRegisterStep(2)) return;

  const shopName = document.getElementById("shopName").value.trim();
  const ownerName = document.getElementById("ownerName").value.trim();
  const shopType = document.getElementById("shopType").value;
  const ownerPhone = document.getElementById("ownerPhone").value.trim();
  const phone = document.getElementById("phone").value.trim();
  const address = document.getElementById("address").value.trim();
  const pincode = document.getElementById("pincode").value.trim();
  const email = document.getElementById("email").value.trim().toLowerCase();
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("regPass").value;
  const confirmPassword = document.getElementById("regConfirm").value;

  if (password.length < 6) {
    showMessage("registerMessage", "Password must contain at least 6 characters.");
    return;
  }

  if (password !== confirmPassword) {
    showMessage("registerMessage", "Passwords do not match.");
    return;
  }

  const users = getUsers();

  const alreadyExists = users.some(user =>
    user.email.toLowerCase() === email ||
    user.username.toLowerCase() === username.toLowerCase()
  );

  if (alreadyExists) {
    showMessage("registerMessage", "This email or username is already registered.");
    return;
  }

  const newUser = {
    id: Date.now().toString(),
    shopName,
    ownerName,
    shopType,
    ownerPhone,
    phone,
    address,
    pincode,
    email,
    username,
    password,
    role: "owner"
  };

  users.push(newUser);
  saveUsers(users);

  document.getElementById("registerForm").reset();
  showView("login");

  document.getElementById("loginId").value = username;

  showMessage("authMessage", "Account created successfully. You can now log in.", "success");
});

// LOGIN

document.getElementById("loginForm").addEventListener("submit", event => {
  event.preventDefault();

  const loginId = document.getElementById("loginId").value.trim().toLowerCase();
  const password = document.getElementById("loginPass").value;

  const users = getUsers();

  const user = users.find(item =>
    item.username.toLowerCase() === loginId ||
    item.email.toLowerCase() === loginId
  );

  if (!user || user.password !== password) {
    showMessage("authMessage", "Incorrect username, email or password.");
    return;
  }

  localStorage.setItem("sf_session", user.id);
  window.location.href = "dashboard.html";
});

// FORGOT PASSWORD

let resetEmail = "";
let generatedResetCode = "";

document.getElementById("forgotForm").addEventListener("submit", event => {
  event.preventDefault();

  resetEmail = document.getElementById("forgotEmail").value.trim().toLowerCase();

  const user = getUsers().find(item => item.email.toLowerCase() === resetEmail);

  if (!user) {
    showMessage("forgotMessage", "No account found with this email address.");
    return;
  }

  generatedResetCode = Math.floor(100000 + Math.random() * 900000).toString();

  document.getElementById("resetArea").classList.remove("hidden");

  showMessage(
    "forgotMessage",
    "Demo reset code: " + generatedResetCode + ". In this prototype, the code is displayed here.",
    "success"
  );
});

document.getElementById("resetPasswordBtn").addEventListener("click", () => {
  const enteredCode = document.getElementById("resetCode").value.trim();
  const newPassword = document.getElementById("newPassword").value;
  const confirmPassword = document.getElementById("confirmNewPassword").value;

  if (enteredCode !== generatedResetCode || !generatedResetCode) {
    showMessage("forgotMessage", "Incorrect reset code.");
    return;
  }

  if (newPassword.length < 6) {
    showMessage("forgotMessage", "Password must contain at least 6 characters.");
    return;
  }

  if (newPassword !== confirmPassword) {
    showMessage("forgotMessage", "Passwords do not match.");
    return;
  }

  const users = getUsers();
  const user = users.find(item => item.email.toLowerCase() === resetEmail);

  if (!user) {
    showMessage("forgotMessage", "Account not found.");
    return;
  }

  user.password = newPassword;
  saveUsers(users);

  generatedResetCode = "";
  document.getElementById("forgotForm").reset();
  document.getElementById("resetArea").classList.add("hidden");

  showView("login");
  showMessage("authMessage", "Password updated successfully. Please log in.", "success");
});
// STOCKFLOW LANGUAGE SETTINGS

const translations = {
  en: {
    loginEyebrow: "WELCOME BACK",
    loginTitle: "Sign in to your shop",
    loginDesc: "Enter your account details to continue.",
    loginId: "Username or email",
    loginIdPlaceholder: "Enter username or email",
    password: "Password",
    passwordPlaceholder: "Enter your password",
    forgot: "Forgot password?",
    loginButton: "Login to StockFlow",
    newAccount: "New to StockFlow?",
    createAccount: "Create an account",

    registerEyebrow: "CREATE YOUR ACCOUNT",
    registerTitle: "Create your shop account",
    basicTab: "Basic Details",
    contactTab: "Contact Details",
    accountTab: "Account Details",
    basicHeading: "Basic Details",
    contactHeading: "Contact Details",
    accountHeading: "Account Details",

    shopName: "Shop Name",
    shopNamePlaceholder: "Enter shop name",
    ownerName: "Owner Name",
    ownerNamePlaceholder: "Enter owner's name",
    shopType: "Shop Type",
    shopTypePlaceholder: "Choose shop type",
    ownerPhone: "Owner's Phone Number",
    ownerPhonePlaceholder: "10-digit phone number",
    shopPhone: "Shop Contact Number",
    address: "Shop Address",
    addressPlaceholder: "Enter complete shop address",
    pincode: "Pincode",
    pincodePlaceholder: "6-digit pincode",
    email: "Email Address",
    emailPlaceholder: "you@example.com",
    username: "Username",
    usernamePlaceholder: "Create a username",
    createPassword: "Password",
    passwordNewPlaceholder: "At least 6 characters",
    confirmPassword: "Confirm Password",
    confirmPlaceholder: "Enter password again",

    continue: "Continue →",
    back: "← Back",
    createButton: "Create Account",
    alreadyAccount: "Already have an account?",
    login: "Login",

    forgotEyebrow: "ACCOUNT RECOVERY",
    forgotTitle: "Reset your password",
    forgotDesc: "Enter your registered email address.",
    forgotEmail: "Email Address",
    forgotEmailPlaceholder: "Enter registered email",
    generateCode: "Generate reset code",
    resetCode: "Reset Code",
    resetCodePlaceholder: "Enter reset code",
    newPassword: "New Password",
    newPasswordPlaceholder: "New password",
    confirmNewPassword: "Confirm New Password",
    confirmNewPlaceholder: "Confirm new password",
    updatePassword: "Update Password",
    backLogin: "← Back to login",

    shopTypes: [
      "Choose shop type", "Grocery", "Medical", "Stationery",
      "Clothing", "Electronics", "General Store", "Other"
    ]
  },

  kn: {
    loginEyebrow: "ಮತ್ತೆ ಸ್ವಾಗತ",
    loginTitle: "ನಿಮ್ಮ ಅಂಗಡಿಗೆ ಲಾಗಿನ್ ಆಗಿ",
    loginDesc: "ಮುಂದುವರಿಯಲು ನಿಮ್ಮ ಖಾತೆಯ ವಿವರಗಳನ್ನು ನಮೂದಿಸಿ.",
    loginId: "ಬಳಕೆದಾರ ಹೆಸರು ಅಥವಾ ಇಮೇಲ್",
    loginIdPlaceholder: "ಬಳಕೆದಾರ ಹೆಸರು ಅಥವಾ ಇಮೇಲ್ ನಮೂದಿಸಿ",
    password: "ಪಾಸ್‌ವರ್ಡ್",
    passwordPlaceholder: "ನಿಮ್ಮ ಪಾಸ್‌ವರ್ಡ್ ನಮೂದಿಸಿ",
    forgot: "ಪಾಸ್‌ವರ್ಡ್ ಮರೆತಿದ್ದೀರಾ?",
    loginButton: "StockFlow ಗೆ ಲಾಗಿನ್ ಆಗಿ",
    newAccount: "StockFlow ಗೆ ಹೊಸಬರೇ?",
    createAccount: "ಖಾತೆ ರಚಿಸಿ",

    registerEyebrow: "ನಿಮ್ಮ ಖಾತೆಯನ್ನು ರಚಿಸಿ",
    registerTitle: "ನಿಮ್ಮ ಅಂಗಡಿಯ ಖಾತೆ ರಚಿಸಿ",
    basicTab: "ಮೂಲ ವಿವರಗಳು",
    contactTab: "ಸಂಪರ್ಕ ವಿವರಗಳು",
    accountTab: "ಖಾತೆ ವಿವರಗಳು",
    basicHeading: "ಮೂಲ ವಿವರಗಳು",
    contactHeading: "ಸಂಪರ್ಕ ವಿವರಗಳು",
    accountHeading: "ಖಾತೆ ವಿವರಗಳು",

    shopName: "ಅಂಗಡಿಯ ಹೆಸರು",
    shopNamePlaceholder: "ಅಂಗಡಿಯ ಹೆಸರನ್ನು ನಮೂದಿಸಿ",
    ownerName: "ಮಾಲೀಕರ ಹೆಸರು",
    ownerNamePlaceholder: "ಮಾಲೀಕರ ಹೆಸರನ್ನು ನಮೂದಿಸಿ",
    shopType: "ಅಂಗಡಿಯ ಪ್ರಕಾರ",
    shopTypePlaceholder: "ಅಂಗಡಿಯ ಪ್ರಕಾರ ಆಯ್ಕೆಮಾಡಿ",
    ownerPhone: "ಮಾಲೀಕರ ಫೋನ್ ಸಂಖ್ಯೆ",
    ownerPhonePlaceholder: "10 ಅಂಕಿಯ ಫೋನ್ ಸಂಖ್ಯೆ",
    shopPhone: "ಅಂಗಡಿಯ ಸಂಪರ್ಕ ಸಂಖ್ಯೆ",
    address: "ಅಂಗಡಿಯ ವಿಳಾಸ",
    addressPlaceholder: "ಸಂಪೂರ್ಣ ವಿಳಾಸ ನಮೂದಿಸಿ",
    pincode: "ಪಿನ್ ಕೋಡ್",
    pincodePlaceholder: "6 ಅಂಕಿಯ ಪಿನ್ ಕೋಡ್",
    email: "ಇಮೇಲ್ ವಿಳಾಸ",
    emailPlaceholder: "ನಿಮ್ಮ ಇಮೇಲ್ ನಮೂದಿಸಿ",
    username: "ಬಳಕೆದಾರ ಹೆಸರು",
    usernamePlaceholder: "ಬಳಕೆದಾರ ಹೆಸರನ್ನು ರಚಿಸಿ",
    createPassword: "ಪಾಸ್‌ವರ್ಡ್",
    passwordNewPlaceholder: "ಕನಿಷ್ಠ 6 ಅಕ್ಷರಗಳು",
    confirmPassword: "ಪಾಸ್‌ವರ್ಡ್ ದೃಢೀಕರಿಸಿ",
    confirmPlaceholder: "ಪಾಸ್‌ವರ್ಡ್ ಮತ್ತೆ ನಮೂದಿಸಿ",

    continue: "ಮುಂದುವರಿಸಿ →",
    back: "← ಹಿಂದೆ",
    createButton: "ಖಾತೆ ರಚಿಸಿ",
    alreadyAccount: "ಈಗಾಗಲೇ ಖಾತೆ ಇದೆಯೇ?",
    login: "ಲಾಗಿನ್",

    forgotEyebrow: "ಖಾತೆ ಮರುಪಡೆಯುವಿಕೆ",
    forgotTitle: "ಪಾಸ್‌ವರ್ಡ್ ಮರುಹೊಂದಿಸಿ",
    forgotDesc: "ನೋಂದಾಯಿತ ಇಮೇಲ್ ವಿಳಾಸ ನಮೂದಿಸಿ.",
    forgotEmail: "ಇಮೇಲ್ ವಿಳಾಸ",
    forgotEmailPlaceholder: "ನೋಂದಾಯಿತ ಇಮೇಲ್ ನಮೂದಿಸಿ",
    generateCode: "ರೀಸೆಟ್ ಕೋಡ್ ಪಡೆಯಿರಿ",
    resetCode: "ರೀಸೆಟ್ ಕೋಡ್",
    resetCodePlaceholder: "ರೀಸೆಟ್ ಕೋಡ್ ನಮೂದಿಸಿ",
    newPassword: "ಹೊಸ ಪಾಸ್‌ವರ್ಡ್",
    newPasswordPlaceholder: "ಹೊಸ ಪಾಸ್‌ವರ್ಡ್",
    confirmNewPassword: "ಹೊಸ ಪಾಸ್‌ವರ್ಡ್ ದೃಢೀಕರಿಸಿ",
    confirmNewPlaceholder: "ಹೊಸ ಪಾಸ್‌ವರ್ಡ್ ಮತ್ತೆ ನಮೂದಿಸಿ",
    updatePassword: "ಪಾಸ್‌ವರ್ಡ್ ಬದಲಾಯಿಸಿ",
    backLogin: "← ಲಾಗಿನ್‌ಗೆ ಹಿಂತಿರುಗಿ",

    shopTypes: [
      "ಅಂಗಡಿಯ ಪ್ರಕಾರ ಆಯ್ಕೆಮಾಡಿ", "ಕಿರಾಣಿ", "ವೈದ್ಯಕೀಯ", "ಸ್ಟೇಷನರಿ",
      "ಬಟ್ಟೆ", "ಎಲೆಕ್ಟ್ರಾನಿಕ್ಸ್", "ಜನರಲ್ ಸ್ಟೋರ್", "ಇತರೆ"
    ]
  },

  hi: {
    loginEyebrow: "वापसी पर स्वागत है",
    loginTitle: "अपनी दुकान में लॉगिन करें",
    loginDesc: "आगे बढ़ने के लिए अपने खाते का विवरण दर्ज करें।",
    loginId: "यूज़रनेम या ईमेल",
    loginIdPlaceholder: "यूज़रनेम या ईमेल दर्ज करें",
    password: "पासवर्ड",
    passwordPlaceholder: "अपना पासवर्ड दर्ज करें",
    forgot: "पासवर्ड भूल गए?",
    loginButton: "StockFlow में लॉगिन करें",
    newAccount: "StockFlow पर नए हैं?",
    createAccount: "खाता बनाएं",

    registerEyebrow: "अपना खाता बनाएं",
    registerTitle: "अपनी दुकान का खाता बनाएं",
    basicTab: "मूल विवरण",
    contactTab: "संपर्क विवरण",
    accountTab: "खाता विवरण",
    basicHeading: "मूल विवरण",
    contactHeading: "संपर्क विवरण",
    accountHeading: "खाता विवरण",

    shopName: "दुकान का नाम",
    shopNamePlaceholder: "दुकान का नाम दर्ज करें",
    ownerName: "मालिक का नाम",
    ownerNamePlaceholder: "मालिक का नाम दर्ज करें",
    shopType: "दुकान का प्रकार",
    shopTypePlaceholder: "दुकान का प्रकार चुनें",
    ownerPhone: "मालिक का फोन नंबर",
    ownerPhonePlaceholder: "10 अंकों का फोन नंबर",
    shopPhone: "दुकान का संपर्क नंबर",
    address: "दुकान का पता",
    addressPlaceholder: "पूरा पता दर्ज करें",
    pincode: "पिन कोड",
    pincodePlaceholder: "6 अंकों का पिन कोड",
    email: "ईमेल पता",
    emailPlaceholder: "अपना ईमेल दर्ज करें",
    username: "यूज़रनेम",
    usernamePlaceholder: "यूज़रनेम बनाएं",
    createPassword: "पासवर्ड",
    passwordNewPlaceholder: "कम से कम 6 अक्षर",
    confirmPassword: "पासवर्ड की पुष्टि करें",
    confirmPlaceholder: "पासवर्ड दोबारा दर्ज करें",

    continue: "आगे बढ़ें →",
    back: "← वापस",
    createButton: "खाता बनाएं",
    alreadyAccount: "पहले से खाता है?",
    login: "लॉगिन",

    forgotEyebrow: "खाता पुनर्प्राप्ति",
    forgotTitle: "पासवर्ड रीसेट करें",
    forgotDesc: "अपना पंजीकृत ईमेल पता दर्ज करें।",
    forgotEmail: "ईमेल पता",
    forgotEmailPlaceholder: "पंजीकृत ईमेल दर्ज करें",
    generateCode: "रीसेट कोड प्राप्त करें",
    resetCode: "रीसेट कोड",
    resetCodePlaceholder: "रीसेट कोड दर्ज करें",
    newPassword: "नया पासवर्ड",
    newPasswordPlaceholder: "नया पासवर्ड",
    confirmNewPassword: "नए पासवर्ड की पुष्टि करें",
    confirmNewPlaceholder: "नया पासवर्ड दोबारा दर्ज करें",
    updatePassword: "पासवर्ड अपडेट करें",
    backLogin: "← लॉगिन पर वापस जाएं",

    shopTypes: [
      "दुकान का प्रकार चुनें", "किराना", "मेडिकल", "स्टेशनरी",
      "कपड़े", "इलेक्ट्रॉनिक्स", "जनरल स्टोर", "अन्य"
    ]
  }
};

const messageTranslations = {
  kn: {
    "Please fill in all the details.": "ದಯವಿಟ್ಟು ಎಲ್ಲಾ ವಿವರಗಳನ್ನು ಭರ್ತಿ ಮಾಡಿ.",
    "Enter a valid 10-digit owner phone number.": "ಸರಿಯಾದ 10 ಅಂಕಿಯ ಮಾಲೀಕರ ಫೋನ್ ಸಂಖ್ಯೆಯನ್ನು ನಮೂದಿಸಿ.",
    "Enter a valid 10-digit shop phone number.": "ಸರಿಯಾದ 10 ಅಂಕಿಯ ಅಂಗಡಿ ಫೋನ್ ಸಂಖ್ಯೆಯನ್ನು ನಮೂದಿಸಿ.",
    "Enter a valid 6-digit pincode.": "ಸರಿಯಾದ 6 ಅಂಕಿಯ ಪಿನ್ ಕೋಡ್ ನಮೂದಿಸಿ.",
    "Password must contain at least 6 characters.": "ಪಾಸ್‌ವರ್ಡ್ ಕನಿಷ್ಠ 6 ಅಕ್ಷರಗಳನ್ನು ಹೊಂದಿರಬೇಕು.",
    "Passwords do not match.": "ಪಾಸ್‌ವರ್ಡ್‌ಗಳು ಹೊಂದಿಕೆಯಾಗುತ್ತಿಲ್ಲ.",
    "This email or username is already registered.": "ಈ ಇಮೇಲ್ ಅಥವಾ ಬಳಕೆದಾರ ಹೆಸರು ಈಗಾಗಲೇ ನೋಂದಾಯಿಸಲಾಗಿದೆ.",
    "Account created successfully. You can now log in.": "ಖಾತೆ ಯಶಸ್ವಿಯಾಗಿ ರಚಿಸಲಾಗಿದೆ. ಈಗ ಲಾಗಿನ್ ಆಗಬಹುದು.",
    "Incorrect username, email or password.": "ತಪ್ಪಾದ ಬಳಕೆದಾರ ಹೆಸರು, ಇಮೇಲ್ ಅಥವಾ ಪಾಸ್‌ವರ್ಡ್.",
    "No account found with this email address.": "ಈ ಇಮೇಲ್ ವಿಳಾಸಕ್ಕೆ ಯಾವುದೇ ಖಾತೆ ಕಂಡುಬಂದಿಲ್ಲ.",
    "Incorrect reset code.": "ತಪ್ಪಾದ ರೀಸೆಟ್ ಕೋಡ್.",
    "Account not found.": "ಖಾತೆ ಕಂಡುಬಂದಿಲ್ಲ.",
    "Password updated successfully. Please log in.": "ಪಾಸ್‌ವರ್ಡ್ ಯಶಸ್ವಿಯಾಗಿ ಬದಲಾಯಿಸಲಾಗಿದೆ. ದಯವಿಟ್ಟು ಲಾಗಿನ್ ಆಗಿ."
  },
  hi: {
    "Please fill in all the details.": "कृपया सभी विवरण भरें।",
    "Enter a valid 10-digit owner phone number.": "मालिक का सही 10 अंकों का फोन नंबर दर्ज करें।",
    "Enter a valid 10-digit shop phone number.": "दुकान का सही 10 अंकों का फोन नंबर दर्ज करें।",
    "Enter a valid 6-digit pincode.": "सही 6 अंकों का पिन कोड दर्ज करें।",
    "Password must contain at least 6 characters.": "पासवर्ड में कम से कम 6 अक्षर होने चाहिए।",
    "Passwords do not match.": "पासवर्ड मेल नहीं खाते।",
    "This email or username is already registered.": "यह ईमेल या यूज़रनेम पहले से पंजीकृत है।",
    "Account created successfully. You can now log in.": "खाता सफलतापूर्वक बन गया है। अब आप लॉगिन कर सकते हैं।",
    "Incorrect username, email or password.": "यूज़रनेम, ईमेल या पासवर्ड गलत है।",
    "No account found with this email address.": "इस ईमेल पते से कोई खाता नहीं मिला।",
    "Incorrect reset code.": "रीसेट कोड गलत है।",
    "Account not found.": "खाता नहीं मिला।",
    "Password updated successfully. Please log in.": "पासवर्ड सफलतापूर्वक अपडेट हो गया। कृपया लॉगिन करें।"
  }
};

window.stockFlowTranslate = function(message) {
  const language = localStorage.getItem("sf_language") || "en";
  if (language === "en") return message;

  if (message.startsWith("Demo reset code:")) {
    const code = message.match(/\d{6}/)?.[0] || "";
    if (language === "kn") {
      return `ಡೆಮೊ ರೀಸೆಟ್ ಕೋಡ್: ${code}. ಈ ಪರೀಕ್ಷಾ ಆವೃತ್ತಿಯಲ್ಲಿ ಕೋಡ್ ಇಲ್ಲಿ ತೋರಿಸಲಾಗುತ್ತದೆ.`;
    }
    return `डेमो रीसेट कोड: ${code}। इस परीक्षण संस्करण में कोड यहां दिखाया जाता है।`;
  }

  return messageTranslations[language]?.[message] || message;
};

function applyLanguage(language) {
  const t = translations[language] || translations.en;

  localStorage.setItem("sf_language", language);
  document.documentElement.lang = language;

  const setText = (selector, value) => {
    document.querySelectorAll(selector).forEach(element => {
      element.textContent = value;
    });
  };

  const setPlaceholder = (id, value) => {
    const element = document.getElementById(id);
    if (element) element.placeholder = value;
  };

  // LOGIN
  setText("#view-login .eyebrow", t.loginEyebrow);
  setText("#view-login h2", t.loginTitle);
  setText("#view-login .muted", t.loginDesc);
  setText('label[for="loginId"]', t.loginId);
  setText('label[for="loginPass"]', t.password);
  setText("#showForgot", t.forgot);
  setText('#loginForm button[type="submit"]', t.loginButton);
  setText("#newAccountText", t.newAccount);
  setText("#showRegister", t.createAccount);

  setPlaceholder("loginId", t.loginIdPlaceholder);
  setPlaceholder("loginPass", t.passwordPlaceholder);

  // REGISTRATION
  setText("#view-register .eyebrow", t.registerEyebrow);
  setText("#view-register h2", t.registerTitle);

  const tabs = document.querySelectorAll(".register-tab");
  const tabNames = [t.basicTab, t.contactTab, t.accountTab];

  tabs.forEach((tab, index) => {
    tab.innerHTML = `<span>0${index + 1}</span>${tabNames[index]}`;
  });

  const headings = [t.basicHeading, t.contactHeading, t.accountHeading];

  document.querySelectorAll(".register-step h3").forEach((heading, index) => {
    heading.textContent = headings[index];
  });

  const labels = {
    shopName: t.shopName,
    ownerName: t.ownerName,
    shopType: t.shopType,
    ownerPhone: t.ownerPhone,
    phone: t.shopPhone,
    address: t.address,
    pincode: t.pincode,
    email: t.email,
    username: t.username,
    regPass: t.createPassword,
    regConfirm: t.confirmPassword
  };

  Object.entries(labels).forEach(([id, value]) => {
    setText(`label[for="${id}"]`, value);
  });

  setPlaceholder("shopName", t.shopNamePlaceholder);
  setPlaceholder("ownerName", t.ownerNamePlaceholder);
  setPlaceholder("ownerPhone", t.ownerPhonePlaceholder);
  setPlaceholder("phone", t.ownerPhonePlaceholder);
  setPlaceholder("address", t.addressPlaceholder);
  setPlaceholder("pincode", t.pincodePlaceholder);
  setPlaceholder("email", t.emailPlaceholder);
  setPlaceholder("username", t.usernamePlaceholder);
  setPlaceholder("regPass", t.passwordNewPlaceholder);
  setPlaceholder("regConfirm", t.confirmPlaceholder);

  const shopType = document.getElementById("shopType");
  if (shopType) {
    [...shopType.options].forEach((option, index) => {
      if (t.shopTypes[index]) option.textContent = t.shopTypes[index];
    });
  }

  document.querySelectorAll(".step-next").forEach(button => {
    if (button.type === "submit") {
      button.textContent = t.createButton;
    } else {
      button.textContent = t.continue;
    }
  });

  document.querySelectorAll(".step-back").forEach(button => {
    button.textContent = t.back;
  });

  setText("#alreadyAccountText", t.alreadyAccount);
  setText("#registerTopBack", t.backLogin);
  setText("#showLogin", t.login);

  // FORGOT PASSWORD
  setText("#view-forgot .eyebrow", t.forgotEyebrow);
  setText("#view-forgot h2", t.forgotTitle);
  setText("#view-forgot .muted", t.forgotDesc);
  setText('label[for="forgotEmail"]', t.forgotEmail);
  setPlaceholder("forgotEmail", t.forgotEmailPlaceholder);
  setText('#forgotForm button[type="submit"]', t.generateCode);
  setText('label[for="resetCode"]', t.resetCode);
  setText('label[for="newPassword"]', t.newPassword);
  setText('label[for="confirmNewPassword"]', t.confirmNewPassword);
  setPlaceholder("resetCode", t.resetCodePlaceholder);
  setPlaceholder("newPassword", t.newPasswordPlaceholder);
  setPlaceholder("confirmNewPassword", t.confirmNewPlaceholder);
  setText("#resetPasswordBtn", t.updatePassword);
  setText("#backToLogin", t.backLogin);
}

// LANGUAGE SELECTOR

const languageSelect = document.getElementById("languageSelect");

if (languageSelect) {
  const savedLanguage = localStorage.getItem("sf_language") || "en";

  languageSelect.value = savedLanguage;
  applyLanguage(savedLanguage);

  languageSelect.addEventListener("change", () => {
    applyLanguage(languageSelect.value);
  });
}

// SHOW / HIDE PASSWORD (eye icon)

const EYE_OPEN = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"/><circle cx="12" cy="12" r="3"/></svg>';
const EYE_OFF = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-7 0-11-7-11-7a19.8 19.8 0 0 1 5.06-5.94"/><path d="M9.9 4.24A10.9 10.9 0 0 1 12 4c7 0 11 7 11 7a19.9 19.9 0 0 1-3.17 4.19"/><path d="M14.12 14.12A3 3 0 1 1 9.88 9.88"/><line x1="1" y1="1" x2="23" y2="23"/></svg>';

document.querySelectorAll('input[type="password"]').forEach(input => {
  const wrapper = document.createElement("div");
  wrapper.className = "password-field";
  input.parentNode.insertBefore(wrapper, input);
  wrapper.appendChild(input);

  const toggle = document.createElement("button");
  toggle.type = "button";
  toggle.className = "toggle-password";
  toggle.setAttribute("aria-label", "Show password");
  toggle.innerHTML = EYE_OFF;
  wrapper.appendChild(toggle);

  toggle.addEventListener("click", () => {
    const show = input.type === "password";
    input.type = show ? "text" : "password";
    toggle.innerHTML = show ? EYE_OPEN : EYE_OFF;
    toggle.setAttribute("aria-label", show ? "Hide password" : "Show password");
  });
});
