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
    const sizes = sizesStr ? sizesStr.split(",").map(s => s.trim()).filter(Boolean) : ["Standard"];
    
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
    }) : [{ name: "Solid Blue", nameAr: "أزرق صلب", hex: "#0284c7" }];

    const categoryNames = {
      apparel: { en: "Apparel", ar: "ملابس" },
      footwear: { en: "Footwear", ar: "أحذية" },
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
