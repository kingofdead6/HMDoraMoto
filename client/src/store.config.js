// ─────────────────────────────────────────────────────────────────────────────
// SINGLE SOURCE OF TRUTH
// Everything brand-specific lives here. Components, Tailwind, index.html and the
// document head all read from this file. To rebrand a store, edit this file only —
// never the components.
//
// Changing the entire look of the store = editing the three `theme` hex values.
// ─────────────────────────────────────────────────────────────────────────────

export const store = {
  brand: {
    name: "HB Dora Moto",                       // text logo / brand name shown everywhere
    fullName: "HB Dora Moto",            // used in copyright / formal contexts
    tagline: "Algeria's #1 source for original smartphones. Best prices, fast delivery, cash on delivery.",
    logoText: "NOVYX",                   // text logo fallback (rendered with accent dot)
    logo: "/src/assets/Logo.jpg",        // optional image logo (favicon source in this demo)
    favicon: "/src/assets/Logo.jpg",     // optional favicon (favicon source in this demo)
  },
  niche: {
    type: "general",
    productNoun: "product",
    productNounPlural: "products",
  },
  theme: {
    primary:   "#6C2BD9",   // brand purple — buttons, gradients, glows, primary accents
    secondary: "#8B5CF6",   // brand violet — gradient pair / surfaces / hover states
    accent:    "#22D3EE",   // brand cyan   — highlights, badges, links, the logo dot
  },
  contact: {
    email:    "contact@novyx.dz",
    phone:    "+213 0542021271",
    phoneHref: "+213542021271",          // digits-only form used in tel: links
    whatsapp: "213542021271",            // digits-only form used in wa.me links
    address:  "Algeria",
  },
  social: {
    instagram: "",
    facebook:  "",
    tiktok:    "",
  },
  locale: {
    currency:       "DZD",
    currencySymbol: "DA",
    locale:         "fr-DZ",
    lang:           "fr",
  },
  seo: {
    title:       "HB Dora Moto",
    description: "Algeria's #1 source for original Motorcycles. Best prices, fast delivery, cash on delivery.",
    ogImage:     "/src/assets/Logo.jpg",
  },
};

export default store;
