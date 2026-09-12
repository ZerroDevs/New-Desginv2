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
            ${navLink("track.html", '<span data-i18n="navTrackOrder">Track Order</span>', "track")}
            ${navLink("faq.html", "FAQ", "faq")}
          </nav>

          <!-- Header Actions -->
          <div class="header-actions">
            <!-- Language Toggle Button -->
            <button type="button" class="header-toggle-btn lang-toggle-btn" aria-label="Toggle Language" title="Switch Language / تغيير اللغة">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10z"></path></svg>
              <span class="lang-toggle-text toggle-badge">EN</span>
            </button>

            <!-- Currency Toggle Button -->
            <button type="button" class="header-toggle-btn currency-toggle-btn" aria-label="Toggle Currency" title="Switch Currency / تغيير العملة">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
              <span class="currency-toggle-text toggle-badge">USD</span>
            </button>

            <!-- Theme Toggle -->
            <button type="button" class="action-btn theme-toggle-btn" aria-label="Toggle Theme" title="Toggle Theme">
              <span class="theme-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
              </span>
            </button>

            <!-- Auth State Button (Logged Out) -->
            <div class="auth-state-logged-out">
              <button type="button" class="action-btn auth-modal-open-btn" aria-label="Sign In / Register" title="Sign In">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
              </button>
            </div>

            <!-- Auth State Button (Logged In Dropdown) -->
            <div class="auth-state-logged-in auth-user-dropdown-container" style="display: none; align-items: center;">
              <button type="button" class="auth-user-btn" id="userDropdownToggleBtn" aria-label="User Menu" title="User Menu" style="padding: 3px; border-radius: 50%; border: none; background: transparent;">
                <span class="auth-avatar auth-user-avatar-initial" style="width: 32px; height: 32px; font-size: 0.9rem; font-weight: 800; border: 2px solid var(--brand-blue);">U</span>
              </button>
              <div class="user-dropdown-menu" id="userAccountDropdown">
                <div class="user-dropdown-header">
                  <div class="user-dropdown-name auth-user-name">User</div>
                  <div class="user-dropdown-email" id="userDropdownEmail">user@example.com</div>
                </div>
                <a href="profile.html" class="user-dropdown-item">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                  <span data-i18n="navProfile">Profile</span>
                </a>
                <a href="admin.html" class="user-dropdown-item user-dropdown-admin-link" style="display: none; color: var(--brand-blue); font-weight: 700;">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                  <span>Admin Panel</span>
                </a>
                <div class="user-dropdown-divider"></div>
                <button type="button" class="user-dropdown-item logout-action-btn" id="logoutBtn" style="color: var(--error);">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                  <span data-i18n="navLogout">Sign Out</span>
                </button>
              </div>
            </div>

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
            ${mobileNavLink("track.html", '<span data-i18n="navTrackOrder">Track Order</span>', "track")}
            ${mobileNavLink("faq.html", "FAQ", "faq")}
            ${mobileNavLink("terms.html", "Terms & Policies", "terms")}
          </nav>

          <div class="mobile-settings-block">
            <div class="auth-state-logged-in" style="display: none; flex-direction: column; gap: 0.5rem; margin-bottom: 0.75rem; padding-bottom: 0.75rem; border-bottom: 1px solid var(--border-color);">
              <a href="profile.html" class="btn btn-secondary btn-sm" style="display: flex; align-items: center; justify-content: center; gap: 6px;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg> <span data-i18n="navProfile">Profile</span>
              </a>
              <a href="admin.html" class="btn btn-primary btn-sm user-dropdown-admin-link" style="display: none; align-items: center; justify-content: center; gap: 6px;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg> <span>Admin Panel</span>
              </a>
            </div>
            <div class="mobile-setting-row">
              <span>Language / اللغة</span>
              <button type="button" class="header-toggle-btn lang-toggle-btn" aria-label="Toggle Language">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10z"></path></svg>
                <span class="lang-toggle-text toggle-badge">EN</span>
              </button>
            </div>
            <div class="mobile-setting-row">
              <span>Currency / العملة</span>
              <button type="button" class="header-toggle-btn currency-toggle-btn" aria-label="Toggle Currency">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                <span class="currency-toggle-text toggle-badge">USD</span>
              </button>
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
    if (typeof AuthManager !== "undefined") {
      if (!AuthManager.initialized) AuthManager.init();
      AuthManager.updateUI();
    }
  },

  bindDrawer() {
    const toggle = document.getElementById("mobileMenuToggle");
    const drawer = document.getElementById("mobileDrawer");
    const close = document.getElementById("mobileDrawerClose");
    let backdrop = document.getElementById("drawerBackdrop");

    // Dynamically inject backdrop if missing on inner pages
    if (!backdrop) {
      backdrop = document.createElement("div");
      backdrop.id = "drawerBackdrop";
      backdrop.className = "drawer-backdrop";
      document.body.appendChild(backdrop);
    }

    const openFn = () => {
      if (drawer) {
        drawer.classList.add("active");
        drawer.classList.add("open");
      }
      if (backdrop) backdrop.classList.add("active");
      document.body.style.overflow = "hidden";
    };

    const closeFn = () => {
      if (drawer) {
        drawer.classList.remove("active");
        drawer.classList.remove("open");
      }
      if (backdrop) backdrop.classList.remove("active");
      document.body.style.overflow = "";
    };

    if (toggle) {
      toggle.addEventListener("click", openFn);
    }

    if (close) {
      close.addEventListener("click", closeFn);
    }

    if (backdrop) {
      backdrop.addEventListener("click", closeFn);
    }

    if (drawer) {
      drawer.querySelectorAll(".mobile-nav-link").forEach(link => {
        link.addEventListener("click", closeFn);
      });
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
  // After rendering, initialize theme, i18n & auth UI if available
  if (typeof ThemeManager !== "undefined") ThemeManager.init();
  if (typeof I18nManager !== "undefined") I18nManager.init();
  if (typeof AuthManager !== "undefined") {
    if (!AuthManager.initialized) AuthManager.init();
    AuthManager.updateUI();
  }
});
