import { describe, expect, it } from "vitest";
import { buildIntentDetail } from "../client/src/lib/analytics";
import { filterProducts, getProduct, getProductGallery, products } from "../client/src/lib/catalog";
import { addEnquiryItem, removeEnquiryItem } from "../client/src/lib/enquirySelection";

describe("catalogue and enquiry client helpers", () => {
  it("filters the catalogue by text and category without altering the source collection", () => {
    expect(filterProducts("cabinet", "All").map((product) => product.id)).toContain("carved-storage-cabinet");
    expect(filterProducts("", "Living").every((product) => product.category === "Living")).toBe(true);
    expect(products).toHaveLength(5);
  });

  it("creates a gallery headed by the selected product and does not repeat it", () => {
    const product = getProduct("carved-storage-cabinet");
    expect(product).toBeDefined();
    const gallery = getProductGallery(product!);
    expect(gallery).toHaveLength(3);
    expect(gallery[0]).toBe(product!.image);
    expect(new Set(gallery).size).toBe(gallery.length);
  });

  it("keeps enquiry selection unique and supports removals", () => {
    const first = { id: "cabinet" };
    const second = { id: "table" };
    const selected = addEnquiryItem([], first);
    expect(addEnquiryItem(selected, first)).toHaveLength(1);
    expect(addEnquiryItem(selected, second)).toEqual([first, second]);
    expect(removeEnquiryItem([first, second], "cabinet")).toEqual([second]);
  });

  it("builds structured analytics details without exposing configuration", () => {
    expect(buildIntentDetail("catalogue_filter", { category: "Storage" })).toEqual({ event: "catalogue_filter", category: "Storage" });
  });
});

