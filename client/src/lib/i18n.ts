export const supportedLocales = ["en", "it"] as const;
export type Locale = typeof supportedLocales[number];

type NavigationKey = "collections" | "manufacturing" | "customFurniture" | "export" | "about" | "contact" | "enquiry";

const messages: Record<Locale, Record<NavigationKey, string>> = {
  en: {
    collections: "Collections",
    manufacturing: "Manufacturing",
    customFurniture: "Custom furniture",
    export: "Export",
    about: "About",
    contact: "Contact",
    enquiry: "Enquiry",
  },
  it: {
    collections: "Collezioni",
    manufacturing: "Produzione",
    customFurniture: "Arredi su misura",
    export: "Export",
    about: "Chi siamo",
    contact: "Contatti",
    enquiry: "Richiesta",
  },
};

export function translate(locale: Locale, key: NavigationKey) {
  return messages[locale][key];
}

export function publicNavigation(locale: Locale = "en") {
  return [
    { href: "/collections", label: translate(locale, "collections") },
    { href: "/manufacturing", label: translate(locale, "manufacturing") },
    { href: "/custom-furniture", label: translate(locale, "customFurniture") },
    { href: "/export", label: translate(locale, "export") },
    { href: "/about", label: translate(locale, "about") },
  ];
}
