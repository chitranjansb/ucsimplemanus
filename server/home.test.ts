import { describe, expect, it } from "vitest";
import { getProduct, productCategories, products } from "../client/src/lib/catalog";

describe("Umaid Craftorium catalogue", () => {
  it("exposes product references with an honest specification boundary", () => {
    expect(products.length).toBeGreaterThan(0);
    expect(products.every((product) => product.dimensions === "Specifications available on request")).toBe(true);
    expect(products.every((product) => product.image.startsWith("/manus-storage/"))).toBe(true);
  });

  it("retrieves an individual product reference and exposes relevant category filters", () => {
    expect(getProduct("carved-storage-cabinet")?.collection).toBe("Mosaic");
    expect(productCategories).toContain("Storage");
    expect(getProduct("missing-product")).toBeUndefined();
  });
});
