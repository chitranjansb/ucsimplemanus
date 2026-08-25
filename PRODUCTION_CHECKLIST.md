# Production Checklist

## Before publishing

| Check | Required action |
| --- | --- |
| Domain | Confirm that `https://www.umaidcraftorium.com` is the production canonical domain, then publish through the project controls. |
| Contact details | Verify the trade-desk email addresses, telephone numbers, and physical address shown on the contact page and Organization markup. |
| Catalogue | Import approved product IDs/SKUs, slugs, collection mapping, publish status, content, images, focal points, documents, and SEO metadata. Do not publish unapproved dimensions, prices, availability, certifications, production lead times, or technical claims. |
| Attachments | Perform a real project-enquiry submission with one approved PDF or image and confirm the attachment record is stored and accessible to the trade desk. |
| Rate limiting | The current public rate limit is in-memory. Before sustained public traffic or multi-instance deployment, replace it with an edge or durable shared rate-limit service. |
| Storage | Establish a retention, owner-access, and deletion policy for enquiry attachments. S3 keys are randomized, but attachments should not be treated as public catalogued assets. |
| Analytics | Connect the `umaid:intent` event bridge to the approved analytics provider, ensuring PII and attachment contents are never forwarded. |
| Search | Submit the production sitemap to the chosen search-console property only after approved product slugs and canonical pages are live. |
| Languages | Obtain approved Italian translations and localized product/SEO content before exposing an Italian language switcher or `/it` routes. |

## Release verification

Run `pnpm check`, `pnpm test`, `pnpm build`, and `pnpm audit --prod --audit-level=critical`. Then test the public enquiry path with selected product quantities, valid and invalid attachment types, keyboard navigation, mobile viewport, and the post-submit trade-desk workflow.
