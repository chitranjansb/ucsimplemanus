# Production-Readiness Upgrade Report

## What changed and why

The public website remains an editorial B2B furniture catalogue, but its operating model is now substantially more suitable for real trade enquiries. A normalized, nullable catalogue schema supports later product, collection, image, document, material, finish, SEO, focal-point, and customisation data imports without seeding invented commercial facts. The public product references remain static until Umaid Craftorium provides approved catalogue data.

The former one-step enquiry basket is now a structured project workflow. It persists a versioned project draft, supports per-reference quantities, collects buyer and project context, permits carefully bounded reference attachments, presents a review stage, and records structured line items and attachment metadata. The public server contract validates every field and attachment before persistence.

## Primary files changed

| Area | Key files |
| --- | --- |
| Catalogue and enquiry database model | `drizzle/schema.ts`, `drizzle/0002_brainy_garia.sql`, `server/db.ts` |
| Public RFQ security and persistence | `server/routers.ts`, `server/_core/index.ts`, `server/storage.ts` |
| B2B project flow | `client/src/contexts/EnquiryContext.tsx`, `client/src/components/SiteLayout.tsx`, `client/src/lib/enquirySelection.ts`, `client/src/lib/rfqAttachments.ts` |
| SEO and internationalization foundation | `client/src/lib/seo.ts`, `client/src/lib/i18n.ts`, `client/src/pages/ProductDetail.tsx`, `client/public/robots.txt`, `client/public/sitemap.xml` |
| Performance and dependency remediation | `vite.config.ts`, `package.json`, `pnpm-lock.yaml`; unreachable AI/chat/chart modules removed |
| Tests and documentation | `server/inquiries.test.ts`, `server/client-behaviors.test.ts`, `server/seo.test.ts`, `server/accessibility-contract.test.ts`, `PRODUCTION_READINESS_AUDIT.md`, `UPGRADE_DESIGN.md`, `PRODUCTION_CHECKLIST.md`, `qa-notes.md` |

## Verification completed

The final local checks passed: TypeScript compilation, 20 Vitest assertions across seven test files, and a production build. The production dependency audit reports no known vulnerabilities. The generated schema migration was reviewed, applied, and verified against the database. Desktop and mobile visual checks were completed on the homepage, catalogue, product detail, manufacturing/custom-furniture pages, and contact page.

## Remaining risks and data required

The public rate limit is process-local, so it should be replaced with a shared rate-limit service before high-volume or multi-instance use. Attached reference files need an agreed trade-desk retention and access policy. Browser automation could not run because the configured connected Firefox executable was unavailable; the unit, type, semantic, and visual suites provide current coverage, but a live browser suite should be enabled before launch.

Umaid Craftorium still needs to supply approved product IDs/SKUs, slugs, collections, categories, materials, finishes, dimensions where publishable, documents, image sets, status, customisation flags, English and Italian text, and product-level SEO metadata. No pricing, stock, production timing, certification, rating, testimonial, technical-construction, or export-statistic content was invented.

## Recommended next phase

Build a small protected owner management surface or an approved CSV/Excel importer on top of the new schema, then populate it only with validated catalogue data. After the first real enquiry is processed end-to-end, connect the CRM and analytics provider, use a distributed rate limiter, and enable a browser-test runtime for recurring public-flow tests.

