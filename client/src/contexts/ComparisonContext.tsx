import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { addComparisonProduct, clearComparisonProducts, MAX_COMPARISON_PRODUCTS, removeComparisonProduct } from "@/lib/comparisonSelection";
import { readComparisonStorage, writeComparisonStorage } from "@/lib/comparisonStorage";
import type { Product } from "@/lib/catalog";

type ComparisonContextValue = { ids: string[]; max: number; add: (product: Product) => boolean; remove: (id: string) => void; clear: () => void; has: (id: string) => boolean };
const ComparisonContext = createContext<ComparisonContextValue | undefined>(undefined);
export function ComparisonProvider({ children }: { children: React.ReactNode }) {
  const [ids, setIds] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => { setIds(readComparisonStorage(window.localStorage)); setHydrated(true); }, []);
  useEffect(() => { if (hydrated) writeComparisonStorage(window.localStorage, ids); }, [hydrated, ids]);
  const value = useMemo<ComparisonContextValue>(() => ({ ids, max: MAX_COMPARISON_PRODUCTS, add: (product) => { const next = addComparisonProduct(ids, product.id); if (next.length === ids.length) return ids.includes(product.id); setIds(next); return true; }, remove: (id) => setIds((current) => removeComparisonProduct(current, id)), clear: () => setIds(clearComparisonProducts()), has: (id) => ids.includes(id) }), [ids]);
  return <ComparisonContext.Provider value={value}>{children}</ComparisonContext.Provider>;
}

export function useComparison() { const context = useContext(ComparisonContext); if (!context) throw new Error("useComparison must be used within ComparisonProvider"); return context; }
