import type { Product } from "@/lib/catalog";
import { ArrowRight, Plus } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";
import { useEnquiry } from "@/contexts/EnquiryContext";
import { useComparison } from "@/contexts/ComparisonContext";
import { trackIntent } from "@/lib/analytics";
import { getImageFocalStyle } from "@/lib/imageFocal";

export function ProductCard({ product, index = 0 }: { product: Product; index?: number }) {
  const { addItem, items } = useEnquiry();
  const { add, remove, has } = useComparison();
  const selected = items.some((item) => item.id === product.id);
  const compared = has(product.id);
  return <article className="product-card">
    <Link href={`/collections/${product.id}`} className="product-card__image"><img src={product.image} alt={product.imageAlt} style={getImageFocalStyle(product.imageFocal)} /><span className="product-card__index">0{index + 1}</span><span className="product-card__view">View <ArrowRight size={15} /></span></Link>
    <div className="product-card__body"><div><span className="product-card__collection">{product.collection} collection</span><h3><Link href={`/collections/${product.id}`}>{product.name}</Link></h3><p>{product.category} · {product.material}</p></div><div className="product-card__actions"><button className={`add-button ${selected ? "is-added" : ""}`} type="button" onClick={() => { addItem(product); trackIntent("add_to_enquiry", { product: product.id }); }} aria-label={`Add ${product.name} to enquiry`}>{selected ? "Added" : <><Plus size={16} /> Add</>}</button><button className={`compare-button ${compared ? "is-active" : ""}`} type="button" onClick={() => { if (compared) remove(product.id); else if (!add(product)) toast.error("Your comparison shortlist already has four products."); }} aria-pressed={compared} aria-label={`${compared ? "Remove" : "Add"} ${product.name} ${compared ? "from" : "to"} comparison`}>{compared ? "Compared" : "Compare"}</button></div></div>
  </article>;
}
