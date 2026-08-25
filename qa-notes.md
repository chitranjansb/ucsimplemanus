# Umaid Craftorium QA Notes

## Automated validation

The completed verification suite covers TypeScript compilation, the production build, public project-enquiry validation, quantity bounds, attachment type/size/count validation, honeypot handling, structured enquiry persistence contracts, product catalogue filtering, enquiry-item selection, gallery source construction, analytics detail construction, product and breadcrumb structured data, keyboard focus styling, reduced-motion CSS, semantic RFQ fields, dialog semantics, focus trapping, and key foreground/background contrast pairs.

## Visual validation

Full-page desktop screenshots were reviewed for the homepage, catalogue, product detail, manufacturing page, custom-furniture page, and contact page. Full-page mobile screenshots were reviewed for the homepage, catalogue, product detail, and contact page at 375 × 812. The hierarchy, responsive grid changes, product-card treatment, footer, focal-point framing, and contact details remained readable and intact.

## Interaction validation limitation

Connected browser automation was inspected for an end-to-end interaction run. It could not launch because its configured Firefox executable was not installed, and the setup action exposed by its guidance was unavailable in the connected tool list. The interactive flows are therefore verified through TypeScript, unit tests, native-semantic controls, component-level state design, and visual review rather than a live scripted browser session.

## Accessibility checks

All menu, filter, gallery, enquiry, and form controls use native anchors, buttons, inputs, selects, or textareas. The RFQ side panel now declares dialog semantics, moves initial focus to its close control, traps keyboard focus while open, and closes on Escape. A visible `:focus-visible` outline is defined globally, and non-essential transitions are suppressed under `prefers-reduced-motion: reduce`. The primary ink/ivory and ink/sand color pairs are covered by automated contrast checks.

## Security and performance checks

The public enquiry endpoint now applies Zod input limits, a honeypot, a minimum completion interval, a bounded in-memory rate limit, a three-file maximum, server-side MIME/size/base64 validation, randomized storage namespaces, and an 8 MB request-body limit. The server disables the Express signature header and adds `nosniff`, referrer, and permissions policies. Unused AI, charting, AWS SDK, and associated vulnerable dependency paths were removed; direct runtime dependencies were upgraded to patched releases. The final production dependency audit reports no known vulnerabilities. The Vite build now separates React and data-client vendor chunks, reducing the primary application chunk from 622 KB to 480 KB minified.
