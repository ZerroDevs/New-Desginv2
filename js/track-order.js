/* ==========================================================================
   NEW DESGIN — ORDER TRACKING ENGINE
   Queries Firebase Realtime Database for order status, renders live step timeline,
   item breakdown, and supports direct URL parameter lookup (?id=ND-123456).
   ========================================================================== */

const TrackOrderEngine = {
  db: null,

  init() {
    this.initFirebase();
    this.bindEvents();
    this.checkUrlParams();
  },

  initFirebase() {
    try {
      if (typeof firebase !== "undefined") {
        if (!firebase.apps.length && typeof APP_CONFIG !== "undefined") {
          firebase.initializeApp(APP_CONFIG.firebase);
        }
        this.db = firebase.database();
      }
    } catch (e) {
      console.warn("Firebase init notice in TrackOrder:", e);
    }
  },

  bindEvents() {
    const searchForm = document.getElementById("trackSearchForm");
    if (searchForm) {
      searchForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const input = document.getElementById("orderSearchInput");
        if (input && input.value.trim()) {
          this.trackOrder(input.value.trim());
        }
      });
    }
  },

  checkUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get("id") || urlParams.get("orderId");
    if (orderId) {
      const input = document.getElementById("orderSearchInput");
      if (input) input.value = orderId;
      this.trackOrder(orderId);
    }
  },

  trackOrder(searchQuery) {
    const resultContainer = document.getElementById("trackResultContainer");
    const loadingEl = document.getElementById("trackLoading");
    const errorEl = document.getElementById("trackError");

    if (!resultContainer) return;

    if (loadingEl) loadingEl.style.display = "block";
    if (errorEl) errorEl.style.display = "none";
    resultContainer.style.display = "none";

    let cleanQuery = String(searchQuery).trim();
    if (cleanQuery.startsWith("#")) {
      cleanQuery = cleanQuery.substring(1).trim();
    }
    const formattedKey = cleanQuery.toUpperCase().startsWith("ND-") ? cleanQuery.toUpperCase() : cleanQuery;

    if (!this.db) {
      if (loadingEl) loadingEl.style.display = "none";
      if (errorEl) {
        errorEl.textContent = "Database connection unavailable. Please try again.";
        errorEl.style.display = "block";
      }
      return;
    }

    // Try fetching by exact order ID key first
    this.db.ref("orders/" + formattedKey).once("value").then(snapshot => {
      const val = snapshot.val();
      if (val) {
        if (loadingEl) loadingEl.style.display = "none";
        this.renderOrderDetails(val, formattedKey);
      } else {
        // Fallback: search through orders list by orderId field or customer phone
        this.db.ref("orders").once("value").then(allSnap => {
          if (loadingEl) loadingEl.style.display = "none";
          const allOrders = allSnap.val() || {};
          let foundOrder = null;
          let foundKey = null;

          for (const [key, order] of Object.entries(allOrders)) {
            if (
              (order.orderId && order.orderId.toUpperCase() === formattedKey.toUpperCase()) ||
              key.toUpperCase() === formattedKey.toUpperCase() ||
              (order.customerPhone && order.customerPhone.replace(/[^0-9]/g, "").includes(cleanQuery.replace(/[^0-9]/g, "")))
            ) {
              foundOrder = order;
              foundKey = key;
              break;
            }
          }

          if (foundOrder) {
            this.renderOrderDetails(foundOrder, foundKey);
          } else {
            if (errorEl) {
              const isAr = typeof I18nManager !== "undefined" && I18nManager.currentLang === "ar";
              errorEl.innerHTML = isAr 
                ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align: middle; margin-right: 4px;"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg> لم يتم العثور على طلب برقم: <strong>${cleanQuery}</strong>.<br>يرجى التأكد من الرقم والمحاولة مجدداً.`
                : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align: middle; margin-right: 4px;"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg> No order found matching <strong>${cleanQuery}</strong>.<br>Please verify your order ID and try again.`;
              errorEl.style.display = "block";
            }
          }
        });
      }
    }).catch(err => {
      if (loadingEl) loadingEl.style.display = "none";
      if (errorEl) {
        errorEl.textContent = "Error loading order: " + err.message;
        errorEl.style.display = "block";
      }
    });
  },

  renderOrderDetails(order, orderKey) {
    const resultContainer = document.getElementById("trackResultContainer");
    if (!resultContainer) return;

    const isAr = typeof I18nManager !== "undefined" && I18nManager.currentLang === "ar";
    const status = (order.status || "pending").toLowerCase();
    const orderId = order.orderId || orderKey;

    const orderDate = new Date(order.timestamp || Date.now());
    const formattedDate = orderDate.toLocaleDateString(isAr ? 'ar-EG' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    // Determine status steps active state
    const statusSteps = [
      { key: "pending", labelAr: "تم استلام الطلب", labelEn: "Order Received", icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>` },
      { key: "processing", labelAr: "قيد التجهيز", labelEn: "Processing", icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06-.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>` },
      { key: "shipped", labelAr: "تم الشحن", labelEn: "Shipped", icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>` },
      { key: "delivered", labelAr: "تم التوصيل", labelEn: "Delivered", icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>` }
    ];

    const statusOrder = ["pending", "processing", "shipped", "delivered", "completed"];
    const currentIndex = statusOrder.indexOf(status);

    let statusTimelineHtml = "";
    if (status === "canceled" || status === "cancelled") {
      statusTimelineHtml = `
        <div style="background: rgba(239, 68, 68, 0.12); border: 1px solid var(--error); color: var(--error); border-radius: var(--radius-md); padding: 1.25rem; text-align: center; margin-bottom: 2rem;">
          <h4 style="font-size: 1.1rem; font-weight: 800; margin-bottom: 0.25rem; display: flex; align-items: center; justify-content: center; gap: 6px;"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg> <span>${isAr ? "تم إلغاء هذا الطلب" : "This order has been canceled"}</span></h4>
          <p style="font-size: 0.88rem; opacity: 0.9;">${isAr ? "إذا كان لديك أي استفسار، يرجى التواصل مع فريق الدعم." : "If you have any questions, please reach out to customer support."}</p>
        </div>
      `;
    } else {
      statusTimelineHtml = `
        <div class="track-timeline">
          ${statusSteps.map((step, idx) => {
            const isCompleted = currentIndex >= idx;
            const isCurrent = (currentIndex === idx) || (status === 'completed' && idx === 3);
            return `
              <div class="timeline-step ${isCompleted ? 'completed' : ''} ${isCurrent ? 'active' : ''}">
                <div class="step-icon">${step.icon}</div>
                <div class="step-label">${isAr ? step.labelAr : step.labelEn}</div>
              </div>
            `;
          }).join('')}
        </div>
      `;
    }

    // Render Items
    const currencySymbol = order.currency === "USD" || order.currency === "$" ? "$" : (isAr ? "د.ل" : "LYD");
    const itemsHtml = (order.items || []).map(item => {
      const pName = isAr ? (item.nameAr || item.name) : item.name;
      const unitPrice = parseFloat(item.price);
      const totalLine = unitPrice * (item.quantity || 1);
      return `
        <div class="track-item-row">
          <div class="track-item-info">
            <h4 class="track-item-title">${pName}</h4>
            <div class="track-item-meta">
              ${item.size ? `<span>${isAr ? 'المقاس:' : 'Size:'} ${item.size}</span>` : ''}
              ${item.color ? `<span>${isAr ? 'اللون:' : 'Color:'} ${item.color}</span>` : ''}
              <span>${isAr ? 'الكمية:' : 'Qty:'} ${item.quantity || 1}</span>
            </div>
          </div>
          <div class="track-item-price">${totalLine.toFixed(2)} ${currencySymbol}</div>
        </div>
      `;
    }).join("");

    resultContainer.innerHTML = `
      <div class="track-card">
        <div class="track-card-header">
          <div>
            <span class="track-badge status-${status}">
              ${isAr ? this.getStatusAr(status) : status.toUpperCase()}
            </span>
            <h2 style="font-size: 1.5rem; font-weight: 800; margin-top: 0.5rem; color: var(--text-main);">
              ${isAr ? 'طلب' : 'Order'} #${orderId}
            </h2>
            <div style="font-size: 0.85rem; color: var(--text-muted); margin-top: 2px; display: flex; align-items: center; gap: 4px;"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg> <span>${formattedDate}</span></div>
          </div>
          <div style="text-align: ${isAr ? 'left' : 'right'};">
            <div style="font-size: 0.85rem; color: var(--text-muted);">${isAr ? 'الإجمالي النهائي' : 'Final Total'}</div>
            <div style="font-size: 1.4rem; font-weight: 900; color: var(--brand-blue);">${parseFloat(order.finalTotal || order.total || 0).toFixed(2)} ${currencySymbol}</div>
          </div>
        </div>

        ${statusTimelineHtml}

        <div class="track-sections-grid">
          <!-- Customer Info -->
          <div class="track-section-box">
            <h4 class="section-box-title" style="display: flex; align-items: center; gap: 6px;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg> <span>${isAr ? 'بيانات الشحن والعميل' : 'Customer & Shipping Info'}</span></h4>
            <div class="info-row"><span>${isAr ? 'الاسم:' : 'Name:'}</span> <strong>${order.customerName || '—'}</strong></div>
            <div class="info-row"><span>${isAr ? 'الهاتف:' : 'Phone:'}</span> <strong dir="ltr">${order.customerPhone || '—'}</strong></div>
            <div class="info-row"><span>${isAr ? 'العنوان:' : 'Address:'}</span> <strong>${order.customerAddress || '—'}</strong></div>
            ${order.notes ? `<div class="info-row"><span>${isAr ? 'ملاحظات:' : 'Notes:'}</span> <strong>${order.notes}</strong></div>` : ''}
            ${order.bankIban ? `<div class="info-row"><span>${isAr ? 'الآيبان:' : 'Bank IBAN:'}</span> <strong dir="ltr" style="font-family: monospace;">${order.bankIban}</strong></div>` : ''}
            ${order.receiptImage ? `
              <div style="margin-top: 0.75rem; padding-top: 0.5rem; border-top: 1px dashed var(--border-color);">
                <div style="font-size: 0.82rem; font-weight: 700; color: #10b981; margin-bottom: 4px; display: flex; align-items: center; gap: 4px;"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg> <span>${isAr ? 'إيصال التحويل المرفق:' : 'Attached Receipt:'}</span></div>
                <a href="${order.receiptImage}" target="_blank" title="Click to view full size">
                  <img src="${order.receiptImage}" alt="Payment Receipt" style="max-width: 100%; max-height: 160px; border-radius: var(--radius-sm); border: 1px solid var(--border-color); object-fit: contain; background: #fff;" />
                </a>
              </div>
            ` : ''}
          </div>

          <!-- Items List -->
          <div class="track-section-box">
            <h4 class="section-box-title" style="display: flex; align-items: center; gap: 6px;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg> <span>${isAr ? 'المنتجات المطلوبة' : 'Ordered Items'}</span></h4>
            <div class="track-items-list">
              ${itemsHtml}
            </div>
            <div style="margin-top: 1rem; padding-top: 0.75rem; border-top: 1px solid var(--border-color); display: flex; justify-content: space-between; font-weight: 700;">
              <span>${isAr ? 'المجموع الإجمالي:' : 'Total Amount:'}</span>
              <span style="color: var(--brand-blue);">${parseFloat(order.finalTotal || order.total || 0).toFixed(2)} ${currencySymbol}</span>
            </div>
          </div>
        </div>

        <div style="margin-top: 1.5rem; display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
          <a href="https://wa.me/218924295050?text=${encodeURIComponent(isAr ? `استفسار بخصوص الطلب #${orderId}` : `Inquiry regarding order #${orderId}`)}" target="_blank" class="btn btn-secondary" style="display: flex; align-items: center; gap: 6px;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg> <span>${isAr ? 'تواصل مع الدعم عبر واتساب' : 'Contact Support via WhatsApp'}</span>
          </a>
        </div>
      </div>
    `;

    resultContainer.style.display = "block";
  },

  getStatusAr(status) {
    const map = {
      pending: "قيد الانتظار",
      processing: "قيد التنفيذ",
      shipped: "تم الشحن",
      delivered: "تم التوصيل",
      completed: "مكتملة",
      canceled: "ملغاة",
      cancelled: "ملغاة"
    };
    return map[status] || status;
  }
};

window.TrackOrderEngine = TrackOrderEngine;

document.addEventListener("DOMContentLoaded", () => {
  TrackOrderEngine.init();
});
