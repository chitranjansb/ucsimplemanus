import { describe, expect, it } from "vitest";
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
