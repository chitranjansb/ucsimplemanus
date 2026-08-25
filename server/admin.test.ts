import { beforeEach, describe, expect, it, vi } from "vitest";

const adminMocks = vi.hoisted(() => ({
  addAdminEnquiryNote: vi.fn(), archiveAdminCategory: vi.fn(), archiveAdminCollection: vi.fn(), archiveAdminProduct: vi.fn(), bulkUpdateAdminProducts: vi.fn(),
  createAdminCategory: vi.fn(), createAdminCollection: vi.fn(), deleteAdminMedia: vi.fn(), deleteAdminProduct: vi.fn(), duplicateAdminProduct: vi.fn(),
  getAdminDashboard: vi.fn(), getAdminEnquiry: vi.fn(), getAdminProduct: vi.fn(), getAdminSiteContent: vi.fn(), getPublicSiteContent: vi.fn(),
  listAdminCategories: vi.fn(), listAdminCollections: vi.fn(), listAdminEnquiries: vi.fn(), listAdminMedia: vi.fn(), listAdminProducts: vi.fn(), listAdminSalespeople: vi.fn(), listAdminTaxonomy: vi.fn(),
  updateAdminCategory: vi.fn(), updateAdminCollection: vi.fn(), updateAdminEnquiry: vi.fn(), updateAdminMedia: vi.fn(), updateAdminProduct: vi.fn(), updateAdminSiteContent: vi.fn(), uploadAdminMedia: vi.fn(),
}));

vi.mock("./admin", () => adminMocks);

import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

const visitorContext = { user: null, req: { headers: {}, ip: "127.0.0.44" } as TrpcContext["req"], res: {} as TrpcContext["res"] } satisfies TrpcContext;
const standardContext = { ...visitorContext, user: { id: 4, openId: "standard", name: "Standard User", email: "user@example.com", loginMethod: "manus", role: "user" as const, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() } } satisfies TrpcContext;
const adminContext = { ...visitorContext, user: { id: 7, openId: "owner", name: "Catalogue Owner", email: "owner@example.com", loginMethod: "manus", role: "admin" as const, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() } } satisfies TrpcContext;

const productInput = {
  id: 12,
  name: "Admin-managed cabinet",
  slug: "admin-managed-cabinet",
  categorySlugs: ["storage"],
  primaryCategorySlug: "storage",
  materialSlugs: [], finishSlugs: [], media: [], specifications: [], variants: [],
  customizable: false, status: "draft" as const, availability: "on_request" as const, featured: false, isNew: false,
};

