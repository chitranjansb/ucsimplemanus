export type EnquiryItem = { id: string };

export function addEnquiryItem<T extends EnquiryItem>(items: T[], item: T) {
  return items.some((current) => current.id === item.id) ? items : [...items, item];
}

export function removeEnquiryItem<T extends EnquiryItem>(items: T[], id: string) {
  return items.filter((item) => item.id !== id);
}
