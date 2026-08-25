import { Meta, SiteFrame } from "@/components/SiteLayout";
import { ProductCard } from "@/components/ProductCard";
import { useEnquiry } from "@/contexts/EnquiryContext";
import { products } from "@/lib/catalog";
import { trackIntent } from "@/lib/analytics";
import { getImageFocalStyle } from "@/lib/imageFocal";
import { ArrowDownRight, ArrowRight, Check, ChevronRight, Globe2, Layers3, Sparkles } from "lucide-react";
import { Link } from "wouter";

export default function Home() {
  const { openEnquiry } = useEnquiry();
  const featured = products.filter((product) => product.featured);
  const heroProduct = products.find((product) => product.id === "patterned-sideboard") ?? products[0];
  const customFeatureProduct = products.find((product) => product.id === "carved-storage-cabinet") ?? products[0];

  return <SiteFrame>
    <Meta title="Trade furniture from Jodhpur" description="Umaid Craftorium is a trade-only furniture manufacturer, wholesale supplier, and exporter in Jodhpur, India." />
    <section className="home-hero">
      <div className="shell home-hero__grid">
        <div className="home-hero__copy">
          <p className="eyebrow"><span /> Trade furniture · Jodhpur, India</p>
          <h1>Furniture with a<br /><em>worldly point of view.</em></h1>
          <p className="hero-copy">Umaid Craftorium develops, manufactures, and sources furniture and home-interior products for trade buyers, project teams, and global markets.</p>
          <div className="hero-actions"><Link className="button button--dark" href="/collections">Browse collections <ArrowRight size={17} /></Link><button type="button" className="text-action" onClick={() => { trackIntent("begin_enquiry", { source: "home_hero" }); openEnquiry(); }}>Start an enquiry <ArrowRight size={15} /></button></div>
        </div>
        <div className="home-hero__visual"><img src={heroProduct.image} alt={heroProduct.imageAlt} style={getImageFocalStyle(heroProduct.imageFocal)} /><div className="home-hero__caption"><span>01</span><span>Made for trade projects and considered retail.</span></div></div>
      </div>
      <div className="home-hero__strip"><div className="shell"><span><Sparkles size={14} /> Trade-only manufacturer & supplier</span><span><Globe2 size={14} /> Worldwide shipping</span><span><Layers3 size={14} /> Custom development & sourcing</span></div></div>
    </section>

    <section className="statement section-space section-space--charcoal">
      <div className="shell statement__grid"><p className="eyebrow">What we make</p><h2>Furniture, home décor, and accessories with the material presence to hold a room.</h2><div><p>The range spans dining, living, kitchen, bar, bathroom, and outdoor furniture, alongside home décor and accessories. Select the references that matter to your project, then take the conversation directly to the trade desk.</p><Link href="/about" className="text-action text-action--light">About Umaid Craftorium <ArrowRight size={15} /></Link></div></div>
    </section>

    <section className="section-space collection-feature">
      <div className="shell"><div className="section-heading"><div><p className="eyebrow">Featured selection</p><h2>Start with the<br /><em>collection.</em></h2></div><p>Browse a compact set of collection references, then add the pieces relevant to your project to one enquiry.</p></div><div className="product-grid product-grid--three">{featured.map((product, index) => <ProductCard product={product} index={index} key={product.id} />)}</div><div className="section-footer-action"><Link href="/collections" className="button button--outline">View all collections <ArrowRight size={17} /></Link></div></div>
    </section>

    <section className="scale-band"><div className="shell scale-band__grid"><div><p className="eyebrow">Manufacturing in Jodhpur</p><h2>A partner built for<br />the long view.</h2></div><div className="scale-band__facts"><div><strong>18,000 sq. m</strong><span>Manufacturing facility in Jodhpur</span></div><div><strong>20+ units</strong><span>Dedicated operating units</span></div><div><strong>4 steps</strong><span>Quality-control system</span></div></div></div></section>

    <section className="custom-feature"><div className="shell custom-feature__grid"><div className="custom-feature__image"><img src={customFeatureProduct.image} alt={customFeatureProduct.imageAlt} style={getImageFocalStyle(customFeatureProduct.imageFocal)} /><span className="image-label">Custom development</span></div><div className="custom-feature__copy"><p className="eyebrow">Made around the brief</p><h2>Bring the reference.<br /><em>We’ll bring the process.</em></h2><p>Umaid Craftorium states that it develops and sources products according to client-market needs, working with buyers on design and development requirements. Use the enquiry desk to share a drawing, an image, a sourcing brief, or a target category.</p><Link href="/custom-furniture" className="button button--light">Explore custom furniture <ArrowRight size={17} /></Link></div></div></section>

    <section className="materials section-space"><div className="shell materials__grid"><div><p className="eyebrow">Wood types in the range</p><h2>Materials chosen<br />for their character.</h2></div><div className="materials__list"><div><span>01</span><p><strong>Sheesham</strong>A wood type included in the furniture range.</p></div><div><span>02</span><p><strong>Mango</strong>A wood type included in the furniture range.</p></div><div><span>03</span><p><strong>Acacia</strong>A wood type included in the furniture range.</p></div><div><span>04</span><p><strong>Pine</strong>A wood type included in the furniture range.</p></div></div></div></section>

    <section className="process section-space section-space--sand"><div className="shell"><div className="section-heading"><div><p className="eyebrow">A clear project path</p><h2>From first brief<br />to trade enquiry.</h2></div><p>The published site describes design development, product sourcing, quality control, customised container loads, and project supply. The following flow makes those stages easier to start.</p></div><div className="process__grid"><Step number="01" title="Discover" copy="Share the collection, category, reference, or project context." /><Step number="02" title="Develop" copy="Discuss product development and sourcing needs with the trade team." /><Step number="03" title="Review" copy="Align on specifications, materials, quantities, and project considerations." /><Step number="04" title="Enquire" copy="Send one consolidated request to the Umaid Craftorium trade desk." /></div></div></section>

    <section className="cta-block"><div className="shell cta-block__inner"><div><p className="eyebrow">Trade desk</p><h2>Ready to begin<br />a conversation?</h2></div><div><p>Share a product shortlist, an RFQ, or a custom brief. The enquiry flow keeps your selected pieces together so the trade team has the right starting context.</p><button className="button button--light" type="button" onClick={() => { trackIntent("begin_enquiry", { source: "home_cta" }); openEnquiry(); }}>Start an enquiry <ArrowRight size={17} /></button></div></div></section>
  </SiteFrame>;
}

function Step({ number, title, copy }: { number: string; title: string; copy: string }) {
  return <div className="process-step"><span>{number}</span><h3>{title}</h3><p>{copy}</p><ChevronRight size={19} /></div>;
}
