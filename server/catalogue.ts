import { and, asc, desc, eq, inArray, like, or } from "drizzle-orm";
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
} from "../drizzle/schema";
import type { CatalogueListInput, ProductCreateInput } from "../shared/catalogue";
import { getDb } from "./db";

type Focal = { desktop?: { x: number; y: number }; mobile?: { x: number; y: number }; fit: "contain" | "cover"; mobileFit?: "contain" | "cover" };
type CatalogueMedia = { id: number; url: string; alt: string; role: "hero" | "gallery" | "detail"; sortOrder: number; focal: Focal };

export type StructuredCatalogueProduct = {
  id: string;
  databaseId: number;
  sku: string | null;
  productCode: string | null;
  name: string;
  slug: string;
  description: string;
  shortDescription: string | null;
  category: string;
  categories: Array<{ slug: string; name: string; primary: boolean }>;
  collection: string;
  collectionSlug: string | null;
  materials: string[];
  finishes: string[];
  material: string;
  finish: string | null;
  dimensions: string;
  weightKg: number | null;
  moq: number | null;
  packagingInfo: string | null;
  cbm: number | null;
  customizable: boolean;
  status: "draft" | "published" | "archived";
  availability: "available" | "on_request" | "discontinued";
  featured: boolean;
  isNew: boolean;
  seoTitle: string | null;
  seoDescription: string | null;
  image: string;
  imageAlt: string;
  imageFocal?: Focal;
  media: CatalogueMedia[];
  specifications: Array<{ key: string; label: string; value: string; unit: string | null; sortOrder: number; variantCode: string | null }>;
  variants: Array<{ variantCode: string; sku: string | null; name: string | null; material: string | null; finish: string | null; dimensions: string | null; weightKg: number | null; moq: number | null; packagingInfo: string | null; cbm: number | null; availability: "available" | "on_request" | "discontinued" }>;
};

function numeric(value: unknown) {
  return value === null || value === undefined ? null : Number(value);
}

function focalFromImage(image: typeof catalogProductImages.$inferSelect): Focal {
  return {
    desktop: image.focalDesktopX === null || image.focalDesktopY === null ? undefined : { x: image.focalDesktopX, y: image.focalDesktopY },
    mobile: image.focalMobileX === null || image.focalMobileY === null ? undefined : { x: image.focalMobileX, y: image.focalMobileY },
    fit: image.fit,
    mobileFit: image.mobileFit ?? undefined,
  };
}

