import { DEFAULT_LOCALE, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "../site";

export function buildWebsiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    name: SITE_NAME,
    url: `${SITE_URL}/`,
    description: SITE_DESCRIPTION,
    inLanguage: DEFAULT_LOCALE.replace("_", "-"),
    publisher: {
      "@id": `${SITE_URL}/#organization`,
    },
  };
}
