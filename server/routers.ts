import { COOKIE_NAME } from "@shared/const";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { internationalRfqFieldsSchema } from "../shared/rfq";
import { createCatalogueProduct, getCatalogueFacets, getCatalogueProductBySlug, listCatalogueProducts } from "./catalogue";
import {
  addAdminEnquiryNote,
  archiveAdminCategory,
  archiveAdminCollection,
  archiveAdminProduct,
  bulkUpdateAdminProducts,
  createAdminCategory,
  createAdminCollection,
  deleteAdminMedia,
  deleteAdminProduct,
  duplicateAdminProduct,
  getAdminDashboard,
  getAdminEnquiry,
  getAdminProduct,
  getAdminSiteContent,
  getPublicSiteContent,
  listAdminCategories,
  listAdminCollections,
  listAdminEnquiries,
  listAdminMedia,
  listAdminProducts,
  listAdminSalespeople,
  listAdminTaxonomy,
  updateAdminCategory,
  updateAdminCollection,
  updateAdminEnquiry,
  updateAdminMedia,
  updateAdminProduct,
  updateAdminSiteContent,
  uploadAdminMedia,
} from "./admin";
import { createProjectInquiry } from "./db";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, publicProcedure, router } from "./_core/trpc";
import { storagePut } from "./storage";
import { catalogueListSchema, productCreateSchema, productSlugSchema } from "../shared/catalogue";
import {
  adminBulkProductSchema,
  adminCategoryArchiveSchema,
  adminCategoryCreateSchema,
  adminCategoryUpdateSchema,
  adminCollectionArchiveSchema,
  adminCollectionCreateSchema,
  adminCollectionUpdateSchema,
  adminInquiryIdSchema,
  adminInquiryListSchema,
  adminInquiryNoteSchema,
  adminInquiryUpdateSchema,
  adminMediaIdSchema,
  adminMediaListSchema,
  adminMediaUpdateSchema,
  adminMediaUploadSchema,
  adminPaginationSchema,
  adminProductDuplicateSchema,
  adminProductIdSchema,
  adminProductListSchema,
  adminProductUpdateSchema,
  adminSiteContentSchema,
} from "../shared/admin";

const MAX_ATTACHMENT_BYTES = 1_500_000;
const MAX_ATTACHMENTS = 3;
const RATE_WINDOW_MS = 15 * 60 * 1000;
const MAX_ENQUIRIES_PER_WINDOW = 6;
const ALLOWED_ATTACHMENT_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
]);

const enquiryRateBuckets = new Map<string, { count: number; resetAt: number }>();

function clientIp(req: { ip?: string; headers?: Record<string, string | string[] | undefined>; socket?: { remoteAddress?: string } }) {
  const forwarded = req.headers?.["x-forwarded-for"];
  const firstForwarded = typeof forwarded === "string" ? forwarded.split(",")[0]?.trim() : undefined;
  return firstForwarded || req.ip || req.socket?.remoteAddress || "unknown";
}

function enforceEnquiryRateLimit(ip: string) {
  const now = Date.now();
  for (const [key, bucket] of Array.from(enquiryRateBuckets.entries())) if (bucket.resetAt < now) enquiryRateBuckets.delete(key);
  const bucket = enquiryRateBuckets.get(ip);
  if (!bucket || bucket.resetAt < now) {
    enquiryRateBuckets.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return;
  }
  if (bucket.count >= MAX_ENQUIRIES_PER_WINDOW) throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Too many enquiries. Please try again later." });
  bucket.count += 1;
}

function safeFilename(filename: string) {
  const basename = filename.replace(/\\/g, "/").split("/").pop()?.replace(/[^a-zA-Z0-9._ -]/g, "_").slice(0, 180);
  if (!basename || basename === "." || basename === "..") throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid attachment filename." });
  return basename;
}

function decodeAttachment(data: string, declaredSize: number) {
  const normalized = data.replace(/^data:[^;]+;base64,/, "");
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(normalized)) throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid attachment encoding." });
  const bytes = Buffer.from(normalized, "base64");
  if (bytes.byteLength !== declaredSize || bytes.byteLength > MAX_ATTACHMENT_BYTES) throw new TRPCError({ code: "BAD_REQUEST", message: "Attachment exceeds the allowed size." });
  return bytes;
}

function asAdminError(error: unknown, fallback: string) {
  return new TRPCError({ code: "BAD_REQUEST", message: error instanceof Error ? error.message : fallback });
}

const attachmentSchema = z.object({
  filename: z.string().trim().min(1).max(240),
  contentType: z.string().trim().max(120),
  byteSize: z.number().int().positive().max(MAX_ATTACHMENT_BYTES),
  base64: z.string().min(4).max(2_100_000),
});

