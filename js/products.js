/* ==========================================================================
   NEW DESGIN — PRODUCT CATALOG DATA & FIREBASE SYNC
   Products are loaded purely from Firebase Realtime Database: 'products'
   Manages catalog loading state for instant user feedback.
   ========================================================================== */

// Initial products catalog is empty; populated exclusively from Firebase
window.PRODUCTS = [];
window.isProductsLoading = true;

/**
 * Initializes real-time synchronization with Firebase Realtime Database.
 */
function initProductsFirebaseSync() {
  try {
    if (typeof firebase !== "undefined" && firebase.database) {
      if (!firebase.apps.length && typeof APP_CONFIG !== "undefined") {
        firebase.initializeApp(APP_CONFIG.firebase);
      }
      const db = firebase.database();

      // Listen for real-time changes
      db.ref("products").on("value", snapshot => {
        window.isProductsLoading = false;
        const data = snapshot.val();

        if (data && Object.keys(data).length > 0) {
          const remoteList = Object.values(data).filter(p => p && p.visible !== false);
          window.PRODUCTS = remoteList;
        } else {
          window.PRODUCTS = [];
        }

        // Notify homepage catalog coordinator
        if (window.AppCoordinator && window.AppCoordinator.renderCatalog) {
          window.AppCoordinator.renderCatalog();
        }

        // Notify single product page controller
        if (window.ProductPageController && window.ProductPageController.loadProductFromUrl) {
          window.ProductPageController.loadProductFromUrl();
          window.ProductPageController.renderProduct();
          window.ProductPageController.renderRelatedProducts();
        }
      }, error => {
        console.error("Firebase products sync error:", error);
        window.isProductsLoading = false;
        if (window.AppCoordinator && window.AppCoordinator.renderCatalog) {
          window.AppCoordinator.renderCatalog();
        }
      });
    } else {
      window.isProductsLoading = false;
    }
  } catch (e) {
    console.warn("Firebase products sync fallback:", e);
    window.isProductsLoading = false;
    if (window.AppCoordinator && window.AppCoordinator.renderCatalog) {
      window.AppCoordinator.renderCatalog();
    }
  }
}

// Start loading immediately
if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initProductsFirebaseSync);
  } else {
    initProductsFirebaseSync();
  }
}
