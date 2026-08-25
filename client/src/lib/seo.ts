import type { Product } from "@/lib/catalog";

export const SITE_ORIGIN = "https://www.umaidcraftorium.com";

export function productStructuredData(product: Product) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: [`${SITE_ORIGIN}${product.image}`],
    category: product.category,
    manufacturer: { "@type": "Organization", name: "Umaid Craftorium", url: SITE_ORIGIN },
  };
}

export function breadcrumbStructuredData(items: Array<{ name: string; path: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({ "@type": "ListItem", position: index + 1, name: item.name, item: `${SITE_ORIGIN}${item.path}` })),
  };
}
