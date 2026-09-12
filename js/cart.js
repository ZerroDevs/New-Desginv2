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
        if (this.items.length === 0) {
          if (window.AppCoordinator) {
            window.AppCoordinator.showToast(I18nManager.t("cartEmptyTitle") || "Cart is empty!");
          }
          return;
        }
        this.openCheckoutModal();
      });
    }
  },

  openCheckoutModal() {
    if (this.items.length === 0) return;

    let modal = document.getElementById("ndCheckoutModal");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "ndCheckoutModal";
      modal.className = "nd-checkout-modal-backdrop";
      document.body.appendChild(modal);
    }

    this.currentReceiptDataUrl = null;
    const isAr = typeof I18nManager !== "undefined" && I18nManager.currentLang === "ar";
    const subtotal = this.calculateSubtotal();
    const formattedTotal = typeof CurrencyManager !== "undefined" ? CurrencyManager.format(subtotal) : `${subtotal} LYD`;
    const curSymbol = (typeof CurrencyManager !== "undefined" && CurrencyManager.currentCurrency) ? CurrencyManager.currentCurrency : "LYD";

    const bankIban = (typeof StoreInfoManager !== "undefined" && StoreInfoManager.data && StoreInfoManager.data.bankIban)
      ? StoreInfoManager.data.bankIban
      : "LY32024005010265803020501";
    const bankAccountTitle = (typeof StoreInfoManager !== "undefined" && StoreInfoManager.data && StoreInfoManager.data.bankAccountTitle)
      ? StoreInfoManager.data.bankAccountTitle
      : "ALTASMEM ALJADED ALALME COMPANY";

    modal.innerHTML = `
      <div class="nd-checkout-modal-content">
        <div class="nd-checkout-modal-header">
          <h3>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
            <span>${I18nManager ? I18nManager.t("checkoutModalTitle") : (isAr ? "إتمام بيانات الطلب" : "Complete Your Order")}</span>
          </h3>
          <button type="button" class="nd-modal-close" onclick="CartManager.closeCheckoutModal()">&times;</button>
        </div>
        <form id="ndCheckoutForm" onsubmit="CartManager.handleCheckoutSubmit(event)">
          <div class="nd-checkout-body">
            <div class="nd-checkout-summary">
              <div>
                <div>${isAr ? "إجمالي المنتجات:" : "Total Items:"} <strong>${this.getTotalCount()}</strong></div>
                <div style="margin-top: 4px;">
                  ${isAr ? "الإجمالي النهائي:" : "Final Total:"} 
                  <strong id="chkSummaryTotal" style="color: var(--brand-blue); font-weight: 800; font-size: 1.05rem;">${formattedTotal}</strong>
                </div>
              </div>
              <button type="button" class="btn btn-secondary btn-sm" id="chkCurrencyToggleBtn" onclick="CartManager.toggleCheckoutCurrency()" style="display: flex; align-items: center; gap: 5px; font-weight: 700; border-radius: var(--radius-full); padding: 5px 12px;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 10h14l-4-4"></path><path d="M17 14H3l4 4"></path></svg>
                <span id="chkCurrencyLabel">${curSymbol}</span>
              </button>
            </div>

            <!-- Bank Transfer & IBAN Details Card -->
            <div style="background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 0.9rem 1rem; margin-bottom: 1rem;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.4rem;">
                <span style="font-weight: 700; font-size: 0.88rem; color: var(--text-main); display: flex; align-items: center; gap: 6px;">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M8 10v11M12 10v11M16 10v11M20 10v11"></path></svg>
                  <span>${isAr ? "بيانات التحويل البنكي / Bank Transfer" : "Bank Transfer Info"}</span>
                </span>
                <button type="button" class="btn btn-secondary btn-sm" onclick="CartManager.copyBankIban('${bankIban}')" style="padding: 2px 10px; font-size: 0.78rem; display: flex; align-items: center; gap: 4px;" id="chkCopyIbanBtn">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg>
                  <span id="chkCopyIbanLabel">${isAr ? "نسخ IBAN" : "Copy IBAN"}</span>
                </button>
              </div>

              <div style="background: var(--bg-main); border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 0.6rem 0.8rem; margin-bottom: 0.4rem; font-family: monospace; font-weight: 800; color: var(--brand-blue); font-size: 0.92rem; letter-spacing: 0.5px; word-break: break-all;" dir="ltr">
                ${bankIban}
              </div>

              <div style="font-size: 0.8rem; color: var(--text-muted);">
                <span>${isAr ? "اسم الحساب:" : "Account Holder:"}</span>
                <strong style="color: var(--text-main); font-weight: 700;">${bankAccountTitle}</strong>
              </div>
            </div>

            <div class="nd-form-group">
              <label>${I18nManager ? I18nManager.t("checkoutName") : (isAr ? "الاسم الكامل" : "Full Name")} *</label>
              <input type="text" id="chkName" required placeholder="${isAr ? 'أدخل اسمك الكامل' : 'Enter your full name'}" class="nd-input" />
            </div>

            <div class="nd-form-group">
              <label>${I18nManager ? I18nManager.t("checkoutPhone") : (isAr ? "رقم الهاتف" : "Phone Number")} *</label>
              <input type="tel" id="chkPhone" required placeholder="${isAr ? '091XXXXXXX / 092XXXXXXX' : 'e.g. +218 91 1234567'}" class="nd-input" dir="ltr" />
            </div>

            <div class="nd-form-group">
              <label>${I18nManager ? I18nManager.t("authEmail") : (isAr ? "البريد الإلكتروني (اختياري)" : "Email Address (Optional)")}</label>
              <input type="email" id="chkEmail" placeholder="${isAr ? 'name@example.com' : 'e.g. name@example.com'}" class="nd-input" />
            </div>

            <div class="nd-form-group">
              <label>${I18nManager ? I18nManager.t("checkoutAddress") : (isAr ? "المدينة وعنوان التوصيل" : "City & Delivery Address")} *</label>
              <input type="text" id="chkAddress" required placeholder="${isAr ? 'مثال: طرابلس - النوفليين / بنغازي' : 'e.g. Tripoli, Al-Noufleen'}" class="nd-input" />
            </div>

            <!-- Upload Receipt Image (Optional / Recommended) -->
            <div class="nd-form-group">
              <label style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                <span>${isAr ? "إرفاق إيصال التحويل (اختياري / موصى به)" : "Payment Receipt (Optional / Recommended)"}</span>
                <span style="font-size: 0.75rem; color: var(--brand-blue); font-weight: 700; display: inline-flex; align-items: center; gap: 4px;"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg> ${isAr ? "صورة الإيصال" : "Receipt Photo"}</span>
              </label>

              <input type="file" id="chkReceiptFile" accept="image/*" style="display: none;" onchange="CartManager.handleReceiptFileSelect(event)" />
              
              <div id="chkReceiptDropZone" onclick="document.getElementById('chkReceiptFile').click()" style="border: 2px dashed var(--border-color); border-radius: var(--radius-md); padding: 0.85rem; text-align: center; cursor: pointer; background: var(--bg-secondary); transition: all 0.2s ease;">
                <div id="chkReceiptPlaceholder">
                  <div style="margin-bottom: 0.3rem;"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--brand-blue)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg></div>
                  <div style="font-size: 0.85rem; font-weight: 700; color: var(--text-main);">${isAr ? "انقر لاختيار أو رفع صورة إيصال التحويل" : "Click to select or upload transfer receipt"}</div>
                  <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 2px;">${isAr ? "يدعم لقطات الشاشة والصور من جهازك" : "Supports screenshots and gallery images"}</div>
                </div>

                <div id="chkReceiptPreviewBox" style="display: none; align-items: center; justify-content: space-between; gap: 0.75rem;">
                  <img id="chkReceiptPreviewImg" src="" alt="Receipt Preview" style="width: 48px; height: 48px; object-fit: cover; border-radius: var(--radius-sm); border: 1px solid var(--border-color); background: #fff;" />
                  <div style="text-align: ${isAr ? 'right' : 'left'}; flex: 1; min-width: 0;">
                    <div style="font-size: 0.82rem; font-weight: 700; color: #10b981;">✓ ${isAr ? "تم إرفاق صورة الإيصال" : "Receipt attached ✓"}</div>
                    <div id="chkReceiptFileName" style="font-size: 0.72rem; color: var(--text-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">receipt.jpg</div>
                  </div>
                  <button type="button" class="btn btn-secondary btn-sm" onclick="event.stopPropagation(); CartManager.clearReceiptFile();" style="color: var(--error); padding: 4px 8px; font-size: 0.8rem;" title="Remove Receipt">✕</button>
                </div>
              </div>
            </div>

            <div class="nd-form-group">
              <label>${I18nManager ? I18nManager.t("checkoutNotes") : (isAr ? "ملاحظات إضافية (اختياري)" : "Order Notes (Optional)")}</label>
              <textarea id="chkNotes" rows="2" placeholder="${isAr ? 'أي تفاصيل خاصة بالتوصيل أو المقاس...' : 'Any special notes regarding delivery...'}" class="nd-input"></textarea>
            </div>
          </div>

          <div class="nd-checkout-footer">
            <button type="button" class="btn btn-secondary" onclick="CartManager.closeCheckoutModal()">${I18nManager ? I18nManager.t("checkoutCancel") : (isAr ? "إلغاء" : "Cancel")}</button>
            <button type="submit" class="btn btn-primary" id="chkSubmitBtn" style="display: flex; align-items: center; gap: 8px;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
              <span>${I18nManager ? I18nManager.t("checkoutSubmit") : (isAr ? "تأكيد الطلب والإرسال عبر واتساب" : "Confirm & Send via WhatsApp")}</span>
            </button>
          </div>
        </form>
      </div>
    `;

    modal.onclick = (e) => {
      if (e.target === modal) {
        CartManager.closeCheckoutModal();
      }
    };

    modal.classList.add("active");
    document.body.style.overflow = "hidden";

    // Auto-fill from saved User Profile if available
    try {
      let profileData = null;
      if (typeof ProfileManager !== "undefined" && ProfileManager.getProfile) {
        profileData = ProfileManager.getProfile();
      } else {
        const raw = localStorage.getItem("nd_user_profile");
        if (raw) profileData = JSON.parse(raw);
      }

      if (profileData) {
        const nameInput = document.getElementById("chkName");
        const phoneInput = document.getElementById("chkPhone");
        const emailInput = document.getElementById("chkEmail");
        const addressInput = document.getElementById("chkAddress");
        const notesInput = document.getElementById("chkNotes");

        const authUser = (typeof AuthManager !== "undefined" && AuthManager.currentUser) ? AuthManager.currentUser : null;

        if (nameInput && profileData.fullName) nameInput.value = profileData.fullName;
        if (phoneInput && profileData.phone) phoneInput.value = profileData.phone;
        if (emailInput) {
          emailInput.value = profileData.email || (authUser ? authUser.email : "");
        }
        if (addressInput && profileData.address) addressInput.value = profileData.address;
        if (notesInput && profileData.notes) notesInput.value = profileData.notes;
      }
    } catch (e) {
      console.warn("Profile auto-fill skipped:", e);
    }
  },

  handleReceiptFileSelect(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    this.compressReceiptImage(file).then(dataUrl => {
      this.currentReceiptDataUrl = dataUrl;
      const placeholder = document.getElementById("chkReceiptPlaceholder");
      const previewBox = document.getElementById("chkReceiptPreviewBox");
      const previewImg = document.getElementById("chkReceiptPreviewImg");
      const fileNameEl = document.getElementById("chkReceiptFileName");

      if (placeholder) placeholder.style.display = "none";
      if (previewBox) previewBox.style.display = "flex";
      if (previewImg) previewImg.src = dataUrl;
      if (fileNameEl) fileNameEl.textContent = file.name || "receipt.jpg";
    }).catch(err => {
      console.warn("Receipt compress error:", err);
    });
  },

  clearReceiptFile() {
    this.currentReceiptDataUrl = null;
    const fileInput = document.getElementById("chkReceiptFile");
    if (fileInput) fileInput.value = "";

    const placeholder = document.getElementById("chkReceiptPlaceholder");
    const previewBox = document.getElementById("chkReceiptPreviewBox");

    if (placeholder) placeholder.style.display = "block";
    if (previewBox) previewBox.style.display = "none";
  },

  compressReceiptImage(file, maxWidth = 1000, maxHeight = 1000, quality = 0.82) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const img = new Image();
        img.onload = () => {
          let width = img.width;
          let height = img.height;

          if (width > maxWidth || height > maxHeight) {
            if (width / height > maxWidth / maxHeight) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            } else {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL("image/jpeg", quality));
        };
        img.onerror = reject;
        img.src = evt.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  },

  copyBankIban(iban) {
    if (!iban) return;
    navigator.clipboard.writeText(iban).then(() => {
      const label = document.getElementById("chkCopyIbanLabel");
      const isAr = typeof I18nManager !== "undefined" && I18nManager.currentLang === "ar";
      if (label) {
        const origText = label.textContent;
        label.textContent = isAr ? "تم النسخ ✓" : "Copied! ✓";
        setTimeout(() => { label.textContent = origText; }, 2000);
      }
      if (window.AppCoordinator && AppCoordinator.showToast) {
        AppCoordinator.showToast(isAr ? "تم نسخ رقم IBAN إلى الحافظة ✓" : "IBAN copied to clipboard! ✓");
      }
    }).catch(err => {
      console.warn("Copy IBAN error:", err);
    });
  },

  toggleCheckoutCurrency() {
    if (typeof CurrencyManager === "undefined") return;
    const newCur = CurrencyManager.currentCurrency === "LYD" ? "USD" : "LYD";
    CurrencyManager.setCurrency(newCur);

    const subtotal = this.calculateSubtotal();
    const formattedTotal = CurrencyManager.format(subtotal);

    const totalEl = document.getElementById("chkSummaryTotal");
    const labelEl = document.getElementById("chkCurrencyLabel");

    if (totalEl) totalEl.textContent = formattedTotal;
    if (labelEl) labelEl.textContent = newCur;

    // Update cart drawer total if rendered
    this.render();
  },

  closeCheckoutModal() {
    const modal = document.getElementById("ndCheckoutModal");
    if (modal) modal.classList.remove("active");
    document.body.style.overflow = "";
  },

  async handleCheckoutSubmit(e) {
    e.preventDefault();

    const name = document.getElementById("chkName").value.trim();
    const phone = document.getElementById("chkPhone").value.trim();
    const email = document.getElementById("chkEmail") ? document.getElementById("chkEmail").value.trim() : "";
    const address = document.getElementById("chkAddress").value.trim();
    const notes = document.getElementById("chkNotes").value.trim();

    if (!name || !phone || !address) return;

    const btn = document.getElementById("chkSubmitBtn");
    const isAr = typeof I18nManager !== "undefined" && I18nManager.currentLang === "ar";

    if (btn) {
      btn.disabled = true;
      btn.innerHTML = `<div class="spinner" style="width: 14px; height: 14px; border: 2px solid white; border-top-color: transparent; border-radius: 50%; animation: spin 0.8s linear infinite; display: inline-block; margin-right: 6px;"></div><span>${isAr ? "جارٍ حفظ الطلب والإرسال..." : "Saving order & sending..."}</span>`;
    }

    const orderNum = "ND-" + Math.floor(100000 + Math.random() * 900000);
    const subtotal = this.calculateSubtotal();
    const formattedTotal = typeof CurrencyManager !== "undefined" ? CurrencyManager.format(subtotal) : `${subtotal} LYD`;
    const currency = (typeof CurrencyManager !== "undefined" && CurrencyManager.currentCurrency) ? CurrencyManager.currentCurrency : "LYD";

    const authUser = (typeof AuthManager !== "undefined" && AuthManager.currentUser) ? AuthManager.currentUser : null;
    const userEmail = email || (authUser ? authUser.email : "");

    // Persist inputted user profile details to local storage and DB
    if (typeof ProfileManager !== "undefined" && ProfileManager.updateUserProfile) {
      ProfileManager.updateUserProfile({
        fullName: name,
        phone: phone,
        email: userEmail,
        address: address,
        notes: notes,
        preferredCurrency: currency
      });
    } else {
      try {
        const raw = localStorage.getItem("nd_user_profile");
        const p = raw ? JSON.parse(raw) : {};
        if (name) p.fullName = name;
        if (phone) p.phone = phone;
        if (userEmail) p.email = userEmail;
        if (address) p.address = address;
        if (notes) p.notes = notes;
        if (currency) p.preferredCurrency = currency;
        localStorage.setItem("nd_user_profile", JSON.stringify(p));
      } catch (e) {}
    }

    const bankIban = (typeof StoreInfoManager !== "undefined" && StoreInfoManager.data && StoreInfoManager.data.bankIban)
      ? StoreInfoManager.data.bankIban
      : "LY32024005010265803020501";
    const bankAccountTitle = (typeof StoreInfoManager !== "undefined" && StoreInfoManager.data && StoreInfoManager.data.bankAccountTitle)
      ? StoreInfoManager.data.bankAccountTitle
      : "ALTASMEM ALJADED ALALME COMPANY";

    const hasReceipt = !!this.currentReceiptDataUrl;

    const orderData = {
      orderId: orderNum,
      id: orderNum,
      timestamp: Date.now(),
      date: new Date().toLocaleDateString(),
      status: "pending",
      userId: authUser ? authUser.uid : null,
      email: userEmail,
      name: name,
      customerName: name,
      phone: phone,
      customerPhone: phone,
      address: address,
      customerAddress: address,
      notes: notes || "",
      bankIban: bankIban,
      bankAccountTitle: bankAccountTitle,
      receiptImage: this.currentReceiptDataUrl || null,
      items: this.items.map(item => ({
        id: item.id || "",
        name: item.name || "",
        nameAr: item.nameAr || item.name || "",
        price: item.price,
        quantity: item.quantity,
        size: item.size || "Standard",
        color: item.color || "Standard"
      })),
      total: subtotal,
      finalTotal: subtotal,
      totalFormatted: formattedTotal,
      currency: currency,
      language: isAr ? "ar" : "en"
    };

    // Save order to Firebase Realtime Database with async await to prevent network cancel on page redirect
    try {
      if (typeof firebase !== "undefined" && firebase.database) {
        if (!firebase.apps.length && typeof APP_CONFIG !== "undefined") {
          firebase.initializeApp(APP_CONFIG.firebase);
        }
        const db = firebase.database();
        const saves = [db.ref("orders/" + orderNum).set(orderData)];
        if (orderData.userId) {
          saves.push(db.ref("users/" + orderData.userId + "/orders/" + orderNum).set(orderData));
        }

        // Wait up to 3 seconds for Firebase acknowledgment before continuing
        const timeoutPromise = new Promise(resolve => setTimeout(resolve, 3000));
        await Promise.race([Promise.all(saves), timeoutPromise]);
      }
    } catch (err) {
      console.warn("Firebase order save notice:", err);
    }

    // Save order locally for user profile & fallback
    try {
      let myOrders = [];
      const rawMyOrders = localStorage.getItem("nd_my_orders");
      if (rawMyOrders) myOrders = JSON.parse(rawMyOrders);
      myOrders.unshift(orderData);
      localStorage.setItem("nd_my_orders", JSON.stringify(myOrders));
    } catch (e) {
      console.warn("Local order save notice:", e);
    }

    // Determine target WhatsApp phone number
    let rawPhone = "+218924295050";
    if (typeof StoreInfoManager !== "undefined" && StoreInfoManager.data) {
      rawPhone = StoreInfoManager.data.whatsapp || StoreInfoManager.data.phone || rawPhone;
    }
    const cleanPhone = rawPhone.replace(/[^0-9]/g, "");

    // Format items text list
    let hasUnspecifiedVariant = false;

    const itemsListText = this.items.map(item => {
      const pName = isAr ? (item.nameAr || item.name) : item.name;
      const unitFmt = typeof CurrencyManager !== "undefined" ? CurrencyManager.format(item.price) : `${item.price} ${currency}`;
      
      const hasSizeVal = item.size && item.size !== "Standard" && item.size !== "none" && item.size !== "";
      const hasColorVal = item.color && item.color !== "Standard" && item.color !== "none" && item.color !== "";

      let tagStr = "";
      if (hasSizeVal && hasColorVal) {
        tagStr = ` [${item.size} - ${item.color}]`;
      } else if (hasSizeVal) {
        tagStr = ` [${item.size}]`;
      } else if (hasColorVal) {
        tagStr = ` [${item.color}]`;
      } else {
        hasUnspecifiedVariant = true;
        tagStr = isAr ? ` (سيتم تحديد المقاس/اللون معكم في المحادثة)` : ` (Size/Color to be confirmed in chat)`;
      }

      return `• ${pName} (${item.quantity}x ${unitFmt})${tagStr}`;
    }).join("\n");

    // Compose WhatsApp message
    let waMessage = "";
    if (isAr) {
      waMessage = `مرحباً، أود تأكيد الطلب التالي من متجر New Desgin\n\n` +
        `رقم الطلب: #${orderNum}\n` +
        `الاسم: ${name}\n` +
        `الهاتف: ${phone}\n` +
        `العنوان: ${address}\n` +
        (notes ? `ملاحظات: ${notes}\n` : "") +
        `\nمعلومات التحويل البنكي:\n` +
        `IBAN: ${bankIban}\n` +
        `اسم الحساب: ${bankAccountTitle}\n` +
        (hasReceipt ? `إيصال التحويل: تم إرفاق صورة الإيصال مع الطلب عبر الموقع ✓\n` : "") +
        `\nالمنتجات المطلوبة:\n${itemsListText}\n\n` +
        (hasUnspecifiedVariant ? `تنبيه: يرجى توضيح تفاصيل المقاس واللون للمنتجات غير المحددة في المحادثة.\n\n` : "") +
        `المجموع الإجمالي: ${formattedTotal}\n\n` +
        `تتبع حالة طلبك من هنا:\n${window.location.origin}/track.html?id=${orderNum}\n\n` +
        `شكراً لكم!`;
    } else {
      waMessage = `Hello, I would like to confirm a new order from New Desgin\n\n` +
        `Order ID: #${orderNum}\n` +
        `Name: ${name}\n` +
        `Phone: ${phone}\n` +
        `Address: ${address}\n` +
        (notes ? `Notes: ${notes}\n` : "") +
        `\nBank Transfer Details:\n` +
        `IBAN: ${bankIban}\n` +
        `Account: ${bankAccountTitle}\n` +
        (hasReceipt ? `Receipt: Payment receipt photo attached with order on website ✓\n` : "") +
        `\nOrdered Items:\n${itemsListText}\n\n` +
        (hasUnspecifiedVariant ? `Note: Please specify size & color preference for items marked above in this chat.\n\n` : "") +
        `Total Amount: ${formattedTotal}\n\n` +
        `Track your order status here:\n${window.location.origin}/track.html?id=${orderNum}\n\n` +
        `Thank you!`;
    }

    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(waMessage)}`;
    orderData.waUrl = waUrl;

    // Store last order in sessionStorage for Success Page
    try {
      sessionStorage.setItem("nd_last_order", JSON.stringify(orderData));
    } catch (e) { }

    // Clear cart & close drawer & modal
    this.items = [];
    this.saveCart();
    this.render();
    this.closeDrawer();
    this.closeCheckoutModal();

    // Open WhatsApp in new tab
    window.open(waUrl, "_blank");

    // Redirect to Order Success Page
    window.location.href = `order-success.html?id=${orderNum}`;
  },

  showOrderConfirmationModal(orderId, waUrl) {
    let modal = document.getElementById("ndOrderSuccessModal");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "ndOrderSuccessModal";
      modal.className = "nd-checkout-modal-backdrop";
      document.body.appendChild(modal);
    }

    const isAr = typeof I18nManager !== "undefined" && I18nManager.currentLang === "ar";

    modal.innerHTML = `
      <div class="nd-checkout-modal-content" style="text-align: center; max-width: 480px;">
        <div style="width: 60px; height: 60px; border-radius: 50%; background: rgba(16, 185, 129, 0.15); color: #10b981; display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem; font-size: 2rem;">✓</div>
        <h3 style="font-size: 1.4rem; margin-bottom: 0.5rem; color: var(--text-main);">${I18nManager ? I18nManager.t("orderSuccessTitle") : (isAr ? "تم إرسال الطلب بنجاح!" : "Order Sent Successfully!")}</h3>
        <p style="color: var(--text-muted); font-size: 0.95rem; margin-bottom: 1.25rem;">
          ${I18nManager ? I18nManager.t("orderSuccessDesc") : (isAr ? "رقم طلبك هو:" : "Your order number is:")} <strong style="color: var(--brand-blue); font-family: monospace; font-size: 1.1rem;">#${orderId}</strong>
        </p>

        <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 1.5rem;">
          ${I18nManager ? I18nManager.t("orderWhatsAppNotice") : (isAr ? "إذا لم يفتح الواتساب تلقائياً، اضغط على الزر أدناه:" : "If WhatsApp didn't open automatically, click the button below:")}
        </p>

        <div style="display: flex; flex-direction: column; gap: 0.75rem;">
          <a href="${waUrl}" target="_blank" class="btn btn-primary btn-full" style="background: #25D366; border-color: #25D366; color: white; display: flex; align-items: center; justify-content: center; gap: 6px;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg> ${I18nManager ? I18nManager.t("openWhatsAppBtn") : (isAr ? "فتح محادثة الواتساب" : "Open WhatsApp Chat")}
          </a>
          <a href="track.html?id=${orderId}" class="btn btn-secondary btn-full" style="display: flex; align-items: center; justify-content: center; gap: 6px;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg> ${I18nManager ? I18nManager.t("trackOrderBtn") : (isAr ? "تتبع حالة الطلب" : "Track Order Status")}
          </a>
          <button type="button" class="btn btn-tertiary" onclick="document.getElementById('ndOrderSuccessModal').classList.remove('active')">
            ${isAr ? "إغلاق" : "Close"}
          </button>
        </div>
      </div>
    `;

    modal.classList.add("active");
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

    const hasSizes = product.sizes && product.sizes.length > 0;
    const hasColors = product.colors && product.colors.length > 0;

    const selectedSize = size !== null ? size : (hasSizes ? product.sizes[0] : "");
    const selectedColor = color !== null ? color : (hasColors ? product.colors[0].name : "");

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
