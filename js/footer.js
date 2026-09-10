/* ==========================================================================
   NEW DESGIN — SHARED FOOTER COMPONENT
   Renders the identical footer on all storefront pages from one source.
   Supports bilingual (EN / AR) via data-i18n attributes.
   ========================================================================== */

const SiteFooter = {
  init() {
    this.render();
  },

  render() {
    const mount = document.getElementById("site-footer-mount");
    if (!mount) return;

    mount.innerHTML = `
      <footer class="site-footer" id="footer">
        <div class="container">
          <div class="footer-grid">
            <!-- Brand Column -->
            <div class="footer-brand">
              <div class="brand-logo">
                <img src="Images/Logo-noBG.png" alt="New Desgin" class="brand-img" />
                <span class="brand-text">NEW <span>DESGIN</span></span>
              </div>
              <p class="footer-desc" data-i18n="footerDesc">
                A modern, minimalist fashion brand dedicated to solid palettes, refined simplicity, and high-performance garments.
              </p>
              <div class="footer-brand-badge" style="margin-top: 1.25rem;">
                <img src="Images/Logo-text.png" alt="New Design — التصميم الجديد"
                  style="width: 110px; height: 110px; object-fit: cover; border-radius: var(--radius-md); border: 1px solid var(--border-color); display: block;" />
              </div>
            </div>

            <!-- Shop Column -->
            <div class="footer-col">
              <h4 class="footer-col-title" data-i18n="footerShopTitle">Shop</h4>
              <ul class="footer-links">
                <li><a href="products.html" class="footer-link" data-i18n="tabAll">All Products</a></li>
                <li><a href="products.html" class="footer-link" data-i18n="tabNew">New Arrivals</a></li>
                <li><a href="products.html" class="footer-link" data-i18n="tabSale">On Sale</a></li>
                <li><a href="products.html" class="footer-link" data-i18n="tabApparel">Apparel</a></li>
              </ul>
            </div>

            <!-- Customer Care Column -->
            <div class="footer-col">
              <h4 class="footer-col-title" data-i18n="footerHelpTitle">Customer Care</h4>
              <ul class="footer-links">
                <li><a href="track.html" class="footer-link" data-i18n="navTrackOrder">Track Order</a></li>
                <li><a href="faq.html" class="footer-link" data-i18n="footerFaq">FAQ &amp; Shipping</a></li>
                <li><a href="terms.html" class="footer-link" data-i18n="footerTerms">Terms &amp; Return Policy</a></li>
                <li><a href="support.html" class="footer-link" data-i18n="footerSupport">Support &amp; Tickets</a></li>
                <li>WhatsApp: <a href="https://wa.me/218924295050" target="_blank" data-store-info="whatsapp" style="color: var(--brand-blue); font-weight: 700;">+218 92-4295050</a></li>
              </ul>
            </div>

            <!-- Direct Contact Column -->
            <div class="footer-col">
              <h4 class="footer-col-title" data-i18n="footerContactTitle">Direct Contact</h4>
              <ul class="footer-links">
                <li>Phone / الهاتف: <strong data-store-info="phone">+218 92-4295050</strong></li>
                <li>Email / الإيميل: <strong data-store-info="email">Altasmemaljaded@gmail.com</strong></li>
                <li>WhatsApp: <a href="https://wa.me/218924295050" target="_blank" data-store-info="whatsapp" style="color: var(--brand-blue); font-weight: 700;">Chat on WhatsApp</a></li>
                <li><span data-i18n="footerReturnLabel">Return:</span> <strong data-store-info="returnDays">3</strong> <span data-i18n="footerDays">days</span></li>
              </ul>
            </div>
          </div>

          <div class="footer-bottom">
            <div>&copy; 2026 New Desgin. <span data-i18n="footerRights">All rights reserved.</span></div>
            <div style="font-size: 0.8rem; display: flex; align-items: center; gap: 1rem;">
          <span style="opacity: 0.8;">Made By <a href="https://wa.me/218916808225" target="_blank" style="color: inherit; text-decoration: underline; font-weight: 600;">@Osama</a></span>
            </div>
          </div>
        </div>
      </footer>
    `;

    // Re-apply i18n after rendering footer
    if (typeof I18nManager !== "undefined") {
      I18nManager.applyTranslations();
    }
    // Re-apply store info after rendering footer
    if (typeof StoreInfoManager !== "undefined") {
      StoreInfoManager.applyToDOM();
    }
  }
};

window.SiteFooter = SiteFooter;

document.addEventListener("DOMContentLoaded", () => {
  SiteFooter.init();
});
