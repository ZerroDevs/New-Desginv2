/* ==========================================================================
   NEW DESGIN — FIREBASE AUTHENTICATION MANAGER
   Implements Sign Up, Login, Logout, Auth State Tracking, and friendly error handling.
   Provides dual-support: connects to live Firebase Web SDK, or falls back to an offline
   session engine if keys are placeholder, guaranteeing zero broken buttons.
   ========================================================================== */

const AuthManager = {
  currentUser: null,
  isFirebaseAvailable: false,
  firebaseAuth: null,

  init() {
    this.initFirebase();
    this.bindEvents();
    this.restoreSession();
  },

  initFirebase() {
    try {
      if (typeof firebase !== "undefined" && firebase.initializeApp) {
        // Check if config has default demo key or real project
        if (!firebase.apps.length) {
          firebase.initializeApp(APP_CONFIG.firebase);
        }
        this.firebaseAuth = firebase.auth();
        this.isFirebaseAvailable = true;

        // Listen for live auth state changes
        this.firebaseAuth.onAuthStateChanged((user) => {
          if (user) {
            this.setUser({
              uid: user.uid,
              email: user.email,
              displayName: user.displayName || user.email.split("@")[0]
            });
          } else {
            // Check if there's an offline session active
            const savedMock = localStorage.getItem("nd_auth_user");
            if (!savedMock) {
              this.setUser(null);
            }
          }
        });
      }
    } catch (err) {
      console.warn("Firebase Auth initialized in offline/demo fallback mode:", err);
      this.isFirebaseAvailable = false;
    }
  },

  restoreSession() {
    try {
      const savedUser = localStorage.getItem("nd_auth_user");
      if (savedUser) {
        this.setUser(JSON.parse(savedUser));
      }
    } catch (e) {
      this.setUser(null);
    }
  },

  bindEvents() {
    // Open auth modal buttons
    const authOpenBtns = document.querySelectorAll(".auth-modal-open-btn");
    authOpenBtns.forEach(btn => {
      btn.addEventListener("click", () => this.openModal());
    });

    // Close auth modal
    const closeBtn = document.getElementById("authModalClose");
    const overlay = document.getElementById("authModalOverlay");
    if (closeBtn) closeBtn.addEventListener("click", () => this.closeModal());
    if (overlay) {
      overlay.addEventListener("click", (e) => {
        if (e.target === overlay) this.closeModal();
      });
    }

    // Tab switching (Login vs Signup)
    const tabLogin = document.getElementById("authTabLogin");
    const tabSignup = document.getElementById("authTabSignup");
    if (tabLogin && tabSignup) {
      tabLogin.addEventListener("click", () => this.switchTab("login"));
      tabSignup.addEventListener("click", () => this.switchTab("signup"));
    }

    // Switch links inside forms
    const toSignup = document.getElementById("linkToSignup");
    const toLogin = document.getElementById("linkToLogin");
    if (toSignup) toSignup.addEventListener("click", (e) => { e.preventDefault(); this.switchTab("signup"); });
    if (toLogin) toLogin.addEventListener("click", (e) => { e.preventDefault(); this.switchTab("login"); });

    // Forms submission
    const loginForm = document.getElementById("loginForm");
    const signupForm = document.getElementById("signupForm");
    if (loginForm) {
      loginForm.addEventListener("submit", (e) => this.handleLogin(e));
    }
    if (signupForm) {
      signupForm.addEventListener("submit", (e) => this.handleSignup(e));
    }

    // Google Sign-In buttons
    const googleBtns = document.querySelectorAll(".btn-google-auth");
    googleBtns.forEach(btn => {
      btn.addEventListener("click", () => this.handleGoogleSignIn());
    });

    // Logout button
    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", () => this.handleLogout());
    }
  },

  openModal(defaultTab = "login") {
    const overlay = document.getElementById("authModalOverlay");
    if (overlay) {
      this.switchTab(defaultTab);
      this.clearAlerts();
      overlay.classList.add("active");
      document.body.style.overflow = "hidden";
    }
  },

  closeModal() {
    const overlay = document.getElementById("authModalOverlay");
    if (overlay) {
      overlay.classList.remove("active");
      document.body.style.overflow = "";
      this.clearAlerts();
    }
  },

  switchTab(tab) {
    const tabLogin = document.getElementById("authTabLogin");
    const tabSignup = document.getElementById("authTabSignup");
    const formLogin = document.getElementById("loginForm");
    const formSignup = document.getElementById("signupForm");

    this.clearAlerts();

    if (tab === "signup") {
      tabSignup.classList.add("active");
      tabLogin.classList.remove("active");
      formSignup.style.display = "block";
      formLogin.style.display = "none";
    } else {
      tabLogin.classList.add("active");
      tabSignup.classList.remove("active");
      formLogin.style.display = "block";
      formSignup.style.display = "none";
    }
  },

  showAlert(message, type = "error") {
    const alertBox = document.getElementById("authModalAlert");
    if (alertBox) {
      alertBox.textContent = message;
      alertBox.className = `form-alert ${type}`;
    }
  },

  clearAlerts() {
    const alertBox = document.getElementById("authModalAlert");
    if (alertBox) {
      alertBox.style.display = "none";
      alertBox.className = "form-alert";
      alertBox.textContent = "";
    }
  },

  async handleLogin(e) {
    e.preventDefault();
    const emailInput = document.getElementById("loginEmail");
    const passwordInput = document.getElementById("loginPassword");
    const submitBtn = document.getElementById("loginSubmitBtn");

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
      this.showAlert(I18nManager.currentLang === "ar" ? "يرجى تعبئة جميع الحقول المطلوبة." : "Please enter both email and password.");
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = I18nManager.currentLang === "ar" ? "جارٍ التحقق..." : "Signing in...";

    try {
      if (this.isFirebaseAvailable && this.firebaseAuth && APP_CONFIG.firebase.apiKey !== "AIzaSyDEMO_KEY_NEW_DESGIN_CLIENT") {
        const userCredential = await this.firebaseAuth.signInWithEmailAndPassword(email, password);
        this.setUser({
          uid: userCredential.user.uid,
          email: userCredential.user.email,
          displayName: userCredential.user.displayName || email.split("@")[0]
        });
      } else {
        // Seamless fallback session
        await new Promise(r => setTimeout(r, 400));
        this.setUser({
          uid: "mock-" + Date.now(),
          email: email,
          displayName: email.split("@")[0]
        });
      }

      this.closeModal();
      if (window.AppCoordinator) {
        window.AppCoordinator.showToast(I18nManager.t("toastLoginSuccess"));
      }
    } catch (err) {
      const friendlyMsg = this.formatFirebaseError(err);
      this.showAlert(friendlyMsg, "error");
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = I18nManager.t("authLoginBtn");
    }
  },

  async handleSignup(e) {
    e.preventDefault();
    const nameInput = document.getElementById("signupName");
    const emailInput = document.getElementById("signupEmail");
    const passwordInput = document.getElementById("signupPassword");
    const confirmInput = document.getElementById("signupConfirm");
    const submitBtn = document.getElementById("signupSubmitBtn");

    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const confirm = confirmInput.value;

    if (!name || !email || !password) {
      this.showAlert(I18nManager.currentLang === "ar" ? "يرجى ملء جميع الحقول المطلوبة." : "Please fill in all fields.");
      return;
    }

    if (password.length < 6) {
      this.showAlert(I18nManager.currentLang === "ar" ? "يجب أن تكون كلمة المرور 6 أحرف على الأقل." : "Password must be at least 6 characters.");
      return;
    }

    if (password !== confirm) {
      this.showAlert(I18nManager.currentLang === "ar" ? "كلمتا المرور غير متطابقتين." : "Passwords do not match.");
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = I18nManager.currentLang === "ar" ? "جارٍ إنشاء الحساب..." : "Creating account...";

    try {
      if (this.isFirebaseAvailable && this.firebaseAuth && APP_CONFIG.firebase.apiKey !== "AIzaSyDEMO_KEY_NEW_DESGIN_CLIENT") {
        const userCredential = await this.firebaseAuth.createUserWithEmailAndPassword(email, password);
        await userCredential.user.updateProfile({ displayName: name });
        this.setUser({
          uid: userCredential.user.uid,
          email: userCredential.user.email,
          displayName: name
        });
      } else {
        await new Promise(r => setTimeout(r, 450));
        this.setUser({
          uid: "mock-" + Date.now(),
          email: email,
          displayName: name
        });
      }

      this.closeModal();
      if (window.AppCoordinator) {
        window.AppCoordinator.showToast(I18nManager.t("toastSignupSuccess"));
      }
    } catch (err) {
      const friendlyMsg = this.formatFirebaseError(err);
      this.showAlert(friendlyMsg, "error");
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = I18nManager.t("authSignupBtn");
    }
  },

  async handleGoogleSignIn() {
    this.clearAlerts();
    try {
      if (this.isFirebaseAvailable && this.firebaseAuth) {
        const provider = new firebase.auth.GoogleAuthProvider();
        provider.setCustomParameters({ prompt: "select_account" });
        const result = await this.firebaseAuth.signInWithPopup(provider);
        const user = result.user;
        this.setUser({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || user.email.split("@")[0],
          photoURL: user.photoURL
        });
      } else {
        // Friendly local simulation if popup blocked or offline
        await new Promise(r => setTimeout(r, 400));
        this.setUser({
          uid: "mock-google-" + Date.now(),
          email: "google.user@gmail.com",
          displayName: "Google User",
          photoURL: null
        });
      }

      this.closeModal();
      if (window.AppCoordinator) {
        window.AppCoordinator.showToast(I18nManager.t("toastLoginSuccess"));
      }
    } catch (err) {
      if (err.code === "auth/popup-closed-by-user") {
        return; // User intentionally closed popup
      }
      const friendlyMsg = this.formatFirebaseError(err);
      this.showAlert(friendlyMsg, "error");
    }
  },

  async handleLogout() {
    try {
      if (this.isFirebaseAvailable && this.firebaseAuth) {
        await this.firebaseAuth.signOut();
      }
    } catch (e) {
      // Ignore
    }
    this.setUser(null);
    localStorage.removeItem("nd_auth_user");
    if (window.AppCoordinator) {
      window.AppCoordinator.showToast(I18nManager.t("toastLogoutSuccess"));
    }
  },

  setUser(user) {
    this.currentUser = user;
    if (user) {
      localStorage.setItem("nd_auth_user", JSON.stringify(user));
    } else {
      localStorage.removeItem("nd_auth_user");
    }
    this.updateUI();
  },

  updateUI() {
    const loggedOutElements = document.querySelectorAll(".auth-state-logged-out");
    const loggedInElements = document.querySelectorAll(".auth-state-logged-in");
    const userNames = document.querySelectorAll(".auth-user-name");
    const userAvatars = document.querySelectorAll(".auth-user-avatar-initial");

    if (this.currentUser) {
      loggedOutElements.forEach(el => el.style.display = "none");
      loggedInElements.forEach(el => el.style.display = "flex");

      const initial = (this.currentUser.displayName || this.currentUser.email || "U").charAt(0).toUpperCase();
      userNames.forEach(el => el.textContent = this.currentUser.displayName || this.currentUser.email);
      userAvatars.forEach(el => el.textContent = initial);
    } else {
      loggedOutElements.forEach(el => el.style.display = "flex");
      loggedInElements.forEach(el => el.style.display = "none");
    }
  },

  formatFirebaseError(err) {
    const code = err.code || "";
    const isArabic = I18nManager.currentLang === "ar";

    switch (code) {
      case "auth/email-already-in-use":
        return isArabic ? "البريد الإلكتروني مسجل مسبقاً." : "This email is already registered.";
      case "auth/invalid-email":
        return isArabic ? "صيغة البريد الإلكتروني غير صحيحة." : "Invalid email address format.";
      case "auth/wrong-password":
      case "auth/user-not-found":
      case "auth/invalid-credential":
        return isArabic ? "بيانات الدخول غير صحيحة." : "Invalid email or password.";
      case "auth/weak-password":
        return isArabic ? "كلمة المرور ضعيفة جداً." : "Password should be at least 6 characters.";
      default:
        return err.message || (isArabic ? "حدث خطأ أثناء المصادقة." : "Authentication failed. Please try again.");
    }
  }
};

window.AuthManager = AuthManager;
