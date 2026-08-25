import { and, asc, count, countDistinct, desc, eq, inArray, like, lte, or, sql, sum } from "drizzle-orm";
import {
  catalogCategories,
  catalogFinishes,
  catalogMaterials,
  catalogProductCategories,
  catalogProductFinishes,
  catalogProductImages,
  catalogProductMaterials,
  catalogProductSpecifications,
  catalogProductVariants,
  catalogProducts,
  collections,
  inquiries,
  inquiryActivities,
  inquiryAttachments,
  inquiryItems,
  inquiryNotes,
  mediaAssets,
  siteContent,
  users,
} from "../drizzle/schema";
import type { AdminProductUpdateInput, InquiryStatus } from "../shared/admin";
import { isValidInquiryStatusTransition } from "../shared/admin";
import { createCatalogueProduct } from "./catalogue";
import { getDb } from "./db";
import { storagePut } from "./storage";

const PRODUCT_LIST_COLUMNS = {
  id: catalogProducts.id,
  name: catalogProducts.title,
  slug: catalogProducts.slug,
  sku: catalogProducts.sku,
  productCode: catalogProducts.productCode,
  status: catalogProducts.status,
  availability: catalogProducts.availability,
  featured: catalogProducts.featured,
  isNew: catalogProducts.isNew,
  updatedAt: catalogProducts.updatedAt,
  collectionName: collections.name,
  collectionSlug: collections.slug,
  categoryName: catalogCategories.name,
  categorySlug: catalogCategories.slug,
} as const;

type CmsDbExecutor = Pick<NonNullable<Awaited<ReturnType<typeof getDb>>>, "select" | "insert" | "update" | "delete">;

function pageWindow(page: number, pageSize: number) {
  return { limit: pageSize, offset: (page - 1) * pageSize };
}

function optionalInput(value: string | undefined | null) {
  return value || null;
}

async function requireDatabase() {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  return db;
}

async function resolveTaxonomy(db: CmsDbExecutor, input: AdminProductUpdateInput) {
  const collection = input.collectionSlug
    ? (await db.select().from(collections).where(and(eq(collections.slug, input.collectionSlug), eq(collections.status, "active"))).limit(1))[0]
    : undefined;
  if (input.collectionSlug && !collection) throw new Error("Unknown or archived collection reference.");
  const categories = await db.select().from(catalogCategories).where(and(inArray(catalogCategories.slug, input.categorySlugs), eq(catalogCategories.status, "active")));
  if (categories.length !== input.categorySlugs.length) throw new Error("Unknown or archived category reference.");
  const materials = input.materialSlugs.length ? await db.select().from(catalogMaterials).where(inArray(catalogMaterials.slug, input.materialSlugs)) : [];
  if (materials.length !== input.materialSlugs.length) throw new Error("Unknown material reference.");
  const finishes = input.finishSlugs.length ? await db.select().from(catalogFinishes).where(inArray(catalogFinishes.slug, input.finishSlugs)) : [];
  if (finishes.length !== input.finishSlugs.length) throw new Error("Unknown finish reference.");
  const primary = categories.find((category) => category.slug === (input.primaryCategorySlug || input.categorySlugs[0]));
  if (!primary) throw new Error("Unknown primary category reference.");
  return { collection, categories, materials, finishes, primary };
}

async function resolveVariantReference(tx: CmsDbExecutor, materialSlug?: string, finishSlug?: string) {
  const material = materialSlug ? (await tx.select().from(catalogMaterials).where(eq(catalogMaterials.slug, materialSlug)).limit(1))[0] : undefined;
  const finish = finishSlug ? (await tx.select().from(catalogFinishes).where(eq(catalogFinishes.slug, finishSlug)).limit(1))[0] : undefined;
  if (materialSlug && !material) throw new Error("Unknown variant material reference.");
  if (finishSlug && !finish) throw new Error("Unknown variant finish reference.");
  return { material, finish };
}