describe("admin CMS authorization and contracts", () => {
  beforeEach(() => Object.values(adminMocks).forEach((mock) => mock.mockReset()));

  it("denies every protected admin dashboard path to visitors and non-admin users", async () => {
    await expect(appRouter.createCaller(visitorContext).admin.dashboard()).rejects.toThrow(/permission/i);
    await expect(appRouter.createCaller(standardContext).admin.dashboard()).rejects.toThrow(/permission/i);
    expect(adminMocks.getAdminDashboard).not.toHaveBeenCalled();
  });

  it("allows an administrator to retrieve dashboard metrics", async () => {
    adminMocks.getAdminDashboard.mockResolvedValueOnce({ products: 5, collections: 2, categories: 4, newEnquiries: 1, enquiriesThisMonth: 3, enquiryStatus: [{ status: "new", total: 1 }] });
    await expect(appRouter.createCaller(adminContext).admin.dashboard()).resolves.toMatchObject({ products: 5, newEnquiries: 1 });
  });

  it("validates privileged product mutations before the service layer", async () => {
    await expect(appRouter.createCaller(adminContext).admin.products.update({ ...productInput, categorySlugs: [] })).rejects.toThrow();
    expect(adminMocks.updateAdminProduct).not.toHaveBeenCalled();
    adminMocks.updateAdminProduct.mockResolvedValueOnce({ id: 12, slug: "admin-managed-cabinet" });
    await expect(appRouter.createCaller(adminContext).admin.products.update(productInput)).resolves.toEqual({ id: 12, slug: "admin-managed-cabinet" });
    expect(adminMocks.updateAdminProduct).toHaveBeenCalledWith(expect.objectContaining({ id: 12, slug: "admin-managed-cabinet" }));
  });

  it("keeps media upload server-authorized and attributes the asset to the authenticated administrator", async () => {
    const mediaInput = { filename: "cabinet.png", contentType: "image/png" as const, byteSize: 3, base64: "YWJj", alt: "Cabinet sample" };
    await expect(appRouter.createCaller(visitorContext).admin.media.upload(mediaInput)).rejects.toThrow(/permission/i);
    adminMocks.uploadAdminMedia.mockResolvedValueOnce({ id: 8, url: "/manus-storage/media/cabinet.png" });
    await expect(appRouter.createCaller(adminContext).admin.media.upload(mediaInput)).resolves.toMatchObject({ id: 8 });
    expect(adminMocks.uploadAdminMedia).toHaveBeenCalledWith(expect.objectContaining({ filename: "cabinet.png" }), adminContext.user.id);
    await expect(appRouter.createCaller(visitorContext).admin.media.update({ id: 8, status: "archived" })).rejects.toThrow(/permission/i);
    adminMocks.updateAdminMedia.mockResolvedValueOnce({ id: 8 });
    await expect(appRouter.createCaller(adminContext).admin.media.update({ id: 8, status: "archived" })).resolves.toEqual({ id: 8 });
    expect(adminMocks.updateAdminMedia).toHaveBeenCalledWith({ id: 8, status: "archived" });
  });

  it("accepts bounded internal enquiry notes only from administrators", async () => {
    await expect(appRouter.createCaller(standardContext).admin.enquiries.addNote({ id: 21, note: "Follow up with the buyer." })).rejects.toThrow(/permission/i);
    adminMocks.addAdminEnquiryNote.mockResolvedValueOnce({ id: 98 });
    await expect(appRouter.createCaller(adminContext).admin.enquiries.addNote({ id: 21, note: "Follow up with the buyer." })).resolves.toEqual({ id: 98 });
    expect(adminMocks.addAdminEnquiryNote).toHaveBeenCalledWith(21, "Follow up with the buyer.", expect.objectContaining({ id: adminContext.user.id }));
  });

  it("validates bounded website content and keeps public content reads separate from admin writes", async () => {
    adminMocks.getPublicSiteContent.mockResolvedValueOnce({ homepage_hero_copy: "Approved copy" });
    await expect(appRouter.createCaller(visitorContext).content.public()).resolves.toEqual({ homepage_hero_copy: "Approved copy" });
    await expect(appRouter.createCaller(adminContext).admin.content.update({ contentKey: "homepage_hero_copy", body: "" })).rejects.toThrow();
    adminMocks.updateAdminSiteContent.mockResolvedValueOnce({ contentKey: "homepage_hero_copy" });
    await expect(appRouter.createCaller(adminContext).admin.content.update({ contentKey: "homepage_hero_copy", body: "Approved hero copy." })).resolves.toEqual({ contentKey: "homepage_hero_copy" });
  });

  it("validates protected collection and category CRUD contracts before calling their services", async () => {
    await expect(appRouter.createCaller(visitorContext).admin.collections.create({ name: "Trade collection", slug: "trade-collection", sortOrder: 10 })).rejects.toThrow(/permission/i);
    await expect(appRouter.createCaller(adminContext).admin.collections.create({ name: "Trade collection", slug: "Invalid Slug", sortOrder: 10 })).rejects.toThrow();
    adminMocks.createAdminCollection.mockResolvedValueOnce({ id: 51, slug: "trade-collection" });
    await expect(appRouter.createCaller(adminContext).admin.collections.create({ name: "Trade collection", slug: "trade-collection", sortOrder: 10 })).resolves.toEqual({ id: 51, slug: "trade-collection" });
    expect(adminMocks.createAdminCollection).toHaveBeenCalledWith(expect.objectContaining({ slug: "trade-collection", sortOrder: 10 }));
    adminMocks.archiveAdminCategory.mockResolvedValueOnce({ id: 11, status: "archived" });
    await expect(appRouter.createCaller(adminContext).admin.categories.archive({ id: 11, archived: true })).resolves.toEqual({ id: 11, status: "archived" });
  });

  it("keeps product bulk lifecycle actions admin-only and validates a bounded unique identifier list", async () => {
    await expect(appRouter.createCaller(standardContext).admin.products.bulk({ ids: [2, 3], action: "archive" })).rejects.toThrow(/permission/i);
    await expect(appRouter.createCaller(adminContext).admin.products.bulk({ ids: [], action: "archive" })).rejects.toThrow();
    adminMocks.bulkUpdateAdminProducts.mockResolvedValueOnce({ ids: [2, 3], action: "archive" });
    await expect(appRouter.createCaller(adminContext).admin.products.bulk({ ids: [2, 2, 3], action: "archive" })).resolves.toEqual({ ids: [2, 3], action: "archive" });
    expect(adminMocks.bulkUpdateAdminProducts).toHaveBeenCalledWith([2, 3], "archive");
  });

  it("keeps duplicate and permanent deletion lifecycle actions on protected administrator routes", async () => {
    await expect(appRouter.createCaller(visitorContext).admin.products.duplicate({ id: 12, slug: "cabinet-copy" })).rejects.toThrow(/permission/i);
    adminMocks.duplicateAdminProduct.mockResolvedValueOnce({ id: 33, slug: "cabinet-copy" });
    await expect(appRouter.createCaller(adminContext).admin.products.duplicate({ id: 12, slug: "cabinet-copy" })).resolves.toEqual({ id: 33, slug: "cabinet-copy" });
    adminMocks.deleteAdminProduct.mockResolvedValueOnce({ id: 33, deleted: true });
    await expect(appRouter.createCaller(adminContext).admin.products.delete({ id: 33 })).resolves.toEqual({ id: 33, deleted: true });
    expect(adminMocks.deleteAdminProduct).toHaveBeenCalledWith(33);
  });
});