async function hydrateProducts(productRows: Array<{ product: typeof catalogProducts.$inferSelect; collectionName: string | null; collectionSlug: string | null; categoryName: string | null }>): Promise<StructuredCatalogueProduct[]> {
  if (!productRows.length) return [];
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const ids = productRows.map((row) => row.product.id);
  const [images, categoryRows, materialRows, finishRows, variantRows, specificationRows] = await Promise.all([
    db.select().from(catalogProductImages).where(inArray(catalogProductImages.productId, ids)).orderBy(asc(catalogProductImages.sortOrder)),
    db.select({ productId: catalogProductCategories.productId, slug: catalogCategories.slug, name: catalogCategories.name, isPrimary: catalogProductCategories.isPrimary }).from(catalogProductCategories).innerJoin(catalogCategories, eq(catalogProductCategories.categoryId, catalogCategories.id)).where(inArray(catalogProductCategories.productId, ids)),
    db.select({ productId: catalogProductMaterials.productId, slug: catalogMaterials.slug, name: catalogMaterials.name, sortOrder: catalogProductMaterials.sortOrder }).from(catalogProductMaterials).innerJoin(catalogMaterials, eq(catalogProductMaterials.materialId, catalogMaterials.id)).where(inArray(catalogProductMaterials.productId, ids)).orderBy(asc(catalogProductMaterials.sortOrder)),
    db.select({ productId: catalogProductFinishes.productId, slug: catalogFinishes.slug, name: catalogFinishes.name, sortOrder: catalogProductFinishes.sortOrder }).from(catalogProductFinishes).innerJoin(catalogFinishes, eq(catalogProductFinishes.finishId, catalogFinishes.id)).where(inArray(catalogProductFinishes.productId, ids)).orderBy(asc(catalogProductFinishes.sortOrder)),
    db.select({ variant: catalogProductVariants, materialName: catalogMaterials.name, finishName: catalogFinishes.name }).from(catalogProductVariants).leftJoin(catalogMaterials, eq(catalogProductVariants.materialId, catalogMaterials.id)).leftJoin(catalogFinishes, eq(catalogProductVariants.finishId, catalogFinishes.id)).where(inArray(catalogProductVariants.productId, ids)),
    db.select({ specification: catalogProductSpecifications, variantCode: catalogProductVariants.variantCode }).from(catalogProductSpecifications).leftJoin(catalogProductVariants, eq(catalogProductSpecifications.variantId, catalogProductVariants.id)).where(inArray(catalogProductSpecifications.productId, ids)).orderBy(asc(catalogProductSpecifications.sortOrder)),
  ]);

  return productRows.map((row) => {
    const productImages = images.filter((image) => image.productId === row.product.id).map((image) => ({ id: image.id, url: image.url, alt: image.alt || `${row.product.title} product image`, role: image.role, sortOrder: image.sortOrder, focal: focalFromImage(image) }));
    const hero = productImages.find((image) => image.role === "hero") ?? productImages[0];
    const categories = categoryRows.filter((category) => category.productId === row.product.id).map((category) => ({ slug: category.slug, name: category.name, primary: category.isPrimary }));
    const materials = materialRows.filter((material) => material.productId === row.product.id).map((material) => material.name);
    const finishes = finishRows.filter((finish) => finish.productId === row.product.id).map((finish) => finish.name);
    return {
      id: row.product.slug,
      databaseId: row.product.id,
      sku: row.product.sku,
      productCode: row.product.productCode,
      name: row.product.title,
      slug: row.product.slug,
      description: row.product.description || "Specifications available on request.",
      shortDescription: row.product.shortDescription,
      category: row.categoryName || row.product.primaryCategory || "Catalogue reference",
      categories,
      collection: row.collectionName || "Collection available on request",
      collectionSlug: row.collectionSlug,
      materials,
      finishes,
      material: materials.join(" · ") || "Specifications available on request",
      finish: finishes.join(" · ") || null,
      dimensions: row.product.dimensions || "Specifications available on request",
      weightKg: numeric(row.product.weightKg),
      moq: row.product.moq,
      packagingInfo: row.product.packagingInfo,
      cbm: numeric(row.product.cbm),
      customizable: row.product.customizable,
      status: row.product.status,
      availability: row.product.availability,
      featured: row.product.featured,
      isNew: row.product.isNew,
      seoTitle: row.product.seoTitle,
      seoDescription: row.product.seoDescription,
      image: hero?.url || "",
      imageAlt: hero?.alt || `${row.product.title} catalogue reference`,
      imageFocal: hero?.focal,
      media: productImages,
      specifications: specificationRows.filter((entry) => entry.specification.productId === row.product.id).map((entry) => ({ key: entry.specification.specificationKey, label: entry.specification.label, value: entry.specification.value, unit: entry.specification.unit, sortOrder: entry.specification.sortOrder, variantCode: entry.variantCode || null })),
      variants: variantRows.filter((entry) => entry.variant.productId === row.product.id).map((entry) => ({ variantCode: entry.variant.variantCode, sku: entry.variant.sku, name: entry.variant.name, material: entry.materialName || null, finish: entry.finishName || null, dimensions: entry.variant.dimensions, weightKg: numeric(entry.variant.weightKg), moq: entry.variant.moq, packagingInfo: entry.variant.packagingInfo, cbm: numeric(entry.variant.cbm), availability: entry.variant.availability })),
    };
  });
}

export async function getCatalogueFacets() {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const [collectionRows, categoryRows, materialRows, finishRows] = await Promise.all([
    db.select({ slug: collections.slug, name: collections.name }).from(collections).where(eq(collections.status, "active")).orderBy(asc(collections.sortOrder), asc(collections.name)),
    db.select({ slug: catalogCategories.slug, name: catalogCategories.name }).from(catalogCategories).where(eq(catalogCategories.status, "active")).orderBy(asc(catalogCategories.sortOrder), asc(catalogCategories.name)),
    db.select({ slug: catalogMaterials.slug, name: catalogMaterials.name }).from(catalogProductMaterials).innerJoin(catalogMaterials, eq(catalogProductMaterials.materialId, catalogMaterials.id)).innerJoin(catalogProducts, eq(catalogProductMaterials.productId, catalogProducts.id)).where(eq(catalogProducts.status, "published")).orderBy(asc(catalogMaterials.name)),
    db.select({ slug: catalogFinishes.slug, name: catalogFinishes.name }).from(catalogProductFinishes).innerJoin(catalogFinishes, eq(catalogProductFinishes.finishId, catalogFinishes.id)).innerJoin(catalogProducts, eq(catalogProductFinishes.productId, catalogProducts.id)).where(eq(catalogProducts.status, "published")).orderBy(asc(catalogFinishes.name)),
  ]);
  const unique = (rows: Array<{ slug: string; name: string }>) => Array.from(new Map(rows.map((row) => [row.slug, row])).values());
  return { collections: collectionRows, categories: categoryRows, materials: unique(materialRows), finishes: unique(finishRows), availability: ["available", "on_request", "discontinued"] as const };
}