async function writeProductChildren(tx: CmsDbExecutor, productId: number, input: AdminProductUpdateInput, resolved: Awaited<ReturnType<typeof resolveTaxonomy>>) {
  await tx.insert(catalogProductCategories).values(resolved.categories.map((category) => ({ productId, categoryId: category.id, isPrimary: category.id === resolved.primary.id })));
  if (resolved.materials.length) await tx.insert(catalogProductMaterials).values(resolved.materials.map((material, sortOrder) => ({ productId, materialId: material.id, sortOrder })));
  if (resolved.finishes.length) await tx.insert(catalogProductFinishes).values(resolved.finishes.map((finish, sortOrder) => ({ productId, finishId: finish.id, sortOrder })));
  if (input.media.length) await tx.insert(catalogProductImages).values(input.media.map((media) => ({
    productId,
    url: media.url,
    alt: optionalInput(media.alt),
    role: media.role,
    sortOrder: media.sortOrder,
    focalDesktopX: media.focalDesktopX ?? null,
    focalDesktopY: media.focalDesktopY ?? null,
    focalMobileX: media.focalMobileX ?? null,
    focalMobileY: media.focalMobileY ?? null,
    fit: media.fit,
    mobileFit: media.mobileFit ?? null,
  })));
  if (input.specifications.length) await tx.insert(catalogProductSpecifications).values(input.specifications.map((specification) => ({
    productId,
    variantId: null,
    specificationKey: specification.key,
    label: specification.label,
    value: specification.value,
    unit: optionalInput(specification.unit),
    sortOrder: specification.sortOrder,
  })));
  for (const variant of input.variants) {
    const references = await resolveVariantReference(tx, variant.materialSlug, variant.finishSlug);
    const result = await tx.insert(catalogProductVariants).values({
      productId,
      variantCode: variant.variantCode,
      sku: optionalInput(variant.sku),
      name: optionalInput(variant.name),
      materialId: references.material?.id ?? null,
      finishId: references.finish?.id ?? null,
      dimensions: optionalInput(variant.dimensions),
      weightKg: variant.weightKg === undefined ? null : String(variant.weightKg),
      moq: variant.moq ?? null,
      packagingInfo: optionalInput(variant.packagingInfo),
      cbm: variant.cbm === undefined ? null : String(variant.cbm),
      availability: variant.availability,
    });
    const variantId = Number(result[0].insertId);
    if (variant.specifications.length) await tx.insert(catalogProductSpecifications).values(variant.specifications.map((specification) => ({
      productId,
      variantId,
      specificationKey: specification.key,
      label: specification.label,
      value: specification.value,
      unit: optionalInput(specification.unit),
      sortOrder: specification.sortOrder,
    })));
  }
}

export async function getAdminDashboard() {
  const db = await requireDatabase();
  const monthStart = new Date();
  monthStart.setUTCDate(1);
  monthStart.setUTCHours(0, 0, 0, 0);
  const now = new Date();
  const [productCount, collectionCount, categoryCount, statusRows, quotationTotal, countryRows, collectionRows, productRows] = await Promise.all([
    db.select({ total: count() }).from(catalogProducts).where(sql`${catalogProducts.status} <> 'archived'`),
    db.select({ total: count() }).from(collections).where(eq(collections.status, "active")),
    db.select({ total: count() }).from(catalogCategories).where(eq(catalogCategories.status, "active")),
    db.select({ status: inquiries.status, total: count() }).from(inquiries).groupBy(inquiries.status),
    db.select({ total: sum(inquiries.quotationValue) }).from(inquiries),
    db.select({ label: inquiries.shippingCountry, total: count() }).from(inquiries).where(sql`${inquiries.shippingCountry} IS NOT NULL AND ${inquiries.shippingCountry} <> ''`).groupBy(inquiries.shippingCountry).orderBy(desc(count())).limit(10),
    db.select({ label: inquiryItems.collectionName, total: countDistinct(inquiryItems.inquiryId) }).from(inquiryItems).where(sql`${inquiryItems.collectionName} IS NOT NULL AND ${inquiryItems.collectionName} <> ''`).groupBy(inquiryItems.collectionName).orderBy(desc(countDistinct(inquiryItems.inquiryId))).limit(10),
    db.select({ label: inquiryItems.productReference, total: countDistinct(inquiryItems.inquiryId) }).from(inquiryItems).groupBy(inquiryItems.productReference).orderBy(desc(countDistinct(inquiryItems.inquiryId))).limit(10),
  ]);
  const statusCount = (status: InquiryStatus) => Number(statusRows.find((row) => row.status === status)?.total || 0);
  const followUpDue = (await db.select({ total: count() }).from(inquiries).where(and(lte(inquiries.nextFollowUpAt, now), sql`${inquiries.status} NOT IN ('follow_up', 'won', 'lost', 'closed')`)))[0]?.total || 0;
  return {
    products: Number(productCount[0]?.total || 0), collections: Number(collectionCount[0]?.total || 0), categories: Number(categoryCount[0]?.total || 0),
    newEnquiries: statusCount("new"), enquiriesThisMonth: Number((await db.select({ total: count() }).from(inquiries).where(sql`${inquiries.createdAt} >= ${monthStart}`))[0]?.total || 0),
    pipeline: { new: statusCount("new"), needingFollowUp: statusCount("follow_up") + Number(followUpDue), quotationSent: statusCount("quotation_sent"), negotiation: statusCount("negotiation"), won: statusCount("won"), lost: statusCount("lost") },
    quotationTotal: quotationTotal[0]?.total === null ? null : Number(quotationTotal[0]?.total || 0),
    enquiryStatus: statusRows.map((row) => ({ status: row.status, total: Number(row.total) })),
    byCountry: countryRows.map((row) => ({ label: row.label || "Unknown", total: Number(row.total) })),
    byCollection: collectionRows.map((row) => ({ label: row.label || "Unknown", total: Number(row.total) })),
    byProduct: productRows.map((row) => ({ label: row.label, total: Number(row.total) })),
  };
}

