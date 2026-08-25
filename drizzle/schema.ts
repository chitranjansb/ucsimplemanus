import { boolean, index, int, json, mysqlEnum, mysqlTable, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";

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

/** Product fields are deliberately nullable where approved commercial data is not available. */
export const catalogProducts = mysqlTable("catalog_products", {
  id: int("id").autoincrement().primaryKey(),
  sku: varchar("sku", { length: 160 }),
  slug: varchar("slug", { length: 180 }).notNull(),
  title: varchar("title", { length: 240 }).notNull(),
  collectionId: int("collectionId"),
  primaryCategory: varchar("primaryCategory", { length: 160 }),
  description: text("description"),
  materials: json("materials").$type<string[]>(),
  finishes: json("finishes").$type<string[]>(),
  dimensions: text("dimensions"),
  status: mysqlEnum("status", ["draft", "published", "archived"]).default("draft").notNull(),
  customizable: boolean("customizable").default(false).notNull(),
  seoTitle: varchar("seoTitle", { length: 255 }),
  seoDescription: varchar("seoDescription", { length: 320 }),
  metadata: json("metadata").$type<Record<string, unknown>>(),
  publishedAt: timestamp("publishedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  uniqueIndex("catalog_products_slug_unique").on(table.slug),
  uniqueIndex("catalog_products_sku_unique").on(table.sku),
  index("catalog_products_collection_idx").on(table.collectionId),
  index("catalog_products_status_idx").on(table.status),
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
