export type ProductCategory = "Dining" | "Living" | "Bedroom" | "Bathroom" | "Outdoor" | "Storage";

export type Product = {
  id: string;
  name: string;
  collection: string;
  category: ProductCategory;
  material: string;
  description: string;
  dimensions: string;
  image: string;
  imageAlt: string;
  featured?: boolean;
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
  },
];

export const productCategories = ["All", "Dining", "Living", "Bedroom", "Bathroom", "Outdoor", "Storage"] as const;

export function getProduct(id: string) {
  return products.find((product) => product.id === id);
}

export function getRelatedProducts(product: Product) {
  return products.filter((candidate) => candidate.id !== product.id && candidate.category === product.category).slice(0, 3);
}

export function filterProducts(query: string, category: (typeof productCategories)[number], catalogue: Product[] = products) {
  const normalizedQuery = query.trim().toLowerCase();
  return catalogue.filter((product) => {
    const matchesCategory = category === "All" || product.category === category;
    const matchesQuery = [product.name, product.collection, product.category].join(" ").toLowerCase().includes(normalizedQuery);
    return matchesCategory && matchesQuery;
  });
}

export function getProductGallery(product: Product, catalogue: Product[] = products) {
  return [product.image, ...catalogue.filter((item) => item.id !== product.id).slice(0, 2).map((item) => item.image)];
}
