import type { CSSProperties } from "react";

export type ImageFit = "contain" | "cover";

export type ImageFocalPoint = {
  desktop?: { x: number; y: number };
  mobile?: { x: number; y: number };
  fit?: ImageFit;
  mobileFit?: ImageFit;
};

function percentage(value: number | undefined, fallback: number) {
  const safeValue = Number.isFinite(value) ? Number(value) : fallback;
  return `${Math.min(100, Math.max(0, safeValue))}%`;
}

/** Converts catalogue focal metadata into CSS custom properties shared by every image surface. */
export function getImageFocalStyle(focal?: ImageFocalPoint): CSSProperties {
  const desktop = focal?.desktop ?? { x: 50, y: 50 };
  const mobile = focal?.mobile ?? desktop;
  return {
    "--image-desktop-position": `${percentage(desktop.x, 50)} ${percentage(desktop.y, 50)}`,
    "--image-mobile-position": `${percentage(mobile.x, desktop.x)} ${percentage(mobile.y, desktop.y)}`,
    "--image-desktop-fit": focal?.fit ?? "contain",
    "--image-mobile-fit": focal?.mobileFit ?? focal?.fit ?? "contain",
  } as CSSProperties;
}
