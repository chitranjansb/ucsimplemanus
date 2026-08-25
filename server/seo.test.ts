import { describe, expect, it } from "vitest";
import { getProduct } from "../client/src/lib/catalog";
import { breadcrumbStructuredData, productStructuredData, SITE_ORIGIN } from "../client/src/lib/seo";

describe("SEO structured-data helpers", () => {
  it("creates product markup without inventing price, availability, dimensions, or ratings", () => {
    const product = getProduct("carved-storage-cabinet");
    expect(product).toBeDefined();
    const data = productStructuredData(product!);
    expect(data).toMatchObject({
      "@type": "Product",
      name: product!.name,
      category: product!.category,
      manufacturer: { name: "Umaid Craftorium", url: SITE_ORIGIN },
    });
    expect(data).not.toHaveProperty("offers");
    expect(data).not.toHaveProperty("aggregateRating");
  });

  it("creates ordered canonical breadcrumb entries for public catalogue routes", () => {
    const data = breadcrumbStructuredData([{ name: "Home", path: "/" }, { name: "Collections", path: "/collections" }]);
    expect(data.itemListElement).toEqual([
      { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_ORIGIN}/` },
      { "@type": "ListItem", position: 2, name: "Collections", item: `${SITE_ORIGIN}/collections` },
    ]);
  });
});
