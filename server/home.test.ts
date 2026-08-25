import { describe, expect, it } from "vitest";
import { buildInquiryMailto } from "../client/src/pages/Home";

describe("Umaid Craftorium inquiry flow", () => {
  it("builds a mailto handoff with encoded inquiry details", () => {
    const href = buildInquiryMailto("Asha & Co", "asha@example.com", "Bespoke Projects", "Need a console for a new space");
    expect(href.startsWith("mailto:hello@umaidcraftorium.com?")).toBe(true);
    expect(decodeURIComponent(href)).toContain("Umaid Craftorium inquiry from Asha & Co");
    expect(decodeURIComponent(href)).toContain("Need a console for a new space");
  });

  it("keeps customer details in the composed body", () => {
    const href = buildInquiryMailto("Ravi", "ravi@example.com", "Explore a collection", "Please share the current catalogue.");
    const decoded = decodeURIComponent(href);
    expect(decoded).toContain("ravi@example.com");
    expect(decoded).toContain("Explore a collection");
  });
});
