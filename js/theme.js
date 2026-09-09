/* ==========================================================================
   NEW DESGIN — THEME MANAGER (LIGHT & DARK MODE)
   Manages solid color themes with instant switching and localStorage persistence.
   ========================================================================== */

const ThemeManager = {
  currentTheme: localStorage.getItem("nd_theme") || APP_CONFIG.defaultTheme || "light",

  init() {
    this.setTheme(this.currentTheme);
    this.bindEvents();
  },

  bindEvents() {
    const toggles = document.querySelectorAll(".theme-toggle-btn");
    toggles.forEach(btn => {
      btn.addEventListener("click", () => {
        this.toggleTheme();
      });
    });
  },

  toggleTheme() {
    const nextTheme = this.currentTheme === "dark" ? "light" : "dark";
    this.setTheme(nextTheme);
  },

  setTheme(theme) {
    this.currentTheme = theme;
    localStorage.setItem("nd_theme", theme);
    document.documentElement.setAttribute("data-theme", theme);

    // Update icons on toggle buttons
    const toggles = document.querySelectorAll(".theme-toggle-btn");
    toggles.forEach(btn => {
      const icon = btn.querySelector("i, span.theme-icon");
      if (icon) {
        if (theme === "dark") {
          icon.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`;
          btn.setAttribute("aria-label", "Switch to Light Mode");
        } else {
          icon.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`;
          btn.setAttribute("aria-label", "Switch to Dark Mode");
        }
      }
    });
  }
};

window.ThemeManager = ThemeManager;
