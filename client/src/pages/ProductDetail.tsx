import { Meta, SiteFrame } from "@/components/SiteLayout";
import { ProductCard } from "@/components/ProductCard";
import { getProduct, getProductGallery, getRelatedProducts } from "@/lib/catalog";
import { useEnquiry } from "@/contexts/EnquiryContext";
import { trackIntent } from "@/lib/analytics";
import { getImageFocalStyle } from "@/lib/imageFocal";
import { breadcrumbStructuredData, productStructuredData } from "@/lib/seo";
import { ArrowLeft, ArrowRight, Check, ChevronRight, Download, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "wouter";

export default function ProductDetail({ id }: { id: string }) {
  const product = getProduct(id);
  const { addItem, items, openEnquiry } = useEnquiry();
  const [activeImage, setActiveImage] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  useEffect(() => {
    if (product) trackIntent("product_view", { product: product.id, collection: product.collection });
  }, [product]);
  if (!product) return <UnknownProduct />;
  const selected = items.some((item) => item.id === product.id);
  const related = getRelatedProducts(product);
  const gallery = getProductGallery(product);
  return <SiteFrame><Meta title={product.name} description={`${product.name} from the Umaid Craftorium ${product.collection} collection. Request live specifications and material information from the trade desk.`} image={product.image} structuredData={[productStructuredData(product), breadcrumbStructuredData([{ name: "Home", path: "/" }, { name: "Collections", path: "/collections" }, { name: product.name, path: `/collections/${product.id}` }])]} />
    <section className="product-detail shell"><Link href="/collections" className="back-link"><ArrowLeft size={16} /> Back to collections</Link><div className="product-detail__grid"><div className="product-gallery"><button type="button" className="product-gallery__main-button" onClick={() => { setZoomed(true); trackIntent("product_gallery_zoom", { product: product.id }); }} aria-label={`Enlarge ${product.name} image`}><img className="product-gallery__main" src={gallery[activeImage].src} alt={gallery[activeImage].alt} style={getImageFocalStyle(gallery[activeImage].focal)} /><span>View larger</span></button><div className="product-gallery__thumbs">{gallery.map((image, index) => <button type="button" className={activeImage === index ? "is-active" : ""} onClick={() => { setActiveImage(index); trackIntent("product_gallery_select", { product: product.id, position: index + 1 }); }} aria-label={`Show gallery image ${index + 1} for ${product.name}`} key={`${image.src}-${index}`}><img src={image.src} alt="" style={getImageFocalStyle(image.focal)} /></button>)}</div></div><div className="product-detail__copy"><p className="eyebrow">{product.collection} collection</p><h1>{product.name}</h1><p className="product-detail__lede">{product.description}</p><dl className="product-specs"><div><dt>Category</dt><dd>{product.category}</dd></div><div><dt>Material / finish</dt><dd>{product.material}</dd></div><div><dt>Dimensions</dt><dd>{product.dimensions}</dd></div><div><dt>Customisation</dt><dd>Discuss material, finish, and project requirements with the trade desk.</dd></div></dl><div className="product-detail__actions"><button type="button" className={`button button--dark ${selected ? "is-selected" : ""}`} onClick={() => { addItem(product); trackIntent("add_to_enquiry", { product: product.id, source: "product_detail" }); }}>{selected ? <><Check size={17} /> Added to enquiry</> : <><Plus size={17} /> Add to enquiry</>}</button><button type="button" className="button button--outline" onClick={() => { trackIntent("request_quote", { product: product.id }); openEnquiry(); }}>Request a quote <ArrowRight size={17} /></button></div><p className="product-detail__note"><Download size={14} /> Detailed specifications and technical documents are available on request where supported.</p></div></div></section>
    <section className="product-applications"><div className="shell product-applications__grid"><div><p className="eyebrow">For your project</p><h2>Bring a brief,<br />not just a basket.</h2></div><div><p>Umaid Craftorium works on a B2B model and publishes custom development, sourcing, contract/project supply, and container-order support. Add the reference to your enquiry, then outline the project requirements in your message.</p><button type="button" className="text-action" onClick={openEnquiry}>Discuss this piece <ArrowRight size={15} /></button></div></div></section>
    {related.length > 0 && <section className="section-space"><div className="shell"><div className="section-heading"><div><p className="eyebrow">Related category</p><h2>Continue<br />the selection.</h2></div><Link href="/collections" className="text-action">All collections <ArrowRight size={15} /></Link></div><div className="product-grid product-grid--three">{related.map((item, index) => <ProductCard key={item.id} product={item} index={index} />)}</div></div></section>}
    {zoomed && <div className="gallery-lightbox" role="dialog" aria-modal="true" aria-label={`${product.name} enlarged image`}><button className="gallery-lightbox__backdrop" type="button" aria-label="Close enlarged image" onClick={() => setZoomed(false)} /><div className="gallery-lightbox__content"><img src={gallery[activeImage].src} alt={gallery[activeImage].alt} style={getImageFocalStyle(gallery[activeImage].focal)} /><button type="button" className="gallery-lightbox__close" onClick={() => setZoomed(false)}>Close</button></div></div>}
  </SiteFrame>;
}

function UnknownProduct() {
  return <SiteFrame><Meta title="Product not found" description="The requested collection reference is not available." /><section className="empty-page shell"><p className="eyebrow">Catalogue reference</p><h1>This product reference is not available.</h1><Link href="/collections" className="button button--dark">Back to collections <ArrowRight size={17} /></Link></section></SiteFrame>;
}
