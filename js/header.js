/* ==========================================================================
   NEW DESGIN — SHARED HEADER COMPONENT
   Renders the announcement bar + sticky navigation on all storefront pages.
   Announcement bar is hidden by default; admin can enable & customize it.
   ========================================================================== */

const SiteHeader = {
  /* The active-page link key so caller can highlight it.
     Set window.CURRENT_PAGE = 'faq' | 'support' | 'terms' | '404' before including this file. */
  currentPage: (typeof window !== "undefined" && window.CURRENT_PAGE) || "",

  announcementConfig: { visible: false, textEn: "", textAr: "" },

  init() {
    this.render();
    this.listenAnnouncement();
  },

  /* Build the full header HTML and inject it into #site-header-mount */
  render() {
    const mount = document.getElementById("site-header-mount");
    if (!mount) return;

    const page = this.currentPage;
    const navLink = (href, label, key) => {
      const active = (page === key) ? " active" : "";
      return `<a href="${href}" class="nav-link${active}">${label}</a>`;
    };
    const mobileNavLink = (href, label, key) => {
      const active = (page === key) ? " active" : "";
      return `<a href="${href}" class="mobile-nav-link${active}">${label}</a>`;
    };

    mount.innerHTML = `
      <!-- Top Announcement Bar (Hidden by Default, Admin-Controlled) -->
      <aside class="announcement-bar" id="announcementBar" role="region" aria-label="Announcement" style="display:none;">
        <div class="container">
          <span id="announcementText" data-i18n="announcement">FREE EXPRESS DELIVERY ON ORDERS OVER $150</span>
        </div>
      </aside>

      <!-- Sticky Main Header -->
      <header class="site-header" id="siteHeader">
        <div class="container header-inner">
          <!-- Mobile Menu Button -->
          <button type="button" class="mobile-menu-toggle" id="mobileMenuToggle" aria-label="Open Navigation Menu">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
          </button>

          <!-- Brand Logo -->
          <a href="index.html" class="brand-logo" aria-label="New Desgin Home">
            <img src="Images/Logo-noBG.png" alt="New Desgin" class="brand-img" />
            <span class="brand-text">NEW <span>DESGIN</span></span>
          </a>

          <!-- Desktop Navigation Links -->
          <nav class="nav-links" aria-label="Main Navigation">
            ${navLink("index.html", '<span data-i18n="navMain">Main</span>', "main")}
            ${navLink("products.html", '<span data-i18n="navShop">Shop</span>', "shop")}
            ${navLink("faq.html", "FAQ", "faq")}
            ${navLink("support.html", "Support", "support")}
          </nav>

          <!-- Header Actions -->
          <div class="header-actions">
            <!-- Language Switcher -->
            <div class="selector-pill" title="Select Language">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
              <select class="lang-selector" aria-label="Language Selector">
                <option value="en">EN</option>
                <option value="ar">العربية (AR)</option>
              </select>
            </div>

            <!-- Theme Toggle -->
            <button type="button" class="action-btn theme-toggle-btn" aria-label="Toggle Theme" title="Toggle Theme">
              <span class="theme-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
              </span>
            </button>

            <!-- Back to Store button (shown on inner pages) -->
            <a href="index.html" class="btn btn-primary btn-sm">Store</a>
          </div>
        </div>
      </header>

      <!-- Mobile Drawer Menu -->
      <aside class="mobile-drawer" id="mobileDrawer" aria-label="Mobile Navigation">
        <div class="mobile-drawer-header">
          <div class="brand-logo">
            <img src="Images/Logo-noBG.png" alt="New Desgin" class="brand-img" />
            <span class="brand-text">NEW <span>DESGIN</span></span>
          </div>
          <button type="button" class="drawer-close-btn" id="mobileDrawerClose" aria-label="Close Navigation">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
        <div class="mobile-drawer-body">
          <nav class="mobile-nav-list">
            ${mobileNavLink("index.html", '<span data-i18n="navMain">Main</span>', "main")}
            ${mobileNavLink("products.html", '<span data-i18n="navShop">Shop</span>', "shop")}
            ${mobileNavLink("faq.html", "FAQ", "faq")}
            ${mobileNavLink("terms.html", "Terms & Policies", "terms")}
            ${mobileNavLink("support.html", "Support & Tickets", "support")}
          </nav>

          <div class="mobile-settings-block">
            <div class="mobile-setting-row">
              <span>Language / اللغة</span>
              <select class="lang-selector" aria-label="Mobile Language Selector">
                <option value="en">English (EN)</option>
                <option value="ar">العربية (AR)</option>
              </select>
            </div>
            <div class="mobile-setting-row">
              <span>Theme Mode</span>
              <button type="button" class="btn btn-secondary btn-sm theme-toggle-btn">
                <span class="theme-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
                </span>
              </button>
            </div>
          </div>
        </div>
      </aside>
    `;

    this.bindDrawer();
  },

  bindDrawer() {
    const toggle = document.getElementById("mobileMenuToggle");
    const drawer = document.getElementById("mobileDrawer");
    const close = document.getElementById("mobileDrawerClose");
    if (toggle && drawer) {
      toggle.addEventListener("click", () => drawer.classList.add("open"));
    }
    if (close && drawer) {
      close.addEventListener("click", () => drawer.classList.remove("open"));
    }
  },

  /* Listen to Firebase for announcement bar visibility & text */
  listenAnnouncement() {
    const bar = document.getElementById("announcementBar");
    const textEl = document.getElementById("announcementText");
    if (!bar) return;

    try {
      if (typeof firebase !== "undefined" && firebase.database) {
        if (!firebase.apps.length && typeof APP_CONFIG !== "undefined") {
          firebase.initializeApp(APP_CONFIG.firebase);
        }
        firebase.database().ref("settings/announcement").on("value", snap => {
          const val = snap.val();
          if (val && val.visible) {
            bar.style.display = "";
            this.announcementConfig = val;
            if (textEl) {
              const lang = (typeof I18nManager !== "undefined" ? I18nManager.currentLang : (localStorage.getItem("nd_lang") || "en"));
              textEl.textContent = (lang === "ar" && val.textAr) ? val.textAr : (val.textEn || "");
            }
          } else {
            bar.style.display = "none";
          }
        });
      }
    } catch (e) {
      bar.style.display = "none";
    }
  },

  /* Called by I18nManager when language switches */
  onLanguageChange(lang) {
    const textEl = document.getElementById("announcementText");
    if (!textEl || !this.announcementConfig.visible) return;
    textEl.textContent = (lang === "ar" && this.announcementConfig.textAr)
      ? this.announcementConfig.textAr
      : (this.announcementConfig.textEn || "");
  }
};

window.SiteHeader = SiteHeader;

document.addEventListener("DOMContentLoaded", () => {
  SiteHeader.currentPage = window.CURRENT_PAGE || "";
  SiteHeader.init();
  // After rendering, initialize theme & i18n if available
  if (typeof ThemeManager !== "undefined") ThemeManager.init();
  if (typeof I18nManager !== "undefined") I18nManager.init();
});