export async function listAdminProducts(input: { page: number; pageSize: number; query?: string; status?: "draft" | "published" | "archived"; categorySlug?: string; collectionSlug?: string }) {
  const db = await requireDatabase();
  const conditions = [];
  if (input.status) conditions.push(eq(catalogProducts.status, input.status));
  if (input.categorySlug) conditions.push(eq(catalogCategories.slug, input.categorySlug));
  if (input.collectionSlug) conditions.push(eq(collections.slug, input.collectionSlug));
  if (input.query) {
    const wildcard = `%${input.query}%`;
    conditions.push(or(like(catalogProducts.title, wildcard), like(catalogProducts.slug, wildcard), like(catalogProducts.sku, wildcard), like(catalogProducts.productCode, wildcard))!);
  }
  const where = conditions.length ? and(...conditions) : undefined;
  const page = pageWindow(input.page, input.pageSize);
  const [items, totals] = await Promise.all([
    db.select(PRODUCT_LIST_COLUMNS).from(catalogProducts)
      .leftJoin(collections, eq(catalogProducts.collectionId, collections.id))
      .leftJoin(catalogCategories, eq(catalogProducts.primaryCategoryId, catalogCategories.id))
      .where(where).orderBy(desc(catalogProducts.updatedAt)).limit(page.limit).offset(page.offset),
    db.select({ total: count() }).from(catalogProducts)
      .leftJoin(collections, eq(catalogProducts.collectionId, collections.id))
      .leftJoin(catalogCategories, eq(catalogProducts.primaryCategoryId, catalogCategories.id)).where(where),
  ]);
  return { items, total: Number(totals[0]?.total || 0), page: input.page, pageSize: input.pageSize };
}

export async function getAdminProduct(id: number) {
  const db = await requireDatabase();
  const product = (await db.select().from(catalogProducts).where(eq(catalogProducts.id, id)).limit(1))[0];
  if (!product) return null;
  const [collection, categories, materials, finishes, media, specifications, variants] = await Promise.all([
    product.collectionId ? db.select({ slug: collections.slug }).from(collections).where(eq(collections.id, product.collectionId)).limit(1) : Promise.resolve([]),
    db.select({ slug: catalogCategories.slug, primary: catalogProductCategories.isPrimary }).from(catalogProductCategories).innerJoin(catalogCategories, eq(catalogProductCategories.categoryId, catalogCategories.id)).where(eq(catalogProductCategories.productId, id)),
    db.select({ slug: catalogMaterials.slug }).from(catalogProductMaterials).innerJoin(catalogMaterials, eq(catalogProductMaterials.materialId, catalogMaterials.id)).where(eq(catalogProductMaterials.productId, id)).orderBy(asc(catalogProductMaterials.sortOrder)),
    db.select({ slug: catalogFinishes.slug }).from(catalogProductFinishes).innerJoin(catalogFinishes, eq(catalogProductFinishes.finishId, catalogFinishes.id)).where(eq(catalogProductFinishes.productId, id)).orderBy(asc(catalogProductFinishes.sortOrder)),
    db.select().from(catalogProductImages).where(eq(catalogProductImages.productId, id)).orderBy(asc(catalogProductImages.sortOrder)),
    db.select({ specification: catalogProductSpecifications, variantCode: catalogProductVariants.variantCode }).from(catalogProductSpecifications).leftJoin(catalogProductVariants, eq(catalogProductSpecifications.variantId, catalogProductVariants.id)).where(eq(catalogProductSpecifications.productId, id)).orderBy(asc(catalogProductSpecifications.sortOrder)),
    db.select({ variant: catalogProductVariants, materialSlug: catalogMaterials.slug, finishSlug: catalogFinishes.slug }).from(catalogProductVariants).leftJoin(catalogMaterials, eq(catalogProductVariants.materialId, catalogMaterials.id)).leftJoin(catalogFinishes, eq(catalogProductVariants.finishId, catalogFinishes.id)).where(eq(catalogProductVariants.productId, id)),
  ]);
  return {
    product,
    collectionSlug: collection[0]?.slug || undefined,
    categorySlugs: categories.map((entry) => entry.slug),
    primaryCategorySlug: categories.find((entry) => entry.primary)?.slug || categories[0]?.slug,
    materialSlugs: materials.map((entry) => entry.slug),
    finishSlugs: finishes.map((entry) => entry.slug),
    media: media.map((entry) => ({ ...entry, alt: entry.alt || undefined, mobileFit: entry.mobileFit || undefined })),
    specifications: specifications.filter((entry) => !entry.variantCode).map((entry) => ({ key: entry.specification.specificationKey, label: entry.specification.label, value: entry.specification.value, unit: entry.specification.unit || undefined, sortOrder: entry.specification.sortOrder })),
    variants: variants.map((entry) => ({
      variantCode: entry.variant.variantCode,
      sku: entry.variant.sku || undefined,
      name: entry.variant.name || undefined,
      materialSlug: entry.materialSlug || undefined,
      finishSlug: entry.finishSlug || undefined,
      dimensions: entry.variant.dimensions || undefined,
      weightKg: entry.variant.weightKg === null ? undefined : Number(entry.variant.weightKg),
      moq: entry.variant.moq || undefined,
      packagingInfo: entry.variant.packagingInfo || undefined,
      cbm: entry.variant.cbm === null ? undefined : Number(entry.variant.cbm),
      availability: entry.variant.availability,
      specifications: specifications.filter((specification) => specification.variantCode === entry.variant.variantCode).map((specification) => ({ key: specification.specification.specificationKey, label: specification.specification.label, value: specification.specification.value, unit: specification.specification.unit || undefined, sortOrder: specification.specification.sortOrder })),
    })),
  };
}

