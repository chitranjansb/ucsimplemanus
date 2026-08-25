import type { Product } from "@/lib/catalog";
import { addEnquiryItem, removeEnquiryItem } from "@/lib/enquirySelection";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

type EnquiryContextValue = {
  items: Product[];
  isOpen: boolean;
  addItem: (product: Product) => void;
  removeItem: (id: string) => void;
  clearItems: () => void;
  openEnquiry: () => void;
  closeEnquiry: () => void;
};

const EnquiryContext = createContext<EnquiryContextValue | undefined>(undefined);
const STORAGE_KEY = "umaid-enquiry-items";

export function EnquiryProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<Product[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) setItems(JSON.parse(stored));
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const value = useMemo<EnquiryContextValue>(() => ({
    items,
    isOpen,
    addItem: (product) => {
      setItems((current) => addEnquiryItem(current, product));
      setIsOpen(true);
    },
    removeItem: (id) => setItems((current) => removeEnquiryItem(current, id)),
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
