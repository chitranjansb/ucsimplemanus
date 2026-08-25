import { describe, expect, it } from "vitest";
import { buildRfqPayload } from "../shared/enquiry";

describe("buildRfqPayload", () => {
  it("combines buyer context and selected catalogue products into the persisted enquiry payload", () => {
    const payload = buildRfqPayload({
      buyerType: "Architect / designer",
      projectType: "Custom development",
      country: "Italy",
      phone: "+39 123 4567",
      quantity: "32 pieces",
      timeline: "3–6 months",
      message: "Need a durable dining and storage programme for a hospitality project.",
    }, [
      { name: "Carved Storage Cabinet", collection: "Mosaic" },
      { name: "Accent Side Table", collection: "Patina" },
    ]);

    expect(payload.project).toBe("Architect / designer · Custom development · Italy");
    expect(payload.message).toContain("Carved Storage Cabinet (Mosaic), Accent Side Table (Patina)");
    expect(payload.message).toContain("Quantity: 32 pieces");
    expect(payload.message).toContain("Requirements: Need a durable dining and storage programme");
  });

  it("keeps general enquiries useful when no catalogue product has been selected", () => {
    const payload = buildRfqPayload({
      buyerType: "Other",
      projectType: "Other",
      country: "India",
      message: "Seeking a sourcing conversation.",
    }, []);

    expect(payload.message).toContain("Selected products: No catalogue products selected");
    expect(payload.message).toContain("Phone: Not supplied");
    expect(payload.project).toBe("Other · Other · India");
  });
});

