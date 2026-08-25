import { describe, expect, it } from "vitest";
import { isValidInquiryStatusTransition } from "../shared/admin";
import { assertMediaNotAssigned } from "./admin";

describe("admin media assignment guard", () => {
  it("allows library cleanup only when a media asset has no product or collection assignment", () => {
    expect(() => assertMediaNotAssigned(0, 0)).not.toThrow();
  });

  it("blocks archive or deletion when a media asset remains assigned to a product or collection", () => {
    expect(() => assertMediaNotAssigned(1, 0)).toThrow(/assigned/i);
    expect(() => assertMediaNotAssigned(0, 1)).toThrow(/assigned/i);
  });
});

describe("CRM status transitions", () => {
  it("allows progression through the sales pipeline and legacy closure", () => {
    expect(isValidInquiryStatusTransition("new", "contacted")).toBe(true);
    expect(isValidInquiryStatusTransition("contacted", "quotation_sent")).toBe(true);
    expect(isValidInquiryStatusTransition("quotation_sent", "negotiation")).toBe(true);
    expect(isValidInquiryStatusTransition("negotiation", "won")).toBe(true);
    expect(isValidInquiryStatusTransition("won", "closed")).toBe(true);
  });

  it("blocks skipping backwards from a won enquiry into active pipeline states", () => {
    expect(isValidInquiryStatusTransition("won", "negotiation")).toBe(false);
    expect(isValidInquiryStatusTransition("won", "lost")).toBe(false);
    expect(isValidInquiryStatusTransition("new", "won")).toBe(false);
  });
});
