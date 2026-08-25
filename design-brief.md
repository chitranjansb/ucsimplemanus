# Umaid Craftorium Design Brief

## Experience intent

The redesigned site will position **Umaid Craftorium** as a trade-only furniture manufacturer, wholesale supplier, and exporter in Jodhpur, India. The experience will be calm, editorial, and spatial rather than promotional or marketplace-like. Its primary job is to make international B2B buyers comfortable starting an enquiry about collections, custom development, project supply, or export orders.

## Verified content boundary

| Use in published copy | Keep out unless the user verifies it |
| --- | --- |
| Trade-only supplier; wholesale furniture and home-interior products; Jodhpur location; B2B model; manufacturing facility of 18,000 sq. m and more than 20 dedicated units; four-step quality control; customised container loads; client-led product development and sourcing; worldwide shipping; published materials including mango, Sheesham, acacia, and pine; published product ranges and named collections. | Named clients or projects; testimonials; awards; sales counts; response times; staff estimates; production lead times; technical construction methods; certification labels beyond the published reference; unverified product dimensions, price, availability, or material attribution. |

## Proposed page model

| Route | Purpose | Primary action |
| --- | --- | --- |
| `/` | Establish the brand, its trade-only offer, product breadth, quality-control approach, custom development, and direct path to the enquiry desk. | Browse collections / Start an enquiry |
| `/collections` | Offer a searchable and filterable catalogue shell using published furniture categories and named collections. | View detail / Add to enquiry |
| `/collections/:id` | Present a single product card with a large image, flexible specification area, material guidance, and an RFQ action. | Add to enquiry / Request a quote |
| `/custom-furniture` | Explain the verified co-development and sourcing offer in a transparent, client-led process. | Discuss a custom brief |
| `/manufacturing` | Present published manufacturing scale, quality-control focus, materials, and category breadth. | Explore collections |
| `/export` | Communicate worldwide shipping and customised-container support without guessing commercial terms. | Speak with the trade desk |
| `/about` | Present the company’s published Jodhpur location, B2B model, artisan and workshop intent, and product range. | Contact Umaid Craftorium |
| `/contact` | Provide verified address, telephone, email details, and the full RFQ form. | Send enquiry |

## Interaction model

The header will keep collection discovery, capabilities, and enquiry actions visible without becoming a dense mega-menu. The enquiry basket will stay in the interface across catalogue and detail views, allowing buyers to accumulate candidate products and submit one consolidated enquiry. Forms will use progressive disclosure and meaningful validation states. Where exact specifications are not published, the experience will show “available on request” rather than fabricated dimensions, material variants, or downloads.

## Visual language

The palette uses charcoal, ivory, sandstone, walnut, and restrained oxidised copper. Typography pairs an elegant editorial serif with a practical grotesk sans-serif. Product imagery is given generous negative space, labelled with simple captions, and used in full-bleed crop treatments where a genuine company image supports the page. The interface avoids rounded card galleries, stock claims, excessive shadows, and decorative gradients. Motion is limited to subtle hover, mobile-menu, dialog, and state transitions; it respects reduced-motion preferences.

## Data model

The initial catalogue is intentionally descriptive rather than transactional. It stores product cards, category tags, named collection relationships, source photography, enquiry-friendly descriptions, and “specifications available on request” fields. Catalogue filtering is client-side for speed. The existing public enquiry endpoint persists the buyer message; the expanded form serialises selected products and project information into the existing validated payload until a fuller CRM schema is required.

## Sources

The factual basis is the original Umaid Craftorium public site: [homepage](http://www.umaidcraftorium.com/), [about](http://www.umaidcraftorium.com/about-us/), [collections](http://www.umaidcraftorium.com/collections/), [contact](http://www.umaidcraftorium.com/contact-us/), and [buyer-benefit page](http://www.umaidcraftorium.com/why-people-prefer-us/). The user-provided Netlify reference informs visual rhythm only; its unsourced company claims, named projects, and testimonials are excluded.
