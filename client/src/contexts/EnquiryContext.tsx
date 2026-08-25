import type { Product } from "@/lib/catalog";
import { addEnquiryItem, removeEnquiryItem, updateEnquiryItemQuantity } from "@/lib/enquirySelection";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type ProjectEnquiryItem = Pick<Product, "id" | "name" | "collection" | "image"> & { quantity: number };

type PersistedDraft = { version: 2; items: ProjectEnquiryItem[] };
type EnquiryContextValue = {
  items: ProjectEnquiryItem[];
  isOpen: boolean;
  addItem: (product: Product) => void;
  addItems: (products: Product[]) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearItems: () => void;
  openEnquiry: () => void;
  closeEnquiry: () => void;
};

const EnquiryContext = createContext<EnquiryContextValue | undefined>(undefined);
const STORAGE_KEY = "umaid-enquiry-project-v2";
const LEGACY_STORAGE_KEY = "umaid-enquiry-items";

function normalizeItems(value: unknown): ProjectEnquiryItem[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const candidate = item as Partial<ProjectEnquiryItem>;
    if (typeof candidate.id !== "string" || typeof candidate.name !== "string" || typeof candidate.collection !== "string" || typeof candidate.image !== "string") return [];
    return [{ id: candidate.id, name: candidate.name, collection: candidate.collection, image: candidate.image, quantity: Math.max(1, Math.min(500, Math.floor(Number(candidate.quantity) || 1))) }];
  });
}

export function EnquiryProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ProjectEnquiryItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    try {
      const current = window.localStorage.getItem(STORAGE_KEY);
      const legacy = window.localStorage.getItem(LEGACY_STORAGE_KEY);
      const parsed = current ? JSON.parse(current) as PersistedDraft : legacy ? JSON.parse(legacy) : null;
      const restored = normalizeItems(parsed && "items" in parsed ? parsed.items : parsed);
      if (restored.length) setItems(restored);
      if (legacy) window.localStorage.removeItem(LEGACY_STORAGE_KEY);
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
      window.localStorage.removeItem(LEGACY_STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    const draft: PersistedDraft = { version: 2, items };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
  }, [items]);

  const value = useMemo<EnquiryContextValue>(() => ({
    items,
    isOpen,
    addItem: (product) => {
      setItems((current) => addEnquiryItem(current, { id: product.id, name: product.name, collection: product.collection, image: product.image, quantity: 1 }));
      setIsOpen(true);
    },
    addItems: (products) => {
      setItems((current) => products.reduce((next, product) => addEnquiryItem(next, { id: product.id, name: product.name, collection: product.collection, image: product.image, quantity: 1 }), current));
      setIsOpen(true);
    },
    removeItem: (id) => setItems((current) => removeEnquiryItem(current, id)),
    updateQuantity: (id, quantity) => setItems((current) => updateEnquiryItemQuantity(current, id, quantity)),
    clearItems: () => setItems([]),
    openEnquiry: () => setIsOpen(true),
    closeEnquiry: () => setIsOpen(false),
  }), [items, isOpen]);

  return <EnquiryContext.Provider value={value}>{children}</EnquiryContext.Provider>;
}

export function useEnquiry() {
  const context = useContext(EnquiryContext);
  if (!context) throw new Error("useEnquiry must be used within EnquiryProvider");
  return context;
}
