/* ==========================================================================
   NEW DESGIN — APPLICATION COORDINATOR & UI CONTROLLER
   Binds products grid, category tabs, quick view modal, toasts, mobile drawer.
   ========================================================================== */

const AppCoordinator = {
  currentCategory: "all",
  activeQuickViewProduct: null,
  selectedQuickViewSize: null,
  selectedQuickViewColor: null,
  quickViewQuantity: 1,

  init() {
    this.bindGlobalEvents();
    this.renderCatalog();
  },

  bindGlobalEvents() {
    // Category Tabs
    const tabs = document.querySelectorAll(".filter-tab");
    tabs.forEach(tab => {
      tab.addEventListener("click", () => {
        tabs.forEach(t => t.classList.remove("active"));
        tab.classList.add("active");
        this.currentCategory = tab.getAttribute("data-category") || "all";
        this.renderCatalog();
      });
    });

    // Mobile Hamburger Toggle
    const mobileMenuBtn = document.getElementById("mobileMenuToggle");
    const mobileDrawer = document.getElementById("mobileDrawer");
    const mobileDrawerClose = document.getElementById("mobileDrawerClose");
    const backdrop = document.getElementById("drawerBackdrop");

    if (mobileMenuBtn && mobileDrawer) {
      mobileMenuBtn.addEventListener("click", () => {
        this.openMobileDrawer();
      });
    }

    if (mobileDrawerClose) {
      mobileDrawerClose.addEventListener("click", () => {
        this.closeMobileDrawer();
      });
    }

    // Close mobile drawer when clicking any mobile nav link
    const mobileNavLinks = document.querySelectorAll(".mobile-nav-link");
    mobileNavLinks.forEach(link => {
      link.addEventListener("click", () => {
        this.closeMobileDrawer();
      });
    });

    // Quick View Modal Close
    const qvClose = document.getElementById("quickViewClose");
    const qvOverlay = document.getElementById("quickViewOverlay");
    if (qvClose) {
      qvClose.addEventListener("click", () => this.closeQuickView());
    }
    if (qvOverlay) {
      qvOverlay.addEventListener("click", (e) => {
        if (e.target === qvOverlay) this.closeQuickView();
      });
    }

    // Quick View Add to Cart Button
    const qvAddToCartBtn = document.getElementById("qvAddToCartBtn");
    if (qvAddToCartBtn) {
      qvAddToCartBtn.addEventListener("click", () => {
        if (this.activeQuickViewProduct) {
          CartManager.addItem(
            this.activeQuickViewProduct.id,
            this.selectedQuickViewSize,
            this.selectedQuickViewColor,
            this.quickViewQuantity
          );
          this.closeQuickView();
        }
      });
    }

    // Quick View Quantity Adjusters
    const qvMinus = document.getElementById("qvQtyMinus");
    const qvPlus = document.getElementById("qvQtyPlus");
    const qvVal = document.getElementById("qvQtyVal");

    if (qvMinus && qvPlus && qvVal) {
      qvMinus.addEventListener("click", () => {
        if (this.quickViewQuantity > 1) {
          this.quickViewQuantity--;
          qvVal.textContent = this.quickViewQuantity;
        }
      });
      qvPlus.addEventListener("click", () => {
        this.quickViewQuantity++;
        qvVal.textContent = this.quickViewQuantity;
      });
    }

    // Newsletter form
    const newsletterForm = document.getElementById("newsletterForm");
    if (newsletterForm) {
      newsletterForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const input = newsletterForm.querySelector("input");
        if (input && input.value.trim()) {
          this.showToast(I18nManager.currentLang === "ar" ? "شكراً لاشتراكك في نشرتنا الإخبارية!" : "Thank you for subscribing!");
          input.value = "";
        }
      });
    }

    // Global ESC key listener to close active modals/drawers
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        this.closeQuickView();
        CartManager.closeDrawer();
        AuthManager.closeModal();
        this.closeMobileDrawer();
      }
    });
  },

  openMobileDrawer() {
    const mobileDrawer = document.getElementById("mobileDrawer");
    const backdrop = document.getElementById("drawerBackdrop");
    if (mobileDrawer && backdrop) {
      mobileDrawer.classList.add("active");
      backdrop.classList.add("active");
      document.body.style.overflow = "hidden";
    }
  },

  closeMobileDrawer() {
    const mobileDrawer = document.getElementById("mobileDrawer");
    const backdrop = document.getElementById("drawerBackdrop");
    if (mobileDrawer) mobileDrawer.classList.remove("active");
    if (backdrop && !document.getElementById("cartDrawer").classList.contains("active")) {
      backdrop.classList.remove("active");
      document.body.style.overflow = "";
    }
  },

  renderCatalog() {
    const grid = document.getElementById("productsGrid");
    if (!grid) return;

    const isArabic = I18nManager.currentLang === "ar";

    // Show loading spinner while initializing from Firebase
    if (window.isProductsLoading) {
      grid.innerHTML = `
        <div class="catalog-loading">
          <div class="loading-spinner"></div>
          <span class="catalog-loading-text">${isArabic ? "جاري تحميل تشكيلة المنتجات..." : "Loading products catalog..."}</span>
        </div>
      `;
      return;
    }

    let filtered = window.PRODUCTS;

    if (this.currentCategory === "featured") {
      filtered = window.PRODUCTS.filter(p => p.featured);
    } else if (this.currentCategory === "new") {
      filtered = window.PRODUCTS.filter(p => p.newArrival);
    } else if (this.currentCategory === "sale") {
      filtered = window.PRODUCTS.filter(p => p.sale);
    } else if (this.currentCategory === "apparel" || this.currentCategory === "footwear" || this.currentCategory === "accessories") {
      filtered = window.PRODUCTS.filter(p => p.category === this.currentCategory);
    }

    const isHomePage = document.querySelector('.hero-section') !== null;
    if (isHomePage) {
      filtered = filtered.slice(0, 4);
    }

    if (!filtered || filtered.length === 0) {
      grid.innerHTML = `
        <div class="catalog-empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="margin: 0 auto 1rem auto; display: block; opacity: 0.6;"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
          <h3>${isArabic ? "لا توجد منتجات حالياً" : "No products currently available"}</h3>
          <p>${isArabic ? "يرجى التحقق لاحقاً أو إضافة منتجات جديدة من لوحة التحكم." : "Please check back later or add products from the admin panel."}</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = filtered.map(product => {
      const name = isArabic ? product.nameAr : product.name;
      const categoryName = isArabic ? product.categoryNameAr : product.categoryNameEn;
      const formattedPrice = CurrencyManager.format(product.price);
      const formattedOrigPrice = product.originalPrice ? CurrencyManager.format(product.originalPrice) : null;

      let badgeHtml = "";
      if (product.badge === "sale") {
        badgeHtml = `<span class="product-badge sale">${isArabic ? "تخفيض" : "SALE"}</span>`;
      } else if (product.badge === "new") {
        badgeHtml = `<span class="product-badge new">${isArabic ? "جديد" : "NEW"}</span>`;
      }

      return `
        <article class="product-card" data-id="${product.id}">
          <div class="product-media">
            ${badgeHtml}
            <a href="product.html?id=${product.id}" class="product-media-link" aria-label="View ${name}">
              <img src="${product.image}" alt="${name}" class="product-img" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=600&q=80'" />
            </a>
            <button type="button" class="product-quick-view-btn" onclick="AppCoordinator.openQuickView('${product.id}')">
              ${I18nManager.t("quickView")}
            </button>
          </div>
          <div class="product-content">
            <span class="product-category">${categoryName}</span>
            <h3 class="product-title">
              <a href="product.html?id=${product.id}">${name}</a>
            </h3>
            <div class="product-price-row">
              <span class="product-price">${formattedPrice}</span>
              ${formattedOrigPrice ? `<span class="product-price-original">${formattedOrigPrice}</span>` : ""}
            </div>
            <div class="product-card-actions">
              <button type="button" class="btn btn-primary btn-sm btn-full" onclick="CartManager.addItem('${product.id}')">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
                ${I18nManager.t("addToCart")}
              </button>
            </div>
          </div>
        </article>
      `;
    }).join("");
  },

  openQuickView(productId) {
    const product = window.PRODUCTS.find(p => p.id === productId);
    if (!product) return;

    this.activeQuickViewProduct = product;
    this.selectedQuickViewSize = product.sizes && product.sizes.length > 0 ? product.sizes[0] : null;
    this.selectedQuickViewColor = product.colors && product.colors.length > 0 ? product.colors[0].name : null;
    this.quickViewQuantity = 1;

    const overlay = document.getElementById("quickViewOverlay");
    const isArabic = I18nManager.currentLang === "ar";

    // Populate modal contents
    const imgEl = document.getElementById("qvImage");
    const catEl = document.getElementById("qvCategory");
    const titleEl = document.getElementById("qvTitle");
    const priceEl = document.getElementById("qvPrice");
    const origPriceEl = document.getElementById("qvOriginalPrice");
    const descEl = document.getElementById("qvDescription");
    const sizesContainer = document.getElementById("qvSizesList");
    const qtyVal = document.getElementById("qvQtyVal");

    if (imgEl) imgEl.src = product.image;
    if (catEl) catEl.textContent = isArabic ? product.categoryNameAr : product.categoryNameEn;
    if (titleEl) titleEl.textContent = isArabic ? product.nameAr : product.name;
    if (priceEl) priceEl.textContent = CurrencyManager.format(product.price);
    if (origPriceEl) {
      if (product.originalPrice) {
        origPriceEl.textContent = CurrencyManager.format(product.originalPrice);
        origPriceEl.style.display = "inline";
      } else {
        origPriceEl.style.display = "none";
      }
    }
    if (descEl) descEl.textContent = isArabic ? product.descriptionAr : product.description;
    if (qtyVal) qtyVal.textContent = "1";

    // Render sizes
    if (sizesContainer) {
      if (product.sizes && product.sizes.length > 0) {
        sizesContainer.innerHTML = product.sizes.map((s, idx) => `
          <button type="button" class="size-pill ${idx === 0 ? 'active' : ''}" onclick="AppCoordinator.selectSize('${s}', this)">
            ${s}
          </button>
        `).join("");
        document.getElementById("qvSizesGroup").style.display = "block";
      } else {
        document.getElementById("qvSizesGroup").style.display = "none";
      }
    }

    if (overlay) {
      overlay.classList.add("active");
      document.body.style.overflow = "hidden";
    }
  },

  selectSize(size, el) {
    this.selectedQuickViewSize = size;
    const pills = document.querySelectorAll("#qvSizesList .size-pill");
    pills.forEach(p => p.classList.remove("active"));
    if (el) el.classList.add("active");
  },

  closeQuickView() {
    const overlay = document.getElementById("quickViewOverlay");
    if (overlay) {
      overlay.classList.remove("active");
      document.body.style.overflow = "";
      this.activeQuickViewProduct = null;
    }
  },

  showToast(message) {
    const container = document.getElementById("toastContainer");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = "toast";
    toast.innerHTML = `
      <span class="toast-icon">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
      </span>
      <span class="toast-text">${message}</span>
    `;

    container.appendChild(toast);

    // Trigger enter animation
    setTimeout(() => toast.classList.add("show"), 20);

    // Auto dismiss after 3 seconds
    setTimeout(() => {
      toast.classList.remove("show");
      setTimeout(() => {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 300);
    }, 3000);
  },

  onLanguageChange(lang) {
    this.renderCatalog();
    CartManager.render();
    AuthManager.updateUI();
  },

  onCurrencyChange(curr) {
    this.renderCatalog();
    CartManager.render();
    if (this.activeQuickViewProduct) {
      const priceEl = document.getElementById("qvPrice");
      const origPriceEl = document.getElementById("qvOriginalPrice");
      if (priceEl) priceEl.textContent = CurrencyManager.format(this.activeQuickViewProduct.price);
      if (origPriceEl && this.activeQuickViewProduct.originalPrice) {
        origPriceEl.textContent = CurrencyManager.format(this.activeQuickViewProduct.originalPrice);
      }
    }
  }
};

window.AppCoordinator = AppCoordinator;

// Bootstrap once DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  ThemeManager.init();
  I18nManager.init();
  CurrencyManager.init();
  CartManager.init();
  AuthManager.init();
  AppCoordinator.init();
});
