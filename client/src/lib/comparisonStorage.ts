import { normalizeComparisonProducts } from "@/lib/comparisonSelection";

export const COMPARISON_STORAGE_KEY = "umaid-comparison-products-v1";

export function readComparisonStorage(storage: Pick<Storage, "getItem">) {
  try { return normalizeComparisonProducts(JSON.parse(storage.getItem(COMPARISON_STORAGE_KEY) || "[]")); } catch { return []; }
}

export function writeComparisonStorage(storage: Pick<Storage, "setItem">, ids: string[]) {
  storage.setItem(COMPARISON_STORAGE_KEY, JSON.stringify(normalizeComparisonProducts(ids)));
}

export function parseSharedComparisonIds(search: string) {
  return normalizeComparisonProducts(new URLSearchParams(search.startsWith("?") ? search.slice(1) : search).get("products")?.split(",") || []);
}

export function buildSharedComparisonUrl(origin: string, ids: string[]) {
  const normalized = normalizeComparisonProducts(ids);
  return `${origin.replace(/\/$/, "")}/compare?products=${encodeURIComponent(normalized.join(","))}`;
}

export function buildSharedRfqUrl(origin: string, ids: string[]) {
  return `${buildSharedComparisonUrl(origin, ids)}&rfq=1`;
}
