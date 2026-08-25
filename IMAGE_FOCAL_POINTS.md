# Image Focal Points

## Purpose

Each catalogue image can define independent **desktop** and **mobile** focal points. The site applies these values to the image’s `object-position`, allowing the product to sit intentionally inside its editorial frame without changing the original asset.

By default, image surfaces use `contain`, preserving the complete product. A future record may intentionally use `cover` where an editorial crop is appropriate; in that case, focal points determine which part of the image remains visible.

## Product configuration

Set `imageFocal` on an item in `client/src/lib/catalog.ts` or on a future imported product record.

```ts
imageFocal: {
  desktop: { x: 50, y: 48 },
  mobile: { x: 50, y: 44 },
  fit: "contain",
  // Optional: use only when an intentional mobile crop is desired.
  mobileFit: "cover",
}
```

| Field | Meaning |
| --- | --- |
| `desktop.x`, `desktop.y` | Horizontal and vertical focal position on desktop, from `0` to `100`. `50, 50` is centred. |
| `mobile.x`, `mobile.y` | Mobile-specific focal position. If omitted, the desktop point is reused. |
| `fit` | Default framing mode. Use `contain` to show the complete piece, or `cover` only for an intentional crop. |
| `mobileFit` | Optional mobile override. Use with a mobile focal point when the mobile frame needs a different crop. |

Values outside the supported `0–100` range are safely clamped. The same metadata is used by product cards, detail galleries, lightbox images, homepage product images, and shared editorial heroes.
