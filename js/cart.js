/* ==========================================================================
   NEW DESGIN — SHOPPING CART ENGINE
   Full CRUD shopping cart with localStorage persistence, live currency conversion,
   RTL/LTR integration, and sliding drawer controller.
   ========================================================================== */

const CartManager = {
  items: [],

  init() {
    this.loadCart();
    this.bindEvents();
    this.render();
  },

  loadCart() {
    try {
      const saved = localStorage.getItem("nd_cart");
      this.items = saved ? JSON.parse(saved) : [];
    } catch (e) {
      this.items = [];
    }
  },

  saveCart() {
    localStorage.setItem("nd_cart", JSON.stringify(this.items));
    this.updateBadge();
  },

  bindEvents() {
    // Open cart drawer buttons
    const openBtns = document.querySelectorAll(".cart-open-btn");
    openBtns.forEach(btn => {
      btn.addEventListener("click", () => this.openDrawer());
    });

    // Close cart drawer buttons
    const closeBtns = document.querySelectorAll(".cart-close-btn");
    closeBtns.forEach(btn => {
      btn.addEventListener("click", () => this.closeDrawer());
    });

    // Backdrop click
    const backdrop = document.getElementById("drawerBackdrop");
    if (backdrop) {
      backdrop.addEventListener("click", () => {
        this.closeDrawer();
        if (window.AppCoordinator) {
          window.AppCoordinator.closeMobileDrawer();
        }
      });
    }

    // Checkout button
    const checkoutBtn = document.getElementById("checkoutBtn");
    if (checkoutBtn) {
      checkoutBtn.addEventListener("click", () => {
        if (this.items.length === 0) return;
        const totalFormatted = CurrencyManager.format(this.calculateSubtotal());
        alert(I18nManager.currentLang === "ar" 
          ? `طلب تجريبي ناجح! الإجمالي: ${totalFormatted}\nشكراً لتسوقك من نيو ديزاين.` 
          : `Mock Checkout Complete! Total: ${totalFormatted}\nThank you for shopping with New Desgin.`);
        this.items = [];
        this.saveCart();
        this.render();
        this.closeDrawer();
      });
    }
  },

  openDrawer() {
    const drawer = document.getElementById("cartDrawer");
    const backdrop = document.getElementById("drawerBackdrop");
    if (drawer && backdrop) {
      drawer.classList.add("active");
      backdrop.classList.add("active");
      document.body.style.overflow = "hidden";
    }
  },

  closeDrawer() {
    const drawer = document.getElementById("cartDrawer");
    const backdrop = document.getElementById("drawerBackdrop");
    if (drawer && backdrop) {
      drawer.classList.remove("active");
      backdrop.classList.remove("active");
      document.body.style.overflow = "";
    }
  },

  /**
   * Adds a product to the cart or increments quantity if existing.
   */
  addItem(productId, size = null, color = null, quantity = 1) {
    const product = PRODUCTS.find(p => p.id === productId);
    if (!product) return;

    const selectedSize = size || (product.sizes && product.sizes.length > 0 ? product.sizes[0] : "Standard");
    const selectedColor = color || (product.colors && product.colors.length > 0 ? product.colors[0].name : "Standard");

    // Search for existing item with identical variant options
    const existingIndex = this.items.findIndex(
      item => item.id === productId && item.size === selectedSize && item.color === selectedColor
    );

    if (existingIndex > -1) {
      this.items[existingIndex].quantity += quantity;
    } else {
      this.items.push({
        id: product.id,
        name: product.name,
        nameAr: product.nameAr,
        price: product.price,
        image: product.image,
        size: selectedSize,
        color: selectedColor,
        quantity: quantity
      });
    }

    this.saveCart();
    this.render();

    // Show friendly toast feedback
    if (window.AppCoordinator) {
      window.AppCoordinator.showToast(I18nManager.t("toastAddedToCart"));
    }

    // Auto open drawer for immediate user confirmation
    this.openDrawer();
  },

  removeItem(index) {
    if (index >= 0 && index < this.items.length) {
      this.items.splice(index, 1);
      this.saveCart();
      this.render();
      if (window.AppCoordinator) {
        window.AppCoordinator.showToast(I18nManager.t("toastRemovedFromCart"));
      }
    }
  },

  updateQuantity(index, newQty) {
    if (index >= 0 && index < this.items.length) {
      if (newQty <= 0) {
        this.removeItem(index);
      } else {
        this.items[index].quantity = newQty;
        this.saveCart();
        this.render();
      }
    }
  },

  getTotalCount() {
    return this.items.reduce((sum, item) => sum + item.quantity, 0);
  },

  calculateSubtotal() {
    return this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  },

  updateBadge() {
    const count = this.getTotalCount();
    const badges = document.querySelectorAll(".cart-count-badge");
    badges.forEach(badge => {
      badge.textContent = count;
      badge.style.display = count > 0 ? "flex" : "none";
    });
  },

  render() {
    this.updateBadge();

    const itemsContainer = document.getElementById("cartItemsList");
    const emptyContainer = document.getElementById("cartEmptyState");
    const footerContainer = document.getElementById("cartFooter");
    const subtotalEl = document.getElementById("cartSubtotalAmount");
    const totalEl = document.getElementById("cartTotalAmount");

    if (!itemsContainer) return;

    if (this.items.length === 0) {
      itemsContainer.innerHTML = "";
      if (emptyContainer) emptyContainer.style.display = "flex";
      if (footerContainer) footerContainer.style.display = "none";
      return;
    }

    if (emptyContainer) emptyContainer.style.display = "none";
    if (footerContainer) footerContainer.style.display = "block";

    const isArabic = I18nManager.currentLang === "ar";

    itemsContainer.innerHTML = this.items.map((item, index) => {
      const displayName = isArabic ? item.nameAr : item.name;
      const formattedUnitPrice = CurrencyManager.format(item.price);
      const formattedTotalPrice = CurrencyManager.format(item.price * item.quantity);

      return `
        <div class="cart-item" data-index="${index}">
          <img src="${item.image}" alt="${displayName}" class="cart-item-img" onerror="this.src='https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=400&q=80'" />
          <div class="cart-item-info">
            <h4 class="cart-item-title">${displayName}</h4>
            <div class="cart-item-meta">${item.size ? `Size: ${item.size}` : ""} ${item.color ? `· ${item.color}` : ""}</div>
            <div class="cart-item-bottom">
              <div class="quantity-controller">
                <button type="button" class="qty-btn" onclick="CartManager.updateQuantity(${index}, ${item.quantity - 1})" aria-label="Decrease quantity">-</button>
                <span class="qty-value">${item.quantity}</span>
                <button type="button" class="qty-btn" onclick="CartManager.updateQuantity(${index}, ${item.quantity + 1})" aria-label="Increase quantity">+</button>
              </div>
              <div class="cart-item-price">${formattedTotalPrice}</div>
              <button type="button" class="cart-item-remove" onclick="CartManager.removeItem(${index})" title="${I18nManager.t('cartRemove')}">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
          </div>
        </div>
      `;
    }).join("");

    const subtotal = this.calculateSubtotal();
    const formattedTotal = CurrencyManager.format(subtotal);

    if (subtotalEl) subtotalEl.textContent = formattedTotal;
    if (totalEl) totalEl.textContent = formattedTotal;
  }
};

window.CartManager = CartManager;
