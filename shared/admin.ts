import { z } from "zod";
import { productCreateSchema, productStatusSchema } from "./catalogue";

const slugSchema = z.string().trim().min(2).max(180).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase words separated by hyphens.");
const optionalText = (maximum: number) => z.string().trim().max(maximum).optional().transform((value) => value || undefined);
const identifierSchema = z.number().int().positive();

export const adminPaginationSchema = z.object({
  page: z.number().int().min(1).max(10_000).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
  query: z.string().trim().max(160).optional(),
});

export const adminProductListSchema = adminPaginationSchema.extend({
  status: productStatusSchema.optional(),
  categorySlug: slugSchema.max(160).optional(),
  collectionSlug: slugSchema.max(160).optional(),
});

export const adminProductIdSchema = z.object({ id: identifierSchema });
export const adminProductUpdateSchema = productCreateSchema.safeExtend({ id: identifierSchema });
export const adminProductDuplicateSchema = z.object({
  id: identifierSchema,
  slug: slugSchema,
  name: z.string().trim().min(2).max(240).optional(),
});
export const adminBulkProductSchema = z.object({
  ids: z.array(identifierSchema).min(1).max(100).transform((ids) => Array.from(new Set(ids))),
  action: z.enum(["archive", "restore", "publish"]),
});

const taxonomyBaseSchema = z.object({
  name: z.string().trim().min(2).max(200),
  slug: slugSchema.max(160),
  description: optionalText(10_000),
  sortOrder: z.number().int().min(0).max(100_000).default(0),
});

export const adminCollectionCreateSchema = taxonomyBaseSchema.extend({
  heroMediaUrl: optionalText(4_000),
  seoTitle: optionalText(255),
  seoDescription: optionalText(320),
});
export const adminCollectionUpdateSchema = adminCollectionCreateSchema.extend({ id: identifierSchema });
export const adminCollectionArchiveSchema = z.object({ id: identifierSchema, archived: z.boolean() });

export const adminCategoryCreateSchema = taxonomyBaseSchema;
export const adminCategoryUpdateSchema = taxonomyBaseSchema.extend({ id: identifierSchema });
export const adminCategoryArchiveSchema = z.object({ id: identifierSchema, archived: z.boolean() });

export const adminMediaUploadSchema = z.object({
  filename: z.string().trim().min(1).max(240),
  contentType: z.enum(["image/jpeg", "image/png", "image/webp"]),
  byteSize: z.number().int().positive().max(5_000_000),
  base64: z.string().min(4).max(7_000_000),
  alt: optionalText(400),
});
export const adminMediaListSchema = adminPaginationSchema.extend({ status: z.enum(["active", "archived"]).optional() });
export const adminMediaUpdateSchema = z.object({
  id: identifierSchema,
  alt: optionalText(400),
  status: z.enum(["active", "archived"]).optional(),
});
export const adminMediaIdSchema = z.object({ id: identifierSchema });

export const inquiryStatusSchema = z.enum(["new", "contacted", "closed"]);
export const adminInquiryListSchema = adminPaginationSchema.extend({
  status: inquiryStatusSchema.optional(),
  assignedToUserId: identifierSchema.optional(),
});
export const adminInquiryIdSchema = z.object({ id: identifierSchema });
export const adminInquiryUpdateSchema = z.object({
  id: identifierSchema,
  status: inquiryStatusSchema.optional(),
  assignedToUserId: identifierSchema.nullable().optional(),
});
export const adminInquiryNoteSchema = z.object({ id: identifierSchema, note: z.string().trim().min(1).max(5_000) });

export const adminSiteContentSchema = z.object({
  contentKey: z.enum(["homepage_hero_copy"]),
  body: z.string().trim().min(1).max(2_000),
});

export type AdminProductUpdateInput = z.infer<typeof adminProductUpdateSchema>;
