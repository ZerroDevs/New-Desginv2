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
                ? `❌ لم يتم العثور على طلب برقم: <strong>${cleanQuery}</strong>.<br>يرجى التأكد من الرقم والمحاولة مجدداً.`
                : `❌ No order found matching <strong>${cleanQuery}</strong>.<br>Please verify your order ID and try again.`;
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
      { key: "pending", labelAr: "تم استلام الطلب", labelEn: "Order Received", icon: "📦" },
      { key: "processing", labelAr: "قيد التجهيز", labelEn: "Processing", icon: "⚙️" },
      { key: "shipped", labelAr: "تم الشحن", labelEn: "Shipped", icon: "🚚" },
      { key: "delivered", labelAr: "تم التوصيل", labelEn: "Delivered", icon: "🎉" }
    ];

    const statusOrder = ["pending", "processing", "shipped", "delivered", "completed"];
    const currentIndex = statusOrder.indexOf(status);

    let statusTimelineHtml = "";
    if (status === "canceled" || status === "cancelled") {
      statusTimelineHtml = `
        <div style="background: rgba(239, 68, 68, 0.12); border: 1px solid var(--error); color: var(--error); border-radius: var(--radius-md); padding: 1.25rem; text-align: center; margin-bottom: 2rem;">
          <h4 style="font-size: 1.1rem; font-weight: 800; margin-bottom: 0.25rem;">❌ ${isAr ? "تم إلغاء هذا الطلب" : "This order has been canceled"}</h4>
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
            <div style="font-size: 0.85rem; color: var(--text-muted); margin-top: 2px;">📅 ${formattedDate}</div>
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
            <h4 class="section-box-title">👤 ${isAr ? 'بيانات الشحن والعميل' : 'Customer & Shipping Info'}</h4>
            <div class="info-row"><span>${isAr ? 'الاسم:' : 'Name:'}</span> <strong>${order.customerName || '—'}</strong></div>
            <div class="info-row"><span>${isAr ? 'الهاتف:' : 'Phone:'}</span> <strong dir="ltr">${order.customerPhone || '—'}</strong></div>
            <div class="info-row"><span>${isAr ? 'العنوان:' : 'Address:'}</span> <strong>${order.customerAddress || '—'}</strong></div>
            ${order.notes ? `<div class="info-row"><span>${isAr ? 'ملاحظات:' : 'Notes:'}</span> <strong>${order.notes}</strong></div>` : ''}
          </div>

          <!-- Items List -->
          <div class="track-section-box">
            <h4 class="section-box-title">📦 ${isAr ? 'المنتجات المطلوبة' : 'Ordered Items'}</h4>
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
          <a href="https://wa.me/218924295050?text=${encodeURIComponent(isAr ? `استفسار بخصوص الطلب #${orderId}` : `Inquiry regarding order #${orderId}`)}" target="_blank" class="btn btn-secondary">
            💬 ${isAr ? 'تواصل مع الدعم عبر واتساب' : 'Contact Support via WhatsApp'}
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
