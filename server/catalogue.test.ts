import { beforeEach, describe, expect, it, vi } from "vitest";

const { createCatalogueProductMock, getCatalogueProductBySlugMock, listCatalogueProductsMock } = vi.hoisted(() => ({
  createCatalogueProductMock: vi.fn(),
  getCatalogueProductBySlugMock: vi.fn(),
  listCatalogueProductsMock: vi.fn(),
}));

vi.mock("./catalogue", () => ({
  createCatalogueProduct: createCatalogueProductMock,
  getCatalogueProductBySlug: getCatalogueProductBySlugMock,
  listCatalogueProducts: listCatalogueProductsMock,
}));

import { appRouter } from "./routers";
import { productCreateSchema } from "../shared/catalogue";
import type { TrpcContext } from "./_core/context";

const visitorContext = {
  user: null,
  req: { headers: {}, ip: "127.0.0.20" } as TrpcContext["req"],
  res: {} as TrpcContext["res"],
} satisfies TrpcContext;

const adminContext = {
  ...visitorContext,
  user: { id: 1, openId: "owner", name: "Owner", email: "owner@example.com", loginMethod: "manus", role: "admin" as const, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
} satisfies TrpcContext;

const productInput = {
  name: "Reference Console",
  slug: "reference-console",
  categorySlugs: ["storage"],
  primaryCategorySlug: "storage",
  description: "A factual reference description supplied for validation coverage.",
  media: [{ url: "https://example.com/reference-console.jpg", role: "hero" as const }],
  specifications: [{ key: "dimensions", label: "Dimensions", value: "Specifications available on request" }],
  variants: [{ variantCode: "reference-console-standard", availability: "on_request" as const }],
};

describe("structured catalogue contracts", () => {
  beforeEach(() => {
    createCatalogueProductMock.mockReset();
    getCatalogueProductBySlugMock.mockReset();
    listCatalogueProductsMock.mockReset();
  });

  it("validates product creation with categories, media, specifications, and variants", () => {
    const parsed = productCreateSchema.parse(productInput);
    expect(parsed.categorySlugs).toEqual(["storage"]);
    expect(parsed.primaryCategorySlug).toBe("storage");
    expect(parsed.variants[0]?.variantCode).toBe("reference-console-standard");
    expect(parsed.specifications[0]?.value).toBe("Specifications available on request");
  });

  it("rejects invalid slugs, primary-category mismatches, duplicate variants, and multiple hero images", () => {
    expect(() => productCreateSchema.parse({ ...productInput, slug: "Reference Console" })).toThrow();
    expect(() => productCreateSchema.parse({ ...productInput, primaryCategorySlug: "living" })).toThrow(/Primary category/);
    expect(() => productCreateSchema.parse({ ...productInput, variants: [{ variantCode: "same" }, { variantCode: "same" }] })).toThrow(/Variant codes/);
    expect(() => productCreateSchema.parse({ ...productInput, media: [{ url: "one", role: "hero" }, { url: "two", role: "hero" }] })).toThrow(/one hero/);
  });

  it("retrieves a product by public slug with collection, variant, and specification relationship data", async () => {
    getCatalogueProductBySlugMock.mockResolvedValueOnce({
      id: "carved-storage-cabinet",
      slug: "carved-storage-cabinet",
      name: "Carved Storage Cabinet",
      collection: "Mosaic",
      category: "Storage",
      materials: ["Wood finish available on request"],
      variants: [{ variantCode: "cabinet-standard", availability: "on_request" }],
      specifications: [{ key: "dimensions", label: "Dimensions", value: "Specifications available on request" }],
    });
    const result = await appRouter.createCaller(visitorContext).catalogue.bySlug({ slug: "carved-storage-cabinet" });
    expect(result.collection).toBe("Mosaic");
    expect(result.variants[0]?.variantCode).toBe("cabinet-standard");
    expect(result.specifications[0]?.value).toBe("Specifications available on request");
  });

  it("passes category and text search filters to the catalogue service", async () => {
    listCatalogueProductsMock.mockResolvedValueOnce([{ id: "carved-storage-cabinet", category: "Storage" }]);
    const result = await appRouter.createCaller(visitorContext).catalogue.list({ query: "cabinet", category: "storage", limit: 12 });
    expect(listCatalogueProductsMock).toHaveBeenCalledWith(expect.objectContaining({ query: "cabinet", category: "storage", limit: 12 }));
    expect(result).toHaveLength(1);
  });

  it("requires an admin and valid product data before product creation", async () => {
    createCatalogueProductMock.mockResolvedValueOnce({ id: 42, slug: "reference-console" });
    await expect(appRouter.createCaller(visitorContext).catalogue.create(productInput)).rejects.toThrow(/permission/i);
    const created = await appRouter.createCaller(adminContext).catalogue.create(productInput);
    expect(created).toEqual({ id: 42, slug: "reference-console" });
    expect(createCatalogueProductMock).toHaveBeenCalledWith(expect.objectContaining({ slug: "reference-console", categorySlugs: ["storage"] }));
    await expect(appRouter.createCaller(adminContext).catalogue.create({ ...productInput, categorySlugs: [] })).rejects.toThrow();
  });

  it("returns not found for a missing public product without changing RFQ contracts", async () => {
    getCatalogueProductBySlugMock.mockResolvedValueOnce(null);
    await expect(appRouter.createCaller(visitorContext).catalogue.bySlug({ slug: "missing-reference" })).rejects.toThrow(/not found/i);
  });
});
