/* ==========================================================================
   NEW DESGIN — STORE INFO & POLICY MANAGER
   Provides centralized store contact, shipping, and policy details with
   instant fallback defaults and real-time Firebase sync (settings/storeInfo).
   ========================================================================== */

const DEFAULT_STORE_INFO = {
  phone: "+218 92-4295050",
  email: "Altasmemaljaded@gmail.com",
  whatsapp: "+218924295050",
  returnDays: "3", // مدة الاسترداد تلاتة أيام
  deliveryTripoli: "نفس اليوم / Same Day", // اي طلبية داخل طرابلس توصيل نفس اليوم
  deliveryOutside: "2-3 أيام / 2-3 Days" // برا طرابلس 2-3
};

const StoreInfoManager = {
  data: { ...DEFAULT_STORE_INFO },

  init() {
    this.initFirebaseSync();
    this.applyToDOM();
  },

  initFirebaseSync() {
    try {
      if (typeof firebase !== "undefined" && firebase.database) {
        if (!firebase.apps.length && typeof APP_CONFIG !== "undefined") {
          firebase.initializeApp(APP_CONFIG.firebase);
        }
        const db = firebase.database();

        // Store Info sync
        db.ref("settings/storeInfo").on("value", snapshot => {
          const val = snapshot.val();
          if (val) {
            this.data = { ...DEFAULT_STORE_INFO, ...val };
          } else {
            this.data = { ...DEFAULT_STORE_INFO };
          }
          this.applyToDOM();
        });

        // Announcement Bar sync (for storefront pages with static header)
        db.ref("settings/announcement").on("value", snapshot => {
          const bar = document.getElementById("announcementBar");
          const textEl = document.getElementById("announcementText");
          if (!bar) return;
          const val = snapshot.val();
          if (val && val.visible) {
            bar.style.display = "";
            if (textEl) {
              const lang = localStorage.getItem("nd_lang") || "en";
              textEl.textContent = (lang === "ar" && val.textAr) ? val.textAr : (val.textEn || "");
            }
          } else {
            bar.style.display = "none";
          }
        });
      }
    } catch (e) {
      console.warn("StoreInfo sync notice:", e);
    }
  },

  applyToDOM() {
    // Update elements with data-store-info attribute
    document.querySelectorAll("[data-store-info]").forEach(el => {
      const key = el.getAttribute("data-store-info");
      if (this.data[key] !== undefined) {
        if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") {
          el.value = this.data[key];
        } else if (el.tagName === "A" && key === "whatsapp") {
          const cleanNum = this.data[key].replace(/[^0-9]/g, "");
          el.href = `https://wa.me/${cleanNum}`;
        } else if (el.tagName === "A" && key === "phone") {
          el.href = `tel:${this.data[key]}`;
          el.textContent = this.data[key];
        } else if (el.tagName === "A" && key === "email") {
          el.href = `mailto:${this.data[key]}`;
          el.textContent = this.data[key];
        } else {
          el.textContent = this.data[key];
        }
      }
    });
  }
};

window.StoreInfoManager = StoreInfoManager;

if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => StoreInfoManager.init());
  } else {
    StoreInfoManager.init();
  }
}
