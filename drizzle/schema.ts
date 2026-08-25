import { boolean, decimal, index, int, json, mysqlEnum, mysqlTable, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";

/** Core user record backing the existing Manus OAuth flow. */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

/** Import-ready collection model. Real catalogue data remains optional until supplied by Umaid Craftorium. */
export const collections = mysqlTable("catalog_collections", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 160 }).notNull(),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  seoTitle: varchar("seoTitle", { length: 255 }),
  seoDescription: varchar("seoDescription", { length: 320 }),
  metadata: json("metadata").$type<Record<string, unknown>>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [uniqueIndex("catalog_collections_slug_unique").on(table.slug)]);

/** Reusable product taxonomy. Category rows are intentionally editorial rather than commercial claims. */
export const catalogCategories = mysqlTable("catalog_categories", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 160 }).notNull(),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [uniqueIndex("catalog_categories_slug_unique").on(table.slug), index("catalog_categories_sort_idx").on(table.sortOrder)]);

/** Approved material vocabulary; product use is modeled through a join table. */
export const catalogMaterials = mysqlTable("catalog_materials", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 160 }).notNull(),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [uniqueIndex("catalog_materials_slug_unique").on(table.slug)]);

/** Approved finish vocabulary; product use is modeled through a join table. */
export const catalogFinishes = mysqlTable("catalog_finishes", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 160 }).notNull(),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [uniqueIndex("catalog_finishes_slug_unique").on(table.slug)]);

/** Product fields are deliberately nullable where approved commercial data is not available. */
export const catalogProducts = mysqlTable("catalog_products", {
  id: int("id").autoincrement().primaryKey(),
  sku: varchar("sku", { length: 160 }),
  productCode: varchar("productCode", { length: 160 }),
  slug: varchar("slug", { length: 180 }).notNull(),
  title: varchar("title", { length: 240 }).notNull(),
  shortDescription: varchar("shortDescription", { length: 500 }),
  collectionId: int("collectionId"),
  primaryCategoryId: int("primaryCategoryId"),
  primaryCategory: varchar("primaryCategory", { length: 160 }),
  description: text("description"),
  materials: json("materials").$type<string[]>(),
  finishes: json("finishes").$type<string[]>(),
  dimensions: text("dimensions"),
  weightKg: decimal("weightKg", { precision: 10, scale: 2 }),
  moq: int("moq"),
  packagingInfo: text("packagingInfo"),
  cbm: decimal("cbm", { precision: 10, scale: 3 }),
  status: mysqlEnum("status", ["draft", "published", "archived"]).default("draft").notNull(),
  availability: mysqlEnum("availability", ["available", "on_request", "discontinued"]).default("on_request").notNull(),
  customizable: boolean("customizable").default(false).notNull(),
  featured: boolean("featured").default(false).notNull(),
  isNew: boolean("isNew").default(false).notNull(),
  seoTitle: varchar("seoTitle", { length: 255 }),
  seoDescription: varchar("seoDescription", { length: 320 }),
  metadata: json("metadata").$type<Record<string, unknown>>(),
  publishedAt: timestamp("publishedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  uniqueIndex("catalog_products_slug_unique").on(table.slug),
  uniqueIndex("catalog_products_sku_unique").on(table.sku),
  uniqueIndex("catalog_products_product_code_unique").on(table.productCode),
  index("catalog_products_collection_idx").on(table.collectionId),
  index("catalog_products_category_idx").on(table.primaryCategoryId),
  index("catalog_products_status_idx").on(table.status),
  index("catalog_products_featured_idx").on(table.status, table.featured),
  index("catalog_products_new_idx").on(table.status, table.isNew),
]);

/** Supports one product belonging to several browseable categories without losing its primary category. */
export const catalogProductCategories = mysqlTable("catalog_product_categories", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId").notNull(),
  categoryId: int("categoryId").notNull(),
  isPrimary: boolean("isPrimary").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [
  uniqueIndex("catalog_product_categories_unique").on(table.productId, table.categoryId),
  index("catalog_product_categories_category_idx").on(table.categoryId, table.productId),
]);

export const catalogProductMaterials = mysqlTable("catalog_product_materials", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId").notNull(),
  materialId: int("materialId").notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [
  uniqueIndex("catalog_product_materials_unique").on(table.productId, table.materialId),
  index("catalog_product_materials_material_idx").on(table.materialId, table.productId),
]);

export const catalogProductFinishes = mysqlTable("catalog_product_finishes", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId").notNull(),
  finishId: int("finishId").notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [
  uniqueIndex("catalog_product_finishes_unique").on(table.productId, table.finishId),
  index("catalog_product_finishes_finish_idx").on(table.finishId, table.productId),
]);

/** Variant records remain optional until actual variant facts are supplied. */
export const catalogProductVariants = mysqlTable("catalog_product_variants", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId").notNull(),
  variantCode: varchar("variantCode", { length: 160 }).notNull(),
  sku: varchar("sku", { length: 160 }),
  name: varchar("name", { length: 240 }),
  materialId: int("materialId"),
  finishId: int("finishId"),
  dimensions: text("dimensions"),
  weightKg: decimal("weightKg", { precision: 10, scale: 2 }),
  moq: int("moq"),
  packagingInfo: text("packagingInfo"),
  cbm: decimal("cbm", { precision: 10, scale: 3 }),
  availability: mysqlEnum("availability", ["available", "on_request", "discontinued"]).default("on_request").notNull(),
  metadata: json("metadata").$type<Record<string, unknown>>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  uniqueIndex("catalog_product_variants_product_code_unique").on(table.productId, table.variantCode),
  uniqueIndex("catalog_product_variants_sku_unique").on(table.sku),
  index("catalog_product_variants_product_idx").on(table.productId),
]);

