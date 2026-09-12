/* ==========================================================================
   NEW DESGIN — CURRENCY CONVERTER ENGINE
   Performs real mathematical conversion across USD and LYD (and extensible)
   Persists in localStorage and updates product cards, quick view, and cart.
   ========================================================================== */

const CurrencyManager = {
  currentCurrency: localStorage.getItem("nd_currency") || APP_CONFIG.defaultCurrency || "USD",

  init() {
    this.setCurrency(this.currentCurrency, false);
    this.bindEvents();
  },

  bindEvents() {
    document.querySelectorAll(".currency-toggle-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        this.toggleCurrency();
      });
    });

    const currencySelects = document.querySelectorAll(".currency-selector");
    currencySelects.forEach(select => {
      select.value = this.currentCurrency;
      select.addEventListener("change", (e) => {
        this.setCurrency(e.target.value);
      });
    });
  },

  toggleCurrency() {
    const nextCurr = this.currentCurrency === "USD" ? "LYD" : "USD";
    this.setCurrency(nextCurr);
  },

  setCurrency(currencyCode, triggerRerender = true) {
    if (!APP_CONFIG.currencies[currencyCode]) {
      currencyCode = "USD";
    }

    this.currentCurrency = currencyCode;
    localStorage.setItem("nd_currency", currencyCode);

    // Sync all currency toggle button texts across desktop and mobile
    const toggleTexts = document.querySelectorAll(".currency-toggle-text");
    toggleTexts.forEach(el => {
      el.textContent = currencyCode;
    });

    // Sync all dropdowns if present
    const currencySelects = document.querySelectorAll(".currency-selector");
    currencySelects.forEach(select => {
      select.value = currencyCode;
    });

    // Notify app coordinator to update all prices dynamically
    if (triggerRerender && window.AppCoordinator) {
      window.AppCoordinator.onCurrencyChange(currencyCode);
    }
  },

  getCurrencyInfo() {
    return APP_CONFIG.currencies[this.currentCurrency] || APP_CONFIG.currencies.USD;
  },

  /**
   * Converts a base USD amount to the active currency and formats it with symbol.
   * @param {number} amountUSD - Base price in USD
   * @returns {string} Formatted string, e.g. "$120.00" or "582.00 ل.د"
   */
  format(amountUSD) {
    const info = this.getCurrencyInfo();
    const converted = amountUSD * info.rate;
    const formattedNum = converted.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });

    if (info.position === "prefix") {
      return `${info.symbol}${formattedNum}`;
    } else {
      return `${formattedNum} ${info.symbol}`;
    }
  },

  /**
   * Returns raw converted number (for calculations)
   */
  convert(amountUSD) {
    const info = this.getCurrencyInfo();
    return amountUSD * info.rate;
  }
};

window.CurrencyManager = CurrencyManager;

// Live synchronization of exchange rate with Firebase Realtime Database
function initExchangeRateFirebaseSync() {
  try {
    if (typeof firebase !== "undefined" && firebase.database) {
      if (!firebase.apps.length && typeof APP_CONFIG !== "undefined") {
        firebase.initializeApp(APP_CONFIG.firebase);
      }
      const db = firebase.database();
      db.ref("settings/exchangeRate").on("value", snapshot => {
        const rate = snapshot.val();
        if (rate && parseFloat(rate) > 0) {
          APP_CONFIG.currencies.LYD.rate = parseFloat(rate);
          if (window.AppCoordinator && window.AppCoordinator.onCurrencyChange) {
            window.AppCoordinator.onCurrencyChange(CurrencyManager.currentCurrency);
          }
        }
      });
    }
  } catch (e) {
    console.warn("Currency live Firebase sync offline fallback:", e);
  }
}

if (typeof document !== "undefined") {
  document.addEventListener("DOMContentLoaded", initExchangeRateFirebaseSync);
}
