import { normalizeComparisonProducts } from "@/lib/comparisonSelection";

export const COMPARISON_STORAGE_KEY = "umaid-comparison-products-v1";

export function readComparisonStorage(storage: Pick<Storage, "getItem">) {
  try { return normalizeComparisonProducts(JSON.parse(storage.getItem(COMPARISON_STORAGE_KEY) || "[]")); } catch { return []; }
}

export function writeComparisonStorage(storage: Pick<Storage, "setItem">, ids: string[]) {
  storage.setItem(COMPARISON_STORAGE_KEY, JSON.stringify(normalizeComparisonProducts(ids)));
}
