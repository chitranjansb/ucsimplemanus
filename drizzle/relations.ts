import { relations } from "drizzle-orm";
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
} from "./schema";

export const collectionRelations = relations(collections, ({ many }) => ({ products: many(catalogProducts) }));
export const categoryRelations = relations(catalogCategories, ({ many }) => ({ productLinks: many(catalogProductCategories) }));
export const materialRelations = relations(catalogMaterials, ({ many }) => ({ productLinks: many(catalogProductMaterials), variants: many(catalogProductVariants) }));
export const finishRelations = relations(catalogFinishes, ({ many }) => ({ productLinks: many(catalogProductFinishes), variants: many(catalogProductVariants) }));

export const productRelations = relations(catalogProducts, ({ one, many }) => ({
  collection: one(collections, { fields: [catalogProducts.collectionId], references: [collections.id] }),
  primaryCategory: one(catalogCategories, { fields: [catalogProducts.primaryCategoryId], references: [catalogCategories.id], relationName: "primaryCategory" }),
  categoryLinks: many(catalogProductCategories),
  materialLinks: many(catalogProductMaterials),
  finishLinks: many(catalogProductFinishes),
  media: many(catalogProductImages),
  variants: many(catalogProductVariants),
  specifications: many(catalogProductSpecifications),
}));

export const productCategoryRelations = relations(catalogProductCategories, ({ one }) => ({
  product: one(catalogProducts, { fields: [catalogProductCategories.productId], references: [catalogProducts.id] }),
  category: one(catalogCategories, { fields: [catalogProductCategories.categoryId], references: [catalogCategories.id] }),
}));

export const productMaterialRelations = relations(catalogProductMaterials, ({ one }) => ({
  product: one(catalogProducts, { fields: [catalogProductMaterials.productId], references: [catalogProducts.id] }),
  material: one(catalogMaterials, { fields: [catalogProductMaterials.materialId], references: [catalogMaterials.id] }),
}));

export const productFinishRelations = relations(catalogProductFinishes, ({ one }) => ({
  product: one(catalogProducts, { fields: [catalogProductFinishes.productId], references: [catalogProducts.id] }),
  finish: one(catalogFinishes, { fields: [catalogProductFinishes.finishId], references: [catalogFinishes.id] }),
}));

export const productVariantRelations = relations(catalogProductVariants, ({ one, many }) => ({
  product: one(catalogProducts, { fields: [catalogProductVariants.productId], references: [catalogProducts.id] }),
  material: one(catalogMaterials, { fields: [catalogProductVariants.materialId], references: [catalogMaterials.id] }),
  finish: one(catalogFinishes, { fields: [catalogProductVariants.finishId], references: [catalogFinishes.id] }),
  specifications: many(catalogProductSpecifications),
}));

export const productImageRelations = relations(catalogProductImages, ({ one }) => ({ product: one(catalogProducts, { fields: [catalogProductImages.productId], references: [catalogProducts.id] }) }));
export const productSpecificationRelations = relations(catalogProductSpecifications, ({ one }) => ({
  product: one(catalogProducts, { fields: [catalogProductSpecifications.productId], references: [catalogProducts.id] }),
  variant: one(catalogProductVariants, { fields: [catalogProductSpecifications.variantId], references: [catalogProductVariants.id] }),
}));
