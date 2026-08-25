# Umaid Craftorium QA Notes

## Automated validation

The completed verification suite covers TypeScript compilation, the production build, public enquiry route validation, the expanded RFQ payload, product catalogue filtering, enquiry-item selection, gallery source construction, analytics detail construction, keyboard focus styling, reduced-motion CSS, semantic RFQ fields, and key foreground/background contrast pairs.

## Visual validation

Full-page desktop screenshots were reviewed for the homepage, catalogue, product detail, manufacturing page, and contact page. Full-page mobile screenshots were reviewed for the homepage, catalogue, product detail, and contact page at 375 × 812. The hierarchy, responsive grid changes, product-card treatment, footer, and contact details remained readable and intact.

## Interaction validation limitation

Connected browser automation was inspected for an end-to-end interaction run. It could not launch because its configured Firefox executable was not installed, and the setup action exposed by its guidance was unavailable in the connected tool list. The interactive flows are therefore verified through TypeScript, unit tests, native-semantic controls, component-level state design, and visual review rather than a live scripted browser session.

## Accessibility checks

All menu, filter, gallery, enquiry, and form controls use native anchors, buttons, inputs, selects, or textareas. A visible `:focus-visible` outline is defined globally, and non-essential transitions are suppressed under `prefers-reduced-motion: reduce`. The primary ink/ivory and ink/sand color pairs are covered by automated contrast checks.

