import { getCanonicalUrl } from "../canonical";

export type BreadcrumbSchemaItem = {
  label: string;
  href?: string;
};

export function buildBreadcrumbSchema(items: BreadcrumbSchemaItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.label,
      ...(item.href ? { item: getCanonicalUrl(item.href) } : {}),
    })),
  };
}
