/* ==========================================================================
   NEW DESGIN — INTERNATIONALIZATION & TRANSLATION ENGINE
   Supports English (LTR) & Arabic (RTL) with persistence in localStorage.
   ========================================================================== */

const translations = {
  en: {
    // Brand & Header
    brandName: "New Desgin",
    navShop: "Shop",
    navMain: "Main",
    navAbout: "About",
    navContact: "Contact",
    navLogin: "Login / Sign Up",
    navLogout: "Logout",
    navAccount: "My Account",
    announcement: "FREE EXPRESS DELIVERY ON ORDERS OVER $150 — SOLID MINIMAL AESTHETICS",

    // Hero
    heroTag: "NEW SEASON 2026",
    heroTitlePart1: "STYLE WITHOUT",
    heroTitlePart2: "LIMITS.",
    heroDesc: "Discover modern, minimalist clothing crafted for effortless elegance. Clean solid cuts, premium materials, and timeless design.",
    heroCtaShop: "Shop Now",
    heroCtaExplore: "Explore Collections",
    heroBadgeTitle: "New Arrival",
    heroBadgeSubtitle: "Spring / Summer 26",

    // Benefits
    benefit1Title: "Premium Materials",
    benefit1Desc: "Crafted from ethically sourced fabrics",
    benefit2Title: "Fast Delivery",
    benefit2Desc: "• Inside Tripoli: Same-day delivery for all orders placed before cutoff. (Same Day)<br><br>• Outside Tripoli (other Libyan cities): 2–3 business days. (2-3 Days)",
    benefit3Title: "Secure Payments",
    benefit3Desc: "Encrypted & authenticated transactions",
    benefit4Title: "Easy Returns",
    benefit4Desc: "30-day hassle-free exchange policy",

    // Catalog & Filter
    catalogTag: "CURATED CATALOG",
    catalogTitle: "Our Minimalist Essentials",
    catalogSubtitle: "Engineered with solid shades, precision cuts, and superior comfort.",
    catalogViewAll: "View All Products",
    tabAll: "All Products",
    tabFeatured: "Featured",
    tabNew: "New Arrivals",
    tabSale: "On Sale",
    tabApparel: "Apparel",
    tabFootwear: "Footwear",
    tabAccessories: "Accessories",

    // Product Card & Quick View
    quickView: "Quick View",
    addToCart: "Add to Cart",
    outOfStock: "Out of Stock",
    inStock: "In Stock",
    selectSize: "Select Size",
    selectColor: "Select Color",
    quantity: "Quantity",
    viewDetails: "View Details",

    // About Section
    aboutTag: "OUR PHILOSOPHY",
    aboutTitle: "Simplicity In Every Stitch",
    aboutP1: "New Desgin was founded on a simple premise: genuine elegance doesn't require complexity or flashy gradients. By focusing strictly on solid palettes of light blue and dark blue, balanced by refined neutrals, we craft apparel that stands out through silhouette and fabric quality.",
    aboutP2: "Every piece is designed for longevity and effortless layering. Whether in bustling urban centers or relaxed coastal escapes, New Desgin represents confident minimalism.",
    stat1Num: "100%",
    stat1Label: "Organic Cotton",
    stat2Num: "48H",
    stat2Label: "Fast Dispatch",
    stat3Num: "25K+",
    stat3Label: "Happy Customers",

    // Cart Drawer
    cartTitle: "Your Shopping Bag",
    cartEmptyTitle: "Your cart is empty",
    cartEmptySubtitle: "Looks like you haven't added any products yet.",
    cartContinueShopping: "Continue Shopping",
    cartSubtotal: "Subtotal",
    cartShipping: "Estimated Shipping",
    cartShippingFree: "Calculated at checkout",
    cartTotal: "Total",
    cartCheckout: "Proceed to Checkout",
    cartRemove: "Remove",

    // Auth Modal
    authLoginTab: "Sign In",
    authSignupTab: "Create Account",
    authEmail: "Email Address",
    authPassword: "Password",
    authConfirmPassword: "Confirm Password",
    authFullName: "Full Name",
    authLoginBtn: "Sign In",
    authSignupBtn: "Create Account",
    authOr: "OR",
    authGoogleSignIn: "Continue with Google",
    authNoAccount: "Don't have an account?",
    authHaveAccount: "Already have an account?",
    authSwitchToSignup: "Register here",
    authSwitchToLogin: "Sign in here",
    authLoggedAs: "Logged in as",
    buyNow: "Buy Now",
    productSku: "Product SKU",
    relatedProducts: "You May Also Like",
    descriptionTab: "Description & Details",
    specsTab: "Fabric & Material Care",
    shippingTab: "Shipping & Free Returns",
    deliveryTripoliLabel: "Delivery (Tripoli):",
    deliveryOutsideLabel: "Delivery (Outside Tripoli):",
    returnsLabel: "Returns:",
    daysText: "Days",

    // Feedback & Toasts
    toastAddedToCart: "Added to cart successfully ✓",
    toastRemovedFromCart: "Item removed from cart",
    toastCartUpdated: "Cart updated",
    toastLoginSuccess: "Welcome back!",
    toastSignupSuccess: "Account created successfully!",
    toastLogoutSuccess: "You have been logged out",
    toastErrorGeneric: "Something went wrong. Please try again.",

    // Footer
    footerDesc: "A modern, minimalist fashion brand dedicated to solid palettes, refined simplicity, and high-performance garments.",
    footerShopTitle: "Shop",
    footerCompanyTitle: "Company",
    footerHelpTitle: "Customer Care",
    footerContactTitle: "Direct Contact",
    footerFaq: "FAQ & Shipping",
    footerTerms: "Terms & Return Policy",
    footerSupport: "Support & Tickets",
    footerReturnLabel: "Return:",
    footerDays: "days",
    footerNewsletterTitle: "Stay In The Loop",
    footerNewsletterDesc: "Receive exclusive updates on new drops and seasonal discounts.",
    footerEmailPlaceholder: "Enter your email address...",
    footerSubscribeBtn: "Join",
    footerRights: "All rights reserved.",

    // FAQ Page
    faqPageTitle: "Frequently Asked Questions",
    faqPageSubtitle: "Common questions about orders, delivery, returns, and support.",
    faqQ1: "How long does delivery take inside Tripoli and other cities?",
    faqA1Tripoli: "Inside Tripoli: Same-day delivery for all orders placed before cutoff.",
    faqA1Outside: "Outside Tripoli (other Libyan cities): 2–3 business days.",
    faqQ2: "What is the return & exchange period?",
    faqA2: "Returns and exchanges are accepted within 3 days of delivery. Items must be unused, in original condition with all tags and original packaging.",
    faqQ3: "How can I contact customer support?",
    faqA3: "You can reach us directly via WhatsApp, phone, email, or by submitting a support ticket on our support page.",
    faqQ4: "What payment methods are available?",
    faqA4: "We offer Cash on Delivery (COD) after inspection, local bank transfers, and electronic payment options in Libyan Dinar (LYD) or USD.",
    faqQ5: "How can I track my support ticket?",
    faqA5: "Visit our Support Center and use the 'My Tickets' tab or enter your ticket ID (e.g. TKT-XXXX) in the ticket tracking section to see admin replies in real time.",
    faqNoAnswer: "Didn't find your answer? Our team is always ready to help.",
    faqContactSupport: "Contact Support",

    // Terms Page
    termsPageTitle: "Terms of Service & Store Policies",
    termsPageSubtitle: "Return policy, delivery timelines, privacy, and store guidelines for New Desgin customers.",
    terms1Title: "01. Return & Exchange Policy",
    terms1Box: "Return & Exchange Duration:",
    terms1BoxSuffix: "days from delivery date.",
    terms1BodyEn: "Customers can request a return or exchange within",
    terms1BodySuffix: "days of delivery. Products must remain in original unused condition with all tags and packaging intact.",
    terms1BodyAr: "We allow returns or exchanges within the specified period from delivery date, provided items are unused with all original tags and packaging.",
    terms2Title: "02. Delivery & Shipping Timelines",
    terms2Tripoli: "Inside Tripoli:",
    terms2Outside: "Outside Tripoli (other cities):",
    terms2Body: "All orders are processed and dispatched with maximum accuracy. Orders within Tripoli city are delivered the same day. Orders to other Libyan cities and regions arrive within 2 to 3 business days.",
    terms3Title: "03. Official Contact & WhatsApp",
    terms3Body: "All inquiries regarding orders, sizing, or follow-up are available via the following official channels:",
    terms3WhatsApp: "WhatsApp:",
    terms3Phone: "Phone:",
    terms3Email: "Email:",
    terms3Tickets: "Support Tickets:",
    terms3TicketsLink: "Open a Support Ticket",
    terms4Title: "04. Customer Privacy & Security",
    terms4Body: "We are fully committed to protecting your personal data. We do not share phone numbers, addresses, or order details with any third party. Your data is used exclusively to complete delivery and communicate with you about your orders.",
    termsContactBtn: "Have Questions? Contact Support",

    // Support Page
    supportPageTitle: "Customer Support Center",
    supportPageSubtitle: "Direct contact channels and live support tickets.",
    supportChannelWhatsApp: "WhatsApp",
    supportChannelPhone: "Direct Call",
    supportChannelEmail: "Email",
    supportChannelDelivery: "Return & Delivery",
    supportDeliveryInfo: "Return",
    supportDeliverySuffix: "days | Tripoli:",
    supportTabNew: "Open New Ticket",
    supportTabMy: "My Tickets",
    supportTabTrack: "Track by ID",
    supportNewTitle: "Submit a Support Ticket",
    supportNewDesc: "Fill in your details below. Our team responds promptly, and you can track responses live on this page.",
    supportFieldName: "Full Name",
    supportFieldContact: "Phone or Email",
    supportFieldCategory: "Category",
    supportFieldSubject: "Subject",
    supportFieldMessage: "Detailed Message",
    supportSubmitBtn: "Submit Ticket",
    supportMyTitle: "My Support Tickets",
    supportTrackTitle: "Track Your Ticket by ID",
    supportTrackDesc: "Enter your unique ticket reference code (e.g. TKT-XXXX) to view status and admin responses.",
    supportSearchBtn: "Search Ticket",

    // 404 Page
    err404Title: "Page Not Found",
    err404Desc: "The page or product you were looking for doesn't exist, has been moved, or is temporarily unavailable.",
    err404CatalogBtn: "Explore Catalog",
    err404SupportBtn: "Customer Support"
  },

  ar: {
    // Brand & Header
    brandName: "نيو ديزاين",
    navShop: "المتجر",
    navMain: "الرئيسية",
    navAbout: "من نحن",
    navContact: "اتصل بنا",
    navLogin: "تسجيل الدخول / حساب جديد",
    navLogout: "تسجيل الخروج",
    navAccount: "حسابي",
    announcement: "توصيل سريع ومجاني للطلبات فوق 150$ — تصاميم عصرية بألوان ثابتة",

    // Hero
    heroTag: "موسم 2026 الجديد",
    heroTitlePart1: "أناقة بلا",
    heroTitlePart2: "حدود.",
    heroDesc: "اكتشف أزياء عصرية وبسيطة صُممت لأناقة تدوم طويلاً. ألوان نقية وثابتة، أقمشة فاخرة، وتصاميم تواكب العصر.",
    heroCtaShop: "تسوق الآن",
    heroCtaExplore: "استكشف المجموعات",
    heroBadgeTitle: "وصل حديثاً",
    heroBadgeSubtitle: "ربيع / صيف 2026",

    // Benefits
    benefit1Title: "أقمشة فائقة الجودة",
    benefit1Desc: "مصنوعة من خامات عضوية ومستدامة",
    benefit2Title: "توصيل فائق السرعة",
    benefit2Desc: "• داخل طرابلس: التوصيل يتم في نفس اليوم لكافة الطلبيات. (نفس اليوم)<br><br>• خارج طرابلس (باقي المدن الليبية): يصلك طلبك خلال 2-3 أيام عمل. (2-3 أيام)",
    benefit3Title: "دفع آمن ومحمي",
    benefit3Desc: "معاملات إلكترونية مشفرة وموثوقة",
    benefit4Title: "استرجاع سهل وميسر",
    benefit4Desc: "سياسة استبدال واسترجاع مرنة خلال 30 يوماً",

    // Catalog & Filter
    catalogTag: "كتالوج المنتجات",
    catalogTitle: "تشكيلة الأزياء العصرية",
    catalogSubtitle: "مختارة بعناية فائقة بألوان الأزرق الداكن والفاتح لتناسب كل الأوقات.",
    catalogViewAll: "عرض جميع المنتجات",
    tabAll: "جميع المنتجات",
    tabFeatured: "المميزة",
    tabNew: "وصل حديثاً",
    tabSale: "العروض والتخفيضات",
    tabApparel: "الملابس",
    tabFootwear: "الأحذية",
    tabAccessories: "الإكسسوارات",

    // Product Card & Quick View
    quickView: "نظرة سريعة",
    addToCart: "أضف إلى السلة",
    outOfStock: "نفذت الكمية",
    inStock: "متوفر بالمخزن",
    selectSize: "اختر المقاس",
    selectColor: "اختر اللون",
    quantity: "الكمية",
    viewDetails: "عرض التفاصيل",

    // About Section
    aboutTag: "فلسفتنا في التصميم",
    aboutTitle: "البساطة في كل تفصيلة",
    aboutP1: "تأسست ماركة نيو ديزاين (New Desgin) على مبدأ أساسي: الأناقة الحقيقية تنبع من البساطة وليس التدرجات الصاخبة. نركز على درجات الأزرق السماوي والأزرق الداكن المتناسقة مع درجات حيادية نقية لنقدم أزياء عملية ومريحة.",
    aboutP2: "كل قطعة مصممة لتدوم طويلاً وتمنحك ثقة كاملة في إطلالتك اليومية ومناسباتك الخاصة.",
    stat1Num: "100%",
    stat1Label: "قطن طبيعي فاخر",
    stat2Num: "48 ساعة",
    stat2Label: "تجهيز الشحن",
    stat3Num: "+25 ألف",
    stat3Label: "عميل راضٍ",

    // Cart Drawer
    cartTitle: "حقيبة التسوق",
    cartEmptyTitle: "حقيبتك فارغة حالياً",
    cartEmptySubtitle: "لم تقم بإضافة أي منتجات إلى السلة بعد.",
    cartContinueShopping: "متابعة التسوق",
    cartSubtotal: "المجموع الفرعي",
    cartShipping: "الشحن التقديري",
    cartShippingFree: "يُحسب عند الدفع",
    cartTotal: "الإجمالي النهائي",
    cartCheckout: "إتمام الطلب الآن",
    cartRemove: "حذف",

    // Auth Modal
    authLoginTab: "تسجيل الدخول",
    authSignupTab: "إنشاء حساب",
    authEmail: "البريد الإلكتروني",
    authPassword: "كلمة المرور",
    authConfirmPassword: "تأكيد كلمة المرور",
    authFullName: "الاسم الكامل",
    authLoginBtn: "دخول",
    authSignupBtn: "تسجيل حساب جديد",
    authOr: "أو",
    authGoogleSignIn: "المتابعة باستخدام Google",
    authNoAccount: "ليس لديك حساب؟",
    authHaveAccount: "لديك حساب بالفعل؟",
    authSwitchToSignup: "أنشئ حساباً الآن",
    authSwitchToLogin: "سجل الدخول هنا",
    authLoggedAs: "مرحباً بك",
    buyNow: "شراء الآن",
    productSku: "رمز المنتج (SKU)",
    relatedProducts: "منتجات قد تعجبك أيضاً",
    descriptionTab: "الوصف والتفاصيل",
    specsTab: "الخامات والعناية بالمنتج",
    shippingTab: "الشحن والاسترجاع المجاني",
    deliveryTripoliLabel: "التوصيل (داخل طرابلس):",
    deliveryOutsideLabel: "التوصيل (خارج طرابلس):",
    returnsLabel: "الاسترداد:",
    daysText: "أيام",

    // Feedback & Toasts
    toastAddedToCart: "تمت إضافة المنتج إلى السلة بنجاح ✓",
    toastRemovedFromCart: "تمت إزالة المنتج من السلة",
    toastCartUpdated: "تم تحديث السلة",
    toastLoginSuccess: "أهلاً بك مجدداً!",
    toastSignupSuccess: "تم إنشاء الحساب بنجاح!",
    toastLogoutSuccess: "تم تسجيل الخروج بنجاح",
    toastErrorGeneric: "حدث خطأ ما، يرجى المحاولة مرة أخرى.",

    // Footer
    footerDesc: "علامة تجارية عصرية رائدة تركز على البساطة، جودة الأقمشة، والألوان الصريحة دون تدرجات.",
    footerShopTitle: "المتجر",
    footerCompanyTitle: "الشركة",
    footerHelpTitle: "خدمة العملاء",
    footerContactTitle: "تواصل مباشر",
    footerFaq: "الأسئلة الشائعة والشحن",
    footerTerms: "الشروط وسياسة الاسترداد",
    footerSupport: "الدعم الفني والتذاكر",
    footerReturnLabel: "الاسترداد:",
    footerDays: "أيام",
    footerNewsletterTitle: "كن أول من يعلم",
    footerNewsletterDesc: "اشترك للحصول على آخر التحديثات والعروض الحصرية مباشرة في بريدك.",
    footerEmailPlaceholder: "أدخل بريدك الإلكتروني...",
    footerSubscribeBtn: "اشتراك",
    footerRights: "جميع الحقوق محفوظة.",

    // FAQ Page
    faqPageTitle: "الأسئلة الشائعة",
    faqPageSubtitle: "أكثر الأسئلة شيوعاً حول الطلبات، التوصيل، الاسترجاع، والدعم الفني.",
    faqQ1: "كم يستغرق توصيل الطلبات في طرابلس وباقي المدن؟",
    faqA1Tripoli: "داخل طرابلس: التوصيل يتم في نفس اليوم لكافة الطلبيات.",
    faqA1Outside: "خارج طرابلس (باقي المدن الليبية): يصلك طلبك خلال 2-3 أيام عمل.",
    faqQ2: "ما هي مدة الاسترجاع أو الاستبدال؟",
    faqA2: "مدة الاسترداد أو الاستبدال هي 3 أيام من تاريخ استلام الطلب. يشترط أن يكون المنتج بحالته الأصلية غير مستعمل ويحمل جميع بطاقات العلامة التجارية.",
    faqQ3: "كيف يمكنني التواصل مع خدمة العملاء أو الاستفسار؟",
    faqA3: "أي تواصل متاح مباشرة عبر الواتساب، الهاتف، البريد الإلكتروني، أو عبر فتح تذكرة دعم من صفحة الدعم الفني.",
    faqQ4: "ما هي طرق الدفع المتاحة في المتجر؟",
    faqA4: "نوفر الدفع عند الاستلام (Cash on Delivery) بعد معاينة طلبكم، كما ندعم التحويلات المصرفية المحلية وخدمات الدفع الإلكتروني بالدينار الليبي (LYD) أو الدولار الأمريكي (USD).",
    faqQ5: "كيف يمكنني متابعة حالة تذكرة الدعم الخاصة بي؟",
    faqA5: "يمكنك الانتقال إلى صفحة مركز الدعم الفني والاطلاع على تذاكرك في تبويب 'تذاكري'، أو إدخال رقم التذكرة الخاص بك (مثل TKT-XXXX) في حقل تتبع التذاكر.",
    faqNoAnswer: "لم تجد إجابة لسؤالك؟ فريقنا متواجد دائماً لمساعدتك.",
    faqContactSupport: "تواصل مع الدعم الفني",

    // Terms Page
    termsPageTitle: "شروط الخدمة وسياسات المتجر",
    termsPageSubtitle: "سياسة الاسترداد، مدد التوصيل، الخصوصية، وإرشادات تسوق العملاء في متجر نيو ديزاين.",
    terms1Title: "01. سياسة الاسترداد والاستبدال",
    terms1Box: "مدة الاسترداد والاستبدال:",
    terms1BoxSuffix: "أيام من تاريخ استلام الطلب.",
    terms1BodyEn: "يمكن طلب الاسترجاع أو الاستبدال خلال",
    terms1BodySuffix: "أيام من تاريخ الاستلام.",
    terms1BodyAr: "حرصاً منا على رضاكم، يتيح متجر New Desgin إمكانية استرجاع أو استبدال المنتجات خلال المدة المحددة من تاريخ الاستلام، بشرط أن تكون المنتجات بحالتها الأصلية غير مستخدمة ومرفقة ببطاقاتها وتغليفها الأصلي.",
    terms2Title: "02. التوصيل والشحن",
    terms2Tripoli: "داخل طرابلس:",
    terms2Outside: "خارج طرابلس (باقي المدن):",
    terms2Body: "يتم تجهيز كافة الطلبيات وشحنها بأعلى معايير الدقة والسرعة. أي طلبية داخل نطاق مدينة طرابلس تصلكم خلال نفس يوم الطلب. أما الطلبيات الموجهة إلى باقي المدن والمناطق الليبية فتصل في غضون 2 إلى 3 أيام عمل.",
    terms3Title: "03. التواصل والدعم الرسمي",
    terms3Body: "أي تواصل أو استفسار بخصوص الطلبات، المقاسات أو المتابعة متاح عبر القنوات الرسمية التالية:",
    terms3WhatsApp: "واتساب:",
    terms3Phone: "الهاتف:",
    terms3Email: "البريد الإلكتروني:",
    terms3Tickets: "تذاكر الدعم:",
    terms3TicketsLink: "فتح تذكرة دعم فني",
    terms4Title: "04. خصوصية وأمان العملاء",
    terms4Body: "نحن نلتزم بحماية خصوصية بياناتكم الشخصية بالكامل. لا نقوم بمشاركة أي أرقام هواتف، عناوين أو تفاصيل طلبات مع أي طرف ثالث، وتُستخدم بياناتكم حصرياً لإتمام التوصيل والتواصل معكم بشأن طلبياتكم.",
    termsContactBtn: "لديك سؤال؟ تواصل مع الدعم",

    // Support Page
    supportPageTitle: "مركز خدمة العملاء",
    supportPageSubtitle: "قنوات التواصل المباشر وتذاكر الدعم الفني.",
    supportChannelWhatsApp: "واتساب",
    supportChannelPhone: "اتصال هاتفي",
    supportChannelEmail: "البريد الإلكتروني",
    supportChannelDelivery: "الاسترداد والتوصيل",
    supportDeliveryInfo: "استرداد",
    supportDeliverySuffix: "أيام | طرابلس:",
    supportTabNew: "فتح تذكرة جديدة",
    supportTabMy: "تذاكري",
    supportTabTrack: "تتبع برقم التذكرة",
    supportNewTitle: "إرسال تذكرة دعم",
    supportNewDesc: "أدخل بياناتك أدناه. يرد فريقنا بسرعة ويمكنك متابعة الردود مباشرة على هذه الصفحة.",
    supportFieldName: "الاسم الكامل",
    supportFieldContact: "الهاتف أو الإيميل",
    supportFieldCategory: "القسم",
    supportFieldSubject: "الموضوع",
    supportFieldMessage: "تفاصيل الرسالة",
    supportSubmitBtn: "إرسال التذكرة",
    supportMyTitle: "تذاكر الدعم الخاصة بي",
    supportTrackTitle: "تتبع تذكرتك برقمها",
    supportTrackDesc: "أدخل رقم التذكرة الخاص بك (مثل TKT-XXXX) لمعاينة حالتها وردود الإدارة.",
    supportSearchBtn: "بحث عن التذكرة",

    // 404 Page
    err404Title: "الصفحة غير موجودة",
    err404Desc: "الصفحة أو المنتج الذي تبحث عنه غير موجود، أو تم نقله، أو غير متاح مؤقتاً.",
    err404CatalogBtn: "تصفح الكتالوج",
    err404SupportBtn: "خدمة العملاء"
  }
};

