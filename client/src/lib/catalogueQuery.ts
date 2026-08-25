import type { CatalogueFilters, CatalogueSort, Product } from "@/lib/catalog";

export type CatalogueUrlState = CatalogueFilters & { page: number };
export function parseCatalogueQuery(search: string): CatalogueUrlState {
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  const availability = params.get("availability") as Product["availability"] | null;
  const sort = params.get("sort") as CatalogueSort | null;
  return { query: params.get("q") || undefined, category: params.get("category") || undefined, collection: params.get("collection") || undefined, material: params.get("material") || undefined, finish: params.get("finish") || undefined, availability: availability || undefined, customizable: params.has("customizable") ? params.get("customizable") === "true" : undefined, isNew: params.has("new") ? params.get("new") === "true" : undefined, featured: params.has("featured") ? params.get("featured") === "true" : undefined, sort: sort || "featured", page: Math.max(1, Number(params.get("page") || 1) || 1) };
}

export function serializeCatalogueQuery(state: CatalogueUrlState) {
  const params = new URLSearchParams();
  if (state.query) params.set("q", state.query);
  if (state.category) params.set("category", state.category);
  if (state.collection) params.set("collection", state.collection);
  if (state.material) params.set("material", state.material);
  if (state.finish) params.set("finish", state.finish);
  if (state.availability) params.set("availability", state.availability);
  if (state.customizable !== undefined) params.set("customizable", String(state.customizable));
  if (state.isNew !== undefined) params.set("new", String(state.isNew));
  if (state.featured !== undefined) params.set("featured", String(state.featured));
  if (state.sort && state.sort !== "featured") params.set("sort", state.sort);
  if (state.page > 1) params.set("page", String(state.page));
  return params.toString();
}