export async function updateAdminProduct(input: AdminProductUpdateInput) {
  const db = await requireDatabase();
  const existing = await getAdminProduct(input.id);
  if (!existing) throw new Error("Product not found.");
  const resolved = await resolveTaxonomy(db, input);
  await db.transaction(async (tx) => {
    await tx.update(catalogProducts).set({
      sku: optionalInput(input.sku), productCode: optionalInput(input.productCode), slug: input.slug, title: input.name,
      shortDescription: optionalInput(input.shortDescription), collectionId: resolved.collection?.id ?? null,
      primaryCategoryId: resolved.primary.id, primaryCategory: resolved.primary.name, description: optionalInput(input.description),
      materials: resolved.materials.map((material) => material.name), finishes: resolved.finishes.map((finish) => finish.name),
      dimensions: optionalInput(input.dimensions), weightKg: input.weightKg === undefined ? null : String(input.weightKg), moq: input.moq ?? null,
      packagingInfo: optionalInput(input.packagingInfo), cbm: input.cbm === undefined ? null : String(input.cbm),
      customizable: input.customizable, status: input.status, availability: input.availability, featured: input.featured, isNew: input.isNew,
      seoTitle: optionalInput(input.seoTitle), seoDescription: optionalInput(input.seoDescription),
      publishedAt: input.status === "published" ? (existing.product.publishedAt || new Date()) : null,
    }).where(eq(catalogProducts.id, input.id));
    await tx.delete(catalogProductSpecifications).where(eq(catalogProductSpecifications.productId, input.id));
    await tx.delete(catalogProductVariants).where(eq(catalogProductVariants.productId, input.id));
    await tx.delete(catalogProductImages).where(eq(catalogProductImages.productId, input.id));
    await tx.delete(catalogProductCategories).where(eq(catalogProductCategories.productId, input.id));
    await tx.delete(catalogProductMaterials).where(eq(catalogProductMaterials.productId, input.id));
    await tx.delete(catalogProductFinishes).where(eq(catalogProductFinishes.productId, input.id));
    await writeProductChildren(tx, input.id, input, resolved);
  });
  return { id: input.id, slug: input.slug };
}

export async function archiveAdminProduct(id: number, archived: boolean) {
  const db = await requireDatabase();
  const result = await db.update(catalogProducts).set({ status: archived ? "archived" : "draft", publishedAt: archived ? null : undefined }).where(eq(catalogProducts.id, id));
  if (!result[0].affectedRows) throw new Error("Product not found.");
  return { id, status: archived ? "archived" : "draft" };
}

export async function bulkUpdateAdminProducts(ids: number[], action: "archive" | "restore" | "publish") {
  const db = await requireDatabase();
  const values = action === "archive" ? { status: "archived" as const, publishedAt: null } : action === "publish" ? { status: "published" as const, publishedAt: new Date() } : { status: "draft" as const, publishedAt: null };
  await db.update(catalogProducts).set(values).where(inArray(catalogProducts.id, ids));
  return { ids, action };
}

export async function deleteAdminProduct(id: number) {
  const db = await requireDatabase();
  const product = (await db.select({ status: catalogProducts.status }).from(catalogProducts).where(eq(catalogProducts.id, id)).limit(1))[0];
  if (!product) throw new Error("Product not found.");
  if (product.status !== "draft") throw new Error("Only draft products can be permanently deleted. Archive published references instead.");
  const linkedEnquiries = await db.select({ total: count() }).from(inquiryItems).where(eq(inquiryItems.productId, id));
  if (Number(linkedEnquiries[0]?.total || 0) > 0) throw new Error("This draft has enquiry history and cannot be deleted.");
  await db.transaction(async (tx) => {
    await tx.delete(catalogProductSpecifications).where(eq(catalogProductSpecifications.productId, id));
    await tx.delete(catalogProductVariants).where(eq(catalogProductVariants.productId, id));
    await tx.delete(catalogProductImages).where(eq(catalogProductImages.productId, id));
    await tx.delete(catalogProductCategories).where(eq(catalogProductCategories.productId, id));
    await tx.delete(catalogProductMaterials).where(eq(catalogProductMaterials.productId, id));
    await tx.delete(catalogProductFinishes).where(eq(catalogProductFinishes.productId, id));
    await tx.delete(catalogProducts).where(eq(catalogProducts.id, id));
  });
  return { id, deleted: true };
}

