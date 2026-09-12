/* ==========================================================================
   NEW DESGIN — USER PROFILE MANAGER
   Handles user profile settings, address preferences, saved notes,
   sync with Firebase Database / localStorage, and user order history.
   ========================================================================== */

const ProfileManager = {
  profileKey: "nd_user_profile",

  init() {
    this.bindEvents();
    if (!this.checkAuthState()) {
      return;
    }
    this.loadProfile();
    this.loadUserOrders();

    // Listen for AuthState changes to auto sync profile
    if (typeof AuthManager !== "undefined" && AuthManager.firebaseAuth) {
      AuthManager.firebaseAuth.onAuthStateChanged((user) => {
        if (user) {
          if (this.checkAuthState()) {
            this.fetchFirebaseProfile(user.uid);
            this.loadUserOrders();
          }
        } else {
          this.checkAuthState();
        }
      });
    }
  },

  checkAuthState() {
    const loggedOutView = document.getElementById("profileLoggedOutView");
    const loggedInView = document.getElementById("profileLoggedInView");

    let authUser = (typeof AuthManager !== "undefined" ? AuthManager.currentUser : null);
    if (!authUser) {
      try {
        const savedAuth = localStorage.getItem("nd_auth_user");
        if (savedAuth) authUser = JSON.parse(savedAuth);
      } catch (e) {}
    }

    const isLoggedIn = !!authUser;

    if (loggedOutView && loggedInView) {
      if (isLoggedIn) {
        loggedOutView.style.display = "none";
        loggedInView.style.display = "block";
      } else {
        loggedOutView.style.display = "block";
        loggedInView.style.display = "none";
      }
    }

    return isLoggedIn;
  },

  getProfile() {
    try {
      const raw = localStorage.getItem(this.profileKey);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch (e) {
      console.warn("Failed to parse local profile:", e);
    }
    
    // Default fallback from AuthManager if present
    const authUser = (typeof AuthManager !== "undefined" && AuthManager.currentUser) ? AuthManager.currentUser : null;
    return {
      fullName: authUser ? (authUser.displayName || "") : "",
      email: authUser ? (authUser.email || "") : "",
      phone: "",
      address: "",
      notes: "",
      preferredCurrency: (typeof CurrencyManager !== "undefined" && CurrencyManager.currentCurrency) ? CurrencyManager.currentCurrency : "LYD",
      apparelSize: "",
      pantsSize: "",
      shoesSize: ""
    };
  },

  updateUserProfile(newData) {
    if (!newData || typeof newData !== "object") return;
    const current = this.getProfile();
    
    // Only update non-empty string or defined values
    const updated = { ...current };
    Object.keys(newData).forEach(key => {
      if (newData[key] !== undefined && newData[key] !== null && newData[key] !== "") {
        updated[key] = newData[key];
      }
    });
    updated.updatedAt = new Date().toISOString();

    try {
      localStorage.setItem(this.profileKey, JSON.stringify(updated));
    } catch (e) {
      console.warn("Failed to save profile to localStorage:", e);
    }

    if (updated.preferredCurrency && typeof CurrencyManager !== "undefined") {
      CurrencyManager.setCurrency(updated.preferredCurrency, false);
    }

    try {
      const authUser = (typeof AuthManager !== "undefined" && AuthManager.currentUser) ? AuthManager.currentUser : null;
      if (authUser && authUser.uid && typeof firebase !== "undefined" && firebase.database) {
        firebase.database().ref("users/" + authUser.uid).update(updated);
      }
    } catch (e) {
      console.warn("Firebase profile update notice:", e);
    }

    return updated;
  },

  toggleSizeOtherInput(type) {
    const select = document.getElementById(`profile${type}Size`);
    const otherIn = document.getElementById(`profile${type}SizeOther`);
    if (select && otherIn) {
      otherIn.style.display = select.value === "other" ? "block" : "none";
      if (select.value !== "other") otherIn.value = "";
    }
  },

  loadProfile() {
    const profile = this.getProfile();
    
    // Fill Profile Page Form Fields if present
    const nameIn = document.getElementById("profileFullName");
    const emailIn = document.getElementById("profileEmail");
    const phoneIn = document.getElementById("profilePhone");
    const addrIn = document.getElementById("profileAddress");
    const notesIn = document.getElementById("profileNotes");
    const currIn = document.getElementById("profileCurrency");

    if (nameIn) nameIn.value = profile.fullName || "";
    if (emailIn) emailIn.value = profile.email || ((typeof AuthManager !== "undefined" && AuthManager.currentUser) ? AuthManager.currentUser.email : "");
    if (phoneIn) phoneIn.value = profile.phone || "";
    if (addrIn) addrIn.value = profile.address || "";
    if (notesIn) notesIn.value = profile.notes || "";
    if (currIn) currIn.value = profile.preferredCurrency || "LYD";

    // Load Apparel Size
    const appSel = document.getElementById("profileApparelSize");
    const appOther = document.getElementById("profileApparelSizeOther");
    if (appSel && profile.apparelSize) {
      const stdApp = ["S", "M", "L", "XL", "XXL"];
      if (stdApp.includes(profile.apparelSize)) {
        appSel.value = profile.apparelSize;
      } else {
        appSel.value = "other";
        if (appOther) {
          appOther.style.display = "block";
          appOther.value = profile.apparelSize;
        }
      }
    }

    // Load Pants Size
    const pantsSel = document.getElementById("profilePantsSize");
    const pantsOther = document.getElementById("profilePantsSizeOther");
    if (pantsSel && profile.pantsSize) {
      const stdPants = ["28", "30", "32", "34", "36", "38", "40", "42"];
      if (stdPants.includes(profile.pantsSize)) {
        pantsSel.value = profile.pantsSize;
      } else {
        pantsSel.value = "other";
        if (pantsOther) {
          pantsOther.style.display = "block";
          pantsOther.value = profile.pantsSize;
        }
      }
    }

    // Load Shoes Size
    const shoesSel = document.getElementById("profileShoesSize");
    const shoesOther = document.getElementById("profileShoesSizeOther");
    if (shoesSel && profile.shoesSize) {
      const stdShoes = ["38", "39", "40", "41", "42", "43", "44", "45", "46"];
      if (stdShoes.includes(profile.shoesSize)) {
        shoesSel.value = profile.shoesSize;
      } else {
        shoesSel.value = "other";
        if (shoesOther) {
          shoesOther.style.display = "block";
          shoesOther.value = profile.shoesSize;
        }
      }
    }

    // Update Header Avatar / Display Info
    this.updateProfileCard(profile);
  },

  updateProfileCard(profile) {
    const nameDisplay = document.getElementById("profileCardName");
    const emailDisplay = document.getElementById("profileCardEmail");
    const avatarInitial = document.getElementById("profileAvatarInitial");

    const authUser = (typeof AuthManager !== "undefined" && AuthManager.currentUser) ? AuthManager.currentUser : null;
    const name = profile.fullName || (authUser ? authUser.displayName : "Valued Customer");
    const email = profile.email || (authUser ? authUser.email : "guest@newdesgin.com");

    if (nameDisplay) nameDisplay.textContent = name;
    if (emailDisplay) emailDisplay.textContent = email;
    if (avatarInitial) avatarInitial.textContent = name.charAt(0).toUpperCase() || "U";
  },

  async saveProfile(event) {
    if (event) event.preventDefault();

    const submitBtn = document.getElementById("saveProfileBtn");
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = `
        <div class="spinner" style="width: 16px; height: 16px; border: 2px solid white; border-top-color: transparent; border-radius: 50%; animation: spin 0.8s linear infinite; display: inline-block;"></div>
        <span>${typeof I18nManager !== "undefined" && I18nManager.currentLang === "ar" ? "جارٍ الحفظ..." : "Saving..."}</span>
      `;
    }

    // Resolve Size selections (check if 'other' custom text was written)
    const appSel = document.getElementById("profileApparelSize")?.value || "";
    const appVal = appSel === "other" ? (document.getElementById("profileApparelSizeOther")?.value.trim() || "") : appSel;

    const pantsSel = document.getElementById("profilePantsSize")?.value || "";
    const pantsVal = pantsSel === "other" ? (document.getElementById("profilePantsSizeOther")?.value.trim() || "") : pantsSel;

    const shoesSel = document.getElementById("profileShoesSize")?.value || "";
    const shoesVal = shoesSel === "other" ? (document.getElementById("profileShoesSizeOther")?.value.trim() || "") : shoesSel;

    const data = {
      fullName: document.getElementById("profileFullName")?.value.trim() || "",
      email: document.getElementById("profileEmail")?.value.trim() || "",
      phone: document.getElementById("profilePhone")?.value.trim() || "",
      address: document.getElementById("profileAddress")?.value.trim() || "",
      notes: document.getElementById("profileNotes")?.value.trim() || "",
      preferredCurrency: document.getElementById("profileCurrency")?.value || "LYD",
      apparelSize: appVal,
      pantsSize: pantsVal,
      shoesSize: shoesVal,
      updatedAt: new Date().toISOString()
    };

    // Save locally
    localStorage.setItem(this.profileKey, JSON.stringify(data));

    // Update Currency preference globally if changed
    if (typeof CurrencyManager !== "undefined" && data.preferredCurrency) {
      CurrencyManager.setCurrency(data.preferredCurrency);
    }

    // Sync with Firebase Database if authenticated
    try {
      const authUser = (typeof AuthManager !== "undefined" && AuthManager.currentUser) ? AuthManager.currentUser : null;
      if (authUser && authUser.uid && typeof firebase !== "undefined" && firebase.database) {
        await firebase.database().ref("users/" + authUser.uid).set(data);
      }
    } catch (e) {
      console.warn("Firebase profile sync fallback to local storage:", e);
    }

    // Update UI card
    this.updateProfileCard(data);

    if (submitBtn) {
      submitBtn.disabled = false;
      const isAr = typeof I18nManager !== "undefined" && I18nManager.currentLang === "ar";
      submitBtn.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
        <span>${typeof I18nManager !== "undefined" ? I18nManager.t("saveProfileBtn") : (isAr ? "حفظ التغييرات" : "Save Changes")}</span>
      `;
    }

    this.showToast(
      typeof I18nManager !== "undefined" ? I18nManager.t("toastProfileSaved") : "Profile changes saved successfully! ✓",
      "success"
    );
  },

  showToast(message, type = "success") {
    let container = document.getElementById("toastContainer");
    if (!container) {
      container = document.createElement("div");
      container.id = "toastContainer";
      container.className = "toast-container";
      document.body.appendChild(container);
    }

    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.style.cssText = "display: flex; align-items: center; gap: 12px; background: #0b192c; color: #ffffff; padding: 0.95rem 1.4rem; border-radius: var(--radius-md, 12px); border-left: 4px solid var(--brand-blue, #0284c7); box-shadow: 0 12px 35px rgba(0,0,0,0.35); font-weight: 700; font-size: 0.95rem; margin-top: 0.5rem; transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1); opacity: 0; transform: translateY(20px); pointer-events: auto;";
    
    toast.innerHTML = `
      <span style="display: flex; align-items: center; justify-content: center; width: 26px; height: 26px; border-radius: 50%; background: rgba(2, 132, 199, 0.2); color: #38bdf8; font-size: 0.95rem;">✓</span>
      <span>${message}</span>
    `;

    container.appendChild(toast);

    // Trigger smooth enter animation
    requestAnimationFrame(() => {
      toast.classList.add("show");
      toast.style.opacity = "1";
      toast.style.transform = "translateY(0)";
    });

    // Auto dismiss after 3.5 seconds
    setTimeout(() => {
      toast.classList.remove("show");
      toast.style.opacity = "0";
      toast.style.transform = "translateY(-12px)";
      setTimeout(() => {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 350);
    }, 3500);
  },

  async fetchFirebaseProfile(uid) {
    if (!uid || typeof firebase === "undefined" || !firebase.database) return;
    try {
      const snap = await firebase.database().ref("users/" + uid).once("value");
      if (snap.exists()) {
        const remoteData = snap.val();
        localStorage.setItem(this.profileKey, JSON.stringify(remoteData));
        this.loadProfile();
      }
    } catch (e) {
      console.warn("Could not fetch remote profile:", e);
    }
  },

  async loadUserOrders(authUserParam = null) {
    const listContainer = document.getElementById("profileOrdersList");
    if (!listContainer) return;

    let authUser = authUserParam || (typeof AuthManager !== "undefined" ? AuthManager.currentUser : null);
    if (!authUser) {
      try {
        const savedAuth = localStorage.getItem("nd_auth_user");
        if (savedAuth) authUser = JSON.parse(savedAuth);
      } catch (e) {}
    }

    if (!authUser) {
      this.renderUserOrders([]);
      return;
    }

    const profile = this.getProfile();
    const userId = authUser ? authUser.uid : null;
    const userEmail = (authUser && authUser.email ? authUser.email : (profile && profile.email ? profile.email : "")).toLowerCase();
    const userPhone = profile && profile.phone ? profile.phone.replace(/[^0-9]/g, "") : "";

    const liveOrdersMap = new Map();
    let isFirebaseConnected = false;

    // 1. Fetch direct user sub-node orders from Firebase if logged in
    if (userId && typeof firebase !== "undefined" && firebase.database) {
      try {
        const userOrdersSnap = await firebase.database().ref(`users/${userId}/orders`).once("value");
        isFirebaseConnected = true;
        if (userOrdersSnap.exists()) {
          const userOrds = userOrdersSnap.val();
          Object.keys(userOrds).forEach(k => {
            const ord = userOrds[k];
            ord.id = ord.id || ord.orderId || k;
            liveOrdersMap.set(ord.id, ord);
          });
        }
      } catch (e) {
        console.warn("Firebase user sub-node orders fetch notice:", e);
      }
    }

    // 2. Fetch from global Firebase orders node to scan for user orders
    if (typeof firebase !== "undefined" && firebase.database) {
      try {
        const snap = await firebase.database().ref("orders").once("value");
        isFirebaseConnected = true;
        if (snap.exists()) {
          const allOrdersObj = snap.val();
          Object.keys(allOrdersObj).forEach(key => {
            const ord = allOrdersObj[key];
            const ordId = ord.id || ord.orderId || key;
            ord.id = ordId;
            const ordPhone = (ord.phone || ord.customerPhone) ? String(ord.phone || ord.customerPhone).replace(/[^0-9]/g, "") : "";
            const ordEmail = ord.email ? String(ord.email).toLowerCase() : "";

            const isMatch = (userId && ord.userId === userId) ||
                            (userEmail && ordEmail && ordEmail === userEmail) ||
                            (userPhone && ordPhone && (ordPhone.includes(userPhone) || userPhone.includes(ordPhone)));

            if (isMatch) {
              liveOrdersMap.set(ordId, ord);
            }
          });
        }
      } catch (e) {
        console.warn("Global orders scan notice:", e);
      }
    }

    let finalOrders = [];

    if (isFirebaseConnected) {
      // Firebase DB is active & authoritative: overwrite local cache with live DB records
      finalOrders = Array.from(liveOrdersMap.values());
      try {
        localStorage.setItem("nd_my_orders", JSON.stringify(finalOrders));
      } catch (e) {}
    } else {
      // Offline fallback: read local storage orders
      try {
        const localOrdersRaw = localStorage.getItem("nd_my_orders") || localStorage.getItem("nd_user_orders");
        if (localOrdersRaw) {
          const parsed = JSON.parse(localOrdersRaw);
          if (Array.isArray(parsed)) {
            finalOrders = parsed;
          }
        }
      } catch (e) {
        console.warn("Local storage orders fallback notice:", e);
      }
    }

    this.renderUserOrders(finalOrders);
  },

  renderUserOrders(orders) {
    const listContainer = document.getElementById("profileOrdersList");
    const countBadge = document.getElementById("profileOrdersCount");
    if (!listContainer) return;

    const isAr = typeof I18nManager !== "undefined" && I18nManager.currentLang === "ar";

    if (countBadge) countBadge.textContent = orders.length;

    if (!orders || orders.length === 0) {
      listContainer.innerHTML = `
        <div style="text-align: center; padding: 2.5rem 1rem; background-color: var(--bg-primary); border-radius: var(--radius-md); border: 1px dashed var(--border-color);">
          <div style="margin-bottom: 0.75rem;">
            <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="var(--brand-blue)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
          </div>
          <h4 style="font-weight: 700; color: var(--text-main); margin-bottom: 0.25rem;">${isAr ? 'لا توجد طلبيات بعد' : 'No orders found'}</h4>
          <p style="color: var(--text-muted); font-size: 0.88rem; margin-bottom: 1rem;">${isAr ? 'لم تقم بإنشاء أي طلبية حتى الآن.' : 'You haven\'t placed any orders yet.'}</p>
          <a href="products.html" class="btn btn-primary btn-sm">${isAr ? 'تسوق الآن' : 'Shop Products'}</a>
        </div>
      `;
      return;
    }

    // Sort newest first
    orders.sort((a, b) => new Date(b.timestamp || b.date || 0) - new Date(a.timestamp || a.date || 0));

    let html = `<div style="display: flex; flex-direction: column; gap: 1rem;">`;
    orders.forEach(ord => {
      const orderId = ord.id || ord.orderId || "ND-UNKNOWN";
      const totalStr = ord.totalFormatted || (ord.total ? `${ord.total} ${ord.currency || 'LYD'}` : '$0.00');
      const dateStr = ord.date || (ord.timestamp ? new Date(ord.timestamp).toLocaleDateString() : 'Recent');
      const status = (ord.status || 'pending').toLowerCase();

      let badgeClass = 'status-pending';
      let statusText = isAr ? 'قيد الانتظار' : 'Pending';

      if (status.includes('deliver') || status.includes('complet')) {
        badgeClass = 'status-delivered';
        statusText = isAr ? 'تم التوصيل' : 'Delivered';
      } else if (status.includes('cancel')) {
        badgeClass = 'status-canceled';
        statusText = isAr ? 'ملغي' : 'Canceled';
      } else if (status.includes('ship')) {
        badgeClass = 'status-shipped';
        statusText = isAr ? 'تم الشحن' : 'Shipped';
      } else if (status.includes('process')) {
        badgeClass = 'status-processing';
        statusText = isAr ? 'قيد المعالجة' : 'Processing';
      }

      html += `
        <div style="background-color: var(--bg-primary); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 1.25rem; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem;">
          <div>
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 4px;">
              <strong style="font-size: 1.05rem; color: var(--text-main); font-weight: 800;">${orderId}</strong>
              <span class="track-badge ${badgeClass}">${statusText}</span>
            </div>
            <div style="font-size: 0.85rem; color: var(--text-secondary);">
              <span><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-1px; margin-right: 3px;"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>${dateStr}</span> &bull; 
              <span style="font-weight: 700; color: var(--brand-blue);">${totalStr}</span>
            </div>
          </div>

          <div>
            <a href="track.html?id=${encodeURIComponent(orderId)}" class="btn btn-secondary btn-sm" style="display: flex; align-items: center; gap: 6px;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              <span>${isAr ? 'تتبع الطلب' : 'Track Order'}</span>
            </a>
          </div>
        </div>
      `;
    });
    html += `</div>`;

    listContainer.innerHTML = html;
  },

  bindEvents() {
    const profileForm = document.getElementById("profileForm");
    if (profileForm) {
      profileForm.addEventListener("submit", (e) => this.saveProfile(e));
    }
  }
};

window.ProfileManager = ProfileManager;

document.addEventListener("DOMContentLoaded", () => {
  ProfileManager.init();
});
