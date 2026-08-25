import { describe, expect, it } from "vitest";
import { buildIntentDetail } from "../client/src/lib/analytics";
import { filterProducts, getProduct, getProductGallery, products } from "../client/src/lib/catalog";
import { addEnquiryItem, removeEnquiryItem } from "../client/src/lib/enquirySelection";
import { getImageFocalStyle } from "../client/src/lib/imageFocal";

describe("catalogue and enquiry client helpers", () => {
  it("filters the catalogue by text and category without altering the source collection", () => {
    expect(filterProducts("cabinet", "All").map((product) => product.id)).toContain("carved-storage-cabinet");
    expect(filterProducts("", "Living").every((product) => product.category === "Living")).toBe(true);
    expect(products).toHaveLength(5);
  });

  it("creates a focal-aware gallery headed by the selected product and does not repeat an image", () => {
    const product = getProduct("carved-storage-cabinet");
    expect(product).toBeDefined();
    const gallery = getProductGallery(product!);
    expect(gallery).toHaveLength(3);
    expect(gallery[0].src).toBe(product!.image);
    expect(gallery[0].focal?.mobile).toEqual({ x: 50, y: 44 });
    expect(new Set(gallery.map((image) => image.src)).size).toBe(gallery.length);
  });

  it("serializes configurable desktop and mobile focal points into safe responsive CSS variables", () => {
    expect(getImageFocalStyle({ desktop: { x: 36, y: 41 }, mobile: { x: 62, y: 28 }, fit: "contain", mobileFit: "cover" })).toMatchObject({
      "--image-desktop-position": "36% 41%",
      "--image-mobile-position": "62% 28%",
      "--image-desktop-fit": "contain",
      "--image-mobile-fit": "cover",
    });
    expect(getImageFocalStyle({ desktop: { x: 150, y: -12 } })).toMatchObject({ "--image-desktop-position": "100% 0%" });
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
