export const store = {
  brand: {
    name: "HM Dora Moto",                       // text logo / brand name shown everywhere
    fullName: "HM Dora Moto",            // used in copyright / formal contexts
    tagline: "Algeria's #1 source for original smartphones. Best prices, fast delivery, cash on delivery.",
    logoText: "HM",                   // text logo fallback (rendered with accent dot)
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
    phone:    "0662 67 82 12",
    phoneHref: "+213662678212",          // digits-only form used in tel: links
    whatsapp: "213662678212",            // digits-only form used in wa.me links
    address:  "Algeria, Algiers · Sidi M'Hamed District · Algiers · 36.772934, 3.058845",
  },
  social: {
    instagram: "",
    facebook:  "https://www.facebook.com/profile.php?id=61576347884816&rdid=j4CChFlMDdOxpE0u&share_url=https%3A%2F%2Fwww.facebook.com%2Fshare%2F1BotcA34Hc%2F#",
    tiktok:    "https://www.tiktok.com/@hmdoramoto?is_from_webapp=1&sender_device=pc",
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
