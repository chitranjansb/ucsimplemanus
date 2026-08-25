# Umaid Craftorium Website Implementation Report

## Delivered website

The project now delivers a responsive, enquiry-led B2B furniture website for **Umaid Craftorium**. It repositions the company as a trade-only furniture manufacturer, wholesale supplier, and export partner in Jodhpur. The public experience includes an editorial homepage, catalogue filters and search, collection-reference detail pages, custom furniture, manufacturing, export, about, and contact pages, plus a persistent multi-product RFQ flow.

The content stays within the published company record. It uses the source website’s trade-only model, Jodhpur location, furniture categories, named collections, material types, manufacturing scale, quality-control statement, worldwide shipping, and customised-container support. Unsupported testimonials, named projects, buyer logos, awards, response-time commitments, lead-time claims, and technical-construction details were deliberately excluded. [1] [2] [3] [4] [5]

| Area | What changed |
| --- | --- |
| Brand and design | Introduced a warm ivory, charcoal, sandstone, copper, and moss palette; an editorial serif/sans type system; a structured trade-catalogue grid; and restrained transitions that respect reduced-motion preferences. |
| Buyer journeys | Added clear navigation, collection discovery, product detail screens, an interactive gallery with enlargement, enquiry selection, direct contact information, and a consolidated RFQ form. |
| Catalogue | Added client-side search and category filtering, named collection listings, collection-reference cards, related products, and deliberate “specifications available on request” boundaries where live data is absent. |
| RFQ | Added an enquiry basket that persists selected product references locally, captures buyer/project context, validates the public form, and stores a consolidated enquiry through the existing application route. |
| SEO | Added a canonical, social metadata, organization structured data using verified contact details, `robots.txt`, `sitemap.xml`, semantic route-level metadata, and clear page hierarchy. |
| Analytics readiness | Added safe browser-side intent events for product views, gallery use, catalogue search and filtering, enquiry progress, and email/phone contact actions. The events expose no configuration or secret values. |

## UX and performance decisions

The experience avoids a conventional checkout model because the source site identifies Umaid Craftorium as trade-only. Instead, products act as conversation starters: users can save several references, add project detail, and submit one useful buyer brief. The website uses verified public furniture imagery supplied by the original company site and stores the selected assets in project-managed storage. The Netlify reference informed the editorial pace and information hierarchy only; its unsourced factual claims were not reused.

Secondary public pages are lazy-loaded to lower initial route cost. The production build completes successfully; it retains a vendor-chunk advisory because the shared UI/runtime bundle is approximately 188 KB gzip. Further gains would require a focused dependency audit and, if desired, server-side rendering for crawl-visible page-specific metadata.

## Validation completed

| Check | Result |
| --- | --- |
| Type safety | `pnpm check` passed. |
| Unit tests | `pnpm test` passed: 6 files and 15 tests. Coverage includes enquiry validation and payloads, catalogue filtering, selection state, gallery construction, analytics detail, focus styling, reduced motion, contrast pairs, and semantic RFQ controls. |
| Production bundle | `pnpm build` passed. |
| Visual review | Desktop and 375 × 812 mobile full-page reviews completed for homepage, catalogue, product detail, manufacturing, and contact journeys. |
| Accessibility implementation | Native form controls and buttons, global `:focus-visible` treatment, reduced-motion CSS, semantic document structure, accessible labels, and automated contrast checks are in place. |

## Information still needed

The next factual content upgrade should come from Umaid Craftorium, not inference. Useful inputs would be a current product data export with real product names, dimensions, materials, finishes, stock/status, technical downloads, and collection mappings; high-resolution factory, process, and lifestyle imagery; approved project case studies; current certifications; current export documentation/terms; WhatsApp details; and a catalogue or brochure file. Those assets would allow the reference catalogue to become a live commercial catalogue without introducing unsupported claims.

## Remaining risks and deployment handoff

The current product records are intentionally reference-level because detailed SKU data was not available. Contact data is sourced from the public company site and should be reconfirmed before launch. Automated browser interaction testing could not be completed because the configured connected browser expected a Firefox executable that was not available; the available setup action was also absent. Component state, unit tests, native semantics, screenshots, and build checks provide the current verification evidence.

Before publishing, review the supplied facts and images, decide whether production needs server-rendered per-route SEO, confirm the canonical public domain, and test a real enquiry submission against the production database. Once the checkpoint is available, use the project’s **Publish** control to deploy.

## References

[1] [Umaid Craftorium homepage](http://www.umaidcraftorium.com/)

[2] [Umaid Craftorium — About Us](http://www.umaidcraftorium.com/about-us/)

[3] [Umaid Craftorium — Collections](http://www.umaidcraftorium.com/collections/)

[4] [Umaid Craftorium — Contact Us](http://www.umaidcraftorium.com/contact-us/)

[5] [Umaid Craftorium — Why people prefer us](http://www.umaidcraftorium.com/why-people-prefer-us/)
