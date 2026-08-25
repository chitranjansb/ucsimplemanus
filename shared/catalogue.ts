import { z } from "zod";

export const productStatusSchema = z.enum(["draft", "published", "archived"]);
export const productAvailabilitySchema = z.enum(["available", "on_request", "discontinued"]);
export const imageRoleSchema = z.enum(["hero", "gallery", "detail"]);
export const imageFitSchema = z.enum(["contain", "cover"]);

const optionalText = (maximum: number) => z.string().trim().max(maximum).optional().transform((value) => value || undefined);
const slugSchema = z.string().trim().min(2).max(180).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase words separated by hyphens.");
const nonNegativeDecimal = z.number().nonnegative().finite().optional();
const positiveInteger = z.number().int().positive().max(1_000_000).optional();

export const productMediaInputSchema = z.object({
  url: z.string().trim().min(1).max(4_000),
  alt: optionalText(400),
  role: imageRoleSchema.default("gallery"),
  sortOrder: z.number().int().min(0).max(10_000).default(0),
  focalDesktopX: z.number().int().min(0).max(100).optional(),
  focalDesktopY: z.number().int().min(0).max(100).optional(),
  focalMobileX: z.number().int().min(0).max(100).optional(),
  focalMobileY: z.number().int().min(0).max(100).optional(),
  fit: imageFitSchema.default("contain"),
  mobileFit: imageFitSchema.optional(),
});

export const productSpecificationInputSchema = z.object({
  key: slugSchema.max(160),
  label: z.string().trim().min(1).max(240),
  value: z.string().trim().min(1).max(5_000),
  unit: optionalText(80),
  sortOrder: z.number().int().min(0).max(10_000).default(0),
});

export const productVariantInputSchema = z.object({
  variantCode: slugSchema.max(160),
  sku: optionalText(160),
  name: optionalText(240),
  materialSlug: slugSchema.max(160).optional(),
  finishSlug: slugSchema.max(160).optional(),
  dimensions: optionalText(2_000),
  weightKg: nonNegativeDecimal,
  moq: positiveInteger,
  packagingInfo: optionalText(5_000),
  cbm: nonNegativeDecimal,
  availability: productAvailabilitySchema.default("on_request"),
  specifications: z.array(productSpecificationInputSchema).max(50).default([]),
});

export const productCreateSchema = z.object({
  sku: optionalText(160),
  productCode: optionalText(160),
  name: z.string().trim().min(2).max(240),
  slug: slugSchema,
  description: optionalText(10_000),
  shortDescription: optionalText(500),
  collectionSlug: slugSchema.max(160).optional(),
  categorySlugs: z.array(slugSchema.max(160)).min(1).max(12).transform((value) => Array.from(new Set(value))),
  primaryCategorySlug: slugSchema.max(160).optional(),
  materialSlugs: z.array(slugSchema.max(160)).max(24).default([]).transform((value) => Array.from(new Set(value))),
  finishSlugs: z.array(slugSchema.max(160)).max(24).default([]).transform((value) => Array.from(new Set(value))),
  dimensions: optionalText(2_000),
  weightKg: nonNegativeDecimal,
  moq: positiveInteger,
  packagingInfo: optionalText(5_000),
  cbm: nonNegativeDecimal,
  customizable: z.boolean().default(false),
  status: productStatusSchema.default("draft"),
  availability: productAvailabilitySchema.default("on_request"),
  featured: z.boolean().default(false),
  isNew: z.boolean().default(false),
  seoTitle: optionalText(255),
  seoDescription: optionalText(320),
  media: z.array(productMediaInputSchema).max(50).default([]),
  specifications: z.array(productSpecificationInputSchema).max(50).default([]),
  variants: z.array(productVariantInputSchema).max(100).default([]),
}).superRefine((value, context) => {
  if (value.primaryCategorySlug && !value.categorySlugs.includes(value.primaryCategorySlug)) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["primaryCategorySlug"], message: "Primary category must be included in categorySlugs." });
  }
  if (value.media.filter((media) => media.role === "hero").length > 1) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["media"], message: "A product can have only one hero image." });
  }
  const variantCodes = value.variants.map((variant) => variant.variantCode);
  if (new Set(variantCodes).size !== variantCodes.length) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["variants"], message: "Variant codes must be unique within a product." });
  }
});

export const catalogueListSchema = z.object({
  query: z.string().trim().max(160).optional(),
  category: slugSchema.max(160).optional(),
  collection: slugSchema.max(160).optional(),
  material: slugSchema.max(160).optional(),
  finish: slugSchema.max(160).optional(),
  featured: z.boolean().optional(),
  isNew: z.boolean().optional(),
  customizable: z.boolean().optional(),
  availability: z.enum(["available", "on_request", "discontinued"]).optional(),
  sort: z.enum(["featured", "newest", "name_asc", "name_desc"]).default("featured"),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(24),
  limit: z.number().int().min(1).max(100).optional(),
});

export const productSlugSchema = z.object({ slug: slugSchema });

export type CatalogueListInput = z.input<typeof catalogueListSchema>;
export type ProductCreateInput = z.infer<typeof productCreateSchema>;