export async function listCatalogueProducts(input: CatalogueListInput = {}) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const query = input.query?.trim();
  const conditions = [eq(catalogProducts.status, "published")];
  if (input.category) {
    const matches = await db.select({ productId: catalogProductCategories.productId }).from(catalogProductCategories).innerJoin(catalogCategories, eq(catalogProductCategories.categoryId, catalogCategories.id)).where(eq(catalogCategories.slug, input.category));
    if (!matches.length) return [];
    conditions.push(inArray(catalogProducts.id, matches.map((match) => match.productId)));
  }
  if (input.collection) conditions.push(eq(collections.slug, input.collection));
  if (input.material) {
    const matches = await db.select({ productId: catalogProductMaterials.productId }).from(catalogProductMaterials).innerJoin(catalogMaterials, eq(catalogProductMaterials.materialId, catalogMaterials.id)).where(eq(catalogMaterials.slug, input.material));
    if (!matches.length) return [];
    conditions.push(inArray(catalogProducts.id, matches.map((match) => match.productId)));
  }
  if (input.finish) {
    const matches = await db.select({ productId: catalogProductFinishes.productId }).from(catalogProductFinishes).innerJoin(catalogFinishes, eq(catalogProductFinishes.finishId, catalogFinishes.id)).where(eq(catalogFinishes.slug, input.finish));
    if (!matches.length) return [];
    conditions.push(inArray(catalogProducts.id, matches.map((match) => match.productId)));
  }
  if (input.featured !== undefined) conditions.push(eq(catalogProducts.featured, input.featured));
  if (input.isNew !== undefined) conditions.push(eq(catalogProducts.isNew, input.isNew));
  if (input.customizable !== undefined) conditions.push(eq(catalogProducts.customizable, input.customizable));
  if (input.availability) conditions.push(eq(catalogProducts.availability, input.availability));
  if (query) {
    const wildcard = `%${query}%`;
    conditions.push(or(like(catalogProducts.title, wildcard), like(catalogProducts.slug, wildcard), like(catalogProducts.sku, wildcard), like(catalogProducts.productCode, wildcard), like(catalogProducts.description, wildcard), like(catalogProducts.materials, wildcard), like(catalogProducts.finishes, wildcard), like(collections.name, wildcard), like(catalogCategories.name, wildcard))!);
  }
  const orderBy = input.sort === "name_asc" ? [asc(catalogProducts.title)] : input.sort === "name_desc" ? [desc(catalogProducts.title)] : input.sort === "newest" ? [desc(catalogProducts.isNew), desc(catalogProducts.createdAt), asc(catalogProducts.title)] : [desc(catalogProducts.featured), desc(catalogProducts.isNew), asc(catalogProducts.title)];
  const pageSize = input.limit ?? input.pageSize ?? 24;
  const offset = ((input.page ?? 1) - 1) * pageSize;
  const rows = await db.select({ product: catalogProducts, collectionName: collections.name, collectionSlug: collections.slug, categoryName: catalogCategories.name }).from(catalogProducts)
    .leftJoin(collections, eq(catalogProducts.collectionId, collections.id))
    .leftJoin(catalogCategories, eq(catalogProducts.primaryCategoryId, catalogCategories.id))
    .where(and(...conditions)).orderBy(...orderBy).limit(pageSize).offset(offset);

  return hydrateProducts(rows);
}

export async function getCatalogueProductBySlug(slug: string) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const rows = await db.select({ product: catalogProducts, collectionName: collections.name, collectionSlug: collections.slug, categoryName: catalogCategories.name }).from(catalogProducts)
    .leftJoin(collections, eq(catalogProducts.collectionId, collections.id))
    .leftJoin(catalogCategories, eq(catalogProducts.primaryCategoryId, catalogCategories.id))
    .where(and(eq(catalogProducts.slug, slug), eq(catalogProducts.status, "published"))).limit(1);
  return (await hydrateProducts(rows))[0] ?? null;
}

async function requireTaxonomyRows<T extends { slug: string }>(rows: T[], requested: string[], field: string) {
  if (rows.length !== requested.length) throw new Error(`Unknown ${field} reference.`);
  return rows;
}

