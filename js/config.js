/* ==========================================================================
   NEW DESGIN — CENTRAL CONFIGURATION
   ========================================================================== */

const APP_CONFIG = {
  brandName: "New Desgin",
  defaultLanguage: "en",
  defaultTheme: "light",
  defaultCurrency: "USD",

  // Currencies & Exchange Rates (Base currency: USD = 1.0)
  currencies: {
    USD: {
      code: "USD",
      symbol: "$",
      rate: 1.0,
      position: "prefix", // e.g. $120
      nameEn: "US Dollar",
      nameAr: "دولار أمريكي"
    },
    LYD: {
      code: "LYD",
      symbol: "ل.د",
      rate: 4.85,
      position: "suffix", // e.g. 120 ل.د
      nameEn: "Libyan Dinar",
      nameAr: "دينار ليبي"
    }
  },

  // Real Firebase Client Configuration
  firebase: {
    apiKey: "AIzaSyDdnZH1Ypo8rYIGvJZeozdzXZGdL_gUYi0",
    authDomain: "new-desginv2.firebaseapp.com",
    databaseURL: "https://new-desginv2-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "new-desginv2",
    storageBucket: "new-desginv2.firebasestorage.app",
    messagingSenderId: "924200803798",
    appId: "1:924200803798:web:60f509674983547c581877",
    measurementId: "G-78B9CEN9BR"
  }
};

window.APP_CONFIG = APP_CONFIG;
