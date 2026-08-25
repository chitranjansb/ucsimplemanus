export const MAX_COMPARISON_PRODUCTS = 4;

export function addComparisonProduct(ids: string[], id: string, max = MAX_COMPARISON_PRODUCTS) {
  if (ids.includes(id)) return ids;
  if (ids.length >= max) return ids;
  return [...ids, id];
}

export function removeComparisonProduct(ids: string[], id: string) {
  return ids.filter((candidate) => candidate !== id);
}

export function clearComparisonProducts() {
  return [] as string[];
}

export function normalizeComparisonProducts(value: unknown, max = MAX_COMPARISON_PRODUCTS) {
  if (!Array.isArray(value)) return [] as string[];
  return Array.from(new Set(value.filter((id): id is string => typeof id === "string" && id.length > 0))).slice(0, max);
}
