import { createContext, useContext, useEffect, useMemo, useState } from "react";

export const SPEC_PRESET_OPTIONS = {
  nominal_power: { fr: "Puissance nominale", ar: "الاستطاعة المقدرة" },
  nominal_voltage: { fr: "Tension nominale", ar: "التوتر المقدر" },
  controller: { fr: "Contrôleur", ar: "المتحكم" },
  battery_type: { fr: "Type de batterie", ar: "نوع البطارية" },
  battery_specs: { fr: "Spécifications de la batterie", ar: "مواصفات البطارية" },
  max_speed: { fr: "Vitesse maximale", ar: "السرعة القصوى" },
  autonomy: { fr: "Autonomie", ar: "المدى" },
  motor_type: { fr: "Type de moteur", ar: "نوع المحرك" },
  slope_angle: { fr: "Angle de pente", ar: "زاوية المنحدر" },
  charging_time: { fr: "Temps de charge", ar: "وقت الشحن" },
  brakes: { fr: "Freins avant / arrière", ar: "الفرامل الأمامية / الخلفية" },
  tire_specs: { fr: "Spécifications des pneus", ar: "مواصفات الإطارات" },
  hub_specs: { fr: "Spécifications du moyeu", ar: "مواصفات المحور" },
  max_load: { fr: "Charge maximale", ar: "الحمولة القصوى" },
  wheelbase: { fr: "Empattement", ar: "المسافة بين العجلات" },
  body_tank: { fr: "Réservoir de carrosserie", ar: "سعة خزان الدراجة" },
  seat_height: { fr: "Hauteur du siège", ar: "ارتفاع المقعد" },
  front_tires: { fr: "Pneus avant", ar: "الإطارات الأمامية" },
  rear_tires: { fr: "Pneus arrière", ar: "الإطارات الخلفية" },
  front_wheel: { fr: "Jante avant", ar: "العجلة الأمامية" },
  front_suspension: { fr: "Suspension avant", ar: "التعليق الأمامي" },
  rear_shock: { fr: "Amortisseur arrière", ar: "المُخمد الخلفي" },
  lights: { fr: "Phares", ar: "الأضواء" },
  instruments: { fr: "Instruments", ar: "الأدوات" },
};

export const FEATURE_PRESET_OPTIONS = {
  repair_in_one_click: { fr: "Réparation en un clic", ar: "إصلاح بنقرة واحدة" },
  parking_brake_p: { fr: "Frein de stationnement en position P", ar: "الفرامل اليدوية في وضع P" },
  three_speeds: { fr: "Trois vitesses", ar: "ثلاث سرعات" },
  reverse: { fr: "Marche arrière", ar: "الرجوع للخلف" },
  usb_port: { fr: "Port USB", ar: "منفذ USB" },
  smart_start: { fr: "Démarrage intelligent sans clé", ar: "التشغيل الذكي بدون مفتاح" },
  cruise_control: { fr: "Régulateur de vitesse", ar: "منظم السرعة" },
};

export function normalizePresetValue(type, value) {
  const lookup = type === "feature" ? FEATURE_PRESET_OPTIONS : SPEC_PRESET_OPTIONS;
  const text = typeof value === "string" ? value.trim() : "";

  if (!text) return value;
  if (lookup[text]) return text;

  const normalized = text.toLowerCase();
  for (const [key, labels] of Object.entries(lookup)) {
    if (Object.values(labels).some((label) => label.toLowerCase() === normalized)) {
      return key;
    }
  }

  return value;
}

export function getPresetLabel(type, value, language = "fr") {
  const lookup = type === "feature" ? FEATURE_PRESET_OPTIONS : SPEC_PRESET_OPTIONS;
  const normalizedValue = normalizePresetValue(type, value);

  if (typeof normalizedValue === "string" && lookup[normalizedValue]) {
    return lookup[normalizedValue][language] || lookup[normalizedValue].fr || normalizedValue;
  }

  return value;
}

