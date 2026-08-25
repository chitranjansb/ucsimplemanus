# Umaid Craftorium Production-Readiness Audit

## Baseline

The current project is a React 19, Vite, Express, tRPC, Drizzle, and MySQL/TiDB application. It presents a strong public editorial catalogue with a client-side enquiry basket and a public tRPC enquiry submission path. The baseline quality gates passed: TypeScript compilation, 16 Vitest assertions across six files, and the production build all completed successfully.

| Area | Current state | Audit finding |
| --- | --- | --- |
| Public catalogue | Static TypeScript records with focal-aware images and product detail routes. | The catalogue is suitable as a reference presentation but has no database-backed product, collection, image, material, metadata, or document model. |
| Product data | Five fact-safe reference products in `client/src/lib/catalog.ts`. | Future product IDs/SKUs, slugs, categories, materials, finishes, documents, status, translations, and SEO fields need a normalized, nullable schema. |
| RFQ | Persisted browser-side selection, buyer/project fields, and a public tRPC create operation. | The selection has no per-item quantity, structured draft, destination/market separation, attachments, upload validation, review stage, or anti-spam/rate-limit layer. |
| Database | `users` and a minimal `inquiries` table. | The enquiry record stores one formatted message and cannot query selected products, attachments, or structured buyer requirements. |
| SEO | Static organization JSON-LD, canonical, robots, sitemap, route title/description updates, and descriptive image alt text. | Route metadata is client-rendered, the sitemap has no product URLs, and product/collection structured data and breadcrumb architecture are absent. |
| Accessibility | Native RFQ controls, labels, focus styling, reduced-motion CSS, and basic accessibility contract tests. | Dialog focus management, error announcement, and scripted keyboard/browser coverage are incomplete. |
| Analytics | Event-detail helper and interaction dispatches. | The event vocabulary does not yet provide a stable project/RFQ funnel schema or an adapter for a production analytics provider. |
| Storage | Server-side presigned upload helpers and a public signed-read proxy. | No RFQ attachment workflow exists. A future public upload surface must validate size, MIME type, filename, ownership, and persisted attachment metadata before using storage. |
| Performance | Lazy page modules and a successful production build. | The main initial chunk remains 622 KB minified / 188 KB gzip and Vite reports a chunk-size warning. |
| Security | Zod validates the minimal enquiry fields; secrets are environment-backed and ignored by Git. | The public enquiry endpoint has no rate limit, no honeypot/abuse guard, and Express accepts 50 MB request bodies globally. |
| Dependencies | The public experience does not render the unused AI showcase surface. | `streamdown` is a direct dependency used only by unused AI showcase code; the production dependency audit reported 81 vulnerabilities, including one critical and 21 high findings, with findings traced through its `mermaid` dependency chain. |

## Architecture overview

The client uses a small route map with lazy-loaded pages, one shared public shell, a localStorage-backed `EnquiryContext`, and tRPC hooks for the enquiry create mutation. The server exposes the typed public procedure through Express. Authentication and admin primitives already exist in the template, but the public commerce flow does not currently use them. This makes it practical to introduce a protected admin management surface later without changing the public browsing path.

The database is the clearest current scalability boundary. Products, collections, images, translations, RFQ line items, attachments, and enquiry metadata are still embedded in React or serialized into a single text message. The recommended next implementation should move only the required commercial data to normalized tables while retaining nullable fields for facts Umaid Craftorium has not yet supplied.

## Highest-impact implementation sequence

| Priority | Improvement | Why it comes first |
| --- | --- | --- |
| 1 | Harden the public enquiry endpoint and reduce global request-body exposure. | It protects the highest-value conversion path before attachments or richer public forms are added. |
| 2 | Introduce a fact-safe catalogue domain model and structured enquiry draft/payload. | It makes future CSV, Excel, JSON, CMS, and database imports possible without fabricating commercial data. |
| 3 | Upgrade the basket into a project enquiry draft with line-item quantities and separate buyer requirements. | It improves conversion quality while preserving the existing public flow. |
| 4 | Remove unused vulnerable showcase/AI dependencies and split the main vendor bundle. | It reduces known supply-chain exposure and improves initial page cost. |
| 5 | Add scalable SEO structures and accessibility improvements. | It improves discoverability and buyer usability once data has stable slugs and metadata. |

## Required business data before a live commercial catalogue

Umaid Craftorium should supply authoritative product IDs/SKUs, approved product titles and slugs, collection mapping, categories, materials, finishes, dimensions where publishable, downloadable documents, image galleries, product status, customisation flags, translation content, and approved SEO metadata. No product availability, technical, lead-time, pricing, certification, or export claims should be introduced until supplied and approved.

## Baseline verification record

`pnpm check` passed. `pnpm test` passed with 16 tests. `pnpm build` passed and emitted a Vite large-chunk advisory for the 622 KB minified main JavaScript chunk. `pnpm audit --prod --audit-level=moderate` reported 81 production dependency vulnerabilities: 10 low, 49 moderate, 21 high, and 1 critical.
