# Structured Catalogue Domain Design

## Compatibility approach

The existing public catalogue uses five reference products with stable identifiers that already appear in public URLs and RFQ drafts. Those identifiers remain the public **slug** values in the normalized model. The application therefore preserves `/collections/:id` routes while allowing the route parameter to resolve a structured product by slug.

The existing `catalog_products.title`, `collectionId`, image, and document tables are preserved. New columns and relationship tables extend rather than replace them. New commercial fields stay nullable until the business provides approved source data; client presentation continues to show **“Specifications available on request”** when a field is not approved.

## Product domain

| Entity | Purpose | Key relationship |
| --- | --- | --- |
| `catalog_products` | Core product identity, descriptions, trade logistics, availability, flags, and SEO | Belongs to a collection; related to categories, materials, finishes, variants, media, and specifications |
| `catalog_categories` | Reusable category taxonomy | Many-to-many with products |
| `catalog_collections` | Existing named collection taxonomy | One-to-many with products |
| `catalog_materials` / `catalog_finishes` | Approved reusable material and finish vocabulary | Many-to-many with products; optional on variants |
| `catalog_product_variants` | Variant-level code, dimensions, logistics, availability, and optional material/finish | Belongs to a product |
| `catalog_product_images` | Existing focal-aware product media records | Belongs to a product |
| `catalog_product_specifications` | Label/value/unit technical or commercial values approved for publication | Belongs to a product or a variant |

## Reference migration

The migration copies the current public reference catalogue into the normalized tables only. It keeps existing product slugs, descriptions, image URLs, collections, categories, and the factual “Wood finish available on request” boundary. It does not create pricing, stock, lead-time, certification, technical, finish, weight, MOQ, packaging, CBM, or variant claims where none currently exists.

The migration uses idempotent `INSERT … ON DUPLICATE KEY UPDATE` statements so rerunning it does not duplicate the reference catalogue. Database uniqueness is enforced for product slugs, non-null SKUs/product codes, taxonomy slugs, and per-product variant codes. Query indexes cover published status, featured/new flags, category, collection, product relationships, and common filter joins.

## Public API and UI contract

The public `catalogue` tRPC router exposes list, search/filter, and product-by-slug procedures. It returns normalized relationship data and only published products. The existing client helper remains a factual fallback for preview resilience, but catalogue and detail pages prefer the structured API response when the database is reachable. An admin-only create procedure validates a Zod product payload and protects content management paths.
