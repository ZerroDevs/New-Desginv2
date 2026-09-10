/* ==========================================================================
   NEW DESGIN — ADMIN CONTROLLER ENGINE
   Validates admin security check against Firebase Realtime Database:
   settings/adminEmails
   Provides Products CRUD, Currency conversion configuration, and Admin security management.
   ========================================================================== */

const AdminController = {
  currentTab: "dashboard",
  currentUser: null,
  isAdmin: false,
  products: {},
  exchangeRate: 4.85,
  adminEmails: {},
  editingProductId: null,
  currentMainPhoto: "",
  currentExtraPhotos: [],
  supportTickets: {},
  activeTicketKey: null,

  init() {
    this.initFirebase();
    this.initTheme();
    this.bindNavigation();
    this.bindProductEvents();
    this.bindCurrencyEvents();
    this.bindStoreInfoEvents();
    this.bindAnnouncementEvents();
    this.bindTicketEvents();
    this.bindAdminEmailEvents();
    this.loadHomepageContent();
    this.bindHomepageContentEvents();
  },

  initTheme() {
    const saved = localStorage.getItem("nd_theme") || "dark";
    if (typeof ThemeManager !== "undefined") {
      ThemeManager.setTheme(saved);
    } else {
      document.documentElement.setAttribute("data-theme", saved);
    }
  },

  initFirebase() {
    try {
      if (!firebase.apps.length) {
        firebase.initializeApp(APP_CONFIG.firebase);
      }
      this.auth = firebase.auth();
      this.db = firebase.database();

      this.auth.onAuthStateChanged(user => {
        this.currentUser = user;
        if (!user) {
          this.showGateScreen("login");
        } else {
          this.verifyAdminAccess(user);
        }
      });
    } catch (e) {
      console.error("Firebase init error in Admin:", e);
      this.showNotification("Error initializing Firebase: " + e.message, "error");
    }
  },

  verifyAdminAccess(user) {
    const gateScreen = document.getElementById("adminGateScreen");
    const gateUserEmail = document.getElementById("gateUserEmail");

    if (gateUserEmail) gateUserEmail.textContent = user.email;
    this.currentUser = user;

    // 1. Check for ownerEmail
    this.db.ref("settings/ownerEmail").once("value").then(ownerSnap => {
      const ownerEmail = ownerSnap.val();
      this.ownerEmail = typeof ownerEmail === "string" ? ownerEmail.toLowerCase() : null;

      // 2. Check adminEmails list
      this.db.ref("settings/adminEmails").on("value", snapshot => {
        const data = snapshot.val();
        this.adminEmails = data || {};

        const hasAdminList = data && Object.keys(data).length > 0;
        let isAuthorized = false;

        // Is it the owner?
        if (this.ownerEmail && this.ownerEmail === user.email.toLowerCase()) {
          isAuthorized = true;
        } else if (hasAdminList) {
          const emailValues = Object.values(data).map(e => (typeof e === "string" ? e.toLowerCase() : ""));
          isAuthorized = emailValues.includes(user.email.toLowerCase());
        } else {
          // First-time setup
          isAuthorized = true;
          this.showFirstTimeSetupPrompt(user);
        }

        if (isAuthorized) {
          this.isAdmin = true;
          gateScreen.style.display = "none";
          this.updateAdminHeader(user);
          this.loadProducts();
          this.loadCurrencySettings();
          this.renderAdminEmailsList();
          this.loadStoreInfo();
          this.loadSupportTickets();
          this.loadOrders();
          this.loadAnnouncementSettings();

          // Restore last open tab
          const savedTab = localStorage.getItem("adminCurrentTab") || "dashboard";
          this.switchTab(savedTab);
        } else {
          this.isAdmin = false;
          this.showGateScreen("unauthorized");
        }
      }, err => {
        console.error("Database read permission denied:", err);
        this.showGateScreen("unauthorized");
      });
    }).catch(err => {
      console.error("Owner email read failed:", err);
      this.showGateScreen("unauthorized");
    });
  },

  showFirstTimeSetupPrompt(user) {
    const setupBanner = document.getElementById("firstTimeSetupBanner");
    if (setupBanner) {
      setupBanner.style.display = "block";
      const claimBtn = document.getElementById("claimAdminBtn");
      if (claimBtn) {
        claimBtn.onclick = () => {
          // Key: replace ALL dots with commas (matches Firebase rules .replace('.', ','))
          const emailKey = user.email.toLowerCase().replace(/\./g, ",");
          this.db.ref("settings/adminEmails/" + emailKey).set(user.email.toLowerCase())
            .then(() => {
              this.showNotification("Registered " + user.email + " as primary admin! ✓", "success");
              setupBanner.style.display = "none";
            })
            .catch(err => this.showNotification("Error: " + err.message, "error"));
        };
      }
    }
  },

  showGateScreen(state) {
    const gateScreen = document.getElementById("adminGateScreen");
    const loginBox = document.getElementById("gateLoginBox");
    const unauthorizedBox = document.getElementById("gateUnauthorizedBox");

    gateScreen.style.display = "flex";
    if (state === "login") {
      loginBox.style.display = "block";
      unauthorizedBox.style.display = "none";
    } else {
      loginBox.style.display = "none";
      unauthorizedBox.style.display = "block";
    }
  },

  updateAdminHeader(user) {
    const emailEl = document.getElementById("currentAdminEmail");
    const avatarEl = document.getElementById("currentAdminAvatar");
    const roleEl = document.getElementById("currentAdminRole");
    if (emailEl) emailEl.textContent = user.email;
    if (avatarEl) avatarEl.textContent = user.email.charAt(0).toUpperCase();
    if (roleEl) {
      if (this.ownerEmail && user.email.toLowerCase() === this.ownerEmail.toLowerCase()) {
        roleEl.textContent = "Owner";
        roleEl.style.color = "var(--admin-blue)";
        roleEl.style.fontWeight = "700";
      } else {
        roleEl.textContent = "Administrator";
        roleEl.style.color = "";
        roleEl.style.fontWeight = "";
      }
    }
  },

  bindNavigation() {
    const navItems = document.querySelectorAll(".sidebar-nav .nav-item");
    const sidebar = document.querySelector(".admin-sidebar");
    const backdrop = document.getElementById("adminMobileBackdrop");
    const mobileToggle = document.getElementById("adminMobileToggle");

    navItems.forEach(btn => {
      btn.addEventListener("click", () => {
        const tab = btn.getAttribute("data-tab");
        this.switchTab(tab);
        if (sidebar) sidebar.classList.remove("mobile-open");
        if (backdrop) backdrop.classList.remove("active");
      });
    });

    // Mobile Hamburger Toggle
    if (mobileToggle && sidebar) {
      mobileToggle.addEventListener("click", () => {
        sidebar.classList.add("mobile-open");
        if (backdrop) backdrop.classList.add("active");
      });
    }

    if (backdrop && sidebar) {
      backdrop.addEventListener("click", () => {
        sidebar.classList.remove("mobile-open");
        backdrop.classList.remove("active");
      });
    }

    // Phone Bottom Navigation Tabs
    const bottomNavItems = document.querySelectorAll(".admin-bottom-nav-item");
    bottomNavItems.forEach(btn => {
      btn.addEventListener("click", () => {
        const tab = btn.getAttribute("data-tab");
        this.switchTab(tab);
        if (sidebar) sidebar.classList.remove("mobile-open");
        if (backdrop) backdrop.classList.remove("active");
      });
    });

    // Logout
    const logoutBtn = document.getElementById("adminLogoutBtn");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", () => {
        this.auth.signOut().then(() => {
          window.location.reload();
        });
      });
    }

    const gateLogoutBtn = document.getElementById("gateLogoutBtn");
    if (gateLogoutBtn) {
      gateLogoutBtn.addEventListener("click", () => {
        this.auth.signOut().then(() => {
          window.location.reload();
        });
      });
    }

    // Google Sign in on gate
    const gateGoogleBtn = document.getElementById("gateGoogleBtn");
    if (gateGoogleBtn) {
      gateGoogleBtn.addEventListener("click", () => {
        const provider = new firebase.auth.GoogleAuthProvider();
        this.auth.signInWithPopup(provider).catch(err => {
          this.showNotification(err.message, "error");
        });
      });
    }

    // Email/Password sign in on gate
    const gateLoginForm = document.getElementById("gateLoginForm");
    if (gateLoginForm) {
      gateLoginForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const email = document.getElementById("gateEmail").value.trim();
        const pass = document.getElementById("gatePassword").value;
        this.auth.signInWithEmailAndPassword(email, pass).catch(err => {
          this.showNotification(err.message, "error");
        });
      });
    }

    // Theme toggle with localStorage persistence
    const themeBtn = document.getElementById("adminThemeToggle");
    if (themeBtn) {
      themeBtn.addEventListener("click", () => {
        if (typeof ThemeManager !== "undefined") {
          ThemeManager.toggleTheme();
        } else {
          const current = document.documentElement.getAttribute("data-theme") || "dark";
          const next = current === "dark" ? "light" : "dark";
          document.documentElement.setAttribute("data-theme", next);
          localStorage.setItem("nd_theme", next);
        }
      });
    }
  },

  switchTab(tabName) {
    this.currentTab = tabName;
    localStorage.setItem("adminCurrentTab", tabName);
    document.querySelectorAll(".sidebar-nav .nav-item").forEach(btn => {
      btn.classList.toggle("active", btn.getAttribute("data-tab") === tabName);
    });

    document.querySelectorAll(".admin-bottom-nav-item").forEach(btn => {
      btn.classList.toggle("active", btn.getAttribute("data-tab") === tabName);
    });

    document.querySelectorAll(".admin-tab-pane").forEach(pane => {
      pane.classList.toggle("active", pane.id === `tab-${tabName}`);
    });

    const pageTitle = document.getElementById("headerPageTitle");
    if (pageTitle) {
      const titles = {
        dashboard: "Dashboard Overview",
        products: "Products Management",
        currency: "Currency & Exchange Rates",
        "store-info": "Store Info & Policies",
        "support-tickets": "Customer Support Tickets",
        admins: "Admin Access & Security",
        homepage: "Homepage Content"
      };
      pageTitle.textContent = titles[tabName] || "Admin Panel";
    }
  },

  /* ========================================================================
     PRODUCTS CRUD
     ======================================================================== */
  loadProducts() {
    const tableBody = document.getElementById("productsTableBody");
    const emptyState = document.getElementById("productsEmptyState");

    this.db.ref("products").on("value", snapshot => {
      const data = snapshot.val();
      this.products = data || {};
      const productIds = Object.keys(this.products);

      // Update stats
      this.updateStats(productIds);

      if (productIds.length === 0) {
        if (tableBody) tableBody.innerHTML = "";
        if (emptyState) emptyState.style.display = "block";
        return;
      }

      if (emptyState) emptyState.style.display = "none";
      if (!tableBody) return;

      tableBody.innerHTML = productIds.map(id => {
        const p = this.products[id];
        const isVisible = p.visible !== false;
        const formattedPrice = `$${parseFloat(p.price || 0).toFixed(2)}`;
        const stock = p.stockCount !== undefined ? p.stockCount : 10;

        return `
          <tr>
            <td>
              <div style="display: flex; align-items: center; gap: 0.75rem;">
                <img src="${p.image || ''}" alt="${p.name || ''}" class="table-product-thumb" onerror="this.src='https://via.placeholder.com/44?text=ND'" />
                <div class="table-product-meta">
                  <span class="table-product-name">${p.name || 'Untitled'}</span>
                  <span class="table-product-key">${id.toUpperCase()}</span>
                </div>
              </div>
            </td>
            <td><span class="product-meta-category">${p.category || 'General'}</span></td>
            <td><strong>${formattedPrice}</strong></td>
            <td>
              <span style="color: ${stock > 5 ? 'var(--success)' : 'var(--error)'}; font-weight: 700;">
                ${stock} pcs
              </span>
            </td>
            <td>
              <span class="status-badge ${isVisible ? 'visible' : 'hidden'}">
                ${isVisible ? 'Active' : 'Hidden'}
              </span>
            </td>
            <td>
              <div class="table-actions">
                <button type="button" class="btn btn-secondary btn-sm" onclick="AdminController.openEditProductModal('${id}')" title="Edit Product">✏️ Edit</button>
                <button type="button" class="btn btn-secondary btn-sm" onclick="AdminController.toggleProductVisibility('${id}')" title="Toggle Visibility">${isVisible ? '👁️' : '🚫'}</button>
                <button type="button" class="btn btn-danger btn-sm" onclick="AdminController.deleteProduct('${id}')" title="Delete Product">🗑️</button>
              </div>
            </td>
          </tr>
        `;
      }).join("");
    });
  },

  updateStats(productIds) {
    const totalCount = productIds.length;
    let activeCount = 0;
    let outOfStockCount = 0;
    let totalInventoryValue = 0;

    productIds.forEach(id => {
      const p = this.products[id];
      if (p.visible !== false) activeCount++;
      if (p.stockCount === 0) outOfStockCount++;
      totalInventoryValue += (parseFloat(p.price) || 0) * (p.stockCount || 1);
    });

    const elTotal = document.getElementById("statTotalProducts");
    const elActive = document.getElementById("statActiveProducts");
    const elRate = document.getElementById("statExchangeRate");
    const elAdmins = document.getElementById("statAdminCount");

    if (elTotal) elTotal.textContent = totalCount;
    if (elActive) elActive.textContent = activeCount;
    if (elRate) elRate.textContent = `${this.exchangeRate.toFixed(2)} LYD`;
    if (elAdmins) elAdmins.textContent = Object.keys(this.adminEmails).length;
  },

  compressImageFile(file, maxDimension = 1000, quality = 0.82) {
    return new Promise((resolve, reject) => {
      if (!file || !file.type.startsWith("image/")) {
        return reject(new Error("Selected file is not an image."));
      }
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("Failed reading image file."));
      reader.onload = e => {
        const img = new Image();
        img.onerror = () => reject(new Error("Failed decoding image."));
        img.onload = () => {
          let { width, height } = img;
          if (width > height) {
            if (width > maxDimension) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            }
          } else {
            if (height > maxDimension) {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL("image/jpeg", quality));
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  },

  renderMainPhotoPreview() {
    const placeholder = document.getElementById("mainPhotoPlaceholder");
    const previewWrapper = document.getElementById("mainPhotoPreviewWrapper");
    const previewImg = document.getElementById("mainPhotoPreview");
    const metaText = document.getElementById("mainPhotoMeta");

    if (this.currentMainPhoto) {
      if (placeholder) placeholder.style.display = "none";
      if (previewWrapper) previewWrapper.style.display = "flex";
      if (previewImg) previewImg.src = this.currentMainPhoto;
      if (metaText) metaText.textContent = "Main Photo Ready ✓";
    } else {
      if (placeholder) placeholder.style.display = "flex";
      if (previewWrapper) previewWrapper.style.display = "none";
      if (previewImg) previewImg.src = "";
    }
  },

  renderExtraPhotosPreview() {
    const grid = document.getElementById("extraPhotosGrid");
    const countEl = document.getElementById("extraPhotosCount");
    if (countEl) countEl.textContent = `${this.currentExtraPhotos.length} / 5 photos`;

    if (!grid) return;
    grid.innerHTML = this.currentExtraPhotos.map((photoSrc, idx) => `
      <div class="extra-photo-chip">
        <img src="${photoSrc}" alt="Gallery ${idx + 1}" />
        <button type="button" class="extra-photo-remove" onclick="AdminController.removeExtraPhoto(${idx})" title="Remove photo">✕</button>
      </div>
    `).join("");
  },

  removeExtraPhoto(idx) {
    this.currentExtraPhotos.splice(idx, 1);
    this.renderExtraPhotosPreview();
  },

  generateRandomSku() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `ND-${code}`;
  },

  bindProductEvents() {
    // Open Add Product Modal
    const openAddBtn = document.getElementById("openAddProductBtn");
    const modalClose = document.getElementById("productModalClose");
    const modalCancel = document.getElementById("productModalCancel");
    const productForm = document.getElementById("productForm");

    if (openAddBtn) {
      openAddBtn.addEventListener("click", () => this.openAddProductModal());
    }

    if (modalClose) modalClose.addEventListener("click", () => this.closeProductModal());
    if (modalCancel) modalCancel.addEventListener("click", () => this.closeProductModal());

    // Randomize SKU button
    const btnRandomize = document.getElementById("btnRandomizeSku");
    if (btnRandomize) {
      btnRandomize.addEventListener("click", () => {
        const prodIdInput = document.getElementById("prodId");
        if (prodIdInput && !prodIdInput.disabled) {
          prodIdInput.value = this.generateRandomSku();
        }
      });
    }

    // Main Photo Upload Events
    const dropZone = document.getElementById("mainPhotoDropZone");
    const mainFileInput = document.getElementById("prodMainFileInput");
    const btnChangeMain = document.getElementById("btnChangeMainPhoto");
    const btnRemoveMain = document.getElementById("btnRemoveMainPhoto");
    const prodUrlInput = document.getElementById("prodImage");

    if (dropZone && mainFileInput) {
      dropZone.addEventListener("click", (e) => {
        if (e.target.closest("button") || e.target.closest("input")) return;
        mainFileInput.click();
      });
    }

    if (btnChangeMain && mainFileInput) {
      btnChangeMain.addEventListener("click", () => mainFileInput.click());
    }

    if (btnRemoveMain) {
      btnRemoveMain.addEventListener("click", () => {
        this.currentMainPhoto = "";
        if (mainFileInput) mainFileInput.value = "";
        if (prodUrlInput) prodUrlInput.value = "";
        this.renderMainPhotoPreview();
      });
    }

    if (mainFileInput) {
      mainFileInput.addEventListener("change", async (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        try {
          this.showNotification("Optimizing photo...", "info");
          const compressed = await this.compressImageFile(file);
          this.currentMainPhoto = compressed;
          if (prodUrlInput) prodUrlInput.value = "";
          this.renderMainPhotoPreview();
          this.showNotification("Main photo loaded! ✓", "success");
        } catch (err) {
          this.showNotification(err.message, "error");
        }
      });
    }

    if (prodUrlInput) {
      prodUrlInput.addEventListener("input", () => {
        const val = prodUrlInput.value.trim();
        if (val) {
          this.currentMainPhoto = val;
          this.renderMainPhotoPreview();
        }
      });
    }

    // Additional Photos Events
    const btnAddExtra = document.getElementById("btnAddExtraPhotos");
    const extraFileInput = document.getElementById("prodExtraFilesInput");

    if (btnAddExtra && extraFileInput) {
      btnAddExtra.addEventListener("click", () => {
        if (this.currentExtraPhotos.length >= 5) {
          this.showNotification("Maximum 5 additional photos allowed.", "warning");
          return;
        }
        extraFileInput.click();
      });
    }

    if (extraFileInput) {
      extraFileInput.addEventListener("change", async (e) => {
        const files = Array.from(e.target.files || []);
        if (!files.length) return;

        const remainingSlots = 5 - this.currentExtraPhotos.length;
        if (remainingSlots <= 0) {
          this.showNotification("Maximum 5 additional photos allowed.", "warning");
          return;
        }

        const toProcess = files.slice(0, remainingSlots);
        this.showNotification(`Optimizing ${toProcess.length} gallery photo(s)...`, "info");

        for (const file of toProcess) {
          try {
            const compressed = await this.compressImageFile(file);
            this.currentExtraPhotos.push(compressed);
          } catch (err) {
            console.error("Gallery photo compress error:", err);
          }
        }

        extraFileInput.value = "";
        this.renderExtraPhotosPreview();
        this.showNotification(`${this.currentExtraPhotos.length} / 5 photos ready!`, "success");
      });
    }

    if (productForm) {
      productForm.addEventListener("submit", (e) => this.handleSaveProduct(e));
    }
  },

  openAddProductModal() {
    this.editingProductId = null;
    this.currentMainPhoto = "";
    this.currentExtraPhotos = [];
    document.getElementById("productModalTitle").textContent = "Add New Product";
    document.getElementById("productForm").reset();
    document.getElementById("prodId").disabled = false;
    document.getElementById("prodId").value = this.generateRandomSku();
    this.renderMainPhotoPreview();
    this.renderExtraPhotosPreview();
    document.getElementById("productModalOverlay").classList.add("active");
  },

  openEditProductModal(id) {
    const p = this.products[id];
    if (!p) return;

    this.editingProductId = id;
    this.currentMainPhoto = p.image || "";
    if (Array.isArray(p.images) && p.images.length > 0) {
      this.currentExtraPhotos = p.images.filter(img => img !== p.image).slice(0, 5);
    } else {
      this.currentExtraPhotos = [];
    }

    document.getElementById("productModalTitle").textContent = `Edit Product: ${id.toUpperCase()}`;
    document.getElementById("prodId").value = id;
    document.getElementById("prodId").disabled = true; // Key cannot be altered
    document.getElementById("prodNameEn").value = p.name || "";
    document.getElementById("prodNameAr").value = p.nameAr || "";
    document.getElementById("prodCategory").value = p.category || "apparel";
    document.getElementById("prodPrice").value = p.price || "";
    document.getElementById("prodOrigPrice").value = p.originalPrice || "";
    document.getElementById("prodStock").value = p.stockCount !== undefined ? p.stockCount : 15;
    document.getElementById("prodBadge").value = p.badge || "none";
    document.getElementById("prodImage").value = p.image && !p.image.startsWith("data:") ? p.image : "";
    document.getElementById("prodSizes").value = p.sizes ? p.sizes.join(", ") : "";
    document.getElementById("prodColors").value = p.colors ? p.colors.map(c => c.name).join(", ") : "";
    document.getElementById("prodDescEn").value = p.description || "";
    document.getElementById("prodDescAr").value = p.descriptionAr || "";

    this.renderMainPhotoPreview();
    this.renderExtraPhotosPreview();
    document.getElementById("productModalOverlay").classList.add("active");
  },

  closeProductModal() {
    document.getElementById("productModalOverlay").classList.remove("active");
    this.editingProductId = null;
    this.currentMainPhoto = "";
    this.currentExtraPhotos = [];
  },

  fillPresetSizes(type) {
    const input = document.getElementById("prodSizes");
    if (!input) return;
    if (type === "apparel") input.value = "S, M, L, XL, XXL";
    else if (type === "pants") input.value = "30, 32, 34, 36, 38, 40";
    else if (type === "shoes") input.value = "40, 41, 42, 43, 44, 45";
    else if (type === "clear") input.value = "";
  },

  clearColors() {
    const input = document.getElementById("prodColors");
    if (input) input.value = "";
  },

  handleSaveProduct(e) {
    e.preventDefault();

    const idInput = document.getElementById("prodId").value.trim().toLowerCase().replace(/\s+/g, "-");
    const nameEn = document.getElementById("prodNameEn").value.trim();
    const nameAr = document.getElementById("prodNameAr").value.trim();
    const category = document.getElementById("prodCategory").value;
    const price = parseFloat(document.getElementById("prodPrice").value) || 0;
    const origPriceVal = document.getElementById("prodOrigPrice").value;
    const origPrice = origPriceVal ? parseFloat(origPriceVal) : null;
    const stock = parseInt(document.getElementById("prodStock").value) || 0;
    const badge = document.getElementById("prodBadge").value;
    const fallbackImage = document.getElementById("prodImage").value.trim();
    const mainPhoto = this.currentMainPhoto || fallbackImage;

    if (!mainPhoto) {
      this.showNotification("Please select a main photo from your device (or enter an image URL).", "error");
      return;
    }

    const sizesStr = document.getElementById("prodSizes").value.trim();
    const colorsStr = document.getElementById("prodColors").value.trim();
    const descEn = document.getElementById("prodDescEn").value.trim();
    const descAr = document.getElementById("prodDescAr").value.trim();

    if (!idInput && !this.editingProductId) {
      this.showNotification("Please provide a unique product key (e.g. ND-009)", "error");
      return;
    }

    const targetId = this.editingProductId || idInput;
    const sizes = sizesStr ? sizesStr.split(",").map(s => s.trim()).filter(Boolean) : [];
    
    const colorDictionary = {
      "black": { hex: "#000000", ar: "أسود" },
      "white": { hex: "#ffffff", ar: "أبيض" },
      "red": { hex: "#ef4444", ar: "أحمر" },
      "blue": { hex: "#3b82f6", ar: "أزرق" },
      "navy": { hex: "#0f172a", ar: "كحلي" },
      "green": { hex: "#22c55e", ar: "أخضر" },
      "yellow": { hex: "#eab308", ar: "أصفر" },
      "gray": { hex: "#6b7280", ar: "رمادي" },
      "grey": { hex: "#6b7280", ar: "رمادي" },
      "orange": { hex: "#f97316", ar: "برتقالي" },
      "purple": { hex: "#a855f7", ar: "بنفسجي" },
      "pink": { hex: "#ec4899", ar: "وردي" },
      "brown": { hex: "#78350f", ar: "بني" },
      "beige": { hex: "#d4d4d8", ar: "بيج" },
      "gold": { hex: "#fbbf24", ar: "ذهبي" },
      "silver": { hex: "#9ca3af", ar: "فضي" }
    };

    const colors = colorsStr ? colorsStr.split(",").map(c => {
      const trimmed = c.trim();
      const lower = trimmed.toLowerCase();
      const match = colorDictionary[lower];
      return { 
        name: trimmed, 
        nameAr: match ? match.ar : trimmed, 
        hex: match ? match.hex : "#0f172a" 
      };
    }).filter(c => Boolean(c.name)) : [];

    const categoryNames = {
      apparel: { en: "Apparel", ar: "ملابس" },
      pants: { en: "Pants", ar: "بنطال" },
      footwear: { en: "Shoes", ar: "أحذية" },
      shoes: { en: "Shoes", ar: "أحذية" },
      accessories: { en: "Accessories", ar: "إكسسوارات" }
    };

    const allImages = [mainPhoto, ...this.currentExtraPhotos];

    const productPayload = {
      id: targetId,
      sku: targetId.toUpperCase(),
      name: nameEn,
      nameAr: nameAr || nameEn,
      category: category,
      categoryNameEn: (categoryNames[category] && categoryNames[category].en) || "Apparel",
      categoryNameAr: (categoryNames[category] && categoryNames[category].ar) || "ملابس",
      price: price,
      originalPrice: origPrice,
      stockCount: stock,
      inStock: stock > 0,
      badge: badge !== "none" ? badge : null,
      featured: badge === "new" || badge === "sale",
      newArrival: badge === "new",
      sale: badge === "sale",
      image: mainPhoto,
      images: allImages,
      sizes: sizes,
      colors: colors,
      description: descEn,
      descriptionAr: descAr || descEn,
      updatedAt: Date.now()
    };

    // If adding new, set visible = true
    if (!this.editingProductId) {
      productPayload.visible = true;
      productPayload.createdAt = Date.now();
    }

    const saveBtn = document.getElementById("saveProductSubmitBtn");
    if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.textContent = "Saving...";
    }

    this.db.ref("products/" + targetId).update(productPayload)
      .then(() => {
        this.showNotification(`Product ${targetId.toUpperCase()} saved successfully! ✓`, "success");
        this.closeProductModal();
      })
      .catch(err => {
        this.showNotification("Error saving product: " + err.message, "error");
      })
      .finally(() => {
        if (saveBtn) {
          saveBtn.disabled = false;
          saveBtn.textContent = "Save Product to Firebase";
        }
      });
  },

  toggleProductVisibility(id) {
    const p = this.products[id];
    if (!p) return;
    const current = p.visible !== false;
    this.db.ref(`products/${id}/visible`).set(!current)
      .then(() => {
        this.showNotification(`Product visibility set to ${!current ? 'Visible' : 'Hidden'}`, "info");
      })
      .catch(err => this.showNotification(err.message, "error"));
  },

  deleteProduct(id) {
    if (!confirm(`Are you sure you want to delete product "${id.toUpperCase()}"? This action cannot be undone.`)) {
      return;
    }

    this.db.ref("products/" + id).remove()
      .then(() => {
        this.showNotification(`Product ${id.toUpperCase()} removed successfully.`, "success");
      })
      .catch(err => this.showNotification(err.message, "error"));
  },

  /* ========================================================================
     STORE INFO & POLICIES CONFIGURATION
     ======================================================================== */
  loadStoreInfo() {
    this.db.ref("settings/storeInfo").on("value", snapshot => {
      const data = snapshot.val() || (typeof DEFAULT_STORE_INFO !== "undefined" ? DEFAULT_STORE_INFO : {});
      const elPhone = document.getElementById("storePhone");
      const elEmail = document.getElementById("storeEmail");
      const elWhatsapp = document.getElementById("storeWhatsapp");
      const elReturn = document.getElementById("storeReturnDays");
      const elTripoli = document.getElementById("storeDeliveryTripoli");
      const elOutside = document.getElementById("storeDeliveryOutside");

      if (elPhone && data.phone) elPhone.value = data.phone;
      if (elEmail && data.email) elEmail.value = data.email;
      if (elWhatsapp && data.whatsapp) elWhatsapp.value = data.whatsapp;
      if (elReturn && data.returnDays) elReturn.value = data.returnDays;
      if (elTripoli && data.deliveryTripoli) elTripoli.value = data.deliveryTripoli;
      if (elOutside && data.deliveryOutside) elOutside.value = data.deliveryOutside;
    });
  },

  bindStoreInfoEvents() {
    const form = document.getElementById("storeInfoForm");
    if (form) {
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const payload = {
          phone: document.getElementById("storePhone").value.trim(),
          email: document.getElementById("storeEmail").value.trim(),
          whatsapp: document.getElementById("storeWhatsapp").value.trim(),
          returnDays: document.getElementById("storeReturnDays").value.trim(),
          deliveryTripoli: document.getElementById("storeDeliveryTripoli").value.trim(),
          deliveryOutside: document.getElementById("storeDeliveryOutside").value.trim(),
          updatedAt: Date.now()
        };

        this.db.ref("settings/storeInfo").set(payload)
          .then(() => {
            this.showNotification("Store policies & contact info saved to Firebase! ✓", "success");
          })
          .catch(err => {
            this.showNotification("Error saving store info: " + err.message, "error");
          });
      });
    }
  },

  /* ========================================================================
     SUPPORT TICKETS MANAGEMENT (ADMIN)
     ======================================================================== */
  loadSupportTickets() {
    const tableBody = document.getElementById("ticketsTableBody");
    const emptyState = document.getElementById("ticketsEmptyState");
    if (!tableBody) return;

    this.db.ref("supportTickets").on("value", snapshot => {
      const data = snapshot.val();
      this.supportTickets = data || {};

      const ticketKeys = Object.keys(this.supportTickets);
      if (ticketKeys.length === 0) {
        tableBody.innerHTML = "";
        if (emptyState) emptyState.style.display = "block";
        return;
      }

      if (emptyState) emptyState.style.display = "none";

      const ticketsList = Object.entries(this.supportTickets)
        .map(([k, v]) => ({ key: k, ...v }))
        .sort((a, b) => (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0));

      tableBody.innerHTML = ticketsList.map(t => {
        const date = new Date(t.createdAt || Date.now()).toLocaleDateString(undefined, {
          month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
        });

        const statusBadges = {
          open: `<span class="status-badge visible">🟢 Open</span>`,
          replied: `<span class="status-badge" style="color: var(--success); background-color: rgba(16, 185, 129, 0.15);">💬 Replied</span>`,
          closed: `<span class="status-badge hidden">🔒 Closed</span>`
        };

        return `
          <tr>
            <td><strong style="font-family: monospace; color: var(--admin-blue);">${t.ticketId || t.key}</strong></td>
            <td>
              <div><strong>${t.name || 'Anonymous'}</strong></div>
              <small style="color: var(--text-muted);">${t.contact || 'No contact'}</small>
            </td>
            <td><span class="product-meta-category">${t.category || 'General'}</span></td>
            <td><strong>${t.subject || 'No Subject'}</strong></td>
            <td>${statusBadges[t.status] || t.status}</td>
            <td style="font-size: 0.8rem; color: var(--text-muted);">${date}</td>
            <td>
              <button type="button" class="btn btn-secondary btn-sm" onclick="AdminController.openTicketModal('${t.key}')">💬 View & Reply</button>
            </td>
          </tr>
        `;
      }).join("");
    });
  },

  bindTicketEvents() {
    const replyForm = document.getElementById("ticketAdminReplyForm");
    if (replyForm) {
      replyForm.addEventListener("submit", (e) => {
        e.preventDefault();
        this.sendAdminReply();
      });
    }

    const toggleBtn = document.getElementById("btnToggleTicketStatus");
    if (toggleBtn) {
      toggleBtn.addEventListener("click", () => this.toggleTicketStatus());
    }
  },

  openTicketModal(ticketKey) {
    this.activeTicketKey = ticketKey;
    const ticket = this.supportTickets[ticketKey];
    if (!ticket) return;

    const overlay = document.getElementById("ticketAdminModalOverlay");
    const titleEl = document.getElementById("ticketAdminModalTitle");
    const metaEl = document.getElementById("ticketAdminMeta");
    const toggleBtn = document.getElementById("btnToggleTicketStatus");

    if (titleEl) titleEl.textContent = `Ticket: ${ticket.ticketId || ticketKey}`;
    if (metaEl) {
      metaEl.innerHTML = `
        <strong>Customer:</strong> ${ticket.name} (${ticket.contact})<br>
        <strong>Category:</strong> ${ticket.category} | <strong>Subject:</strong> ${ticket.subject}<br>
        <strong>Current Status:</strong> <span style="font-weight: 700; text-transform: uppercase;">${ticket.status}</span>
      `;
    }

    if (toggleBtn) {
      toggleBtn.textContent = ticket.status === "closed" ? "Re-open Ticket" : "Mark as Closed";
    }

    this.renderTicketModalMessages(ticket);
    if (overlay) overlay.classList.add("active");
  },

  closeTicketModal() {
    const overlay = document.getElementById("ticketAdminModalOverlay");
    if (overlay) overlay.classList.remove("active");
    this.activeTicketKey = null;
  },

  renderTicketModalMessages(ticket) {
    const container = document.getElementById("ticketAdminMessages");
    if (!container) return;

    const msgs = ticket.messages || [];
    container.innerHTML = msgs.map(m => {
      const isAdmin = m.sender === "admin";
      const time = new Date(m.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      return `
        <div class="chat-bubble-wrap ${isAdmin ? 'customer-wrap' : 'admin-wrap'}">
          <div class="chat-bubble ${isAdmin ? 'bubble-customer' : 'bubble-admin'}" style="max-width: 90%;">
            <div class="chat-bubble-sender">${isAdmin ? '🛡️ New Desgin Admin' : (m.name || 'Customer')}</div>
            <div class="chat-bubble-text">${m.text}</div>
            <div class="chat-bubble-time">${time}</div>
          </div>
        </div>
      `;
    }).join("");
    container.scrollTop = container.scrollHeight;
  },

  sendAdminReply() {
    if (!this.activeTicketKey) return;
    const input = document.getElementById("ticketAdminReplyInput");
    if (!input) return;
    const text = input.value.trim();
    if (!text) return;

    const replyObj = {
      sender: "admin",
      name: "New Desgin Support",
      text: text,
      timestamp: Date.now()
    };

    const ref = this.db.ref(`supportTickets/${this.activeTicketKey}`);
    ref.transaction(current => {
      if (!current) return current;
      if (!current.messages) current.messages = [];
      current.messages.push(replyObj);
      current.status = "replied";
      current.updatedAt = Date.now();
      return current;
    }).then(() => {
      input.value = "";
      this.showNotification("Admin reply sent to customer! ✓", "success");
      // Update local view
      if (this.supportTickets[this.activeTicketKey]) {
        this.supportTickets[this.activeTicketKey].status = "replied";
        if (!this.supportTickets[this.activeTicketKey].messages) {
          this.supportTickets[this.activeTicketKey].messages = [];
        }
        this.supportTickets[this.activeTicketKey].messages.push(replyObj);
        this.renderTicketModalMessages(this.supportTickets[this.activeTicketKey]);
      }
    }).catch(err => {
      this.showNotification("Failed sending reply: " + err.message, "error");
    });
  },

  toggleTicketStatus() {
    if (!this.activeTicketKey) return;
    const ticket = this.supportTickets[this.activeTicketKey];
    if (!ticket) return;

    const newStatus = ticket.status === "closed" ? "open" : "closed";
    this.db.ref(`supportTickets/${this.activeTicketKey}/status`).set(newStatus)
      .then(() => {
        ticket.status = newStatus;
        this.showNotification(`Ticket marked as ${newStatus}.`, "info");
        const toggleBtn = document.getElementById("btnToggleTicketStatus");
        if (toggleBtn) {
          toggleBtn.textContent = newStatus === "closed" ? "Re-open Ticket" : "Mark as Closed";
        }
        const metaEl = document.getElementById("ticketAdminMeta");
        if (metaEl) {
          metaEl.innerHTML = `
            <strong>Customer:</strong> ${ticket.name} (${ticket.contact})<br>
            <strong>Category:</strong> ${ticket.category} | <strong>Subject:</strong> ${ticket.subject}<br>
            <strong>Current Status:</strong> <span style="font-weight: 700; text-transform: uppercase;">${newStatus}</span>
          `;
        }
      })
      .catch(err => this.showNotification(err.message, "error"));
  },

  /* ========================================================================
     CURRENCY & EXCHANGE RATE
     ======================================================================== */
  loadCurrencySettings() {
    this.db.ref("settings/exchangeRate").on("value", snapshot => {
      const val = snapshot.val();
      if (val) {
        this.exchangeRate = parseFloat(val) || 4.85;
      }
      const rateInput = document.getElementById("adminExchangeRate");
      if (rateInput) rateInput.value = this.exchangeRate;
      this.updateCurrencyConverterPreview();
      const elRate = document.getElementById("statExchangeRate");
      if (elRate) elRate.textContent = `${this.exchangeRate.toFixed(2)} LYD`;
    });
  },

  bindCurrencyEvents() {
    const saveRateBtn = document.getElementById("saveExchangeRateBtn");
    const rateInput = document.getElementById("adminExchangeRate");
    const testAmountInput = document.getElementById("currencyTestAmount");

    if (saveRateBtn && rateInput) {
      saveRateBtn.addEventListener("click", () => {
        const newRate = parseFloat(rateInput.value);
        if (!newRate || newRate <= 0) {
          this.showNotification("Please enter a valid exchange rate.", "error");
          return;
        }

        this.db.ref("settings/exchangeRate").set(newRate)
          .then(() => {
            this.showNotification(`Exchange rate updated to 1 USD = ${newRate} LYD! ✓`, "success");
          })
          .catch(err => this.showNotification(err.message, "error"));
      });
    }

    if (testAmountInput) {
      testAmountInput.addEventListener("input", () => this.updateCurrencyConverterPreview());
    }
  },

  updateCurrencyConverterPreview() {
    const testAmountInput = document.getElementById("currencyTestAmount");
    const previewEl = document.getElementById("currencyConvertPreview");
    if (!testAmountInput || !previewEl) return;

    const usdVal = parseFloat(testAmountInput.value) || 0;
    const lydVal = (usdVal * this.exchangeRate).toFixed(2);
    previewEl.textContent = `$${usdVal.toFixed(2)} USD = ${lydVal} LYD (ل.د)`;
  },

  /* ========================================================================
     ADMIN EMAILS & SECURITY
     ======================================================================== */
  renderAdminEmailsList() {
    const container = document.getElementById("adminEmailsList");
    if (!container) return;

    const keys = Object.keys(this.adminEmails);
    if (keys.length === 0) {
      container.innerHTML = `<p style="color: var(--text-muted); font-size: 0.9rem;">No administrators registered yet.</p>`;
      return;
    }

    container.innerHTML = keys.map(key => {
      const emailVal = this.adminEmails[key];
      // emailVal is either the email string (new UID-keyed) or an email string (old dot-keyed)
      const displayEmail = typeof emailVal === "string" ? emailVal : key;
      const isCurrent = this.currentUser && this.currentUser.uid === key;
      const isOwner = this.ownerEmail && displayEmail.toLowerCase() === this.ownerEmail.toLowerCase();

      return `
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 0.75rem 1rem; background-color: var(--bg-input); border: 1px solid var(--border-color); border-radius: var(--radius-md); margin-bottom: 0.5rem;">
          <div style="display: flex; align-items: center; gap: 0.75rem;">
            <span style="width: 8px; height: 8px; border-radius: 50%; background-color: var(--admin-blue);"></span>
            <strong>${displayEmail}</strong>
            ${isOwner ? '<span style="font-size: 0.75rem; background-color: #f59e0b; color: #fff; padding: 2px 6px; border-radius: 4px;" title="Store Owner">Owner 👑</span>' : ''}
            ${isCurrent ? '<span style="font-size: 0.75rem; background-color: var(--admin-blue); color: #fff; padding: 2px 6px; border-radius: 4px;">You</span>' : ''}
          </div>
          <div>
            ${(!isCurrent && !isOwner) ? `<button type="button" class="btn btn-danger btn-sm" onclick="AdminController.removeAdminEmail('${key}')">Remove</button>` : ''}
          </div>
        </div>
      `;
    }).join("");
  },

  bindAdminEmailEvents() {
    const addAdminForm = document.getElementById("addAdminForm");
    if (addAdminForm) {
      addAdminForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const input = document.getElementById("newAdminEmail");
        const email = input.value.trim().toLowerCase();

        if (!email || !email.includes("@")) {
          this.showNotification("Please enter a valid email address.", "error");
          return;
        }

        // Key: replace ALL dots with commas — matches Firebase rules .replace('.', ',')
        const emailKey = email.replace(/\./g, ",");
        this.db.ref("settings/adminEmails/" + emailKey).set(email)
          .then(() => {
            this.showNotification(`Admin access granted to ${email}! ✓`, "success");
            input.value = "";
          })
          .catch(err => this.showNotification(err.message, "error"));
      });
    }
  },

  removeAdminEmail(key) {
    const emailToRemove = this.adminEmails[key];
    const displayEmail = typeof emailToRemove === "string" ? emailToRemove : key;

    if (this.ownerEmail && displayEmail.toLowerCase() === this.ownerEmail.toLowerCase()) {
      this.showNotification("The store owner cannot be removed.", "error");
      return;
    }

    if (!confirm(`Are you sure you want to revoke admin permissions for ${displayEmail}?`)) {
      return;
    }

    this.db.ref("settings/adminEmails/" + key).remove()
      .then(() => {
        this.showNotification("Administrator access removed.", "info");
      })
      .catch(err => this.showNotification(err.message, "error"));
  },

  /* ========================================================================
     ANNOUNCEMENT BAR
     ======================================================================== */
  loadAnnouncementSettings() {
    this.db.ref("settings/announcement").on("value", snapshot => {
      const val = snapshot.val() || {};
      const chk = document.getElementById("announcementVisible");
      const enInput = document.getElementById("announcementTextEn");
      const arInput = document.getElementById("announcementTextAr");
      if (chk) chk.checked = !!val.visible;
      if (enInput) enInput.value = val.textEn || "";
      if (arInput) arInput.value = val.textAr || "";
    });
  },

  bindAnnouncementEvents() {
    const form = document.getElementById("announcementForm");
    if (form) {
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const payload = {
          visible: document.getElementById("announcementVisible").checked,
          textEn: document.getElementById("announcementTextEn").value.trim(),
          textAr: document.getElementById("announcementTextAr").value.trim(),
          updatedAt: Date.now()
        };
        this.db.ref("settings/announcement").set(payload)
          .then(() => this.showNotification("Announcement bar updated! ✓", "success"))
          .catch(err => this.showNotification(err.message, "error"));
      });
    }
  },

  /* ========================================================================
     HOMEPAGE CONTENT
     ======================================================================== */
  loadHomepageContent() {
    this.db.ref("settings/homepageContent").on("value", snapshot => {
      const val = snapshot.val() || {};
      
      const fields = [
        "heroTag_en", "heroTag_ar", "heroTitlePart1_en", "heroTitlePart1_ar", "heroTitlePart2_en", "heroTitlePart2_ar", "heroDesc_en", "heroDesc_ar", "heroBadgeTitle_en", "heroBadgeTitle_ar", "heroBadgeSubtitle_en", "heroBadgeSubtitle_ar",
        "benefit1Title_en", "benefit1Title_ar", "benefit1Desc_en", "benefit1Desc_ar",
        "benefit2Title_en", "benefit2Title_ar", "benefit2Desc_en", "benefit2Desc_ar",
        "benefit3Title_en", "benefit3Title_ar", "benefit3Desc_en", "benefit3Desc_ar",
        "benefit4Title_en", "benefit4Title_ar", "benefit4Desc_en", "benefit4Desc_ar",
        "aboutTag_en", "aboutTag_ar", "aboutTitle_en", "aboutTitle_ar", "aboutP1_en", "aboutP1_ar", "aboutP2_en", "aboutP2_ar",
        "stat1Num", "stat1Label_en", "stat1Label_ar",
        "stat2Num", "stat2Label_en", "stat2Label_ar",
        "stat3Num", "stat3Label_en", "stat3Label_ar"
      ];

      fields.forEach(f => {
        const el = document.getElementById("hc_" + f);
        if (el) {
          el.value = val[f] || "";
        }
      });

      const toggles = [
        "showBenefits", "showPhilosophy", "showStats",
        "showBenefit1", "showBenefit2", "showBenefit3", "showBenefit4",
        "showStat1", "showStat2", "showStat3"
      ];
      toggles.forEach(t => {
        const el = document.getElementById("hc_" + t);
        if (el) {
          el.checked = val[t] !== false; // Default true
        }
      });
    });
  },

  bindHomepageContentEvents() {
    const btnSave = document.getElementById("btnSaveHomepageContent");
    if (btnSave) {
      btnSave.addEventListener("click", () => {
        const fields = [
          "heroTag_en", "heroTag_ar", "heroTitlePart1_en", "heroTitlePart1_ar", "heroTitlePart2_en", "heroTitlePart2_ar", "heroDesc_en", "heroDesc_ar", "heroBadgeTitle_en", "heroBadgeTitle_ar", "heroBadgeSubtitle_en", "heroBadgeSubtitle_ar",
          "benefit1Title_en", "benefit1Title_ar", "benefit1Desc_en", "benefit1Desc_ar",
          "benefit2Title_en", "benefit2Title_ar", "benefit2Desc_en", "benefit2Desc_ar",
          "benefit3Title_en", "benefit3Title_ar", "benefit3Desc_en", "benefit3Desc_ar",
          "benefit4Title_en", "benefit4Title_ar", "benefit4Desc_en", "benefit4Desc_ar",
          "aboutTag_en", "aboutTag_ar", "aboutTitle_en", "aboutTitle_ar", "aboutP1_en", "aboutP1_ar", "aboutP2_en", "aboutP2_ar",
          "stat1Num", "stat1Label_en", "stat1Label_ar",
          "stat2Num", "stat2Label_en", "stat2Label_ar",
          "stat3Num", "stat3Label_en", "stat3Label_ar"
        ];
        
        const payload = { updatedAt: Date.now() };
        fields.forEach(f => {
          const el = document.getElementById("hc_" + f);
          if (el) {
            payload[f] = el.value.trim();
          }
        });

        const toggles = [
          "showBenefits", "showPhilosophy", "showStats",
          "showBenefit1", "showBenefit2", "showBenefit3", "showBenefit4",
          "showStat1", "showStat2", "showStat3"
        ];
        toggles.forEach(t => {
          const el = document.getElementById("hc_" + t);
          if (el) {
            payload[t] = el.checked;
          }
        });

        this.db.ref("settings/homepageContent").set(payload)
          .then(() => this.showNotification("Homepage content updated! ✓", "success"))
          .catch(err => this.showNotification(err.message, "error"));
      });
    }
  },

  orders: {},
  activeOrderFilter: "all",

  loadOrders() {
    if (!this.db) return;
    this.db.ref("orders").on("value", snapshot => {
      this.orders = snapshot.val() || {};
      this.updateOrdersDashboardStats();
      this.renderOrdersTable();
    }, err => {
      console.warn("Orders sync notice:", err);
    });
  },

  updateOrdersDashboardStats() {
    const ordersList = Object.values(this.orders);
    const totalOrders = ordersList.length;
    const pendingOrders = ordersList.filter(o => (o.status || 'pending').toLowerCase() === 'pending').length;
    const totalRevenue = ordersList
      .filter(o => (o.status || '').toLowerCase() !== 'canceled' && (o.status || '').toLowerCase() !== 'cancelled')
      .reduce((sum, o) => sum + (parseFloat(o.finalTotal || o.total || 0)), 0);

    const statTotalEl = document.getElementById("statTotalOrders");
    const statPendingEl = document.getElementById("statPendingOrders");
    const statRevenueEl = document.getElementById("statTotalRevenue");

    if (statTotalEl) statTotalEl.textContent = totalOrders;
    if (statPendingEl) statPendingEl.textContent = pendingOrders;
    if (statRevenueEl) statRevenueEl.textContent = `${totalRevenue.toFixed(2)} LYD`;
  },

  setOrderFilter(filter, btnEl) {
    this.activeOrderFilter = filter;
    document.querySelectorAll(".order-filter-pill").forEach(b => {
      b.classList.remove("active", "btn-primary");
      b.classList.add("btn-secondary");
    });
    if (btnEl) {
      btnEl.classList.add("active", "btn-primary");
      btnEl.classList.remove("btn-secondary");
    }
    this.renderOrdersTable();
  },

  filterOrders() {
    this.renderOrdersTable();
  },

  renderOrdersTable() {
    const tbody = document.getElementById("ordersTableBody");
    const emptyState = document.getElementById("ordersEmptyState");
    const searchInput = document.getElementById("orderSearchInputAdmin");
    const query = searchInput ? searchInput.value.trim().toLowerCase() : "";

    if (!tbody) return;

    let entries = Object.entries(this.orders);

    // Apply status filter
    if (this.activeOrderFilter !== "all") {
      entries = entries.filter(([key, o]) => {
        const s = (o.status || "pending").toLowerCase();
        if (this.activeOrderFilter === "canceled") {
          return s === "canceled" || s === "cancelled";
        }
        return s === this.activeOrderFilter;
      });
    }

    // Apply search query
    if (query) {
      entries = entries.filter(([key, o]) => {
        const orderId = (o.orderId || key).toLowerCase();
        const phone = (o.customerPhone || "").toLowerCase();
        const name = (o.customerName || "").toLowerCase();
        return orderId.includes(query) || phone.includes(query) || name.includes(query);
      });
    }

    // Sort by timestamp descending (newest first)
    entries.sort((a, b) => (b[1].timestamp || 0) - (a[1].timestamp || 0));

    if (entries.length === 0) {
      tbody.innerHTML = "";
      if (emptyState) emptyState.style.display = "block";
      return;
    }

    if (emptyState) emptyState.style.display = "none";

    tbody.innerHTML = entries.map(([key, order]) => {
      const orderId = order.orderId || key;
      const status = (order.status || "pending").toLowerCase();
      const dateStr = new Date(order.timestamp || Date.now()).toLocaleString('ar-EG', {
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
      });
      const currencySymbol = order.currency === "USD" || order.currency === "$" ? "$" : "د.ل";

      const itemsCount = (order.items || []).reduce((sum, i) => sum + (i.quantity || 1), 0);
      const itemsSummaryText = (order.items || []).map(i => `${i.nameAr || i.name} (${i.quantity}x)`).join(", ");

      return `
        <tr>
          <td><strong style="font-family: monospace; color: var(--admin-blue);">#${orderId}</strong></td>
          <td style="font-size: 0.85rem; color: var(--text-muted);">${dateStr}</td>
          <td>
            <div style="font-weight: 700; color: var(--text-main);">${order.customerName || "—"}</div>
            <div style="font-size: 0.82rem; color: var(--text-muted);" dir="ltr">${order.customerPhone || "—"}</div>
          </td>
          <td style="font-size: 0.85rem; max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${order.customerAddress || "—"}</td>
          <td>
            <span class="badge" style="background: rgba(14,165,233,0.15); color: var(--admin-blue);" title="${itemsSummaryText}">
              ${itemsCount} ${itemsCount === 1 ? 'item' : 'items'}
            </span>
          </td>
          <td><strong style="color: var(--brand-blue);">${parseFloat(order.finalTotal || order.total || 0).toFixed(2)} ${currencySymbol}</strong></td>
          <td>
            <select class="form-input" style="padding: 4px 8px; font-size: 0.82rem; width: auto; font-weight: 700;" onchange="AdminController.updateOrderStatus('${orderId}', this.value)">
              <option value="pending" ${status === 'pending' ? 'selected' : ''}>⏳ Pending / قيد الانتظار</option>
              <option value="processing" ${status === 'processing' ? 'selected' : ''}>⚙️ Processing / قيد التنفيذ</option>
              <option value="shipped" ${status === 'shipped' ? 'selected' : ''}>🚚 Shipped / تم الشحن</option>
              <option value="delivered" ${status === 'delivered' || status === 'completed' ? 'selected' : ''}>🎉 Delivered / تم التوصيل</option>
              <option value="canceled" ${status === 'canceled' || status === 'cancelled' ? 'selected' : ''}>❌ Canceled / ملغاة</option>
            </select>
          </td>
          <td>
            <div style="display: flex; gap: 4px;">
              <button type="button" class="btn btn-secondary btn-sm" onclick="AdminController.generateInvoice('${orderId}')" title="Print Invoice / الفاتورة">🖨️</button>
              <button type="button" class="btn btn-secondary btn-sm" onclick="AdminController.viewOrderDetails('${orderId}')" title="View Details / التفاصيل">👁️</button>
              <button type="button" class="btn btn-secondary btn-sm" onclick="AdminController.deleteOrder('${orderId}')" title="Delete Order / حذف" style="color: var(--error);">🗑️</button>
            </div>
          </td>
        </tr>
      `;
    }).join("");
  },

  updateOrderStatus(orderId, newStatus) {
    if (!this.db) return;
    this.db.ref("orders/" + orderId + "/status").set(newStatus)
      .then(() => {
        this.showNotification(`Order #${orderId} status updated to ${newStatus}! ✓`, "success");
      })
      .catch(err => {
        this.showNotification("Failed to update status: " + err.message, "error");
      });
  },

  deleteOrder(orderId) {
    if (!confirm(`Are you sure you want to permanently delete order #${orderId}?`)) return;
    if (!this.db) return;

    this.db.ref("orders/" + orderId).remove()
      .then(() => {
        this.showNotification(`Order #${orderId} deleted successfully.`, "success");
      })
      .catch(err => {
        this.showNotification("Failed to delete order: " + err.message, "error");
      });
  },

  viewOrderDetails(orderId) {
    const order = this.orders[orderId];
    if (!order) return;

    const modal = document.getElementById("adminOrderDetailsModal");
    const modalTitle = document.getElementById("modalOrderTitle");
    const modalContent = document.getElementById("modalOrderContent");

    if (!modal || !modalContent) return;

    modalTitle.textContent = `Order Details #${order.orderId || orderId}`;
    const dateStr = new Date(order.timestamp || Date.now()).toLocaleString('ar-EG');
    const currencySymbol = order.currency === "USD" || order.currency === "$" ? "$" : "د.ل";

    const itemsHtml = (order.items || []).map(item => `
      <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid var(--border-color); font-size: 0.9rem;">
        <div>
          <strong style="color: var(--text-main);">${item.nameAr || item.name}</strong>
          <div style="font-size: 0.8rem; color: var(--text-muted);">
            ${item.size ? 'Size: ' + item.size : ''} ${item.color ? '· Color: ' + item.color : ''}
          </div>
        </div>
        <div style="text-align: right;">
          <div>${item.quantity}x @ ${parseFloat(item.price).toFixed(2)} ${currencySymbol}</div>
          <strong style="color: var(--brand-blue);">${(item.quantity * parseFloat(item.price)).toFixed(2)} ${currencySymbol}</strong>
        </div>
      </div>
    `).join("");

    modalContent.innerHTML = `
      <div style="margin-bottom: 1.25rem;">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; background: var(--bg-secondary); padding: 1rem; border-radius: var(--radius-md); border: 1px solid var(--border-color);">
          <div>
            <div style="font-size: 0.8rem; color: var(--text-muted);">Customer Name</div>
            <strong style="color: var(--text-main); font-size: 0.95rem;">${order.customerName || '—'}</strong>
          </div>
          <div>
            <div style="font-size: 0.8rem; color: var(--text-muted);">Phone Number</div>
            <strong style="color: var(--text-main); font-size: 0.95rem;" dir="ltr">${order.customerPhone || '—'}</strong>
          </div>
          <div>
            <div style="font-size: 0.8rem; color: var(--text-muted);">Delivery Address</div>
            <strong style="color: var(--text-main); font-size: 0.95rem;">${order.customerAddress || '—'}</strong>
          </div>
          <div>
            <div style="font-size: 0.8rem; color: var(--text-muted);">Order Date</div>
            <strong style="color: var(--text-main); font-size: 0.95rem;">${dateStr}</strong>
          </div>
        </div>
        ${order.notes ? `<div style="margin-top: 0.75rem; font-size: 0.88rem; background: rgba(14,165,233,0.08); padding: 8px 12px; border-radius: var(--radius-sm);"><strong>Notes:</strong> ${order.notes}</div>` : ''}
      </div>

      <h4 style="font-size: 1rem; margin-bottom: 0.5rem; color: var(--text-main);">Ordered Products</h4>
      <div style="margin-bottom: 1.25rem;">
        ${itemsHtml}
      </div>

      <div style="display: flex; justify-content: space-between; align-items: center; background: var(--bg-secondary); padding: 1rem; border-radius: var(--radius-md); font-size: 1.1rem; font-weight: 800;">
        <span>Final Total Amount:</span>
        <span style="color: var(--brand-blue);">${parseFloat(order.finalTotal || order.total || 0).toFixed(2)} ${currencySymbol}</span>
      </div>

      <div style="margin-top: 1.25rem; display: flex; justify-content: flex-end; gap: 0.75rem;">
        <button type="button" class="btn btn-secondary" onclick="AdminController.generateInvoice('${orderId}')">🖨️ Print Invoice</button>
        <button type="button" class="btn btn-primary" onclick="document.getElementById('adminOrderDetailsModal').classList.remove('active')">Close</button>
      </div>
    `;

    modal.classList.add("active");
  },

  generateInvoice(orderId) {
    const order = this.orders[orderId];
    if (!order) {
      this.showNotification("Order not found", "error");
      return;
    }

    const storeInfo = (this.storeInfo && this.storeInfo) || {};
    const storeName = storeInfo.storeName || "New Desgin";
    const storePhone = storeInfo.phone || storeInfo.whatsapp || "+218 92-4295050";
    const storeEmail = storeInfo.email || "Altasmemaljaded@gmail.com";
    const storeLogo = "Images/Logo-noBG.png";

    const date = new Date(order.timestamp || Date.now());
    const formattedDate = date.toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });
    const formattedTime = date.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });

    const statusMap = {
      'pending': { text: 'قيد الانتظار', bg: '#fef3c7', color: '#b45309' },
      'processing': { text: 'قيد التنفيذ', bg: '#e0f2fe', color: '#0369a1' },
      'shipped': { text: 'تم الشحن', bg: '#e0e7ff', color: '#4338ca' },
      'completed': { text: 'مكتملة', bg: '#dcfce7', color: '#15803d' },
      'delivered': { text: 'تم التوصيل', bg: '#dcfce7', color: '#15803d' },
      'cancelled': { text: 'ملغاة', bg: '#fee2e2', color: '#b91c1c' },
      'canceled': { text: 'ملغاة', bg: '#fee2e2', color: '#b91c1c' }
    };
    const stKey = (order.status || 'pending').toLowerCase();
    const stInfo = statusMap[stKey] || { text: order.status, bg: '#f1f5f9', color: '#334155' };

    const currencySymbol = order.currency === 'USD' || order.currency === '$' ? '$' : 'د.ل';

    let itemsRows = '';
    let calcSubtotal = 0;
    if (order.items && order.items.length > 0) {
      order.items.forEach((item, idx) => {
        const qty = item.quantity || 1;
        const unitPrice = parseFloat(item.price || 0);
        const lineTotal = unitPrice * qty;
        calcSubtotal += lineTotal;
        const imgAttr = item.image ? `<img src="${item.image}" style="width: 38px; height: 38px; object-fit: cover; border-radius: 6px; border: 1px solid #e2e8f0; vertical-align: middle; margin-left: 8px;">` : '';

        itemsRows += `
          <tr>
            <td style="text-align: center; font-weight: 700; color: #64748b;">${idx + 1}</td>
            <td style="display: flex; align-items: center;">
              ${imgAttr}
              <div>
                <div style="font-weight: 700; color: #0f172a;">${item.nameAr || item.name}</div>
                <div style="font-size: 0.78rem; color: #64748b; margin-top: 2px;">
                  ${item.size ? `<span style="background:#f1f5f9; padding:2px 6px; border-radius:4px; margin-left:4px;">مقاس: ${item.size}</span>` : ''}
                  ${item.color ? `<span style="background:#f1f5f9; padding:2px 6px; border-radius:4px;">لون: ${item.color}</span>` : ''}
                </div>
              </div>
            </td>
            <td style="text-align: center; font-weight: 700; color: #0f172a;"><span style="background: #f1f5f9; padding: 4px 10px; border-radius: 20px; border: 1px solid #e2e8f0;">${qty}</span></td>
            <td style="text-align: left; font-weight: 600; color: #334155;">${unitPrice.toFixed(2)} ${currencySymbol}</td>
            <td style="text-align: left; font-weight: 800; color: #0284c7;">${lineTotal.toFixed(2)} ${currencySymbol}</td>
          </tr>
        `;
      });
    }

    const finalTotalNum = parseFloat(order.finalTotal || order.total || calcSubtotal);
    const trackUrl = `${window.location.origin}/track.html?id=${order.orderId || orderId}`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=110x110&data=${encodeURIComponent(trackUrl)}`;

    const invoiceHtml = `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>فاتورة طلب #${order.orderId || orderId} - ${storeName}</title>
    <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap" rel="stylesheet">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Cairo', system-ui, -apple-system, sans-serif; background: #f8fafc; color: #0f172a; padding: 24px 12px; direction: rtl; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .print-actions { max-width: 840px; margin: 0 auto 16px; display: flex; justify-content: space-between; align-items: center; }
        .print-btn { padding: 10px 24px; background: #0284c7; color: white; border: none; border-radius: 8px; font-family: 'Cairo', sans-serif; font-size: 0.95rem; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: background 0.2s; }
        .print-btn:hover { background: #0369a1; }
        .close-btn { padding: 10px 20px; background: #e2e8f0; color: #334155; border: none; border-radius: 8px; font-family: 'Cairo', sans-serif; font-size: 0.9rem; font-weight: 700; cursor: pointer; }
        .close-btn:hover { background: #cbd5e1; }
        
        .invoice-card { max-width: 840px; margin: 0 auto; background: #ffffff; border-radius: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; overflow: hidden; }
        
        /* Header */
        .inv-header { background: linear-gradient(135deg, #0b192c 0%, #1e293b 100%); color: #ffffff; padding: 2.2rem 2.5rem; display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #0284c7; }
        .store-brand { display: flex; align-items: center; gap: 16px; }
        .store-logo { height: 56px; width: auto; object-fit: contain; filter: drop-shadow(0 2px 8px rgba(0,0,0,0.2)); }
        .store-title { font-size: 1.6rem; font-weight: 900; letter-spacing: -0.5px; color: #ffffff; }
        .store-sub { font-size: 0.85rem; color: #94a3b8; margin-top: 2px; }
        
        .inv-badge-box { text-align: left; }
        .inv-title { font-size: 1.4rem; font-weight: 800; color: #38bdf8; text-transform: uppercase; letter-spacing: 0.5px; }
        .inv-id { font-size: 1.1rem; font-weight: 800; color: #ffffff; font-family: monospace; margin-top: 2px; }
        .st-badge { display: inline-block; padding: 4px 14px; border-radius: 20px; font-size: 0.82rem; font-weight: 800; margin-top: 6px; }
        
        /* Meta Info Grid */
        .inv-meta-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; padding: 1.5rem 2.5rem; background: #f8fafc; border-bottom: 1px solid #e2e8f0; }
        .meta-item { background: #ffffff; padding: 0.85rem 1.1rem; border-radius: 10px; border: 1px solid #e2e8f0; }
        .meta-item-label { font-size: 0.78rem; color: #64748b; font-weight: 700; margin-bottom: 4px; display: flex; align-items: center; gap: 6px; }
        .meta-item-val { font-size: 0.95rem; font-weight: 800; color: #0f172a; word-break: break-word; }
        
        /* Body */
        .inv-body { padding: 2rem 2.5rem; }
        .section-title { font-size: 1.05rem; font-weight: 800; color: #0284c7; margin-bottom: 1rem; display: flex; align-items: center; gap: 8px; }
        
        .items-table { width: 100%; border-collapse: collapse; margin-bottom: 1.75rem; }
        .items-table th { background: #f1f5f9; color: #475569; font-weight: 800; font-size: 0.85rem; padding: 12px 14px; text-align: right; border-bottom: 2px solid #cbd5e1; }
        .items-table td { padding: 14px 14px; border-bottom: 1px solid #f1f5f9; font-size: 0.92rem; }
        
        /* Summary Section */
        .inv-summary-container { display: flex; justify-content: space-between; align-items: flex-start; gap: 1.5rem; flex-wrap: wrap; }
        .notes-card { flex: 1; min-width: 260px; background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 10px; padding: 1rem 1.25rem; font-size: 0.88rem; color: #0369a1; }
        .notes-card strong { display: block; margin-bottom: 4px; color: #0284c7; font-size: 0.9rem; }
        
        .summary-box { width: 320px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 1.2rem 1.4rem; }
        .summary-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 0.9rem; color: #475569; font-weight: 600; }
        .summary-row.total { border-top: 2px solid #0284c7; margin-top: 8px; padding-top: 12px; font-size: 1.25rem; font-weight: 900; color: #0f172a; }
        
        /* QR & Tracking */
        .inv-qr-section { display: flex; align-items: center; justify-content: center; gap: 1rem; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 1rem 1.5rem; margin-top: 1.75rem; text-align: right; }
        .qr-img { width: 84px; height: 84px; border-radius: 8px; border: 1px solid #cbd5e1; padding: 3px; background: white; }
        
        /* Footer */
        .inv-footer { background: #f8fafc; padding: 1.5rem 2.5rem; border-top: 1px solid #e2e8f0; text-align: center; }
        .inv-footer-text { font-size: 1rem; font-weight: 800; color: #0284c7; margin-bottom: 4px; }
        .inv-footer-sub { font-size: 0.82rem; color: #64748b; }

        @media print {
            body { background: #ffffff; padding: 0; }
            .print-actions { display: none !important; }
            .invoice-card { box-shadow: none; border: none; max-width: 100%; width: 100%; border-radius: 0; }
            .inv-header { padding: 1.5rem 2rem; }
            .inv-meta-grid { padding: 1rem 2rem; }
            .inv-body { padding: 1.5rem 2rem; }
            .inv-footer { padding: 1.2rem 2rem; }
        }
    </style>
</head>
<body>
    <div class="print-actions">
        <button class="print-btn" onclick="window.print()">🖨️ طباعة الفاتورة / Print</button>
        <button class="close-btn" onclick="window.close()">❌ إغلاق / Close</button>
    </div>

    <div class="invoice-card">
        <!-- Header -->
        <div class="inv-header">
            <div class="store-brand">
                <img src="${storeLogo}" class="store-logo" alt="${storeName}" onerror="this.style.display='none'">
                <div>
                    <div class="store-title">${storeName}</div>
                    <div class="store-sub">📞 ${storePhone} &nbsp;|&nbsp; ✉️ ${storeEmail}</div>
                </div>
            </div>
            <div class="inv-badge-box">
                <div class="inv-title">فاتورة مبيعات</div>
                <div class="inv-id">#${order.orderId || orderId}</div>
                <div><span class="st-badge" style="background: ${stInfo.bg}; color: ${stInfo.color};">${stInfo.text}</span></div>
            </div>
        </div>

        <!-- Meta Information -->
        <div class="inv-meta-grid">
            <div class="meta-item">
                <div class="meta-item-label">👤 بيانات العميل</div>
                <div class="meta-item-val">${order.customerName || order.name || 'عميل محترم'}</div>
                <div style="font-size: 0.82rem; color: #64748b; font-weight: 600; margin-top: 2px;" dir="ltr">${order.customerPhone || order.phone || ''}</div>
            </div>
            <div class="meta-item">
                <div class="meta-item-label">📍 عنوان التوصيل</div>
                <div class="meta-item-val">${order.customerAddress || order.address || 'طرابلس، ليبيا'}</div>
            </div>
            <div class="meta-item">
                <div class="meta-item-label">📅 تاريخ ووقت الطلب</div>
                <div class="meta-item-val">${formattedDate}</div>
                <div style="font-size: 0.82rem; color: #64748b; font-weight: 600; margin-top: 2px;">${formattedTime}</div>
            </div>
        </div>

        <!-- Body -->
        <div class="inv-body">
            <div class="section-title">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
                <span>المنتجات المطلوبة</span>
            </div>

            <table class="items-table">
                <thead>
                    <tr>
                        <th style="width: 40px; text-align: center;">#</th>
                        <th>المنتج</th>
                        <th style="width: 90px; text-align: center;">الكمية</th>
                        <th style="width: 120px; text-align: left;">السعر</th>
                        <th style="width: 130px; text-align: left;">المجموع</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsRows}
                </tbody>
            </table>

            <!-- Summary & Notes -->
            <div class="inv-summary-container">
                ${order.notes ? `
                <div class="notes-card">
                    <strong>📝 ملاحظات العميل:</strong>
                    <div>${order.notes}</div>
                </div>
                ` : `
                <div class="notes-card" style="background: #f8fafc; border-color: #e2e8f0; color: #64748b;">
                    <strong>💳 طريقة الدفع:</strong>
                    <div>الدفع عند الاستلام (Cash on Delivery)</div>
                </div>
                `}

                <div class="summary-box">
                    <div class="summary-row">
                        <span>المجموع الفرعي:</span>
                        <span>${calcSubtotal.toFixed(2)} ${currencySymbol}</span>
                    </div>
                    <div class="summary-row">
                        <span>رسوم التوصيل:</span>
                        <span style="color: #10b981;">مجاني</span>
                    </div>
                    <div class="summary-row total">
                        <span>المجموع الكلي:</span>
                        <span style="color: #0284c7;">${finalTotalNum.toFixed(2)} ${currencySymbol}</span>
                    </div>
                </div>
            </div>

            <!-- QR Section -->
            <div class="inv-qr-section">
                <img src="${qrUrl}" alt="QR Code" class="qr-img">
                <div>
                    <div style="font-weight: 800; font-size: 0.95rem; color: #0f172a;">تتبع حالة شحنتك المباشرة</div>
                    <div style="font-size: 0.82rem; color: #64748b; margin-top: 2px;">امسح كود QR عبر كاميرا هاتفك للانتقال لصفحة التتبع لطلبك مباشرة</div>
                </div>
            </div>
        </div>

        <!-- Footer -->
        <div class="inv-footer">
            <div class="inv-footer-text">شكراً لشرائكم من ${storeName} ✨</div>
            <div class="inv-footer-sub">${storeName} • أرقى تشكيلات الملابس والأزياء الفاخرة | تواصلوا معنا دائماً عبر الواتساب</div>
        </div>
    </div>
</body>
</html>
    `;

    const invoiceWindow = window.open('', '_blank');
    if (invoiceWindow) {
      invoiceWindow.document.write(invoiceHtml);
      invoiceWindow.document.close();
    } else {
      this.showNotification("يرجى السماح بالنوافذ المنبثقة لعرض الفاتورة", "error");
    }
  },

  showNotification(message, type = "info") {
    const toast = document.createElement("div");
    toast.className = `toast show`;
    toast.style.borderColor = type === "error" ? "var(--error)" : type === "success" ? "var(--success)" : "var(--admin-blue)";
    toast.innerHTML = `<span class="toast-text">${message}</span>`;

    let container = document.getElementById("toastContainer");
    if (!container) {
      container = document.createElement("div");
      container.id = "toastContainer";
      container.className = "toast-container";
      document.body.appendChild(container);
    }

    container.appendChild(toast);
    setTimeout(() => {
      toast.classList.remove("show");
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }
};

window.AdminController = AdminController;

document.addEventListener("DOMContentLoaded", () => {
  AdminController.init();
});
