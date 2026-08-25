export type EnquiryProductReference = {
  name: string;
  collection: string;
};

export type RfqFormValues = {
  buyerType: string;
  projectType: string;
  country: string;
  phone?: string;
  quantity?: string;
  timeline?: string;
  message: string;
};

export function buildRfqPayload(values: RfqFormValues, items: EnquiryProductReference[]) {
  const selected = items.length ? items.map((item) => `${item.name} (${item.collection})`).join(", ") : "No catalogue products selected";
  const project = [values.buyerType, values.projectType, values.country].filter(Boolean).join(" · ");
  const message = [
    `Selected products: ${selected}`,
    `Phone: ${values.phone || "Not supplied"}`,
    `Quantity: ${values.quantity || "Not supplied"}`,
    `Timeline: ${values.timeline || "Not supplied"}`,
    `Requirements: ${values.message}`,
  ].join("\n");

  return { project, message };
}
