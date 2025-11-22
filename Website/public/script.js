// =================================================================================
// BAUST Student Portal - Main Script v19.8 FINAL (All Features Integrated)
// =================================================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import {
  getDatabase,
  ref,
  get,
  set,
  child,
  update,
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-database.js";
import {
  getFunctions,
  httpsCallable,
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-functions.js";

// --- Firebase Configuration ---
const mainAppConfig = {
  apiKey: "AIzaSyBUq_szwEsm50CLZRxUiD6CmXNiB3OwNRc",
  authDomain: "ctquestions-ac5f2.firebaseapp.com",
  databaseURL: "https://ctquestions-ac5f2-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "ctquestions-ac5f2",
  storageBucket: "ctquestions-ac5f2.appspot.com",
  messagingSenderId: "421824009186",
  appId: "1:421824009186:web:298554ad147781e6ec5fbb",
  measurementId: "G-DSEDQ51WF3"
};

// --- ICONS & UTILITIES ---
const subjectIcons = {
  MATH: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20V10M18 20V4M6 20V16"/></svg>',
  CSE: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>',
  CHEM: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16.29 4.31a2 2 0 0 0-2.82 0L5 12.73a2 2 0 0 0 0 2.82l8.43 8.43a2 2 0 0 0 2.82 0l8.43-8.43a2 2 0 0 0 0-2.82zM9 16l-3-3m5 1l-4-4m5-1l-3-3m5 1l-4-4"/></svg>',
};
const getIconForSubject = (code) => {
  const prefix = (code || "").split(" ")[0].split("-")[0];
  return subjectIcons[prefix] || subjectIcons["CSE"];
};

async function sha256(str) {
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(str)
  );
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
const formatDateToKey = (dateObj) => {
  const y = dateObj.getFullYear();
  const m = (dateObj.getMonth() + 1).toString().padStart(2, "0");
  const d = dateObj.getDate().toString().padStart(2, "0");
  return `${y}-${m}-${d}`;
};

function runApp() {
  const eyeIconSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
  const eyeOffIconSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`;

  const appState = {
    userIP: null,
    deviceFingerprint: null,
    currentStudent: null,
    portalData: {},
    devToolsCheckInterval: null,
    resetTimers: { countdownTimer: null },
    resetState: {
      currentUsername: null,
      currentStudentId: null,
    },
    calendarDate: new Date(),
    eventsByDate: {},
  };
  
  const mainApp = initializeApp(mainAppConfig);
  const mainDb = getDatabase(mainApp);
  const functions = getFunctions(mainApp, "asia-southeast1");
  const sdk = { ref, get, set, child, update };

  const dom = {
    videoBackground: document.getElementById("video-background"),
    mainWrapper: document.getElementById("mainWrapper"),
    dashboardWrapper: document.querySelector(".dashboard-wrapper"),
    dashboardSidebar: document.getElementById("dashboardSidebar"),
    hamburgerMenu: document.getElementById("hamburgerMenu"),
    modalBackdrop: document.getElementById("modalBackdrop"),
    toastContainer: document.getElementById("toast-container"),
    login: {
      view: document.getElementById("loginView"),
      userInput: document.getElementById("usernameInput"),
      passInput: document.getElementById("passwordInput"),
      btn: document.getElementById("loginBtn"),
      btnText: document.querySelector("#loginBtn .btn-text"),
      loader: document.querySelector("#loginBtn .btn-loader"),
      error: document.getElementById("loginError"),
      ipDisplay: document.getElementById("userIP"),
      showCreate: document.getElementById("showCreateAccount"),
      showForget: document.getElementById("showForgetPassword"),
    },
    create: {
      view: document.getElementById("createAccountView"),
      idInput: document.getElementById("createStudentId"),
      userInput: document.getElementById("createUsername"),
      emailInput: document.getElementById("createEmail"),
      passInput: document.getElementById("createPassword"),
      confirmPassInput: document.getElementById("confirmPassword"),
      btn: document.getElementById("createAccountBtn"),
      btnText: document.querySelector("#createAccountBtn .btn-text"),
      loader: document.querySelector("#createAccountBtn .btn-loader"),
      error: document.getElementById("createAccountError"),
      backBtn: document.getElementById("backToLoginFromCreate"),
    },
    forget: {
      view: document.getElementById("forgetPasswordView"),
      userInput: document.getElementById("forgetUsernameInput"),
      btn: document.getElementById("sendCodeBtn"),
      btnText: document.querySelector("#sendCodeBtn .btn-text"),
      loader: document.querySelector("#sendCodeBtn .btn-loader"),
      error: document.getElementById("forgetPasswordError"),
      showFindUsername: document.getElementById("showFindUsername"),
      backBtn: document.getElementById("backToLoginFromForget"),
    },
    findUsername: {
      view: document.getElementById("findUsernameView"),
      idInput: document.getElementById("findUsernameIdInput"),
      btn: document.getElementById("findUsernameBtn"),
      btnText: document.querySelector("#findUsernameBtn .btn-text"),
      loader: document.querySelector("#findUsernameBtn .btn-loader"),
      result: document.getElementById("findUsernameResult"),
      backBtn: document.getElementById("backToForgetFromFind"),
    },
    verify: {
      view: document.getElementById("verifyCodeView"),
      codeInput: document.getElementById("verificationCodeInput"),
      btn: document.getElementById("verifyCodeBtn"),
      btnText: document.querySelector("#verifyCodeBtn .btn-text"),
      loader: document.querySelector("#verifyCodeBtn .btn-loader"),
      resendBtn: document.getElementById("resendCodeBtn"),
      resendBtnText: document.querySelector("#resendCodeBtn .btn-text"),
      resendLoader: document.querySelector("#resendCodeBtn .btn-loader"),
      error: document.getElementById("verifyCodeError"),
      timerDisplay: document.getElementById("timerDisplay"),
      maskedEmailDisplay: document.getElementById("maskedEmailDisplay"),
      backBtn: document.getElementById("backToForgetFromVerify"),
    },
    reset: {
      view: document.getElementById("resetPasswordView"),
      newPassInput: document.getElementById("newPasswordInput"),
      confirmNewPassInput: document.getElementById("confirmNewPasswordInput"),
      btn: document.getElementById("resetPasswordBtn"),
      btnText: document.querySelector("#resetPasswordBtn .btn-text"),
      loader: document.querySelector("#resetPasswordBtn .btn-loader"),
      error: document.getElementById("resetPasswordError"),
    },
    payment: {
      section: document.getElementById("paymentSection"),
      studentName: document.getElementById("studentName"),
      bkashNumberInput: document.getElementById("bkashNumberInput"),
      trxIdInput: document.getElementById("trxIdInput"),
      verifyPaymentBtn: document.getElementById("verifyPaymentBtn"),
      verifyBtnText: document.querySelector("#verifyPaymentBtn .btn-text"),
      verifyBtnLoader: document.querySelector("#verifyPaymentBtn .btn-loader"),
      message: document.getElementById("paymentMessage"),
      closeBtn: document.querySelector("#paymentSection .close-modal-btn"),
    },
    dashboard: {
      mainContent: document.querySelector(".main-content"),
      logoutBtn: document.getElementById("dashboardLogoutBtn"),
      nameDisplay: document.getElementById("dashboardName"),
      ipDisplay: document.getElementById("dashboardIP"),
      lastLoginDisplay: document.getElementById("lastLoginInfo"),
      avatar: document.querySelector(".user-avatar"),
      navItems: document.querySelectorAll(".sidebar-nav .nav-item"),
    },
    welcomePage: {
      nameDisplay: document.getElementById("welcomeName"),
      statsContainer: document.getElementById("statsContainer"),
      calendarContainer: document.getElementById("calendarContainer"),
    },
    resultsPage: {
      container: document.getElementById("resultsPageContainer"),
      summaryContainer: document.getElementById("resultsSummaryContainer"),
      downloadBtn: document.getElementById("downloadResultBtn"),
    },
    questionBank: {
      container: document.getElementById("questionBankContainer"),
    },
    resources: { container: document.getElementById("resourcesContainer") },
    oldQuestions: {
      container: document.getElementById("oldQuestionsContainer"),
    },
    notice: { container: document.getElementById("noticeContainer") },
    groups: { container: document.getElementById("groupsContainer") },
    subjectsView: {
      section: document.getElementById("subjectsViewSection"),
      title: document.getElementById("subjectsViewTitle"),
      breadcrumb: document.getElementById("subjectsViewBreadcrumb"),
      wrapper: document.getElementById("subjectsViewWrapper"),
      backBtn: document.getElementById("backToWelcomeFromSubjects"),
    },
    detailsView: {
      section: document.getElementById("detailsViewSection"),
      title: document.getElementById("detailsViewTitle"),
      breadcrumb: document.getElementById("detailsViewBreadcrumb"),
      wrapper: document.getElementById("detailsViewWrapper"),
      backBtn: document.getElementById("backToWelcomeFromDetails"),
    },
    eventModal: {
      modal: document.getElementById("eventModal"),
      closeBtn: document.getElementById("closeEventModalBtn"),
      date: document.getElementById("eventModalDate"),
      body: document.getElementById("eventModalBody"),
    },
    securityOverlay: document.getElementById("securityOverlay"),
  };

  const showToast = (message, type = "info", duration = 4000) => {
    const toast = document.createElement("div");
    toast.className = `toast toast--${type}`;
    toast.innerHTML = `${message}<div class="toast-progress" style="animation-duration: ${
      duration * 0.9
    }ms;"></div>`;
    dom.toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.classList.add("closing");
      toast.addEventListener("animationend", () => toast.remove());
    }, duration);
  };
  const switchPage = (page) => {
    dom.mainWrapper.style.display = page === "login" ? "flex" : "none";
    dom.dashboardWrapper.classList.toggle("hidden", page !== "dashboard");
    if (dom.videoBackground)
      dom.videoBackground.style.display = page === "login" ? "block" : "none";
  };
  const switchLoginView = (viewId) => {
    document
      .querySelectorAll(".login-view")
      .forEach((v) => v.classList.remove("active-view"));
    const target = document.getElementById(viewId);
    if (target) target.classList.add("active-view");
    document
      .querySelectorAll(".login-view .error, .login-view .success")
      .forEach((el) => el.classList.add("hidden"));
  };
  const switchModal = (modalElement) => {
    document
      .querySelectorAll(".modal-view")
      .forEach((m) => m.classList.remove("active-view"));
    if (modalElement) {
      modalElement.classList.add("active-view");
      dom.modalBackdrop.classList.remove("hidden");
      document.body.classList.add("modal-open");
    } else {
      dom.modalBackdrop.classList.add("hidden");
      document.body.classList.remove("modal-open");
    }
  };
  const switchContentView = (viewId) => {
    document
      .querySelectorAll(".main-content .content-view")
      .forEach((v) => v.classList.remove("active-content"));
    const newView = document.getElementById(viewId);
    if (newView) newView.classList.add("active-content");
    const isSubView = ["subjectsViewSection", "detailsViewSection"].includes(
      viewId
    );
    dom.dashboard.navItems.forEach((item) => {
      item.classList.toggle(
        "active",
        isSubView
          ? item.dataset.view === "welcomeSection"
          : item.dataset.view === viewId
      );
    });
    if (window.innerWidth <= 992) dom.dashboardSidebar.classList.remove("open");
  };
  const showError = (message, element) => {
    element.innerHTML = message;
    element.className = "error";
    element.classList.remove("hidden");
  };
  const showSuccess = (message, element) => {
    element.innerHTML = message;
    element.className = "success";
    element.classList.remove("hidden");
  };
  const hideResult = (element) => {
    element.classList.add("hidden");
    element.className = "";
  };
  const setButtonState = (button, textSpan, loader, isLoading, text) => {
    button.disabled = isLoading;
    if (textSpan) textSpan.textContent = text;
    if (loader) loader.classList.toggle("hidden", !isLoading);
    if (textSpan) textSpan.classList.toggle("hidden", isLoading);
  };
  const updateIPDisplay = () => {
    dom.login.ipDisplay.innerHTML = `<strong>${
      appState.userIP || "N/A"
    }</strong> (Tracked)`;
    dom.dashboard.ipDisplay.textContent = `Device: ${appState.userIP || "N/A"}`;
  };
  const clearAllResetTimers = () => {
    if (appState.resetTimers.countdownTimer) {
        clearInterval(appState.resetTimers.countdownTimer);
        appState.resetTimers.countdownTimer = null;
    }
  };
  const initializePasswordToggles = () => {
    document.querySelectorAll(".password-toggle").forEach((button) => {
      button.innerHTML = eyeIconSVG;
      button.addEventListener("click", () => {
        const input = button.parentElement.querySelector("input");
        if (input.type === "password") {
          input.type = "text";
          button.innerHTML = eyeOffIconSVG;
        } else {
          input.type = "password";
          button.innerHTML = eyeIconSVG;
        }
      });
    });
  };

  function startCodeExpiryTimer(durationInSeconds) {
    clearAllResetTimers();
    let timer = durationInSeconds;
    const timerDisplay = dom.verify.timerDisplay;
    const resendBtn = dom.verify.resendBtn;
    const verifyBtn = dom.verify.btn;

    resendBtn.classList.add("hidden");
    verifyBtn.disabled = false;

    appState.resetTimers.countdownTimer = setInterval(() => {
        let minutes = parseInt(timer / 60, 10);
        let seconds = parseInt(timer % 60, 10);
        minutes = minutes < 10 ? "0" + minutes : minutes;
        seconds = seconds < 10 ? "0" + seconds : seconds;
        timerDisplay.textContent = `Code expires in: ${minutes}:${seconds}`;
        if (--timer < 0) {
            clearInterval(appState.resetTimers.countdownTimer);
            timerDisplay.textContent = "Code has expired!";
            resendBtn.classList.remove("hidden");
            verifyBtn.disabled = true;
        }
    }, 1000);
  }

  async function handleResendCode() {
      hideResult(dom.verify.error);
      const username = appState.resetState.currentUsername;
      if (!username) {
          showError("Username not found. Please go back.", dom.verify.error);
          return;
      }
      setButtonState(
        dom.verify.resendBtn,
        dom.verify.resendBtnText,
        dom.verify.resendLoader,
        true,
        "RESENDING..."
      );
      try {
          const sendCodeFunction = httpsCallable(
            functions,
            "sendPasswordResetCode"
          );
          const result = await sendCodeFunction({ username });
          if (result.data.success) {
              showToast("A new verification code has been sent.", "success");
              startCodeExpiryTimer(120);
          } else {
              throw new Error(result.data.message || "Failed to resend code.");
          }
      } catch (error) {
          showError(error.message, dom.verify.error);
      } finally {
          setButtonState(
            dom.verify.resendBtn,
            dom.verify.resendBtnText,
            dom.verify.resendLoader,
            false,
            "Resend Code"
          );
      }
  }

  const renderDashboard = () => {
    const studentName = appState.currentStudent.name || "Student";
    dom.dashboard.nameDisplay.textContent = studentName;
    dom.dashboard.avatar.textContent = studentName.charAt(0).toUpperCase();
    dom.welcomePage.nameDisplay.textContent = studentName;
    const lastSeen =
      appState.currentStudent.devices &&
      appState.currentStudent.devices[appState.deviceFingerprint]
        ? new Date(
            appState.currentStudent.devices[appState.deviceFingerprint].lastSeen
          ).toLocaleString()
        : "First time!";
    dom.dashboard.lastLoginDisplay.textContent = `Last login: ${lastSeen}`;
    updateIPDisplay();
    
    processEvents();
    renderWelcomePageContent();
    renderResultsPage();
    renderQuestionBank();
    renderResources();
    renderOldQuestions();
    renderNoticeBoard();
    renderGroupsPage();

    switchPage("dashboard");
    switchContentView("welcomeSection");
  };

  const handleLogin = async () => {
    const username = dom.login.userInput.value.trim().toLowerCase();
    const password = dom.login.passInput.value;
    hideResult(dom.login.error);
    if (!username || !password)
      return showError("Username and password required.", dom.login.error);
    setButtonState(
      dom.login.btn,
      dom.login.btnText,
      dom.login.loader,
      true,
      "VERIFYING..."
    );
    try {
      const usernameSnapshot = await sdk.get(
        sdk.ref(mainDb, `usernames/${username}`)
      );
      if (!usernameSnapshot.exists())
        throw new Error("Invalid username or password.");
      const studentId = usernameSnapshot.val();
      const studentSnapshot = await sdk.get(
        sdk.ref(mainDb, `students/${studentId}`)
      );
      if (!studentSnapshot.exists()) throw new Error("Account data not found.");
      const studentData = studentSnapshot.val();
      if (!studentData.password)
        throw new Error("Account not fully created. Please register first.");
      const hashedPassword = await sha256(password);
      if (studentData.password !== hashedPassword)
        throw new Error("Invalid username or password.");
      const classId = studentData.classId;
      if (!classId)
        throw new Error(
          "Your account is not assigned to any class. Please contact your admin."
        );
      const classSnapshot = await sdk.get(
        sdk.ref(mainDb, `classes/${classId}`)
      );
      if (!classSnapshot.exists())
        throw new Error(`Data for your class (${classId}) could not be found.`);
      appState.currentStudent = { id: studentId, ...studentData };
      appState.portalData = classSnapshot.val();
      if (!studentData.paid) {
        dom.payment.studentName.textContent = studentData.name;
        switchModal(dom.payment.section);
        setButtonState(
          dom.login.btn,
          dom.login.btnText,
          dom.login.loader,
          false,
          "LOGIN"
        );
        return;
      }
      const devices = studentData.devices || {};
      const maxDeviceLimit = studentData.maxDeviceLimit ?? 1;
      const deviceRef = sdk.ref(
        mainDb,
        `students/${studentId}/devices/${appState.deviceFingerprint}`
      );
      if (
        !devices[appState.deviceFingerprint] &&
        Object.keys(devices).length >= maxDeviceLimit
      )
        throw new Error(`Max device limit of ${maxDeviceLimit} reached.`);
      await sdk.update(deviceRef, {
        lastSeen: new Date().toISOString(),
        lastIP: appState.userIP,
      });
      renderDashboard();
    } catch (error) {
      showError(error.message, dom.login.error);
      setButtonState(
        dom.login.btn,
        dom.login.btnText,
        dom.login.loader,
        false,
        "LOGIN"
      );
    }
  };
  const handleCreateAccount = async () => {
    hideResult(dom.create.error);
    const studentId = dom.create.idInput.value.trim();
    const username = dom.create.userInput.value.trim().toLowerCase();
    const email = dom.create.emailInput.value.trim();
    const password = dom.create.passInput.value;
    const confirmPassword = dom.create.confirmPassInput.value;
    if (!studentId || !username || !email || !password)
      return showError("All fields are required.", dom.create.error);
    if (password !== confirmPassword)
      return showError("Passwords do not match.", dom.create.error);
    setButtonState(
      dom.create.btn,
      dom.create.btnText,
      dom.create.loader,
      true,
      "VERIFYING..."
    );
    try {
      const studentSnapshot = await sdk.get(
        sdk.ref(mainDb, `students/${studentId}`)
      );
      if (!studentSnapshot.exists())
        throw new Error(
          "This Student ID is not registered. Please contact your CR."
        );
      if (studentSnapshot.val().username)
        throw new Error(
          "An account for this Student ID has already been created."
        );
      const usernameSnapshot = await sdk.get(
        sdk.ref(mainDb, `usernames/${username}`)
      );
      if (usernameSnapshot.exists())
        throw new Error(`The username "${username}" is already taken.`);
      setButtonState(
        dom.create.btn,
        dom.create.btnText,
        dom.create.loader,
        true,
        "CREATING ACCOUNT..."
      );
      const hashedPassword = await sha256(password);
      const updates = {};
      updates[`/students/${studentId}/username`] = username;
      updates[`/students/${studentId}/email`] = email;
      updates[`/students/${studentId}/password`] = hashedPassword;
      updates[`/usernames/${username}`] = studentId;
      await sdk.update(sdk.ref(mainDb), updates);
      showToast("Account created successfully! You can now log in.", "success");
      dom.create.idInput.value = "";
      dom.create.userInput.value = "";
      dom.create.emailInput.value = "";
      dom.create.passInput.value = "";
      dom.create.confirmPassInput.value = "";
      switchLoginView("loginView");
    } catch (error) {
      showError(error.message, dom.create.error);
    } finally {
      setButtonState(
        dom.create.btn,
        dom.create.btnText,
        dom.create.loader,
        false,
        "Create Account"
      );
    }
  };
  const handleForgetPassword = async () => {
    hideResult(dom.forget.error);
    const username = dom.forget.userInput.value.trim().toLowerCase();
    if (!username)
      return showError("Please enter your username.", dom.forget.error);

    setButtonState(
      dom.forget.btn,
      dom.forget.btnText,
      dom.forget.loader,
      true,
      "SENDING..."
    );

    try {
      const sendCodeFunction = httpsCallable(
        functions,
        "sendPasswordResetCode"
      );
      const result = await sendCodeFunction({ username: username });

      if (result.data.success) {
        appState.resetState.currentUsername = username;
        dom.verify.maskedEmailDisplay.textContent = result.data.email;
        startCodeExpiryTimer(120);
        switchLoginView("verifyCodeView");
        showToast("Verification code sent to your email.", "success");
      } else {
        throw new Error(result.data.message || "Failed to send code.");
      }
    } catch (error) {
      console.error("Forgot Password Error:", error);
      showError(error.message, dom.forget.error);
    } finally {
      setButtonState(
        dom.forget.btn,
        dom.forget.btnText,
        dom.forget.loader,
        false,
        "Send Verification Code"
      );
    }
  };
  const handleVerifyCode = async () => {
    hideResult(dom.verify.error);
    const code = dom.verify.codeInput.value.trim();
    const username = appState.resetState.currentUsername;

    if (!code || code.length !== 6) {
      return showError("Please enter the 6-digit code.", dom.verify.error);
    }
    if (!username) {
      return showError("Session expired. Please start over.", dom.verify.error);
    }

    setButtonState(
      dom.verify.btn,
      dom.verify.btnText,
      dom.verify.loader,
      true,
      "VERIFYING..."
    );

    try {
      const verifyCodeFunction = httpsCallable(functions, "verifyResetCode");
      const result = await verifyCodeFunction({ username, code });

      if (result.data.success) {
        appState.resetState.currentStudentId = result.data.studentId;
        clearAllResetTimers();
        switchLoginView("resetPasswordView");
      } else {
        throw new Error(result.data.message || "Verification failed.");
      }
    } catch (error) {
      console.error("Verify Code Error:", error);
      showError(error.message, dom.verify.error);
    } finally {
      setButtonState(
        dom.verify.btn,
        dom.verify.btnText,
        dom.verify.loader,
        false,
        "Verify Code"
      );
    }
  };
  const handleResetPassword = async () => {
    hideResult(dom.reset.error);
    const newPassword = dom.reset.newPassInput.value;
    const confirmPassword = dom.reset.confirmNewPassInput.value;
    const studentId = appState.resetState.currentStudentId;

    if (!newPassword || !confirmPassword) {
      return showError("Please fill both password fields.", dom.reset.error);
    }
    if (newPassword.length < 8) {
      return showError(
        "Password must be at least 8 characters long.",
        dom.reset.error
      );
    }
    if (newPassword !== confirmPassword) {
      return showError("Passwords do not match.", dom.reset.error);
    }
    if (!studentId) {
      return showError(
        "Invalid session. Please start the process again.",
        dom.reset.error
      );
    }

    setButtonState(
      dom.reset.btn,
      dom.reset.btnText,
      dom.reset.loader,
      true,
      "RESETTING..."
    );

    try {
      const newPasswordHash = await sha256(newPassword);
      const resetPasswordFunction = httpsCallable(functions, "resetPassword");
      const result = await resetPasswordFunction({
        studentId,
        newPasswordHash,
      });

      if (result.data.success) {
        showToast(
          "Password has been reset successfully! You can now log in.",
          "success"
        );
        dom.reset.newPassInput.value = "";
        dom.reset.confirmNewPassInput.value = "";
        switchLoginView("loginView");
        appState.resetState = { currentUsername: null, currentStudentId: null };
      } else {
        throw new Error(result.data.message || "Failed to reset password.");
      }
    } catch (error) {
      console.error("Reset Password Error:", error);
      showError(error.message, dom.reset.error);
    } finally {
      setButtonState(
        dom.reset.btn,
        dom.reset.btnText,
        dom.reset.loader,
        false,
        "Reset Password"
      );
    }
  };
  const createDashboardCard = (config) => {
    const el = document.createElement(
      config.href && config.href !== "#" ? "a" : "button"
    );
    el.className = "stat-card interactive";
    if (config.id) el.id = config.id;
    if (config.href && config.href !== "#") {
      el.href = config.href;
      el.target = "_blank";
    } else {
      el.type = "button";
      if (config.onClick) el.addEventListener("click", config.onClick);
    }
    if (config.disabled) {
      el.classList.add("disabled");
      el.addEventListener("click", (e) => {
        e.preventDefault();
        showToast(config.disabledMessage, "info");
      });
    }
    el.innerHTML = `<div class="stat-icon">${config.icon}</div><div class="stat-info"><div class="stat-title">${config.title}</div><div class="stat-value">${config.value}</div></div>`;
    return el;
  };
  const renderWelcomePageContent = () => {
    const container = dom.welcomePage.statsContainer;
    container.innerHTML = "";
    const courses = appState.portalData.courses || {};
    let theoryCount = 0,
      sessionalCount = 0,
      labCount = 0;
    Object.values(courses).forEach((c) => {
      if (c.assignments) {
        if (c.type === "theory")
          theoryCount += Object.keys(c.assignments).length;
        else sessionalCount += Object.keys(c.assignments).length;
      }
      if (c.labReports) labCount += Object.keys(c.labReports).length;
    });
    const routineLink = appState.portalData.routineLink || "#";
    const cards = [
      {
        id: "subjectsCard",
        icon: "📚",
        title: "TOTAL SUBJECTS",
        value: Object.keys(courses).length,
        onClick: renderSubjectsView,
      },
      {
        id: "theoryAssignmentsCard",
        icon: "📝",
        title: "ASSIGNMENTS (THEORY)",
        value: theoryCount,
        onClick: () =>
          renderDetailsView({ type: "assignments", filter: "theory" }),
      },
      {
        id: "sessionalAssignmentsCard",
        icon: "📋",
        title: "ASSIGNMENTS (SESSIONAL)",
        value: sessionalCount,
        onClick: () =>
          renderDetailsView({ type: "assignments", filter: "sessional" }),
      },
      {
        id: "labReportsCard",
        icon: "🔬",
        title: "LAB REPORTS",
        value: labCount,
        onClick: renderLabReportSubjectSelectionView,
      },
      {
        id: "advisorCard",
        icon: "👩‍🏫",
        title: "COURSE ADVISOR",
        value: "View Information",
        onClick: () => renderAdvisorsView(),
      },
      {
        id: "routineCard",
        icon: "📅",
        title: "CLASS ROUTINE",
        value: "View & Download",
        href: routineLink,
        disabled: !routineLink || routineLink === "#",
        disabledMessage: "Routine link not available.",
      },
    ];
    cards.forEach((cardConf, i) => {
      const card = createDashboardCard(cardConf);
      card.style.animation = `card-entry 0.6s ease-out ${i * 0.1}s forwards`;
      container.appendChild(card);
    });
    renderCalendar();
  };
  const renderSubjectsView = () => {
    dom.subjectsView.title.textContent = "All Registered Subjects";
    dom.subjectsView.breadcrumb.textContent =
      "Dashboard / Welcome / All Subjects";
    const wrapper = dom.subjectsView.wrapper;
    wrapper.innerHTML = "";
    const grid = document.createElement("div");
    grid.className = "card-grid-container";
    const courses = appState.portalData.courses || {};
    Object.keys(courses)
      .sort()
      .forEach((key) => {
        const subject = courses[key];
        const wrapperDiv = document.createElement("div");
        wrapperDiv.className = "subject-card-wrapper";
        const card = document.createElement("div");
        card.className = "subject-display-card interactive";
        card.innerHTML = `<div class="card-icon-wrapper">${getIconForSubject(
          subject.courseCode
        )}</div><div class="card-info-wrapper"><div class="card-subject-code">${
          subject.courseCode
        }</div><div class="card-subject-name">${
          subject.courseName
        }</div><div class="card-subject-type">${
          subject.type
        }</div></div><div class="card-arrow">›</div>`;
        let detailsPanel = null;
        if (
          (subject.teacherInfo && subject.teacherInfo.name) ||
          (subject.teacherInfo2 && subject.teacherInfo2.name)
        ) {
          detailsPanel = document.createElement("div");
          detailsPanel.className = "teacher-details-panel";
          const createTeacherHTML = (t, title) =>
            t && t.name
              ? `<div class="teacher-info-block"><h4>${title}</h4><ul><li><strong>Name:</strong> <span>${
                  t.name
                }</span></li><li><strong>Designation:</strong> <span>${
                  t.designation
                }</span></li><li><strong>Department:</strong> <span>${
                  t.department || "N/A"
                }</span></li><li><strong>Phone:</strong> <span>${
                  t.phone || "N/A"
                }</span></li></ul></div>`
              : "";
          let content = createTeacherHTML(
            subject.teacherInfo,
            "Course Teacher"
          );
          if (
            subject.teacherInfo &&
            subject.teacherInfo.name &&
            subject.teacherInfo2 &&
            subject.teacherInfo2.name
          )
            content += `<hr class="teacher-separator">`;
          content += createTeacherHTML(
            subject.teacherInfo2,
            "Course Teacher 2"
          );
          detailsPanel.innerHTML = content;
        }
        card.addEventListener("click", () => {
          document
            .querySelectorAll(".subject-card-wrapper")
            .forEach((other) => {
              if (other !== wrapperDiv) {
                other
                  .querySelector(".subject-display-card")
                  .classList.remove("active");
                const p = other.querySelector(".teacher-details-panel");
                if (p) p.style.maxHeight = "0";
              }
            });
          if (detailsPanel) {
            const isActive = card.classList.toggle("active");
            detailsPanel.style.maxHeight = isActive
              ? `${detailsPanel.scrollHeight}px`
              : "0";
          }
        });
        wrapperDiv.appendChild(card);
        if (detailsPanel) wrapperDiv.appendChild(detailsPanel);
        grid.appendChild(wrapperDiv);
      });
    wrapper.appendChild(grid);
    switchContentView("subjectsViewSection");
  };

  const renderLabReportSubjectSelectionView = () => {
    dom.detailsView.title.textContent = "Select Subject for Lab Reports";
    dom.detailsView.breadcrumb.textContent = "Dashboard / Welcome / Lab Reports";
    const wrapper = dom.detailsView.wrapper;
    wrapper.innerHTML = "";
  
    const grid = document.createElement("div");
    grid.className = "card-grid-container"; 
  
    const courses = appState.portalData.courses || {};
    const sessionalCoursesWithLabs = Object.keys(courses).filter(key =>
      courses[key].type === 'sessional' && courses[key].labReports
    );
  
    if (sessionalCoursesWithLabs.length === 0) {
      grid.innerHTML = `<p class="no-items-message">No subjects with lab reports found.</p>`;
    } else {
      sessionalCoursesWithLabs.sort().forEach(courseId => {
        const subject = courses[courseId];
        const card = document.createElement("button");
        card.className = "subject-selection-card";
        card.onclick = () => renderLabReportsForSubject(courseId);
  
        card.innerHTML = `
          <div class="card-icon-wrapper">${getIconForSubject(subject.courseCode)}</div>
          <div class="card-info-wrapper">
            <div class="card-subject-code">${subject.courseCode}</div>
            <div class="card-subject-name">${subject.courseName}</div>
          </div>
          <div class="card-arrow">›</div>
        `;
        grid.appendChild(card);
      });
    }
  
    wrapper.appendChild(grid);
    dom.detailsView.backBtn.onclick = () => switchContentView("welcomeSection");
    switchContentView("detailsViewSection");
  };
  
  const renderLabReportsForSubject = (courseId) => {
      const subject = appState.portalData.courses[courseId];
      if (!subject) return;
  
      dom.detailsView.title.textContent = subject.courseName;
      dom.detailsView.breadcrumb.textContent = `Dashboard / Welcome / Lab Reports / ${subject.courseCode}`;
      const wrapper = dom.detailsView.wrapper;
      wrapper.innerHTML = "";
  
      const labs = subject.labReports || {};
      const items = [];
      const listIcon = "🔬";
  
      Object.values(labs).forEach(lab => {
          items.push(
            `<li class="detail-list-item">
               <div class="detail-icon">${listIcon}</div>
               <div class="detail-content">
                 <div class="detail-title">${lab.experimentName}</div>
                 <div class="detail-meta">
                   <span>🧪 Exp. Date: <strong>${lab.experimentDate || 'N/A'}</strong></span>
                   <span>📅 Submit Date: <strong>${lab.submissionDate}</strong></span>
                 </div>
               </div>
             </li>`
          );
      });
  
      const list = document.createElement("ul");
      list.className = "details-list-container";
      list.innerHTML = items.length > 0
          ? items.join("")
          : `<li class="detail-list-item no-items">No lab reports found for this subject.</li>`;
  
      wrapper.appendChild(list);
      
      dom.detailsView.backBtn.onclick = renderLabReportSubjectSelectionView;
      switchContentView("detailsViewSection");
  };

  const renderDetailsView = (config) => {
    dom.detailsView.wrapper.innerHTML = "";
    const { type, filter } = config;
    let pageTitle = "",
      breadcrumbText = "",
      items = [],
      listIcon = "",
      itemTitle = "";
    const courses = appState.portalData.courses || {};
  
    if (type === "assignments") {
      itemTitle = `${
        filter.charAt(0).toUpperCase() + filter.slice(1)
      } Assignments`;
      listIcon = filter === "theory" ? "📝" : "📋";
      pageTitle = `All ${itemTitle}`;
      breadcrumbText = `Dashboard / Welcome / ${itemTitle}`;
      Object.values(courses)
        .filter((c) => c.type === filter && c.assignments)
        .forEach((subject) => {
          Object.values(subject.assignments).forEach((asm) => {
            items.push(
              `<li class="detail-list-item"><div class="detail-icon">${listIcon}</div><div class="detail-content"><div class="detail-title">${asm.name}</div><div class="detail-meta"><span><strong>${subject.courseCode}</strong></span><span>📅 Submit Date: <strong>${asm.submissionDate}</strong></span></div></div></li>`
            );
          });
        });
    }
    const list = document.createElement("ul");
    list.className = "details-list-container";
    list.innerHTML =
      items.length > 0
        ? items.join("")
        : `<li class="detail-list-item no-items">No ${itemTitle.toLowerCase()} found.</li>`;
    dom.detailsView.title.textContent = pageTitle;
    dom.detailsView.breadcrumb.textContent = breadcrumbText;
    dom.detailsView.wrapper.appendChild(list);
    dom.detailsView.backBtn.onclick = () => switchContentView("welcomeSection");
    switchContentView("detailsViewSection");
  };

  const renderAdvisorsView = () => {
    dom.detailsView.title.textContent = "Course Advisor Information";
    dom.detailsView.breadcrumb.textContent =
      "Dashboard / Welcome / Course Advisor";
    const wrapper = dom.detailsView.wrapper;
    wrapper.innerHTML = "";
    const advisors = appState.portalData.courseAdvisors || {};
    const grid = document.createElement("div");
    grid.className = "advisor-grid-container";
    if (Object.keys(advisors).length === 0)
      grid.innerHTML = `<p class="no-items-message">No course advisor information is available for your class.</p>`;
    else
      Object.values(advisors).forEach((advisor) => {
        grid.innerHTML += `<div class="advisor-card"><div class="advisor-header"><div class="advisor-avatar">${advisor.name.charAt(
          0
        )}</div><div class="advisor-info"><h2 class="advisor-name">${
          advisor.name
        }</h2><p class="advisor-designation">${
          advisor.designation
        }</p></div></div><div class="advisor-body"><ul class="advisor-contact-list"><li><strong>Department:</strong> <span>${
          advisor.department
        }</span></li><li><strong>Mobile:</strong> <span><a href="tel:${
          advisor.phone
        }">${
          advisor.phone
        }</a></span></li><li><strong>Email:</strong> <span><a href="mailto:${
          advisor.email
        }">${advisor.email}</a></span></li></ul></div></div>`;
      });
    wrapper.appendChild(grid);
    dom.detailsView.backBtn.onclick = () => switchContentView("welcomeSection");
    switchContentView("detailsViewSection");
  };
  const renderResultsPage = () => {
    const container = dom.resultsPage.container;
    const summaryContainer = dom.resultsPage.summaryContainer;
    container.innerHTML = "";
    summaryContainer.innerHTML = "";
    const courses = appState.portalData.courses || {};
    const allResults = appState.portalData.results || {};
    const studentId = appState.currentStudent.id;
    const studentMarks = [];
    Object.keys(courses)
      .sort()
      .forEach((courseId) => {
        const course = courses[courseId];
        if (course.type === "theory") {
          const result = allResults[courseId]
            ? allResults[courseId][studentId]
            : null;
          const marks = {
            courseCode: course.courseCode,
            courseName: course.courseName,
            ct1: result ? result.ct1 ?? "N/A" : "N/A",
            ct2: result ? result.ct2 ?? "N/A" : "N/A",
            ct3: result ? result.ct3 ?? "N/A" : "N/A",
            midterm: result ? result.midterm ?? "N/A" : "N/A",
            attendance: result ? result.attendance ?? "N/A" : "N/A",
            total: result ? result.total ?? "N/A" : "N/A",
          };
          studentMarks.push(marks);
        }
      });
    if (studentMarks.length === 0) {
      container.innerHTML =
        '<p class="no-items-message">No theory course results are available yet.</p>';
      return;
    }
    let highest = { score: -1, subject: "N/A" };
    let lowest = { score: 1000, subject: "N/A" };
    let totalAttendance = 0;
    let attendanceCount = 0;
    studentMarks.forEach((mark) => {
      if (typeof mark.total === "number") {
        if (mark.total > highest.score) {
          highest.score = mark.total;
          highest.subject = mark.courseName;
        }
        if (mark.total < lowest.score) {
          lowest.score = mark.total;
          lowest.subject = mark.courseName;
        }
      }
      if (typeof mark.attendance === "number") {
        totalAttendance += mark.attendance;
        attendanceCount++;
      }
    });
    const avgAttendance =
      attendanceCount > 0
        ? (totalAttendance / attendanceCount).toFixed(2)
        : "N/A";
    summaryContainer.innerHTML = `<div class="summary-stat-card"><div class="summary-stat-icon">🏆</div><div class="summary-stat-info"><div class="summary-stat-title">Highest Score</div><div class="summary-stat-value">${
      highest.score > -1 ? highest.score.toFixed(2) : "N/A"
    }</div><div class="summary-stat-subject">${
      highest.subject
    }</div></div></div><div class="summary-stat-card"><div class="summary-stat-icon">📉</div><div class="summary-stat-info"><div class="summary-stat-title">Lowest Score</div><div class="summary-stat-value">${
      lowest.score < 1000 ? lowest.score.toFixed(2) : "N/A"
    }</div><div class="summary-stat-subject">${
      lowest.subject
    }</div></div></div><div class="summary-stat-card"><div class="summary-stat-icon">📈</div><div class="summary-stat-info"><div class="summary-stat-title">Average Attendance</div><div class="summary-stat-value">${avgAttendance}%</div><div class="summary-stat-subject">Across all subjects</div></div></div>`;
    let tableHTML = `<table class="result-table"><thead><tr><th>Subject Name</th><th>CT-1</th><th>CT-2</th><th>CT-3</th><th>Midterm</th><th>Attendance</th><th>Total Marks (120)</th></tr></thead><tbody>`;
    studentMarks.forEach((mark) => {
      tableHTML += `<tr><td data-label="Subject"><div class="subject-cell-name">${
        mark.courseName
      }</div><div class="subject-cell-code">${
        mark.courseCode
      }</div></td><td data-label="CT-1">${mark.ct1}</td><td data-label="CT-2">${
        mark.ct2
      }</td><td data-label="CT-3">${mark.ct3}</td><td data-label="Midterm">${
        mark.midterm
      }</td><td data-label="Attendance">${
        typeof mark.attendance === "number"
          ? mark.attendance.toFixed(2) + "%"
          : "N/A"
      }</td><td data-label="Total"><strong>${
        typeof mark.total === "number" ? mark.total.toFixed(2) : "N/A"
      }</strong></td></tr>`;
    });
    tableHTML += "</tbody></table>";
    container.innerHTML = tableHTML;
  };
  const renderQuestionBank = () => {
    const container = dom.questionBank.container;
    container.innerHTML = "";
    const courses = appState.portalData.courses || {};
    const theoryCourses = Object.values(courses).filter(
      (c) => c.type === "theory" && c.ctQuestions
    );
    if (theoryCourses.length === 0) {
      container.innerHTML =
        '<p class="no-items-message">No question links available.</p>';
      return;
    }
    theoryCourses.forEach((subject) => {
      const accordionItem = document.createElement("div");
      accordionItem.className = "subject-accordion";
      accordionItem.innerHTML = `<div class="accordion-header">${getIconForSubject(
        subject.courseCode
      )} <span class="accordion-title">${subject.courseName} (${
        subject.courseCode
      })</span></div><div class="accordion-content" style="display:none;"><div class="ct-grid"></div><div class="midterm-section"></div></div>`;
      const content = accordionItem.querySelector(".accordion-content");
      const ctGrid = content.querySelector(".ct-grid");
      const midtermSection = content.querySelector(".midterm-section");
      const createLinkCard = (url, inner) =>
        `<a href="${url || "#"}" target="_blank" class="ct-card ${
          !url ? "disabled" : ""
        }">${inner}</a>`;
      Object.keys(subject.ctQuestions).forEach((key) => {
        if (key.startsWith("CT"))
          ctGrid.innerHTML += createLinkCard(
            subject.ctQuestions[key],
            `<div class="ct-number">${key.replace(
              "CT",
              ""
            )}</div><div class="ct-title">Class Test ${key.replace(
              "CT",
              ""
            )}</div>`
          );
      });
      midtermSection.innerHTML = `<a href="${
        subject.ctQuestions.Midterm || "#"
      }" target="_blank" class="special-card ${
        !subject.ctQuestions.Midterm ? "disabled" : ""
      }"><div class="card-icon">📋</div><div class="card-title">Midterm</div></a>`;
      accordionItem
        .querySelector(".accordion-header")
        .addEventListener("click", (e) => {
          e.currentTarget.classList.toggle("active");
          content.style.display =
            content.style.display === "block" ? "none" : "block";
        });
      container.appendChild(accordionItem);
    });
  };
  const renderResources = () => {
    const container = dom.resources.container;
    container.innerHTML = "";
    const courses = appState.portalData.courses || {};
    const coursesWithRes = Object.values(courses).filter((c) => c.resources);
    if (coursesWithRes.length === 0) {
      container.innerHTML =
        '<p class="no-items-message">No resources found.</p>';
      return;
    }
    coursesWithRes.forEach((subject) => {
      const accordionItem = document.createElement("div");
      accordionItem.className = "subject-accordion";
      accordionItem.innerHTML = `<div class="accordion-header">${getIconForSubject(
        subject.courseCode
      )} <span class="accordion-title">${subject.courseName} (${
        subject.courseCode
      })</span></div><div class="accordion-content" style="display:none;"><div class="resource-list"></div></div>`;
      const content = accordionItem.querySelector(".accordion-content");
      const resList = content.querySelector(".resource-list");
      Object.values(subject.resources).forEach((res) => {
        resList.innerHTML += `<a href="${
          res.url || "#"
        }" target="_blank" class="resource-item ${
          !res.url ? "disabled" : ""
        }"><div class="resource-item-info"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg><span>${
          res.topic
        }</span></div><span class="status-badge available">View</span></a>`;
      });
      accordionItem
        .querySelector(".accordion-header")
        .addEventListener("click", (e) => {
          e.currentTarget.classList.toggle("active");
          content.style.display =
            content.style.display === "block" ? "none" : "block";
        });
      container.appendChild(accordionItem);
    });
  };
  const renderOldQuestions = () => {
    const container = dom.oldQuestions.container;
    container.innerHTML = "";
    const questions = appState.portalData.oldQuestions || {};
    if (Object.keys(questions).length === 0) {
      container.innerHTML =
        '<p class="no-items-message">No old questions found.</p>';
      return;
    }
    Object.values(questions).forEach((item) => {
      const link = document.createElement("a");
      link.className = "note-link";
      if (item.url) link.href = item.url;
      link.target = "_blank";
      link.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg><span>${item.title}</span>`;
      container.appendChild(link);
    });
  };
  const renderNoticeBoard = () => {
    const container = dom.notice.container;
    container.innerHTML = "";
    const notices = appState.portalData.notices || {};
    if (Object.keys(notices).length === 0) {
      container.innerHTML =
        '<p class="no-items-message">No new notices for your class.</p>';
      return;
    }
    Object.values(notices).forEach((notice) => {
      const card = document.createElement("div");
      card.className = "notice-card";
      card.innerHTML = `<p class="notice-date">${notice.date}</p><h3 class="notice-title">${notice.title}</h3><p class="notice-content">${notice.content}</p>`;
      container.appendChild(card);
    });
  };
  const renderGroupsPage = () => {
    const container = dom.groups.container;
    container.innerHTML = "";
    const groups = appState.portalData.groupLinks || {};
    Object.values(groups).forEach((group) => {
      const card = document.createElement("a");
      card.href = group.url;
      card.target = "_blank";
      card.className = "group-card";
      card.innerHTML = `<img src="${group.icon}" alt="${group.type} Logo" class="brand-icon"><div class="group-card-info"><div class="group-title">${group.name}</div><div class="group-type">Join via ${group.type}</div></div>`;
      container.appendChild(card);
    });
  };
  const processEvents = () => {
    appState.eventsByDate = {};
    const courses = appState.portalData.courses || {};
    const calendarEvents = appState.portalData.calendarEvents || {};
    for (const courseKey in courses) {
      const subject = courses[courseKey];
      const processItems = (items, typeClass, typeLabel) => {
        if (!items) return;
        Object.values(items).forEach((item) => {
          const dateStr = item.submissionDate;
          if (!dateStr || (!item.name && !item.experimentName)) return;
          try {
            const dateParts = dateStr.split("/");
            if (dateParts.length !== 3) return;
            const eventDate = new Date(
              dateParts[2],
              dateParts[1] - 1,
              dateParts[0]
            );
            if (isNaN(eventDate.getTime())) return;
            const formattedDate = formatDateToKey(eventDate);
            if (!appState.eventsByDate[formattedDate])
              appState.eventsByDate[formattedDate] = [];
            appState.eventsByDate[formattedDate].push({
              name: item.name || item.experimentName,
              subjectName: `${subject.courseName} (${subject.courseCode})`,
              typeClass,
              typeLabel,
            });
          } catch (e) {
            console.warn(`Could not parse date: ${dateStr}`);
          }
        });
      };
      processItems(
        subject.assignments,
        subject.type === "theory"
          ? "assignment-theory"
          : "assignment-sessional",
        `Assignment (${subject.type})`
      );
      //processItems(subject.labReports, "lab-report", "Lab Report");
    }
    Object.values(calendarEvents).forEach((event) => {
      if (!event.date) return;
      const formattedDate = event.date;
      if (!appState.eventsByDate[formattedDate])
        appState.eventsByDate[formattedDate] = [];
      const type = event.type || "notice";
      appState.eventsByDate[formattedDate].push({
        name: event.title,
        subjectName: event.description || "",
        typeClass: `event-${type}`,
        typeLabel: type.charAt(0).toUpperCase() + type.slice(1),
      });
    });
  };
  const renderCalendar = () => {
    const container = dom.welcomePage.calendarContainer;
    if (!container) return;
    const date = appState.calendarDate;
    const currentYear = date.getFullYear();
    const currentMonth = date.getMonth();
    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December",
    ];
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    let calendarHTML = `<div class="calendar-header"><div class="calendar-nav"><button id="prevMonthBtn">‹</button></div><h2>${monthNames[currentMonth]} ${currentYear}</h2><div class="calendar-nav"><button id="nextMonthBtn">›</button></div></div><div class="calendar-grid">`;
    dayNames.forEach((day) => {
      calendarHTML += `<div class="calendar-day-header">${day}</div>`;
    });
    for (let i = 0; i < firstDayOfMonth; i++) {
      calendarHTML += `<div class="calendar-day other-month"></div>`;
    }
    const todayKey = formatDateToKey(new Date());
    for (let day = 1; day <= daysInMonth; day++) {
      const formattedDate = formatDateToKey(
        new Date(currentYear, currentMonth, day)
      );
      let classes = "calendar-day";
      if (formattedDate === todayKey) classes += " today";
      if (appState.eventsByDate[formattedDate]) classes += " has-event";
      calendarHTML += `<div class="${classes}" data-date="${formattedDate}">${day}</div>`;
    }
    calendarHTML += `</div>`;
    container.innerHTML = calendarHTML;
    document.getElementById("prevMonthBtn").addEventListener("click", () => {
      appState.calendarDate.setMonth(appState.calendarDate.getMonth() - 1);
      renderCalendar();
    });
    document.getElementById("nextMonthBtn").addEventListener("click", () => {
      appState.calendarDate.setMonth(appState.calendarDate.getMonth() + 1);
      renderCalendar();
    });
    container.querySelectorAll(".has-event").forEach((cell) => {
      cell.addEventListener("click", () => showEventModal(cell.dataset.date));
    });
  };
  const showEventModal = (dateStr) => {
    const events = appState.eventsByDate[dateStr];
    if (!events || events.length === 0) return;
    const dateParts = dateStr.split("-");
    const date = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
    dom.eventModal.date.textContent = date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    dom.eventModal.body.innerHTML = events
      .map(
        (event) =>
          `<div class="event-item ${event.typeClass}"><div class="event-item-title">${event.name}</div><div class="event-item-type">${event.typeLabel}</div><div class="event-item-subject">${event.subjectName}</div></div>`
      )
      .join("");
    dom.eventModal.modal.classList.remove("hidden");
  };
  const getDeviceAndNetworkInfo = async () => {
    setButtonState(
      dom.login.btn,
      dom.login.btnText,
      dom.login.loader,
      true,
      "INITIALIZING..."
    );
    const fetchIP = async () => {
      try {
        const response = await fetch("https://api.ipify.org?format=json", {
          signal: AbortSignal.timeout(5000),
        });
        return response.ok ? (await response.json()).ip : "Unavailable";
      } catch {
        return "Unavailable";
      }
    };
    const generateFingerprint = async () => {
      const components = [
        `ua:${navigator.userAgent || "N/A"}`,
        `lang:${navigator.language || "N/A"}`,
        `screen:${screen.width || 0}x${screen.height || 0}`,
      ];
      return `customfp_${await sha256(components.join("||"))}`;
    };
    [appState.userIP, appState.deviceFingerprint] = await Promise.all([
      fetchIP(),
      generateFingerprint(),
    ]);
    updateIPDisplay();
    if (appState.userIP === "Unavailable" || !appState.deviceFingerprint) {
      showError(
        "Failed to identify device. Check connection.",
        dom.login.error
      );
      setButtonState(
        dom.login.btn,
        dom.login.btnText,
        dom.login.loader,
        true,
        "RETRY"
      );
    } else {
      setButtonState(
        dom.login.btn,
        dom.login.btnText,
        dom.login.loader,
        false,
        "LOGIN"
      );
    }
  };
  const handleLogout = () => {
    appState.currentStudent = null;
    appState.portalData = {};
    clearAllResetTimers();
    dom.login.userInput.value = "";
    dom.login.passInput.value = "";
    hideResult(dom.login.error);
    switchLoginView("loginView");
    switchPage("login");
  };
  const handlePaymentSubmission = async () => {
    hideResult(dom.payment.message);
    const bkashNumber = dom.payment.bkashNumberInput.value.trim();
    const trxId = dom.payment.trxIdInput.value.trim().toUpperCase();
    if (!bkashNumber || !trxId)
      return showError("Please enter both fields.", dom.payment.message);
    setButtonState(
      dom.payment.verifyPaymentBtn,
      dom.payment.verifyBtnText,
      dom.payment.verifyBtnLoader,
      true,
      "SUBMITTING..."
    );
    const paymentRef = sdk.ref(
      mainDb,
      `pendingPayments/${appState.currentStudent.id}`
    );
    try {
      await sdk.set(paymentRef, {
        bkashNumber,
        trxId,
        timestamp: new Date().toISOString(),
      });
      showSuccess(
        "Your payment is under review. You may close this window.",
        dom.payment.message
      );
      dom.payment.bkashNumberInput.disabled = true;
      dom.payment.trxIdInput.disabled = true;
      setButtonState(
        dom.payment.verifyPaymentBtn,
        null,
        null,
        true,
        "SUBMITTED"
      );
    } catch (error) {
      console.error("Payment Submission Error:", error);
      showError(
        "Submission failed. You may have already submitted your payment details. Please contact admin if you need assistance.",
        dom.payment.message
      );
      setButtonState(
        dom.payment.verifyPaymentBtn,
        dom.payment.verifyBtnText,
        dom.payment.verifyBtnLoader,
        false,
        "Submit for Verification"
      );
    }
  };
  const handleFindUsername = async () => {
    const studentId = dom.findUsername.idInput.value.trim();
    hideResult(dom.findUsername.result);
    if (!studentId)
      return showError(
        "Please enter your Student ID.",
        dom.findUsername.result
      );
    setButtonState(
      dom.findUsername.btn,
      dom.findUsername.btnText,
      dom.findUsername.loader,
      true,
      "Searching..."
    );
    try {
      const snapshot = await sdk.get(sdk.ref(mainDb, `students/${studentId}`));
      if (snapshot.exists() && snapshot.val().username) {
        showSuccess(
          `Your username is: <strong>${snapshot.val().username}</strong>`,
          dom.findUsername.result
        );
      } else {
        showError(
          "Student ID not found or no username is associated.",
          dom.findUsername.result
        );
      }
    } catch (error) {
      showError("An error occurred.", dom.findUsername.result);
    } finally {
      setButtonState(
        dom.findUsername.btn,
        dom.findUsername.btnText,
        dom.findUsername.loader,
        false,
        "Find Username"
      );
    }
  };
  const downloadResultAsPdf = () => {
    const { jsPDF } = window.jspdf;
    if (!jsPDF) {
      showToast("PDF library not loaded. Please try again.", "error");
      return;
    }
    const courses = appState.portalData.courses || {};
    const allResults = appState.portalData.results || {};
    const studentId = appState.currentStudent.id;
    const studentName = appState.currentStudent.name;
    const className = appState.portalData.className;
    const studentMarks = [];
    Object.keys(courses)
      .sort()
      .forEach((courseId) => {
        const course = courses[courseId];
        if (course.type === "theory") {
          const result = allResults[courseId]
            ? allResults[courseId][studentId]
            : null;
          studentMarks.push({
            courseName: `${course.courseName}\n(${course.courseCode})`,
            ct1: result?.ct1 ?? "N/A",
            ct2: result?.ct2 ?? "N/A",
            ct3: result?.ct3 ?? "N/A",
            midterm: result?.midterm ?? "N/A",
            attendance:
              typeof result?.attendance === "number"
                ? `${result.attendance.toFixed(2)}%`
                : "N/A",
            total:
              typeof result?.total === "number"
                ? result.total.toFixed(2)
                : "N/A",
          });
        }
      });
    if (studentMarks.length === 0) {
      showToast("No results available to download.", "info");
      return;
    }
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text(
      "Academic Summary (Theory)",
      doc.internal.pageSize.getWidth() / 2,
      20,
      { align: "center" }
    );
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(
      "Bangladesh Army University of Science and Technology (BAUST)",
      doc.internal.pageSize.getWidth() / 2,
      28,
      { align: "center" }
    );
    doc.setLineWidth(0.5);
    doc.line(14, 32, 196, 32);
    doc.setFontSize(10);
    doc.text(`Student Name: ${studentName}`, 14, 40);
    doc.text(`Student ID: ${studentId}`, 14, 45);
    doc.text(`Class: ${className}`, 14, 50);
    const generationDate = new Date().toLocaleDateString("en-GB");
    doc.text(`Date: ${generationDate}`, 196, 40, { align: "right" });
    const head = [
      [
        "Subject",
        "CT-1",
        "CT-2",
        "CT-3",
        "Midterm",
        "Attendance",
        "Total (120)",
      ],
    ];
    const body = studentMarks.map((mark) => Object.values(mark));
    doc.autoTable({
      head: head,
      body: body,
      startY: 55,
      theme: "grid",
      headStyles: {
        fillColor: [59, 130, 246],
        textColor: [255, 255, 255],
        fontStyle: "bold",
      },
      styles: { cellPadding: 3, fontSize: 9 },
      columnStyles: {
        0: { cellWidth: "auto" },
        1: { halign: "center" },
        2: { halign: "center" },
        3: { halign: "center" },
        4: { halign: "center" },
        5: { halign: "center" },
        6: { halign: "center", fontStyle: "bold" },
      },
      didDrawPage: function (data) {
        const pageCount = doc.internal.getNumberOfPages();
        doc.setFontSize(8);
        doc.text(
          "Generated by BAUST Student Portal",
          14,
          doc.internal.pageSize.height - 10
        );
        doc.text(
          `Page ${data.pageNumber} of ${pageCount}`,
          doc.internal.pageSize.width - 14,
          doc.internal.pageSize.height - 10,
          { align: "right" }
        );
      },
    });
    doc.save(`BAUST_Result_${studentId}.pdf`);
  };
  const setupSecurity = () => {
    document.addEventListener("contextmenu", (e) => e.preventDefault());
    document.addEventListener("keydown", (e) => {
      if (
        e.key === "F12" ||
        (e.ctrlKey &&
          e.shiftKey &&
          (e.key === "I" || e.key === "J" || e.key === "C")) ||
        (e.ctrlKey && e.key === "U") ||
        (e.ctrlKey && e.key === "S")
      ) {
        e.preventDefault();
        dom.securityOverlay.classList.add("visible");
      }
    });
    const check = () => {
      dom.securityOverlay.classList.toggle(
        "visible",
        window.outerWidth - window.innerWidth > 160 ||
          window.outerHeight - window.innerHeight > 160
      );
    };
    appState.devToolsCheckInterval = setInterval(check, 500);
  };
  const handleUrlParameters = () => {
    const params = new URLSearchParams(window.location.search);
    const viewToOpen = params.get("view");
    if (viewToOpen === "find_username") {
      switchLoginView("findUsernameView");
    } else if (viewToOpen === "forgot_password") {
      switchLoginView("forgetPasswordView");
    }
  };

  const addEventListeners = () => {
    dom.login.btn.addEventListener("click", handleLogin);
    dom.login.passInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") handleLogin();
    });
    dom.login.showCreate.addEventListener("click", (e) => {
      e.preventDefault();
      switchLoginView("createAccountView");
    });
    dom.login.showForget.addEventListener("click", (e) => {
      e.preventDefault();
      switchLoginView("forgetPasswordView");
    });
    dom.create.backBtn.addEventListener("click", () =>
      switchLoginView("loginView")
    );
    dom.create.btn.addEventListener("click", handleCreateAccount);
    dom.forget.backBtn.addEventListener("click", () =>
      switchLoginView("loginView")
    );
    dom.forget.btn.addEventListener("click", handleForgetPassword);
    dom.forget.showFindUsername.addEventListener("click", (e) => {
      e.preventDefault();
      switchLoginView("findUsernameView");
    });
    dom.findUsername.backBtn.addEventListener("click", () =>
      switchLoginView("forgetPasswordView")
    );
    dom.findUsername.btn.addEventListener("click", handleFindUsername);

    dom.verify.btn.addEventListener("click", handleVerifyCode);
    dom.verify.resendBtn.addEventListener("click", handleResendCode);
    dom.reset.btn.addEventListener("click", handleResetPassword);

    dom.payment.verifyPaymentBtn.addEventListener(
      "click",
      handlePaymentSubmission
    );
    dom.payment.closeBtn.addEventListener("click", () => switchModal(null));
    dom.dashboard.logoutBtn.addEventListener("click", handleLogout);
    dom.dashboard.navItems.forEach((item) => {
      item.addEventListener("click", () =>
        switchContentView(item.dataset.view)
      );
    });
    dom.hamburgerMenu.addEventListener("click", () =>
      dom.dashboardSidebar.classList.toggle("open")
    );
    dom.resultsPage.downloadBtn.addEventListener("click", downloadResultAsPdf);
    dom.subjectsView.backBtn.addEventListener("click", () =>
      switchContentView("welcomeSection")
    );
    dom.detailsView.backBtn.addEventListener("click", () =>
      switchContentView("welcomeSection")
    );
    dom.eventModal.closeBtn.addEventListener("click", () =>
      dom.eventModal.modal.classList.add("hidden")
    );
    dom.eventModal.modal.addEventListener("click", (e) => {
      if (e.target === dom.eventModal.modal)
        dom.eventModal.modal.classList.add("hidden");
    });
    dom.dashboard.mainContent.addEventListener("click", (e) => {
      if (
        window.innerWidth <= 992 &&
        dom.dashboardSidebar.classList.contains("open")
      ) {
        if (
          !e.target.closest(".sidebar") &&
          !e.target.closest(".hamburger-menu")
        )
          dom.dashboardSidebar.classList.remove("open");
      }
    });
  };

  const init = async () => {
    initializePasswordToggles();
    addEventListeners();
    //setupSecurity();
    switchPage("login");
    await getDeviceAndNetworkInfo();
    handleUrlParameters();
  };

  init();
}

document.addEventListener("DOMContentLoaded", runApp);