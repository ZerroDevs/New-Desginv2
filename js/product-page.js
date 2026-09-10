/* ==========================================================================
   NEW DESGIN — PRODUCT DETAIL PAGE CONTROLLER
   Reads product unique key/id from URL parameters, renders dynamic product
   information, variant options, stock status, and related products.
   ========================================================================== */

const ProductPageController = {
  currentProduct: null,
  selectedSize: null,
  selectedColor: null,
  quantity: 1,

  init() {
    this.loadProductFromUrl();
    this.bindEvents();
    this.renderProduct();
    this.renderRelatedProducts();
  },

  loadProductFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const key = params.get("id") || params.get("key");
    
    if (!window.PRODUCTS || window.PRODUCTS.length === 0) {
      this.currentProduct = null;
      return;
    }

    if (key) {
      this.currentProduct = window.PRODUCTS.find(
        p => p && (p.id.toLowerCase() === key.toLowerCase() || (p.sku && p.sku.toLowerCase() === key.toLowerCase()))
      ) || window.PRODUCTS[0];
    } else {
      this.currentProduct = window.PRODUCTS[0];
    }

    if (this.currentProduct) {
      const p = this.currentProduct;
      const hasSizes = p.sizes && p.sizes.length > 0;
      const hasColors = p.colors && p.colors.length > 0;

      // Try matching user's saved profile size preference
      let userPrefSize = null;
      try {
        const rawProf = localStorage.getItem("nd_user_profile");
        if (rawProf) {
          const prof = JSON.parse(rawProf);
          const cat = (p.category || "").toLowerCase();
          if (cat === "pants" && prof.pantsSize) userPrefSize = prof.pantsSize;
          else if ((cat === "footwear" || cat === "shoes") && prof.shoesSize) userPrefSize = prof.shoesSize;
          else if (prof.apparelSize) userPrefSize = prof.apparelSize;
        }
      } catch (e) {}

      if (hasSizes) {
        if (userPrefSize && p.sizes.includes(userPrefSize)) {
          this.selectedSize = userPrefSize;
        } else {
          this.selectedSize = p.sizes[0];
        }
      } else {
        this.selectedSize = "";
      }

      this.selectedColor = hasColors ? p.colors[0].name : "";
    }
  },

  bindEvents() {
    // Quantity buttons
    const qtyMinus = document.getElementById("pdpQtyMinus");
    const qtyPlus = document.getElementById("pdpQtyPlus");
    const qtyVal = document.getElementById("pdpQtyVal");

    if (qtyMinus && qtyPlus && qtyVal) {
      qtyMinus.addEventListener("click", () => {
        if (this.quantity > 1) {
          this.quantity--;
          qtyVal.textContent = this.quantity;
        }
      });
      qtyPlus.addEventListener("click", () => {
        this.quantity++;
        qtyVal.textContent = this.quantity;
      });
    }

    // Add to Cart button
    const addToCartBtn = document.getElementById("pdpAddToCartBtn");
    if (addToCartBtn) {
      addToCartBtn.addEventListener("click", () => {
        if (this.currentProduct) {
          CartManager.addItem(
            this.currentProduct.id,
            this.selectedSize,
            this.selectedColor,
            this.quantity
          );
        }
      });
    }

    // Buy Now button
    const buyNowBtn = document.getElementById("pdpBuyNowBtn");
    if (buyNowBtn) {
      buyNowBtn.addEventListener("click", () => {
        if (this.currentProduct) {
          CartManager.addItem(
            this.currentProduct.id,
            this.selectedSize,
            this.selectedColor,
            this.quantity
          );
          // Directly trigger checkout from drawer
          const checkoutBtn = document.getElementById("checkoutBtn");
          if (checkoutBtn) checkoutBtn.click();
        }
      });
    }

    // Accordions
    const accordionHeaders = document.querySelectorAll(".accordion-header");
    accordionHeaders.forEach(header => {
      header.addEventListener("click", () => {
        const body = header.nextElementSibling;
        const icon = header.querySelector(".accordion-icon svg");
        if (body) {
          const isHidden = body.style.display === "none";
          body.style.display = isHidden ? "block" : "none";
          if (icon) {
            icon.style.transform = isHidden ? "rotate(180deg)" : "rotate(0deg)";
          }
        }
      });
    });

    // Mobile Hamburger Toggle
    const mobileMenuBtn = document.getElementById("mobileMenuToggle");
    const mobileDrawer = document.getElementById("mobileDrawer");
    const mobileDrawerClose = document.getElementById("mobileDrawerClose");
    const backdrop = document.getElementById("drawerBackdrop");

    if (mobileMenuBtn && mobileDrawer) {
      mobileMenuBtn.addEventListener("click", () => {
        mobileDrawer.classList.add("active");
        if (backdrop) backdrop.classList.add("active");
        document.body.style.overflow = "hidden";
      });
    }

    if (mobileDrawerClose) {
      mobileDrawerClose.addEventListener("click", () => {
        if (mobileDrawer) mobileDrawer.classList.remove("active");
        if (backdrop) backdrop.classList.remove("active");
        document.body.style.overflow = "";
      });
    }
  },

  renderProduct() {
    const isArabic = I18nManager.currentLang === "ar";
    const titleEl = document.getElementById("pdpTitle");
    const descEl = document.getElementById("pdpDescription");

    if (window.isProductsLoading) {
      if (titleEl) titleEl.textContent = isArabic ? "جاري تحميل تفاصيل المنتج..." : "Loading product details...";
      if (descEl) descEl.textContent = isArabic ? "يرجى الانتظار بينما نقوم بمزامنة البيانات من السحابة..." : "Please wait while we synchronize data from the cloud...";
      return;
    }

    if (!this.currentProduct) {
      if (titleEl) titleEl.textContent = isArabic ? "المنتج غير موجود أو تم إخفاؤه" : "Product Not Found";
      if (descEl) descEl.textContent = isArabic ? "عذراً، هذا المنتج غير متوفر حالياً. يمكنك العودة إلى المتجر لاستكشاف باقي التشكيلة." : "Sorry, this product is currently unavailable. Please return to the shop to explore our other items.";
      const actionsBlock = document.querySelector(".product-actions-block");
      if (actionsBlock) actionsBlock.style.display = "none";
      return;
    } else {
      const actionsBlock = document.querySelector(".product-actions-block");
      if (actionsBlock) actionsBlock.style.display = "flex";
    }

    const p = this.currentProduct;
    const name = isArabic ? p.nameAr : p.name;
    const desc = isArabic ? p.descriptionAr : p.description;
    const categoryName = isArabic ? p.categoryNameAr : p.categoryNameEn;
    const formattedPrice = CurrencyManager.format(p.price);
    const formattedOrigPrice = p.originalPrice ? CurrencyManager.format(p.originalPrice) : null;
    const uniqueKey = p.id.toUpperCase();

    // Document Title
    document.title = `${name} — New Desgin`;

    // Breadcrumbs
    const bcCategory = document.getElementById("pdpBreadcrumbCategory");
    const bcTitle = document.getElementById("pdpBreadcrumbTitle");
    if (bcCategory) bcCategory.textContent = categoryName;
    if (bcTitle) bcTitle.textContent = name;

    // Gallery Main Image & Chip
    const mainImg = document.getElementById("pdpMainImage");
    const keyChip = document.getElementById("pdpUniqueKeyChip");
    if (mainImg) {
      mainImg.src = p.image;
      mainImg.alt = name;
    }
    if (keyChip) {
      keyChip.textContent = `KEY: ${uniqueKey}`;
    }

    // Gallery Extra Thumbnails (Main + up to 5 additional)
    const thumbsContainer = document.getElementById("pdpThumbnails");
    const allImages = Array.isArray(p.images) && p.images.length > 0 ? p.images : (p.image ? [p.image] : []);

    if (thumbsContainer) {
      if (allImages.length > 1) {
        thumbsContainer.style.display = "flex";
        thumbsContainer.innerHTML = allImages.map((imgSrc, idx) => `
          <img src="${imgSrc}" alt="${name} ${idx + 1}" class="gallery-thumb ${imgSrc === p.image ? 'active' : ''}" data-src="${imgSrc}" />
        `).join("");

        thumbsContainer.querySelectorAll(".gallery-thumb").forEach(thumb => {
          thumb.addEventListener("click", () => {
            thumbsContainer.querySelectorAll(".gallery-thumb").forEach(t => t.classList.remove("active"));
            thumb.classList.add("active");
            if (mainImg) mainImg.src = thumb.getAttribute("data-src");
          });
        });
      } else {
        thumbsContainer.style.display = "none";
      }
    }

    // Info Column
    const metaCategory = document.getElementById("pdpMetaCategory");
    const keyDisplay = document.getElementById("pdpKeyDisplay");
    const priceEl = document.getElementById("pdpPrice");
    const origPriceEl = document.getElementById("pdpOrigPrice");
    const stockEl = document.getElementById("pdpStockText");

    if (metaCategory) metaCategory.textContent = categoryName;
    if (keyDisplay) keyDisplay.textContent = uniqueKey;
    if (titleEl) titleEl.textContent = name;
    if (priceEl) priceEl.textContent = formattedPrice;
    if (origPriceEl) {
      if (formattedOrigPrice) {
        origPriceEl.textContent = formattedOrigPrice;
        origPriceEl.style.display = "inline";
      } else {
        origPriceEl.style.display = "none";
      }
    }
    if (descEl) descEl.textContent = desc;
    if (stockEl) {
      stockEl.textContent = isArabic ? `متوفر في المخزن (${p.stockCount} قطعة متبقية)` : `In Stock (${p.stockCount} units left)`;
    }

    // Render Color Swatches
    const swatchesContainer = document.getElementById("pdpColorSwatches");
    const colorGroup = document.getElementById("pdpColorGroup");
    if (swatchesContainer && colorGroup) {
      if (p.colors && p.colors.length > 0) {
        swatchesContainer.innerHTML = p.colors.map((c, idx) => {
          const colorName = isArabic ? c.nameAr : c.name;
          const isActive = c.name === this.selectedColor;
          return `
            <button type="button" 
                    class="color-swatch ${isActive ? 'active' : ''}" 
                    style="background-color: ${c.hex};" 
                    title="${colorName}" 
                    aria-label="${colorName}"
                    onclick="ProductPageController.selectColor('${c.name}', this)">
            </button>
          `;
        }).join("");
        colorGroup.style.display = "block";
      } else {
        colorGroup.style.display = "none";
      }
    }

    // Render Sizes
    const sizesContainer = document.getElementById("pdpSizesList");
    const sizesGroup = document.getElementById("pdpSizesGroup");
    if (sizesContainer && sizesGroup) {
      if (p.sizes && p.sizes.length > 0) {
        sizesContainer.innerHTML = p.sizes.map((s) => {
          const isActive = s === this.selectedSize;
          return `
            <button type="button" 
                    class="size-pill ${isActive ? 'active' : ''}" 
                    onclick="ProductPageController.selectSize('${s}', this)">
              ${s}
            </button>
          `;
        }).join("");
        sizesGroup.style.display = "block";
      } else {
        // Render dynamic notice callout banner for items without pre-set size/color selection
        sizesGroup.style.display = "block";
        sizesContainer.innerHTML = `
          <div style="background: rgba(14, 165, 233, 0.08); border: 1px solid rgba(14, 165, 233, 0.25); border-radius: var(--radius-md); padding: 0.85rem 1rem; color: var(--brand-blue); font-size: 0.88rem; font-weight: 700; line-height: 1.5; margin-top: 0.25rem;">
            ${typeof I18nManager !== "undefined" ? I18nManager.t("productNoSizeNotice") : (isArabic ? "💬 ملاحظة: لا يلزم اختيار مقاس لهذا المنتج — سيتم تحديد التفاصيل مباشرة مع خدمة العملاء في محادثة الواتساب." : "💬 Note: No size selection required for this product — details will be confirmed directly in WhatsApp chat.")}
          </div>
        `;
      }
    }
  },

  selectColor(colorName, el) {
    this.selectedColor = colorName;
    const swatches = document.querySelectorAll("#pdpColorSwatches .color-swatch");
    swatches.forEach(s => s.classList.remove("active"));
    if (el) el.classList.add("active");
  },

  selectSize(size, el) {
    this.selectedSize = size;
    const pills = document.querySelectorAll("#pdpSizesList .size-pill");
    pills.forEach(p => p.classList.remove("active"));
    if (el) el.classList.add("active");
  },

  renderRelatedProducts() {
    const container = document.getElementById("pdpRelatedGrid");
    if (!container || !this.currentProduct) return;

    const isArabic = I18nManager.currentLang === "ar";
    // Get up to 4 other products
    const related = window.PRODUCTS.filter(p => p.id !== this.currentProduct.id && p.category === this.currentProduct.category).slice(0, 4);

    container.innerHTML = related.map(product => {
      const name = isArabic ? product.nameAr : product.name;
      const categoryName = isArabic ? product.categoryNameAr : product.categoryNameEn;
      const formattedPrice = CurrencyManager.format(product.price);
      const uniqueKey = product.id.toUpperCase();

      return `
        <article class="product-card">
          <div class="product-media">
            <span class="product-badge new">${uniqueKey}</span>
            <a href="product.html?id=${product.id}">
              <img src="${product.image}" alt="${name}" class="product-img" loading="lazy" />
            </a>
          </div>
          <div class="product-content">
            <span class="product-category">${categoryName}</span>
            <h3 class="product-title">
              <a href="product.html?id=${product.id}">${name}</a>
            </h3>
            <div class="product-price-row">
              <span class="product-price">${formattedPrice}</span>
            </div>
            <div class="product-card-actions">
              <button type="button" class="btn btn-primary btn-sm btn-full" onclick="CartManager.addItem('${product.id}')">
                ${I18nManager.t("addToCart")}
              </button>
            </div>
          </div>
        </article>
      `;
    }).join("");
  },

  showToast(msg) {
    if (window.AppCoordinator) {
      window.AppCoordinator.showToast(msg);
    } else {
      const container = document.getElementById("toastContainer");
      if (!container) return;
      const toast = document.createElement("div");
      toast.className = "toast show";
      toast.innerHTML = `<span class="toast-text">${msg}</span>`;
      container.appendChild(toast);
      setTimeout(() => toast.remove(), 3000);
    }
  },

  onLanguageChange(lang) {
    this.renderProduct();
    this.renderRelatedProducts();
    CartManager.render();
    AuthManager.updateUI();
  },

  onCurrencyChange(curr) {
    this.renderProduct();
    this.renderRelatedProducts();
    CartManager.render();
  }
};

window.ProductPageController = ProductPageController;
window.AppCoordinator = ProductPageController; // Share hook receiver

// Bootstrap on product.html
document.addEventListener("DOMContentLoaded", () => {
  ThemeManager.init();
  I18nManager.init();
  CurrencyManager.init();
  CartManager.init();
  AuthManager.init();
  ProductPageController.init();
});
