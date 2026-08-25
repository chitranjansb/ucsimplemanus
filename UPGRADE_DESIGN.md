# Production-Readiness Upgrade Design

## Scope selected from the audit

The initial implementation focuses on the highest-value gaps that can be completed without invented commercial data: a future-importable catalogue domain model, a structured B2B project-enquiry model, secure attachment intake boundaries, resilient enquiry draft state, public-endpoint abuse controls, and removal of unused vulnerable presentation dependencies. Existing public collection references remain visible until approved product data is supplied.

## Catalogue domain model

The database will introduce nullable, import-ready tables for collections, products, product images, and product documents. The product model will hold an optional SKU, stable slug, title, category, description, materials, finishes, dimensions, status, customisation flag, SEO title/description, and JSON metadata. Product-image records will hold ordering, alt text, storage key/URL, and focal metadata. Product-document records will hold a display label, type, storage key/URL, and sort order.

No production product facts will be seeded. The existing static reference catalogue remains a temporary presentation data source, while the schema provides a safe destination for future CSV, Excel, JSON, CMS, or owner-managed imports.

## Project enquiry model

The current freeform inquiry will gain structured buyer and project fields. New enquiry-line and attachment tables will retain selected product references, per-item quantity, attachment metadata, and a future CRM-compatible snapshot even when a linked product does not yet exist in the database.

The browser will persist a versioned draft with item quantities and non-sensitive project context. The RFQ panel will use a short sequence: selection, project details, review, then submission. It will collect buyer type, company, country/destination, target market, project type, quantity, timeline, customisation requirements, and freeform brief. The UI will remain explicit that product availability, specifications, and commercial terms are available on request.

## Attachment safety boundary

The public workflow will accept a tightly bounded set of reference files: PDF, common image formats, spreadsheets, and plain-text design references. Client-side checks improve feedback but are never the enforcement point. The server will validate a declared filename, MIME type, byte size, file count, and base64 payload size before storing any attachment via the existing S3 helper. It will use randomized storage keys and persist only attachment metadata plus the storage key in the database. The initial request body limit will be reduced from 50 MB to a bounded value aligned with the accepted file count and maximum size.

## Public endpoint safeguards

The public enquiry mutation will retain Zod validation and add a lightweight in-memory IP rate limit, a honeypot field, a minimum human completion time, and request-size limits. This is appropriate for the current autoscaled application but is not a distributed rate-limit substitute; a managed edge or durable rate-limit store should be considered before sustained public traffic.

## Performance, SEO, accessibility, and analytics

Unused AI showcase code and its `streamdown` dependency will be removed because it is not in the public route map and drives the reported vulnerable dependency chain. The existing lazy route split remains, and build output will be rechecked. SEO and internationalization will be made data-model ready rather than duplicating unapproved pages: future product and collection records reserve slug, SEO, metadata, and translation-compatible fields. The current sitemap remains limited to real public routes until stable published product slugs exist.

Analytics will use a stable event vocabulary for project selection, quantity changes, RFQ start, RFQ review, submission, and attachment selection. It will only emit product IDs/counts and interaction state, never attachment contents, email addresses, phone numbers, messages, or other buyer PII.
