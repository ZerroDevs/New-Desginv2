/* ==========================================================================
   NEW DESGIN — HOMEPAGE CONTENT MANAGER
   Fetches dynamic homepage text from Firebase and updates the DOM based
   on the currently selected language.
   ========================================================================== */

const HomepageManager = {
  content: null,

  init() {
    this.listenToFirebase();
    
    // Re-render when language changes
    window.addEventListener("languageChanged", () => {
      this.renderContent();
    });
  },

  listenToFirebase() {
    firebase.database().ref("settings/homepageContent").on("value", snapshot => {
      this.content = snapshot.val();
      if (this.content) {
        this.renderContent();
      }
    });
  },

  renderContent() {
    if (!this.content) return;
    
    const lang = I18nManager.currentLang || "en";
    
    // Helper to safely set text content
    const setText = (id, key) => {
      const el = document.getElementById(id);
      if (el && this.content[key]) {
        el.textContent = this.content[key];
      }
    };
    
    // Helper to safely set innerHTML (for line breaks)
    const setHtml = (id, key) => {
      const el = document.getElementById(id);
      if (el && this.content[key]) {
        el.innerHTML = this.content[key];
      }
    };

    // Hero Section
    setText("txt_heroTag", `heroTag_${lang}`);
    setText("txt_heroTitlePart1", `heroTitlePart1_${lang}`);
    setText("txt_heroTitlePart2", `heroTitlePart2_${lang}`);
    setText("txt_heroDesc", `heroDesc_${lang}`);
    setText("txt_heroBadgeTitle", `heroBadgeTitle_${lang}`);
    setText("txt_heroBadgeSubtitle", `heroBadgeSubtitle_${lang}`);

    // Benefits Section
    setText("txt_benefit1Title", `benefit1Title_${lang}`);
    setText("txt_benefit1Desc", `benefit1Desc_${lang}`);
    setText("txt_benefit2Title", `benefit2Title_${lang}`);
    setText("txt_benefit2Desc", `benefit2Desc_${lang}`);
    setText("txt_benefit3Title", `benefit3Title_${lang}`);
    setText("txt_benefit3Desc", `benefit3Desc_${lang}`);
    setText("txt_benefit4Title", `benefit4Title_${lang}`);
    setText("txt_benefit4Desc", `benefit4Desc_${lang}`);

    // Philosophy Section
    setText("txt_aboutTag", `aboutTag_${lang}`);
    setText("txt_aboutTitle", `aboutTitle_${lang}`);
    setText("txt_aboutP1", `aboutP1_${lang}`);
    setText("txt_aboutP2", `aboutP2_${lang}`);

    // Stats Section
    setText("txt_stat1Num", "stat1Num"); // Numbers are usually identical, but we have fields just in case
    setText("txt_stat1Label", `stat1Label_${lang}`);
    
    setText("txt_stat2Num", "stat2Num");
    setText("txt_stat2Label", `stat2Label_${lang}`);
    
    setText("txt_stat3Num", "stat3Num");
    setText("txt_stat3Label", `stat3Label_${lang}`);

    // Toggles - Sections
    const benefitsSection = document.querySelector(".benefits-section");
    if (benefitsSection) {
      benefitsSection.style.display = this.content.showBenefits === false ? "none" : "";
    }

    const philosophySection = document.querySelector(".about-section");
    if (philosophySection) {
      philosophySection.style.display = this.content.showPhilosophy === false ? "none" : "";
    }

    const statsContainer = document.querySelector(".about-stats");
    if (statsContainer) {
      statsContainer.style.display = this.content.showStats === false ? "none" : "flex";
    }

    // Toggles - Individual Items
    for (let i = 1; i <= 4; i++) {
      const bItem = document.getElementById(`benefitItem${i}`);
      if (bItem) bItem.style.display = this.content[`showBenefit${i}`] === false ? "none" : "";
    }

    for (let i = 1; i <= 3; i++) {
      const sItem = document.getElementById(`statItem${i}`);
      if (sItem) sItem.style.display = this.content[`showStat${i}`] === false ? "none" : "";
    }
  }
};

document.addEventListener("DOMContentLoaded", () => {
  // Only init on homepage (where hero exists)
  if (document.querySelector(".hero-section")) {
    HomepageManager.init();
  }
});
