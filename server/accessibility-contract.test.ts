import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const css = readFileSync(resolve(process.cwd(), "client/src/index.css"), "utf8");

function contrastRatio(hexA: string, hexB: string) {
  const luminance = (hex: string) => {
    const values = hex.match(/[a-f\d]{2}/gi)!.map((value) => Number.parseInt(value, 16) / 255);
    const linear = values.map((value) => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4);
    return .2126 * linear[0] + .7152 * linear[1] + .0722 * linear[2];
  };
  const [lighter, darker] = [luminance(hexA), luminance(hexB)].sort((a, b) => b - a);
  return (lighter + .05) / (darker + .05);
}

describe("public-site accessibility contract", () => {
  it("keeps a visible keyboard focus treatment and reduced-motion fallback", () => {
    expect(css).toMatch(/:focus-visible/);
    expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\)/);
    expect(css).toMatch(/scroll-behavior: auto/);
  });

  it("uses contrast-safe core foreground and background pairs", () => {
    expect(contrastRatio("#24231f", "#f5f2ea")).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio("#f5f2ea", "#24231f")).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio("#24231f", "#e9e1d3")).toBeGreaterThanOrEqual(4.5);
  });

  it("uses native semantic fields and buttons in the enquiry surface", () => {
    const layout = readFileSync(resolve(process.cwd(), "client/src/components/SiteLayout.tsx"), "utf8");
    expect(layout).toMatch(/<form className="rfq-form"/);
    expect(layout).toMatch(/<input name={name}/);
    expect(layout).toMatch(/<select name={name} required>/);
    expect(layout).toMatch(/<textarea name="message"/);
  });
});