const I18nManager = {
  currentLang: localStorage.getItem("nd_lang") || APP_CONFIG.defaultLanguage || "en",

  init() {
    this.setLanguage(this.currentLang, false);
    this.bindEvents();
  },

  bindEvents() {
    const langSelects = document.querySelectorAll(".lang-selector");
    langSelects.forEach(select => {
      select.value = this.currentLang;
      select.addEventListener("change", (e) => {
        this.setLanguage(e.target.value);
      });
    });
  },

  setLanguage(lang, triggerRerender = true) {
    if (!translations[lang]) lang = "en";
    this.currentLang = lang;
    localStorage.setItem("nd_lang", lang);

    // Update HTML attributes
    document.documentElement.lang = lang;
    if (lang === "ar") {
      document.documentElement.setAttribute("dir", "rtl");
    } else {
      document.documentElement.setAttribute("dir", "ltr");
    }

    // Sync all language dropdowns across desktop and mobile
    const langSelects = document.querySelectorAll(".lang-selector");
    langSelects.forEach(select => {
      select.value = lang;
    });

    // Translate DOM elements marked with data-i18n
    this.applyTranslations();

    // Notify app to re-render products and cart if active
    if (triggerRerender && window.AppCoordinator) {
      window.AppCoordinator.onLanguageChange(lang);
    }
  },

  t(key) {
    if (translations[this.currentLang] && translations[this.currentLang][key]) {
      return translations[this.currentLang][key];
    }
    if (translations.en[key]) {
      return translations.en[key];
    }
    return key;
  },

  applyTranslations() {
    const elements = document.querySelectorAll("[data-i18n]");
    elements.forEach(el => {
      const key = el.getAttribute("data-i18n");
      const translation = this.t(key);
      if (translation) {
        if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") {
          if (el.hasAttribute("placeholder")) {
            el.setAttribute("placeholder", translation);
          }
        } else {
          el.innerHTML = translation;
        }
      }
    });

    const placeholders = document.querySelectorAll("[data-i18n-placeholder]");
    placeholders.forEach(el => {
      const key = el.getAttribute("data-i18n-placeholder");
      const translation = this.t(key);
      if (translation) {
        el.setAttribute("placeholder", translation);
      }
    });
  }
};

window.I18nManager = I18nManager;