const translations = {
  fr: {
    footer: {
      message: "Suivez-nous sur Facebook et TikTok pour voir nos derniers modèles.",
    },
    nav: {
      home: "Accueil",
      products: "Produits",
      adminProducts: "Produits",
      logout: "Déconnexion",
      whatsapp: "WhatsApp",
      menu: "Menu",
      contact: "Contact",
      followUs: "Suivez-nous",
      location: "Algérie",
      language: "Langue",
      french: "Français",
      arabic: "العربية",
    },
    hero: {
      badge: "Électricité fiable",
      title: "HM Dora Moto",
      subtitle: "Découvrez la gamme de scooters électriques et commandez directement sur WhatsApp.",
      cta: "Voir les modèles",
      whatsapp: "WhatsApp",
      features: ["Garantie officielle", "Paiement à la livraison"],
      scrollLabel: "Défiler vers les produits",
    },
    auth: {
      adminTitle: "Espace Admin",
      adminSubtitle: "Connectez-vous pour gérer HM Dora Moto",
      emailLabel: "Adresse email",
      emailPlaceholder: "admin@example.com",
      passwordLabel: "Mot de passe",
      passwordPlaceholder: "••••••••",
      showPassword: "Afficher le mot de passe",
      hidePassword: "Masquer le mot de passe",
      loginEmailRequired: "Veuillez entrer votre email.",
      loginEmailInvalid: "Format d'email invalide.",
      loginPasswordRequired: "Veuillez entrer votre mot de passe.",
      loginPasswordTooShort: "Le mot de passe doit contenir au moins 6 caractères.",
      loginSuccess: "Connexion réussie !",
      loginFailed: "Échec de la connexion.",
      loggingIn: "Connexion...",
      loginButton: "Se connecter",
    },
    notFound: {
      title: "Page introuvable",
      message: "La page que vous cherchez n'existe pas ou a été déplacée. Retournez à l'accueil pour découvrir nos scooters.",
      backHome: "Retour à l'accueil",
    },
    products: {
      heading: "Notre gamme",
      title: "Nos scooters",
      loading: "Chargement…",
      empty: "Aucun produit disponible pour le moment.",
      unavailable: "Indisponible",
      details: "Détails",
      priceOnDemand: "Sur demande",
      categoryFallback: "Scooter",
      dimensions: "Dimensions",
      features: "Équipements",
      characteristics: "Caractéristiques",
      contact: "Commander via WhatsApp",
      modalClose: "Fermer",
    },
    productDetails: {
      loading: "Chargement…",
      notFoundTitle: "Produit introuvable",
      notFoundMessage: "Ce modèle n'existe plus ou a été retiré du catalogue.",
      backHome: "Retour à l'accueil",
      unavailable: "Indisponible",
      priceOnDemand: "Prix sur demande",
      characteristics: "Caractéristiques",
      equipments: "Équipements",
      ready: "Prêt à rouler avec le",
      contact: "Commander via WhatsApp",
      breadcrumbHome: "Accueil",
      categoryFallback: "Scooter",
      dimensions: "Dimensions extérieures du véhicule (mm)",
    },
    adminProducts: {
      title: "Produits",
      addProduct: "Nouveau produit",
      searchPlaceholder: "Rechercher un produit…",
      loading: "Chargement…",
      empty: "Aucun produit trouvé.",
      visibilityTitle: "Ce produit a des points à corriger",
      visibilityConfirm: "Compris",
      visibilityName: "Le nom du produit est manquant.",
      visibilityAvailability: "Le produit est marqué « indisponible » — il n'apparaîtra pas sur le site.",
      visibilityImages: "Aucune image n'a été ajoutée — la fiche affichera un cadre vide.",
      visibilitySpecs: "Aucune caractéristique technique renseignée.",
      visibilityDescription: "Aucune description — la fiche produit paraîtra incomplète.",
      modalTitleNew: "Nouveau produit",
      modalTitleEdit: "Modifier le produit",
      modalSubtitle: "Remplissez les champs ci-dessous — les caractéristiques courantes sont déjà listées.",
      modalLiveIssues: "À corriger avant publication idéale :",
      fieldName: "Nom du modèle",
      fieldPrice: "Prix (DA)",
      fieldPriceHint: "Laisser vide pour afficher « Sur demande »",
      fieldDescription: "Description",
      fieldDimensions: "Dimensions extérieures du véhicule (mm)",
      fieldLength: "Longueur",
      fieldWidth: "Largeur",
      fieldHeight: "Hauteur",
      toggleAvailable: "Disponible",
      toggleFeatured: "Mis en avant",
      toggleMainPage: "Priorité page d'accueil",
      specSection: "Caractéristiques",
      featureSection: "Équipements",
      addSpec: "Ajouter une caractéristique personnalisée",
      addFeature: "Ajouter un équipement personnalisé",
      imageSection: "Images",
      imageHint: "16 images maximum, 5 Mo par image.",
      cancel: "Annuler",
      save: "Enregistrer",
      update: "Mettre à jour",
      create: "Créer",
      deleteConfirm: "Supprimer \"{name}\" définitivement ?",
      deleteSuccess: "Produit supprimé",
      deleteError: "Suppression impossible",
      saveSuccessCreate: "Produit créé",
      saveSuccessUpdate: "Produit mis à jour",
      saveError: "Une erreur est survenue",
      statusHome: "Accueil",
      statusUnavailable: "Indispo",
      editAction: "Modifier",
      deleteAction: "Supprimer",
      productNameRequired: "Le nom du produit est requis.",
      priceNegative: "Le prix ne peut pas être négatif.",
      maxImages: "16 images maximum — il ne reste que {count} emplacement(s).",
      maxImagesReached: "16 images maximum atteintes.",
      imageTooLarge: "\"{name}\" dépasse {size} Mo.",
      imageRemoveError: "{count} image(s) n'ont pas pu être supprimée(s), réessayez.",
      loadError: "Impossible de charger les produits",
      saveErrorMessage: "{message}",
    },
  },
  ar: {
    footer: {
      message: "تابعنا على فيسبوك وتيك توك لرؤية أحدث موديلاتنا.",
    },
    nav: {
      home: "الرئيسية",
      products: "المنتجات",
      adminProducts: "المنتجات",
      logout: "تسجيل الخروج",
      whatsapp: "واتساب",
      menu: "القائمة",
      contact: "تواصل",
      followUs: "تابعنا",
      location: "الجزائر",
      language: "اللغة",
      french: "Français",
      arabic: "العربية",
    },
    hero: {
      badge: "طاقة موثوقة",
      title: "HM Dora Moto",
      subtitle: "اكتشف مجموعة الدراجة الكهربائية واطلب مباشرة عبر واتساب.",
      cta: "عرض الطرازات",
      whatsapp: "واتساب",
      features: ["ضمان رسمي", "الدفع عند التسليم"],
      scrollLabel: "الانتقال إلى المنتجات",
    },
    auth: {
      adminTitle: "مساحة الإدارة",
      adminSubtitle: "سجل الدخول لإدارة HM Dora Moto",
      emailLabel: "عنوان البريد الإلكتروني",
      emailPlaceholder: "admin@example.com",
      passwordLabel: "كلمة المرور",
      passwordPlaceholder: "••••••••",
      showPassword: "إظهار كلمة المرور",
      hidePassword: "إخفاء كلمة المرور",
      loginEmailRequired: "يرجى إدخال عنوان البريد الإلكتروني.",
      loginEmailInvalid: "تنسيق البريد الإلكتروني غير صالح.",
      loginPasswordRequired: "يرجى إدخال كلمة المرور.",
      loginPasswordTooShort: "يجب أن تتكون كلمة المرور من 6 أحرف على الأقل.",
      loginSuccess: "تم تسجيل الدخول بنجاح!",
      loginFailed: "فشل تسجيل الدخول.",
      loggingIn: "جارٍ تسجيل الدخول...",
      loginButton: "تسجيل الدخول",
    },
    notFound: {
      title: "الصفحة غير موجودة",
      message: "الصفحة التي تبحث عنها غير موجودة أو تم نقلها. ارجع إلى الصفحة الرئيسية لاكتشاف دراجاتنا الكهربائية.",
      backHome: "العودة إلى الرئيسية",
    },
    products: {
      heading: "مجموعة منتجاتنا",
      title: "دراجاتنا الكهربائية",
      loading: "جارٍ التحميل…",
      empty: "لا توجد منتجات متاحة في الوقت الحالي.",
      unavailable: "غير متوفر",
      details: "التفاصيل",
      priceOnDemand: "حسب الطلب",
      categoryFallback: "دراجة",
      dimensions: "الأبعاد",
      features: "المميزات",
      characteristics: "المواصفات",
      contact: "الطلب عبر واتساب",
      modalClose: "إغلاق",
    },
    productDetails: {
      loading: "جارٍ التحميل…",
      notFoundTitle: "المنتج غير موجود",
      notFoundMessage: "هذا الطراز لم يعد موجوداً أو تم سحبه من الكتالوج.",
      backHome: "العودة إلى الرئيسية",
      unavailable: "غير متوفر",
      priceOnDemand: "السعر حسب الطلب",
      characteristics: "المواصفات",
      equipments: "المُعدّات",
      ready: "جاهز للانطلاق مع",
      contact: "الطلب عبر واتساب",
      breadcrumbHome: "الرئيسية",
      categoryFallback: "دراجة",
      dimensions: "الأبعاد الخارجية للمركبة (مم)",
    },
    adminProducts: {
      title: "المنتجات",
      addProduct: "منتج جديد",
      searchPlaceholder: "البحث عن منتج…",
      loading: "جارٍ التحميل…",
      empty: "لم يتم العثور على أي منتج.",
      visibilityTitle: "هذا المنتج يحتاج إلى بعض التعديلات",
      visibilityConfirm: "فهمت",
      visibilityName: "اسم المنتج مفقود.",
      visibilityAvailability: "تم تعيين المنتج على «غير متوفر» — لن يظهر على الموقع.",
      visibilityImages: "لم تتم إضافة أي صور — ستظهر صفحة المنتج بصندوق فارغ.",
      visibilitySpecs: "لم يتم إدخال أي مواصفات فنية.",
      visibilityDescription: "لا يوجد وصف — ستظهر صفحة المنتج غير مكتملة.",
      modalTitleNew: "منتج جديد",
      modalTitleEdit: "تعديل المنتج",
      modalSubtitle: "املأ الحقول أدناه — تم إدراج الخصائص الشائعة مسبقاً.",
      modalLiveIssues: "ما يجب تصحيحه قبل النشر المثالي :",
      fieldName: "اسم الطراز",
      fieldPrice: "السعر (د.ج)",
      fieldPriceHint: "اتركه فارغاً لعرض « حسب الطلب »",
      fieldDescription: "الوصف",
      fieldDimensions: "الأبعاد الخارجية للمركبة (مم)",
      fieldLength: "الطول",
      fieldWidth: "العرض",
      fieldHeight: "الارتفاع",
      toggleAvailable: "متوفر",
      toggleFeatured: "مُعَلَّق",
      toggleMainPage: "أولوية الصفحة الرئيسية",
      specSection: "المواصفات",
      featureSection: "المُعدّات",
      addSpec: "إضافة خاصية مخصصة",
      addFeature: "إضافة مِيزَة مخصصة",
      imageSection: "الصور",
      imageHint: "16 صور كحد أقصى، 5 ميغابايت لكل صورة.",
      cancel: "إلغاء",
      save: "حفظ",
      update: "تحديث",
      create: "إنشاء",
      deleteConfirm: "حذف \"{name}\" نهائياً؟",
      deleteSuccess: "تم حذف المنتج",
      deleteError: "تعذر الحذف",
      saveSuccessCreate: "تم إنشاء المنتج",
      saveSuccessUpdate: "تم تحديث المنتج",
      saveError: "حدث خطأ ما",
      statusHome: "الرئيسية",
      statusUnavailable: "غير متوفر",
      editAction: "تعديل",
      deleteAction: "حذف",
      productNameRequired: "اسم المنتج مطلوب.",
      priceNegative: "لا يمكن أن يكون السعر سالباً.",
      maxImages: "الحد الأقصى 16 صور — تبقى {count} خلية(خلات).",
      maxImagesReached: "تم الوصول إلى الحد الأقصى 16 صور.",
      imageTooLarge: "\"{name}\" يتجاوز {size} ميغابايت.",
      imageRemoveError: "لم يتم حذف {count} صورة، يرجى المحاولة مرة أخرى.",
      loadError: "تعذر تحميل المنتجات",
      saveErrorMessage: "{message}",
    },
  },
};

const LanguageContext = createContext({
  language: "fr",
  setLanguage: () => {},
  t: (key) => key,
  isRTL: false,
});

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    if (typeof window === "undefined") return "fr";
    return localStorage.getItem("preferred-language") || "fr";
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem("preferred-language", language);
    document.documentElement.lang = language;
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
  }, [language]);

  const value = useMemo(() => ({
    language,
    setLanguage,
    t: (key, params = {}) => {
      const path = key.split(".");
      let current = translations[language];
      for (const part of path) {
        current = current?.[part];
        if (current == null) return key;
      }
      if (typeof current === "string") {
        return current.replace(/\{(\w+)\}/g, (_, name) => params[name] ?? `{${name}}`);
      }
      return current;
    },
    isRTL: language === "ar",
  }), [language]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