export async function createCatalogueProduct(input: ProductCreateInput) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const collection = input.collectionSlug ? (await db.select().from(collections).where(and(eq(collections.slug, input.collectionSlug), eq(collections.status, "active"))).limit(1))[0] : undefined;
  if (input.collectionSlug && !collection) throw new Error("Unknown or archived collection reference.");
  const categories = await requireTaxonomyRows(await db.select().from(catalogCategories).where(and(inArray(catalogCategories.slug, input.categorySlugs), eq(catalogCategories.status, "active"))), input.categorySlugs, "category");
  const materials = input.materialSlugs.length ? await requireTaxonomyRows(await db.select().from(catalogMaterials).where(inArray(catalogMaterials.slug, input.materialSlugs)), input.materialSlugs, "material") : [];
  const finishes = input.finishSlugs.length ? await requireTaxonomyRows(await db.select().from(catalogFinishes).where(inArray(catalogFinishes.slug, input.finishSlugs)), input.finishSlugs, "finish") : [];
  const primaryCategory = categories.find((category) => category.slug === (input.primaryCategorySlug || input.categorySlugs[0]));
  if (!primaryCategory) throw new Error("Unknown primary category reference.");

  return db.transaction(async (tx) => {
    const result = await tx.insert(catalogProducts).values({
      sku: input.sku || null,
      productCode: input.productCode || null,
      slug: input.slug,
      title: input.name,
      shortDescription: input.shortDescription || null,
      collectionId: collection?.id ?? null,
      primaryCategoryId: primaryCategory.id,
      primaryCategory: primaryCategory.name,
      description: input.description || null,
      materials: materials.map((material) => material.name),
      finishes: finishes.map((finish) => finish.name),
      dimensions: input.dimensions || null,
      weightKg: input.weightKg === undefined ? null : String(input.weightKg),
      moq: input.moq ?? null,
      packagingInfo: input.packagingInfo || null,
      cbm: input.cbm === undefined ? null : String(input.cbm),
      customizable: input.customizable,
      status: input.status,
      availability: input.availability,
      featured: input.featured,
      isNew: input.isNew,
      seoTitle: input.seoTitle || null,
      seoDescription: input.seoDescription || null,
      publishedAt: input.status === "published" ? new Date() : null,
    });
    const productId = Number(result[0].insertId);
    if (!Number.isInteger(productId) || productId < 1) throw new Error("Unable to create product.");
    await tx.insert(catalogProductCategories).values(categories.map((category) => ({ productId, categoryId: category.id, isPrimary: category.id === primaryCategory.id })));
    if (materials.length) await tx.insert(catalogProductMaterials).values(materials.map((material, index) => ({ productId, materialId: material.id, sortOrder: index })));
    if (finishes.length) await tx.insert(catalogProductFinishes).values(finishes.map((finish, index) => ({ productId, finishId: finish.id, sortOrder: index })));
    if (input.media.length) await tx.insert(catalogProductImages).values(input.media.map((media) => ({ productId, url: media.url, alt: media.alt || null, role: media.role, sortOrder: media.sortOrder, focalDesktopX: media.focalDesktopX ?? null, focalDesktopY: media.focalDesktopY ?? null, focalMobileX: media.focalMobileX ?? null, focalMobileY: media.focalMobileY ?? null, fit: media.fit, mobileFit: media.mobileFit ?? null })));
    if (input.specifications.length) await tx.insert(catalogProductSpecifications).values(input.specifications.map((specification) => ({ productId, variantId: null, specificationKey: specification.key, label: specification.label, value: specification.value, unit: specification.unit || null, sortOrder: specification.sortOrder })));
    for (const variant of input.variants) {
      const [variantMaterial] = variant.materialSlug ? await tx.select().from(catalogMaterials).where(eq(catalogMaterials.slug, variant.materialSlug)).limit(1) : [];
      const [variantFinish] = variant.finishSlug ? await tx.select().from(catalogFinishes).where(eq(catalogFinishes.slug, variant.finishSlug)).limit(1) : [];
      if (variant.materialSlug && !variantMaterial) throw new Error("Unknown variant material reference.");
      if (variant.finishSlug && !variantFinish) throw new Error("Unknown variant finish reference.");
      const variantResult = await tx.insert(catalogProductVariants).values({ productId, variantCode: variant.variantCode, sku: variant.sku || null, name: variant.name || null, materialId: variantMaterial?.id ?? null, finishId: variantFinish?.id ?? null, dimensions: variant.dimensions || null, weightKg: variant.weightKg === undefined ? null : String(variant.weightKg), moq: variant.moq ?? null, packagingInfo: variant.packagingInfo || null, cbm: variant.cbm === undefined ? null : String(variant.cbm), availability: variant.availability });
      const variantId = Number(variantResult[0].insertId);
      if (variant.specifications.length) await tx.insert(catalogProductSpecifications).values(variant.specifications.map((specification) => ({ productId, variantId, specificationKey: specification.key, label: specification.label, value: specification.value, unit: specification.unit || null, sortOrder: specification.sortOrder })));
    }
    return { id: productId, slug: input.slug };
  });
}