const enquirySchema = z.object({
  name: z.string().trim().min(2).max(160),
  email: z.string().trim().email().max(320),
  company: z.string().trim().max(160).optional(),
  phone: z.string().trim().max(80).optional(),
  buyerType: z.string().trim().max(120).optional(),
  project: z.string().trim().min(2).max(160).optional(),
  projectType: z.string().trim().max(160).optional(),
  shippingCountry: z.string().trim().max(160).optional(),
  targetMarket: z.string().trim().max(160).optional(),
  timeline: z.string().trim().max(120).optional(),
  customizationRequirements: z.string().trim().max(3000).optional(),
  message: z.string().trim().min(10).max(5000),
  items: z.array(z.object({ productReference: z.string().trim().min(1).max(240), collectionName: z.string().trim().max(200).optional(), quantity: z.number().int().min(1).max(500) })).max(24).default([]),
  attachments: z.array(attachmentSchema).max(MAX_ATTACHMENTS).default([]),
  submittedAt: z.number().int().positive().optional(),
  website: z.string().max(200).optional().default(""),
}).merge(internationalRfqFieldsSchema);

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  catalogue: router({
    list: publicProcedure.input(catalogueListSchema.optional()).query(({ input }) => listCatalogueProducts(input ?? {})),
    facets: publicProcedure.query(() => getCatalogueFacets()),
    bySlug: publicProcedure.input(productSlugSchema).query(async ({ input }) => {
      const product = await getCatalogueProductBySlug(input.slug);
      if (!product) throw new TRPCError({ code: "NOT_FOUND", message: "Catalogue reference not found." });
      return product;
    }),
    create: adminProcedure.input(productCreateSchema).mutation(async ({ input }) => {
      try {
        return await createCatalogueProduct(input);
      } catch (error) {
        throw new TRPCError({ code: "BAD_REQUEST", message: error instanceof Error ? error.message : "Unable to create product." });
      }
    }),
  }),
  inquiries: router({
    create: publicProcedure.input(enquirySchema).mutation(async ({ input, ctx }) => {
      if (input.website.trim()) return { success: true, inquiryId: null } as const;
      if (input.submittedAt) {
        const formAge = Date.now() - input.submittedAt;
        if (formAge < 1200 || formAge > 24 * 60 * 60 * 1000) throw new TRPCError({ code: "BAD_REQUEST", message: "Please reopen the enquiry form and try again." });
      }
      enforceEnquiryRateLimit(clientIp(ctx.req));

      const uploadedAttachments = [] as { storageKey: string; filename: string; contentType: string; byteSize: number }[];
      const uploadNamespace = `inquiries/${crypto.randomUUID()}`;
      for (const attachment of input.attachments) {
        if (!ALLOWED_ATTACHMENT_TYPES.has(attachment.contentType)) throw new TRPCError({ code: "BAD_REQUEST", message: "This attachment type is not supported." });
        const filename = safeFilename(attachment.filename);
        const bytes = decodeAttachment(attachment.base64, attachment.byteSize);
        const stored = await storagePut(`${uploadNamespace}/${filename}`, bytes, attachment.contentType);
        uploadedAttachments.push({ storageKey: stored.key, filename, contentType: attachment.contentType, byteSize: bytes.byteLength });
      }

      const project = input.project || [input.buyerType, input.projectType, input.shippingCountry].filter(Boolean).join(" · ") || "Project enquiry";
      const created = await createProjectInquiry({
        inquiry: {
          name: input.name,
          email: input.email,
          company: input.company || null,
          phone: input.phone || null,
          buyerType: input.buyerType || null,
          project,
          projectType: input.projectType || null,
          shippingCountry: input.shippingCountry || null,
          destinationCity: input.destinationCity || null,
          destinationCountry: input.destinationCountry || null,
          destinationPort: input.destinationPort || null,
          targetMarket: input.targetMarket || null,
          timeline: input.timeline || null,
          estimatedOrderQuantity: input.estimatedOrderQuantity ?? null,
          containerRequirement: input.containerRequirement || null,
          preferredDeliveryPeriod: input.preferredDeliveryPeriod || null,
          preferredUnits: input.preferredUnits || null,
          exportRequirements: input.exportRequirements || null,
          customizationRequirements: input.customizationRequirements || null,
          message: input.message,
          metadata: { source: "public_project_enquiry", itemCount: input.items.length, attachmentCount: uploadedAttachments.length },
        },
        items: input.items,
        attachments: uploadedAttachments,
      });
      return { success: true, inquiryId: created.id } as const;
    }),
  }),
  content: router({
    public: publicProcedure.query(() => getPublicSiteContent()),
  }),
  admin: router({
    dashboard: adminProcedure.query(() => getAdminDashboard()),
    taxonomy: adminProcedure.query(() => listAdminTaxonomy()),
    products: router({
      list: adminProcedure.input(adminProductListSchema).query(({ input }) => listAdminProducts(input)),
      byId: adminProcedure.input(adminProductIdSchema).query(async ({ input }) => {
        const product = await getAdminProduct(input.id);
        if (!product) throw new TRPCError({ code: "NOT_FOUND", message: "Product not found." });
        return product;
      }),
      create: adminProcedure.input(productCreateSchema).mutation(async ({ input }) => {
        try { return await createCatalogueProduct(input); } catch (error) { throw asAdminError(error, "Unable to create product."); }
      }),
      update: adminProcedure.input(adminProductUpdateSchema).mutation(async ({ input }) => {
        try { return await updateAdminProduct(input); } catch (error) { throw asAdminError(error, "Unable to update product."); }
      }),
      duplicate: adminProcedure.input(adminProductDuplicateSchema).mutation(async ({ input }) => {
        try { return await duplicateAdminProduct(input.id, input.slug, input.name); } catch (error) { throw asAdminError(error, "Unable to duplicate product."); }
      }),
      archive: adminProcedure.input(z.object({ id: z.number().int().positive(), archived: z.boolean() })).mutation(async ({ input }) => {
        try { return await archiveAdminProduct(input.id, input.archived); } catch (error) { throw asAdminError(error, "Unable to change product status."); }
      }),
      delete: adminProcedure.input(adminProductIdSchema).mutation(async ({ input }) => {
        try { return await deleteAdminProduct(input.id); } catch (error) { throw asAdminError(error, "Unable to delete product."); }
      }),
      bulk: adminProcedure.input(adminBulkProductSchema).mutation(async ({ input }) => {
        try { return await bulkUpdateAdminProducts(input.ids, input.action); } catch (error) { throw asAdminError(error, "Unable to update products."); }
      }),
    }),
    collections: router({
      list: adminProcedure.query(() => listAdminCollections()),
      create: adminProcedure.input(adminCollectionCreateSchema).mutation(async ({ input }) => {
        try { return await createAdminCollection(input); } catch (error) { throw asAdminError(error, "Unable to create collection."); }
      }),
      update: adminProcedure.input(adminCollectionUpdateSchema).mutation(async ({ input }) => {
        try { return await updateAdminCollection(input); } catch (error) { throw asAdminError(error, "Unable to update collection."); }
      }),
      archive: adminProcedure.input(adminCollectionArchiveSchema).mutation(async ({ input }) => {
        try { return await archiveAdminCollection(input.id, input.archived); } catch (error) { throw asAdminError(error, "Unable to change collection status."); }
      }),
    }),
    categories: router({
      list: adminProcedure.query(() => listAdminCategories()),
      create: adminProcedure.input(adminCategoryCreateSchema).mutation(async ({ input }) => {
        try { return await createAdminCategory(input); } catch (error) { throw asAdminError(error, "Unable to create category."); }
      }),
      update: adminProcedure.input(adminCategoryUpdateSchema).mutation(async ({ input }) => {
        try { return await updateAdminCategory(input); } catch (error) { throw asAdminError(error, "Unable to update category."); }
      }),
      archive: adminProcedure.input(adminCategoryArchiveSchema).mutation(async ({ input }) => {
        try { return await archiveAdminCategory(input.id, input.archived); } catch (error) { throw asAdminError(error, "Unable to change category status."); }
      }),
    }),
    media: router({
      list: adminProcedure.input(adminMediaListSchema).query(({ input }) => listAdminMedia(input)),
      upload: adminProcedure.input(adminMediaUploadSchema).mutation(async ({ input, ctx }) => {
        try { return await uploadAdminMedia(input, ctx.user.id); } catch (error) { throw asAdminError(error, "Unable to upload media."); }
      }),
      update: adminProcedure.input(adminMediaUpdateSchema).mutation(async ({ input }) => {
        try { return await updateAdminMedia(input); } catch (error) { throw asAdminError(error, "Unable to update media."); }
      }),
      delete: adminProcedure.input(adminMediaIdSchema).mutation(async ({ input }) => {
        try { return await deleteAdminMedia(input.id); } catch (error) { throw asAdminError(error, "Unable to delete media."); }
      }),
    }),
    enquiries: router({
      list: adminProcedure.input(adminInquiryListSchema).query(({ input }) => listAdminEnquiries(input)),
      byId: adminProcedure.input(adminInquiryIdSchema).query(async ({ input }) => {
        const enquiry = await getAdminEnquiry(input.id);
        if (!enquiry) throw new TRPCError({ code: "NOT_FOUND", message: "Enquiry not found." });
        return enquiry;
      }),
      update: adminProcedure.input(adminInquiryUpdateSchema).mutation(async ({ input, ctx }) => {
        try { return await updateAdminEnquiry(input, ctx.user); } catch (error) { throw asAdminError(error, "Unable to update enquiry."); }
      }),
      addNote: adminProcedure.input(adminInquiryNoteSchema).mutation(async ({ input, ctx }) => {
        try { return await addAdminEnquiryNote(input.id, input.note, ctx.user); } catch (error) { throw asAdminError(error, "Unable to add enquiry note."); }
      }),
      salespeople: adminProcedure.query(() => listAdminSalespeople()),
    }),
    content: router({
      list: adminProcedure.query(() => getAdminSiteContent()),
      update: adminProcedure.input(adminSiteContentSchema).mutation(async ({ input, ctx }) => {
        try { return await updateAdminSiteContent(input.contentKey, input.body, ctx.user.id); } catch (error) { throw asAdminError(error, "Unable to update website content."); }
      }),
    }),
  }),
});

export type AppRouter = typeof appRouter;
