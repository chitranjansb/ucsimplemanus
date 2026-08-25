export type ProductCategory = string;

import type { ImageFocalPoint } from "@/lib/imageFocal";

export type Product = {
  id: string;
  databaseId?: number;
  sku?: string | null;
  productCode?: string | null;
  slug?: string;
  name: string;
  collection: string;
  collectionSlug?: string | null;
  category: ProductCategory;
  categories?: Array<{ slug: string; name: string; primary: boolean }>;
  material: string;
  materials?: string[];
  finish?: string | null;
  finishes?: string[];
  description: string;
  shortDescription?: string | null;
  dimensions: string;
  weightKg?: number | null;
  moq?: number | null;
  packagingInfo?: string | null;
  cbm?: number | null;
  customizable?: boolean;
  status?: "draft" | "published" | "archived";
  availability?: "available" | "on_request" | "discontinued";
  image: string;
  imageAlt: string;
  /** Sets product placement inside fixed editorial frames; values are percentages from the image’s top-left corner. */
  imageFocal?: ImageFocalPoint;
  featured?: boolean;
  isNew?: boolean;
  seoTitle?: string | null;
  seoDescription?: string | null;
  media?: Array<{ id: number; url: string; alt: string; role: "hero" | "gallery" | "detail"; sortOrder: number; focal: ImageFocalPoint }>;
  specifications?: Array<{ key: string; label: string; value: string; unit: string | null; sortOrder: number; variantCode: string | null }>;
  variants?: Array<{ variantCode: string; sku: string | null; name: string | null; material: string | null; finish: string | null; dimensions: string | null; weightKg: number | null; moq: number | null; packagingInfo: string | null; cbm: number | null; availability: "available" | "on_request" | "discontinued" }>;
};

export const collections = [
  { slug: "stark", name: "Stark" },
  { slug: "flat", name: "Flat" },
  { slug: "toris", name: "Toris" },
  { slug: "rio", name: "Rio" },
  { slug: "urban", name: "Urban" },
  { slug: "mosaic", name: "Mosaic" },
  { slug: "thakat", name: "Thakat" },
  { slug: "patina", name: "Patina" },
  { slug: "sturdy", name: "Sturdy" },
  { slug: "county", name: "County" },
  { slug: "muster", name: "Muster" },
  { slug: "empirical", name: "Empirical" },
  { slug: "bathroom", name: "Bathroom" },
  { slug: "musk", name: "Musk" },
  { slug: "bedroom", name: "Bedroom" },
  { slug: "misty", name: "Misty" },
  { slug: "pulp", name: "Pulp" },
  { slug: "reclaimed", name: "Reclaimed" },
  { slug: "live-edge", name: "Live Edge" },
  { slug: "et", name: "ET" },
];

export const products: Product[] = [
  {
    id: "carved-storage-cabinet",
    name: "Carved Storage Cabinet",
    collection: "Mosaic",
    category: "Storage",
    material: "Wood finish available on request",
    description: "A cabinet-style reference for a storage enquiry, shown from the Umaid Craftorium collection archive.",
    dimensions: "Specifications available on request",
    image: "/manus-storage/product-cabinet_0372320c.jpg",
    imageAlt: "Carved wooden cabinet from Umaid Craftorium collection imagery",
    imageFocal: { desktop: { x: 50, y: 48 }, mobile: { x: 50, y: 44 }, fit: "contain" },
    featured: true,
  },
  {
    id: "accent-side-table",
    name: "Accent Side Table",
    collection: "Patina",
    category: "Living",
    material: "Wood finish available on request",
    description: "A compact occasional furniture reference for living and decorative settings.",
    dimensions: "Specifications available on request",
    image: "/manus-storage/product-console_2e1070d8.jpg",
    imageAlt: "Blue wooden accent table from Umaid Craftorium collection imagery",
    imageFocal: { desktop: { x: 50, y: 48 }, mobile: { x: 51, y: 46 }, fit: "contain" },
    featured: true,
  },
  {
    id: "patterned-sideboard",
    name: "Patterned Sideboard",
    collection: "Stark",
    category: "Storage",
    material: "Wood finish available on request",
    description: "A sideboard-style storage reference for hospitality, retail, and residential settings.",
    dimensions: "Specifications available on request",
    image: "/manus-storage/product-sideboard_6cf7e491.jpg",
    imageAlt: "Patterned wooden sideboard from Umaid Craftorium collection imagery",
    imageFocal: { desktop: { x: 50, y: 50 }, mobile: { x: 50, y: 45 }, fit: "contain" },
    featured: true,
  },
  {
    id: "wooden-chest",
    name: "Wooden Storage Chest",
    collection: "County",
    category: "Storage",
    material: "Wood finish available on request",
    description: "A chest-style storage reference for a project or collection-sourcing brief.",
    dimensions: "Specifications available on request",
    image: "/manus-storage/product-trunk_6aad3181.jpg",
    imageAlt: "Wooden storage chest from Umaid Craftorium collection imagery",
    imageFocal: { desktop: { x: 50, y: 49 }, mobile: { x: 50, y: 45 }, fit: "contain" },
  },
  {
    id: "carved-cabinet",
    name: "Carved Cabinet",
    collection: "Musk",
    category: "Storage",
    material: "Wood finish available on request",
    description: "A carved cabinet reference for a storage or decorative furniture brief.",
    dimensions: "Specifications available on request",
    image: "/manus-storage/product-carved-cabinet_18e101e8.jpg",
    imageAlt: "Carved cabinet from Umaid Craftorium collection imagery",
    imageFocal: { desktop: { x: 50, y: 49 }, mobile: { x: 50, y: 45 }, fit: "contain" },
  },
];

export const productCategories = ["All", "Dining", "Living", "Bedroom", "Bathroom", "Outdoor", "Storage"] as const;

export function getProduct(id: string) {
  return products.find((product) => product.id === id);
}

export function getRelatedProducts(product: Product) {
  return products.filter((candidate) => candidate.id !== product.id && candidate.category === product.category).slice(0, 3);
}

export function filterProducts(query: string, category: (typeof productCategories)[number], catalogue: Product[] = products, collectionSlug?: string) {
  const normalizedQuery = query.trim().toLowerCase();
  return catalogue.filter((product) => {
    const matchesCategory = category === "All" || product.category === category;
    const productCollectionSlug = product.collectionSlug || product.collection.toLowerCase().replace(/\s+/g, "-");
    const matchesCollection = !collectionSlug || productCollectionSlug === collectionSlug;
    const matchesQuery = [product.name, product.collection, product.category].join(" ").toLowerCase().includes(normalizedQuery);
    return matchesCategory && matchesCollection && matchesQuery;
  });
}

export function getProductGallery(product: Product, catalogue: Product[] = products) {
  return [product, ...catalogue.filter((item) => item.id !== product.id).slice(0, 2)].map((item) => ({ src: item.image, alt: item.imageAlt, focal: item.imageFocal }));
}
