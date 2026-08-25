export type EnquiryItem = { id: string };

export function addEnquiryItem<T extends EnquiryItem>(items: T[], item: T) {
  return items.some((current) => current.id === item.id) ? items : [...items, item];
}

export function removeEnquiryItem<T extends EnquiryItem>(items: T[], id: string) {
  return items.filter((item) => item.id !== id);
}

export function updateEnquiryItemQuantity<T extends EnquiryItem & { quantity: number }>(items: T[], id: string, quantity: number) {
  const safeQuantity = Math.max(1, Math.min(500, Math.floor(quantity)));
  return items.map((item) => item.id === id ? { ...item, quantity: safeQuantity } : item);
}