/** Publish only approved labels and values; no inferred specifications are stored. */
export const catalogProductSpecifications = mysqlTable("catalog_product_specifications", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId").notNull(),
  variantId: int("variantId"),
  specificationKey: varchar("specificationKey", { length: 160 }).notNull(),
  label: varchar("label", { length: 240 }).notNull(),
  value: text("value").notNull(),
  unit: varchar("unit", { length: 80 }),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [
  uniqueIndex("catalog_product_specs_unique").on(table.productId, table.variantId, table.specificationKey),
  index("catalog_product_specs_product_idx").on(table.productId, table.sortOrder),
  index("catalog_product_specs_variant_idx").on(table.variantId, table.sortOrder),
]);

export const catalogProductImages = mysqlTable("catalog_product_images", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId").notNull(),
  storageKey: varchar("storageKey", { length: 512 }),
  url: text("url").notNull(),
  alt: varchar("alt", { length: 400 }),
  role: mysqlEnum("role", ["hero", "gallery", "detail"]).default("gallery").notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  focalDesktopX: int("focalDesktopX"),
  focalDesktopY: int("focalDesktopY"),
  focalMobileX: int("focalMobileX"),
  focalMobileY: int("focalMobileY"),
  fit: mysqlEnum("fit", ["contain", "cover"]).default("contain").notNull(),
  mobileFit: mysqlEnum("mobileFit", ["contain", "cover"]),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [index("catalog_product_images_product_idx").on(table.productId, table.sortOrder)]);

export const catalogProductDocuments = mysqlTable("catalog_product_documents", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId").notNull(),
  label: varchar("label", { length: 240 }).notNull(),
  documentType: varchar("documentType", { length: 120 }).notNull(),
  storageKey: varchar("storageKey", { length: 512 }),
  url: text("url").notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [index("catalog_product_documents_product_idx").on(table.productId, table.sortOrder)]);

/** Existing simple inquiry record extended with safe structured buyer and project context. */
export const inquiries = mysqlTable("inquiries", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 160 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  company: varchar("company", { length: 160 }),
  phone: varchar("phone", { length: 80 }),
  buyerType: varchar("buyerType", { length: 120 }),
  project: varchar("project", { length: 160 }).notNull(),
  projectType: varchar("projectType", { length: 160 }),
  shippingCountry: varchar("shippingCountry", { length: 160 }),
  targetMarket: varchar("targetMarket", { length: 160 }),
  timeline: varchar("timeline", { length: 120 }),
  customizationRequirements: text("customizationRequirements"),
  message: text("message").notNull(),
  metadata: json("metadata").$type<Record<string, unknown>>(),
  status: mysqlEnum("status", ["new", "contacted", "closed"]).default("new").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/** Snapshot each selected product reference to keep enquiries meaningful even when catalogue records later change. */
export const inquiryItems = mysqlTable("inquiry_items", {
  id: int("id").autoincrement().primaryKey(),
  inquiryId: int("inquiryId").notNull(),
  productId: int("productId"),
  productReference: varchar("productReference", { length: 240 }).notNull(),
  collectionName: varchar("collectionName", { length: 200 }),
  quantity: int("quantity").default(1).notNull(),
  metadata: json("metadata").$type<Record<string, unknown>>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [index("inquiry_items_inquiry_idx").on(table.inquiryId)]);

/** Attachment metadata only; bytes are stored in S3 through the server storage helper. */
export const inquiryAttachments = mysqlTable("inquiry_attachments", {
  id: int("id").autoincrement().primaryKey(),
  inquiryId: int("inquiryId").notNull(),
  storageKey: varchar("storageKey", { length: 512 }).notNull(),
  filename: varchar("filename", { length: 240 }).notNull(),
  contentType: varchar("contentType", { length: 120 }).notNull(),
  byteSize: int("byteSize").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [index("inquiry_attachments_inquiry_idx").on(table.inquiryId)]);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Inquiry = typeof inquiries.$inferSelect;
export type InsertInquiry = typeof inquiries.$inferInsert;
export type CatalogProduct = typeof catalogProducts.$inferSelect;
export type CatalogProductImage = typeof catalogProductImages.$inferSelect;
export type CatalogCollection = typeof collections.$inferSelect;
export type CatalogCategory = typeof catalogCategories.$inferSelect;
export type CatalogMaterial = typeof catalogMaterials.$inferSelect;
export type CatalogFinish = typeof catalogFinishes.$inferSelect;
export type CatalogProductVariant = typeof catalogProductVariants.$inferSelect;
export type CatalogProductSpecification = typeof catalogProductSpecifications.$inferSelect;