export async function duplicateAdminProduct(id: number, slug: string, name?: string) {
  const source = await getAdminProduct(id);
  if (!source) throw new Error("Product not found.");
  return createCatalogueProduct({
    sku: undefined,
    productCode: undefined,
    name: name || `${source.product.title} copy`,
    slug,
    description: source.product.description || undefined,
    shortDescription: source.product.shortDescription || undefined,
    collectionSlug: source.product.collectionId ? (await requireDatabase().then((db) => db.select({ slug: collections.slug }).from(collections).where(eq(collections.id, source.product.collectionId!)).limit(1)))[0]?.slug : undefined,
    categorySlugs: source.categorySlugs,
    primaryCategorySlug: source.primaryCategorySlug,
    materialSlugs: source.materialSlugs,
    finishSlugs: source.finishSlugs,
    dimensions: source.product.dimensions || undefined,
    weightKg: source.product.weightKg === null ? undefined : Number(source.product.weightKg),
    moq: source.product.moq || undefined,
    packagingInfo: source.product.packagingInfo || undefined,
    cbm: source.product.cbm === null ? undefined : Number(source.product.cbm),
    customizable: source.product.customizable,
    status: "draft",
    availability: source.product.availability,
    featured: false,
    isNew: false,
    seoTitle: source.product.seoTitle || undefined,
    seoDescription: source.product.seoDescription || undefined,
    media: source.media.map((media) => ({ url: media.url, alt: media.alt || undefined, role: media.role, sortOrder: media.sortOrder, focalDesktopX: media.focalDesktopX ?? undefined, focalDesktopY: media.focalDesktopY ?? undefined, focalMobileX: media.focalMobileX ?? undefined, focalMobileY: media.focalMobileY ?? undefined, fit: media.fit, mobileFit: media.mobileFit || undefined })),
    specifications: source.specifications,
    variants: source.variants,
  });
}

export async function listAdminCollections() {
  const db = await requireDatabase();
  const [rows, productCounts, assets] = await Promise.all([
    db.select().from(collections).orderBy(asc(collections.status), asc(collections.sortOrder), asc(collections.name)),
    db.select({ collectionId: catalogProducts.collectionId, total: count() }).from(catalogProducts).groupBy(catalogProducts.collectionId),
    db.select({ id: mediaAssets.id, url: mediaAssets.url, alt: mediaAssets.alt }).from(mediaAssets).where(eq(mediaAssets.status, "active")),
  ]);
  const counts = new Map(productCounts.map((entry) => [entry.collectionId, Number(entry.total)]));
  const assetMap = new Map(assets.map((asset) => [asset.id, asset]));
  return rows.map((row) => ({ ...row, productCount: counts.get(row.id) || 0, heroMedia: row.heroMediaId ? assetMap.get(row.heroMediaId) || null : null }));
}

async function mediaIdForUrl(db: Awaited<ReturnType<typeof getDb>>, url?: string) {
  if (!db || !url) return null;
  const media = (await db.select({ id: mediaAssets.id }).from(mediaAssets).where(and(eq(mediaAssets.url, url), eq(mediaAssets.status, "active"))).limit(1))[0];
  if (!media) throw new Error("Select an active media-library image for the collection hero.");
  return media.id;
}

export async function createAdminCollection(input: { name: string; slug: string; description?: string; sortOrder: number; heroMediaUrl?: string; seoTitle?: string; seoDescription?: string }) {
  const db = await requireDatabase();
  const heroMediaId = await mediaIdForUrl(db, input.heroMediaUrl);
  const result = await db.insert(collections).values({ name: input.name, slug: input.slug, description: optionalInput(input.description), sortOrder: input.sortOrder, heroMediaId, seoTitle: optionalInput(input.seoTitle), seoDescription: optionalInput(input.seoDescription) });
  return { id: Number(result[0].insertId), slug: input.slug };
}

export async function updateAdminCollection(input: { id: number; name: string; slug: string; description?: string; sortOrder: number; heroMediaUrl?: string; seoTitle?: string; seoDescription?: string }) {
  const db = await requireDatabase();
  const heroMediaId = await mediaIdForUrl(db, input.heroMediaUrl);
  const result = await db.update(collections).set({ name: input.name, slug: input.slug, description: optionalInput(input.description), sortOrder: input.sortOrder, heroMediaId, seoTitle: optionalInput(input.seoTitle), seoDescription: optionalInput(input.seoDescription) }).where(eq(collections.id, input.id));
  if (!result[0].affectedRows) throw new Error("Collection not found.");
  return { id: input.id, slug: input.slug };
}

export async function archiveAdminCollection(id: number, archived: boolean) {
  const db = await requireDatabase();
  const result = await db.update(collections).set({ status: archived ? "archived" : "active" }).where(eq(collections.id, id));
  if (!result[0].affectedRows) throw new Error("Collection not found.");
  return { id, status: archived ? "archived" : "active" };
}

export async function listAdminCategories() {
  const db = await requireDatabase();
  const [rows, productCounts] = await Promise.all([
    db.select().from(catalogCategories).orderBy(asc(catalogCategories.status), asc(catalogCategories.sortOrder), asc(catalogCategories.name)),
    db.select({ categoryId: catalogProductCategories.categoryId, total: count() }).from(catalogProductCategories).groupBy(catalogProductCategories.categoryId),
  ]);
  const counts = new Map(productCounts.map((entry) => [entry.categoryId, Number(entry.total)]));
  return rows.map((row) => ({ ...row, productCount: counts.get(row.id) || 0 }));
}

