import { describe, expect, it } from "vitest";
import { buildIntentDetail } from "../client/src/lib/analytics";
import { filterProducts, getProduct, getProductGallery, products } from "../client/src/lib/catalog";
import { addEnquiryItem, removeEnquiryItem, updateEnquiryItemQuantity } from "../client/src/lib/enquirySelection";
import { getImageFocalStyle } from "../client/src/lib/imageFocal";
import { validateRfqFiles } from "../client/src/lib/rfqAttachments";
import { getAdminRouteState } from "../client/src/lib/adminAccess";
import { addComparisonProduct, clearComparisonProducts, normalizeComparisonProducts, removeComparisonProduct } from "../client/src/lib/comparisonSelection";
import { COMPARISON_STORAGE_KEY, readComparisonStorage, writeComparisonStorage } from "../client/src/lib/comparisonStorage";
import { filterCatalogueProducts } from "../client/src/lib/catalog";
import { parseCatalogueQuery, serializeCatalogueQuery } from "../client/src/lib/catalogueQuery";
import { formatDimensionValue, formatWeightValue } from "../client/src/lib/units";

describe("catalogue and enquiry client helpers", () => {
  it("filters the catalogue by text and category without altering the source collection", () => {
    expect(filterProducts("cabinet", "All").map((product) => product.id)).toContain("carved-storage-cabinet");
    expect(filterProducts("", "Living").every((product) => product.category === "Living")).toBe(true);
    expect(filterProducts("", "All", products, "mosaic").map((product) => product.id)).toEqual(["carved-storage-cabinet"]);
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

  it("keeps project selection unique, supports removals, and bounds line-item quantities", () => {
    const first = { id: "cabinet", quantity: 1 };
    const second = { id: "table", quantity: 1 };
    const selected = addEnquiryItem([], first);
    expect(addEnquiryItem(selected, first)).toHaveLength(1);
    expect(addEnquiryItem(selected, second)).toEqual([first, second]);
    expect(removeEnquiryItem([first, second], "cabinet")).toEqual([second]);
    expect(updateEnquiryItemQuantity([first], "cabinet", 0)).toEqual([{ id: "cabinet", quantity: 1 }]);
    expect(updateEnquiryItemQuantity([first], "cabinet", 900)).toEqual([{ id: "cabinet", quantity: 500 }]);
  });

  it("rejects unsafe RFQ attachment sets before network submission", () => {
    const safeFile = { name: "brief.pdf", type: "application/pdf", size: 1200 } as File;
    const largeFile = { name: "oversized.pdf", type: "application/pdf", size: 1_500_001 } as File;
    const unsupported = { name: "payload.exe", type: "application/octet-stream", size: 500 } as File;
    expect(validateRfqFiles([safeFile])).toBeNull();
    expect(validateRfqFiles([largeFile])).toMatch(/larger than 1.5 MB/);
    expect(validateRfqFiles([unsupported])).toMatch(/not a supported file type/);
    expect(validateRfqFiles([safeFile, safeFile, safeFile, safeFile])).toMatch(/up to three/);
  });

  it("builds structured analytics details without exposing configuration", () => {
    expect(buildIntentDetail("catalogue_filter", { category: "Storage" })).toEqual({ event: "catalogue_filter", category: "Storage" });
  });

  it("supports comparison add, maximum limit, remove, clear, and persisted ID normalization", () => {
    const selected = ["one", "two", "three", "four"];
    expect(addComparisonProduct([], "one")).toEqual(["one"]);
    expect(addComparisonProduct(selected, "five")).toEqual(selected);
    expect(addComparisonProduct(selected, "two")).toEqual(selected);
    expect(removeComparisonProduct(selected, "two")).toEqual(["one", "three", "four"]);
    expect(clearComparisonProducts()).toEqual([]);
    expect(normalizeComparisonProducts(["one", "one", "two", 3, "three", "four", "five"])).toEqual(["one", "two", "three", "four"]);
  });

  it("transfers compared product references into the existing RFQ selection without duplicate product records", () => {
    const compared = products.slice(0, 2);
    const rfqItems = compared.reduce((items, product) => addEnquiryItem(items, { id: product.id, name: product.name, collection: product.collection, image: product.image, quantity: 1 }), [] as Array<{ id: string; name: string; collection: string; image: string; quantity: number }>);
    expect(rfqItems.map((item) => item.id)).toEqual(compared.map((product) => product.id));
    expect(compared.reduce((items, product) => addEnquiryItem(items, { id: product.id, name: product.name, collection: product.collection, image: product.image, quantity: 1 }), rfqItems)).toHaveLength(2);
  });

  it("persists comparison IDs through localStorage so navigation/remount restores the shortlist", () => {
    const values = new Map<string, string>();
    const storage = { getItem: (key: string) => values.get(key) || null, setItem: (key: string, value: string) => values.set(key, value) };
    writeComparisonStorage(storage, ["carved-storage-cabinet", "accent-side-table"]);
    expect(values.has(COMPARISON_STORAGE_KEY)).toBe(true);
    expect(readComparisonStorage(storage)).toEqual(["carved-storage-cabinet", "accent-side-table"]);
  });

  it("searches and combines advanced catalogue filters without mutating product data", () => {
    expect(filterCatalogueProducts({ query: "cabinet" }).map((product) => product.id)).toContain("carved-storage-cabinet");
    expect(filterCatalogueProducts({ collection: "mosaic" }).map((product) => product.id)).toEqual(["carved-storage-cabinet"]);
    expect(filterCatalogueProducts({ category: "living" }).every((product) => product.category === "Living")).toBe(true);
    expect(filterCatalogueProducts({ material: "wood-finish-available-on-request" }).map((product) => product.id)).toContain("carved-storage-cabinet");
    expect(filterCatalogueProducts({ featured: true }).every((product) => product.featured)).toBe(true);
    expect(filterCatalogueProducts({ query: "does-not-exist" })).toEqual([]);
    expect(filterCatalogueProducts({ sort: "name_desc" }).map((product) => product.name)).toEqual([...products].sort((a, b) => b.name.localeCompare(a.name)).map((product) => product.name));
  });

  it("round-trips shareable catalogue URL state and formats units without inventing missing values", () => {
    const state = parseCatalogueQuery("?q=cabinet&collection=mosaic&material=reclaimed-wood&customizable=true&new=false&sort=name_desc&page=2");
    expect(state).toMatchObject({ query: "cabinet", collection: "mosaic", material: "reclaimed-wood", customizable: true, isNew: false, sort: "name_desc", page: 2 });
    expect(parseCatalogueQuery(`?${serializeCatalogueQuery(state)}`)).toEqual(state);
    expect(formatDimensionValue("100 cm x 50 cm", "imperial")).toBe("39.4 in x 19.7 in");
    expect(formatWeightValue(null, "imperial")).toBe("Available on request");
  });

  it("keeps the client admin route behind explicit loading, authentication, and role gates", () => {
    expect(getAdminRouteState(null, true)).toBe("loading");
    expect(getAdminRouteState(null, false)).toBe("unauthenticated");
    expect(getAdminRouteState({ role: "user" }, false)).toBe("forbidden");
    expect(getAdminRouteState({ role: "admin" }, false)).toBe("authorized");
  });
});