export async function createAdminCategory(input: { name: string; slug: string; description?: string; sortOrder: number }) {
  const db = await requireDatabase();
  const result = await db.insert(catalogCategories).values({ name: input.name, slug: input.slug, description: optionalInput(input.description), sortOrder: input.sortOrder });
  return { id: Number(result[0].insertId), slug: input.slug };
}

export async function updateAdminCategory(input: { id: number; name: string; slug: string; description?: string; sortOrder: number }) {
  const db = await requireDatabase();
  const result = await db.update(catalogCategories).set({ name: input.name, slug: input.slug, description: optionalInput(input.description), sortOrder: input.sortOrder }).where(eq(catalogCategories.id, input.id));
  if (!result[0].affectedRows) throw new Error("Category not found.");
  return { id: input.id, slug: input.slug };
}

export async function archiveAdminCategory(id: number, archived: boolean) {
  const db = await requireDatabase();
  const result = await db.update(catalogCategories).set({ status: archived ? "archived" : "active" }).where(eq(catalogCategories.id, id));
  if (!result[0].affectedRows) throw new Error("Category not found.");
  return { id, status: archived ? "archived" : "active" };
}

export async function listAdminTaxonomy() {
  const db = await requireDatabase();
  const [collectionsRows, categoriesRows, materialsRows, finishesRows] = await Promise.all([
    db.select({ slug: collections.slug, name: collections.name, status: collections.status }).from(collections).orderBy(asc(collections.sortOrder), asc(collections.name)),
    db.select({ slug: catalogCategories.slug, name: catalogCategories.name, status: catalogCategories.status }).from(catalogCategories).orderBy(asc(catalogCategories.sortOrder), asc(catalogCategories.name)),
    db.select({ slug: catalogMaterials.slug, name: catalogMaterials.name }).from(catalogMaterials).orderBy(asc(catalogMaterials.name)),
    db.select({ slug: catalogFinishes.slug, name: catalogFinishes.name }).from(catalogFinishes).orderBy(asc(catalogFinishes.name)),
  ]);
  return { collections: collectionsRows, categories: categoriesRows, materials: materialsRows, finishes: finishesRows };
}

function safeMediaFilename(filename: string) {
  const normalized = filename.replace(/\\/g, "/").split("/").pop()?.replace(/[^a-zA-Z0-9._ -]/g, "_").slice(0, 180);
  if (!normalized || normalized === "." || normalized === "..") throw new Error("Invalid media filename.");
  return normalized;
}

function decodeMedia(base64: string, byteSize: number) {
  const normalized = base64.replace(/^data:[^;]+;base64,/, "");
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(normalized)) throw new Error("Invalid media encoding.");
  const bytes = Buffer.from(normalized, "base64");
  if (bytes.byteLength !== byteSize || !bytes.byteLength) throw new Error("Media size validation failed.");
  return bytes;
}

export function assertMediaNotAssigned(productReferenceCount: number, collectionReferenceCount: number) {
  if (productReferenceCount > 0 || collectionReferenceCount > 0) {
    throw new Error("This media asset is assigned and cannot be removed from the library.");
  }
}

export async function uploadAdminMedia(input: { filename: string; contentType: "image/jpeg" | "image/png" | "image/webp"; byteSize: number; base64: string; alt?: string }, userId: number) {
  const db = await requireDatabase();
  const filename = safeMediaFilename(input.filename);
  const bytes = decodeMedia(input.base64, input.byteSize);
  const stored = await storagePut(`media/${crypto.randomUUID()}/${filename}`, bytes, input.contentType);
  const result = await db.insert(mediaAssets).values({ storageKey: stored.key, url: stored.url, filename, contentType: input.contentType, byteSize: bytes.byteLength, alt: optionalInput(input.alt), createdByUserId: userId });
  return { id: Number(result[0].insertId), url: stored.url, storageKey: stored.key, filename, alt: input.alt || null };
}

export async function listAdminMedia(input: { page: number; pageSize: number; query?: string; status?: "active" | "archived" }) {
  const db = await requireDatabase();
  const conditions = [];
  if (input.status) conditions.push(eq(mediaAssets.status, input.status));
  if (input.query) {
    const wildcard = `%${input.query}%`;
    conditions.push(or(like(mediaAssets.filename, wildcard), like(mediaAssets.alt, wildcard))!);
  }
  const where = conditions.length ? and(...conditions) : undefined;
  const page = pageWindow(input.page, input.pageSize);
  const [items, totals] = await Promise.all([
    db.select().from(mediaAssets).where(where).orderBy(desc(mediaAssets.createdAt)).limit(page.limit).offset(page.offset),
    db.select({ total: count() }).from(mediaAssets).where(where),
  ]);
  return { items, total: Number(totals[0]?.total || 0), page: input.page, pageSize: input.pageSize };
}

export async function updateAdminMedia(input: { id: number; alt?: string; status?: "active" | "archived" }) {
  const db = await requireDatabase();
  if (input.status === "archived") {
    const asset = (await db.select().from(mediaAssets).where(eq(mediaAssets.id, input.id)).limit(1))[0];
    if (!asset) throw new Error("Media asset not found.");
    const inUse = await db.select({ total: count() }).from(catalogProductImages).where(or(eq(catalogProductImages.mediaAssetId, input.id), eq(catalogProductImages.url, asset.url))!);
    assertMediaNotAssigned(Number(inUse[0]?.total || 0), 0);
  }
  const result = await db.update(mediaAssets).set({ alt: input.alt === undefined ? undefined : optionalInput(input.alt), status: input.status }).where(eq(mediaAssets.id, input.id));
  if (!result[0].affectedRows) throw new Error("Media asset not found.");
  return { id: input.id };
}

export async function deleteAdminMedia(id: number) {
  const db = await requireDatabase();
  const asset = (await db.select().from(mediaAssets).where(eq(mediaAssets.id, id)).limit(1))[0];
  if (!asset) throw new Error("Media asset not found.");
  const [productUse, collectionUse] = await Promise.all([
    db.select({ total: count() }).from(catalogProductImages).where(or(eq(catalogProductImages.mediaAssetId, id), eq(catalogProductImages.url, asset.url))!),
    db.select({ total: count() }).from(collections).where(eq(collections.heroMediaId, id)),
  ]);
  assertMediaNotAssigned(Number(productUse[0]?.total || 0), Number(collectionUse[0]?.total || 0));
  await db.delete(mediaAssets).where(eq(mediaAssets.id, id));
  return { id, deleted: true };
}

export async function listAdminEnquiries(input: { page: number; pageSize: number; query?: string; status?: InquiryStatus; assignedToUserId?: number; country?: string; collection?: string; product?: string; sort?: "newest" | "oldest" | "updated" | "follow_up" | "value" }) {
  const db = await requireDatabase();
  const conditions = [];
  if (input.status) conditions.push(eq(inquiries.status, input.status));
  if (input.assignedToUserId) conditions.push(eq(inquiries.assignedToUserId, input.assignedToUserId));
  if (input.country) conditions.push(like(inquiries.shippingCountry, `%${input.country}%`));
  if (input.query) {
    const wildcard = `%${input.query}%`;
    conditions.push(or(like(inquiries.name, wildcard), like(inquiries.email, wildcard), like(inquiries.company, wildcard), like(inquiries.project, wildcard), like(inquiries.shippingCountry, wildcard))!);
  }
  if (input.collection) conditions.push(sql`${inquiries.id} IN (SELECT ${inquiryItems.inquiryId} FROM ${inquiryItems} WHERE ${inquiryItems.collectionName} LIKE ${`%${input.collection}%`})`);
  if (input.product) conditions.push(sql`${inquiries.id} IN (SELECT ${inquiryItems.inquiryId} FROM ${inquiryItems} WHERE ${inquiryItems.productReference} LIKE ${`%${input.product}%`})`);
  const where = conditions.length ? and(...conditions) : undefined;
  const page = pageWindow(input.page, input.pageSize);
  const orderBy = input.sort === "oldest" ? asc(inquiries.createdAt) : input.sort === "updated" ? desc(inquiries.updatedAt) : input.sort === "follow_up" ? asc(inquiries.nextFollowUpAt) : input.sort === "value" ? desc(inquiries.quotationValue) : desc(inquiries.createdAt);
  const select = { inquiry: inquiries, assigneeName: users.name, assigneeEmail: users.email };
  const [rows, totals] = await Promise.all([
    db.select(select).from(inquiries).leftJoin(users, eq(inquiries.assignedToUserId, users.id)).where(where).orderBy(orderBy).limit(page.limit).offset(page.offset),
    db.select({ total: count() }).from(inquiries).where(where),
  ]);
  return { items: rows, total: Number(totals[0]?.total || 0), page: input.page, pageSize: input.pageSize };
}

export async function getAdminEnquiry(id: number) {
  const db = await requireDatabase();
  const inquiry = (await db.select({ inquiry: inquiries, assigneeName: users.name, assigneeEmail: users.email }).from(inquiries).leftJoin(users, eq(inquiries.assignedToUserId, users.id)).where(eq(inquiries.id, id)).limit(1))[0];
  if (!inquiry) return null;
  const [items, attachments, notes, activities] = await Promise.all([
    db.select().from(inquiryItems).where(eq(inquiryItems.inquiryId, id)).orderBy(asc(inquiryItems.createdAt)),
    db.select().from(inquiryAttachments).where(eq(inquiryAttachments.inquiryId, id)).orderBy(asc(inquiryAttachments.createdAt)),
    db.select().from(inquiryNotes).where(eq(inquiryNotes.inquiryId, id)).orderBy(desc(inquiryNotes.createdAt)),
    db.select().from(inquiryActivities).where(eq(inquiryActivities.inquiryId, id)).orderBy(desc(inquiryActivities.createdAt)),
  ]);
  return { ...inquiry, items, attachments, notes, activities };
}

export async function updateAdminEnquiry(input: { id: number; status?: InquiryStatus; assignedToUserId?: number | null; nextFollowUpAt?: Date | null; quotationValue?: number | null; quotationCurrency?: string | null }, actor: { id: number; name: string | null }) {
  const db = await requireDatabase();
  const current = (await db.select({ status: inquiries.status, assignedToUserId: inquiries.assignedToUserId, nextFollowUpAt: inquiries.nextFollowUpAt, quotationValue: inquiries.quotationValue, quotationCurrency: inquiries.quotationCurrency }).from(inquiries).where(eq(inquiries.id, input.id)).limit(1))[0];
  if (!current) throw new Error("Enquiry not found.");
  if (input.assignedToUserId !== undefined && input.assignedToUserId !== null) {
    const assignee = (await db.select({ id: users.id, role: users.role }).from(users).where(eq(users.id, input.assignedToUserId)).limit(1))[0];
    if (!assignee || assignee.role !== "admin") throw new Error("Assigned salesperson must be an active admin user.");
  }
  if (input.status && !isValidInquiryStatusTransition(current.status, input.status)) throw new Error(`Invalid enquiry status transition from ${current.status} to ${input.status}.`);
  const changes: { status?: InquiryStatus; assignedToUserId?: number | null; nextFollowUpAt?: Date | null; quotationValue?: string | null; quotationCurrency?: string | null } = {};
  if (input.status !== undefined) changes.status = input.status;
  if (input.assignedToUserId !== undefined) changes.assignedToUserId = input.assignedToUserId;
  if (input.nextFollowUpAt !== undefined) changes.nextFollowUpAt = input.nextFollowUpAt;
  if (input.quotationValue !== undefined) changes.quotationValue = input.quotationValue === null ? null : String(input.quotationValue);
  if (input.quotationCurrency !== undefined) changes.quotationCurrency = input.quotationCurrency === null ? null : input.quotationCurrency.toUpperCase();
  await db.transaction(async (tx) => {
    if (Object.keys(changes).length) await tx.update(inquiries).set(changes).where(eq(inquiries.id, input.id));
    if (input.status && input.status !== current.status) await tx.insert(inquiryActivities).values({ inquiryId: input.id, actorUserId: actor.id, actorName: actor.name || null, activityType: "status_changed", description: `Status changed from ${current.status} to ${input.status}.`, fromStatus: current.status, toStatus: input.status });
    if (input.assignedToUserId !== undefined && input.assignedToUserId !== current.assignedToUserId) await tx.insert(inquiryActivities).values({ inquiryId: input.id, actorUserId: actor.id, actorName: actor.name || null, activityType: "assigned", description: input.assignedToUserId ? `Assigned to salesperson ${input.assignedToUserId}.` : "Assignment cleared." });
    if (input.nextFollowUpAt !== undefined) await tx.insert(inquiryActivities).values({ inquiryId: input.id, actorUserId: actor.id, actorName: actor.name || null, activityType: "follow_up_scheduled", description: input.nextFollowUpAt ? `Follow-up scheduled for ${input.nextFollowUpAt.toISOString()}.` : "Follow-up date cleared." });
    if (input.quotationValue !== undefined || input.quotationCurrency !== undefined) await tx.insert(inquiryActivities).values({ inquiryId: input.id, actorUserId: actor.id, actorName: actor.name || null, activityType: "quotation_updated", description: input.quotationValue === null ? "Quotation value cleared." : "Quotation details updated." });
  });
  return { id: input.id };
}

export async function addAdminEnquiryNote(id: number, note: string, user: { id: number; name: string | null }) {
  const db = await requireDatabase();
  const exists = (await db.select({ id: inquiries.id }).from(inquiries).where(eq(inquiries.id, id)).limit(1))[0];
  if (!exists) throw new Error("Enquiry not found.");
  let noteId = 0;
  await db.transaction(async (tx) => {
    const result = await tx.insert(inquiryNotes).values({ inquiryId: id, authorUserId: user.id, authorName: user.name || null, note });
    noteId = Number(result[0].insertId);
    await tx.insert(inquiryActivities).values({ inquiryId: id, actorUserId: user.id, actorName: user.name || null, activityType: "note_added", description: "Internal note added." });
  });
  return { id: noteId };
}

export async function listAdminSalespeople() {
  const db = await requireDatabase();
  return db.select({ id: users.id, name: users.name, email: users.email }).from(users).where(eq(users.role, "admin")).orderBy(asc(users.name));
}

export async function getAdminSiteContent() {
  const db = await requireDatabase();
  return db.select().from(siteContent).orderBy(asc(siteContent.contentKey));
}

export async function updateAdminSiteContent(contentKey: "homepage_hero_copy", body: string, userId: number) {
  const db = await requireDatabase();
  await db.insert(siteContent).values({ contentKey, body, updatedByUserId: userId }).onDuplicateKeyUpdate({ set: { body, updatedByUserId: userId } });
  return { contentKey };
}

export async function getPublicSiteContent() {
  const db = await getDb();
  if (!db) return {} as Record<string, string>;
  const rows = await db.select({ key: siteContent.contentKey, body: siteContent.body }).from(siteContent).where(eq(siteContent.contentKey, "homepage_hero_copy"));
  return Object.fromEntries(rows.map((row) => [row.key, row.body]));
}
