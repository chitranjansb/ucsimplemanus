import { useEnquiry } from "@/contexts/EnquiryContext";
import { trackIntent } from "@/lib/analytics";
import { trpc } from "@/lib/trpc";
import { buildRfqPayload } from "@shared/enquiry";
import { ArrowRight, Check, ChevronDown, Menu, Minus, Phone, Plus, ShoppingBag, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";

const primaryLinks = [
  { href: "/collections", label: "Collections" },
  { href: "/manufacturing", label: "Manufacturing" },
  { href: "/custom-furniture", label: "Custom furniture" },
  { href: "/export", label: "Export" },
  { href: "/about", label: "About" },
];

export function Meta({ title, description }: { title: string; description: string }) {
  useEffect(() => {
    document.title = `${title} | Umaid Craftorium`;
    const descriptionTag = document.querySelector('meta[name="description"]');
    if (descriptionTag) descriptionTag.setAttribute("content", description);
    const canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) canonical.setAttribute("href", `${window.location.origin}${window.location.pathname}`);
  }, [description, title]);
  return null;
}

export function SiteHeader() {
  const [location] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const { items, openEnquiry } = useEnquiry();

  useEffect(() => setMenuOpen(false), [location]);

  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link href="/" className="wordmark" aria-label="Umaid Craftorium home">
          <span className="wordmark__monogram" aria-hidden="true">UC</span>
          <span className="wordmark__text"><strong>Umaid</strong><small>Craftorium</small></span>
        </Link>

        <nav className="desktop-nav" aria-label="Primary navigation">
          {primaryLinks.map((link) => <Link key={link.href} href={link.href} className={location === link.href ? "is-active" : ""}>{link.label}</Link>)}
        </nav>

        <div className="site-header__actions">
          <button className="enquiry-count" type="button" onClick={() => { trackIntent("open_enquiry", { source: "header" }); openEnquiry(); }} aria-label={`Open enquiry list with ${items.length} selected products`}>
            <ShoppingBag size={17} strokeWidth={1.7} /><span>Enquiry</span><b>{items.length}</b>
          </button>
          <button className="mobile-menu-button" type="button" onClick={() => setMenuOpen((open) => !open)} aria-label="Toggle navigation" aria-expanded={menuOpen}>
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      <nav className={`mobile-nav ${menuOpen ? "is-open" : ""}`} aria-label="Mobile navigation">
        {primaryLinks.map((link) => <Link key={link.href} href={link.href}>{link.label}<ArrowRight size={16} /></Link>)}
        <Link href="/contact" className="mobile-nav__cta">Request a quote <ArrowRight size={16} /></Link>
      </nav>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer__top shell">
        <div>
          <div className="footer-kicker">Trade furniture · Jodhpur, India</div>
          <h2>Built for the people<br />who shape spaces.</h2>
        </div>
        <Link href="/contact" className="button button--light">Start an enquiry <ArrowRight size={17} /></Link>
      </div>
      <div className="site-footer__bottom shell">
        <div className="footer-brand"><span className="wordmark__monogram">UC</span><span><strong>Umaid</strong> Craftorium</span></div>
        <div className="footer-links" aria-label="Footer navigation">
          <Link href="/collections">Collections</Link><Link href="/manufacturing">Manufacturing</Link><Link href="/export">Export</Link><Link href="/about">About</Link><Link href="/contact">Contact</Link>
        </div>
        <p>© {new Date().getFullYear()} Umaid Craftorium</p>
      </div>
    </footer>
  );
}

export function SiteFrame({ children }: { children: React.ReactNode }) {
  return <><SiteHeader /><main>{children}</main><SiteFooter /><EnquiryPanel /></>;
}

function EnquiryPanel() {
  const { items, isOpen, closeEnquiry, removeItem, clearItems } = useEnquiry();
  const [formOpen, setFormOpen] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const createInquiry = trpc.inquiries.create.useMutation({
    onSuccess: () => { setStatus("success"); clearItems(); },
    onError: () => setStatus("error"),
  });

  useEffect(() => {
    const onKeydown = (event: KeyboardEvent) => { if (event.key === "Escape") closeEnquiry(); };
    if (isOpen) window.addEventListener("keydown", onKeydown);
    return () => window.removeEventListener("keydown", onKeydown);
  }, [closeEnquiry, isOpen]);

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const rfq = buildRfqPayload({
      buyerType: String(form.get("buyerType")),
      projectType: String(form.get("projectType")),
      country: String(form.get("country")),
      phone: String(form.get("phone") || ""),
      quantity: String(form.get("quantity") || ""),
      timeline: String(form.get("timeline") || ""),
      message: String(form.get("message")),
    }, items);
    setStatus("idle");
    createInquiry.mutate({ name: String(form.get("name")), email: String(form.get("email")), ...rfq });
    trackIntent("submit_enquiry", { products: items.length });
  };

  return (
    <div className={`enquiry-overlay ${isOpen ? "is-open" : ""}`} aria-hidden={!isOpen}>
      <div className="enquiry-backdrop" onClick={closeEnquiry} />
      <aside className="enquiry-panel" aria-label="Request a quote">
        <div className="panel-heading"><div><span className="eyebrow">Trade desk</span><h2>{formOpen ? "Tell us about your brief" : "Your enquiry list"}</h2></div><button type="button" className="icon-button" onClick={closeEnquiry} aria-label="Close enquiry"><X size={22} /></button></div>

        {!formOpen ? <>
          <div className="enquiry-list">
            {items.length ? items.map((item) => <div className="enquiry-item" key={item.id}><img src={item.image} alt="" /><div><p>{item.name}</p><span>{item.collection} collection</span></div><button type="button" onClick={() => removeItem(item.id)} aria-label={`Remove ${item.name}`}><Minus size={15} /></button></div>) : <div className="enquiry-empty"><ShoppingBag size={25} /><p>Your selection is empty.</p><span>Add products from the catalogue or start with a general project brief.</span></div>}
          </div>
          <div className="panel-actions"><button className="button button--dark button--wide" type="button" onClick={() => { setFormOpen(true); trackIntent("begin_enquiry", { products: items.length }); }}>Continue to enquiry <ArrowRight size={17} /></button><Link href="/collections" onClick={closeEnquiry} className="text-action">Browse collections <ArrowRight size={15} /></Link></div>
        </> : status === "success" ? <div className="panel-success"><span className="success-mark"><Check size={23} /></span><h3>Thank you for your enquiry.</h3><p>Your details have been received. The Umaid Craftorium team can follow up using the contact information you supplied.</p><button type="button" className="button button--dark" onClick={() => { setFormOpen(false); closeEnquiry(); setStatus("idle"); }}>Close</button></div> : <form className="rfq-form" onSubmit={submit}>
          <div className="field-pair"><Field label="Name" name="name" required /><Field label="Work email" name="email" type="email" required /></div>
          <div className="field-pair"><SelectField label="Buyer type" name="buyerType" options={["Architect / designer", "Retailer / wholesaler", "Hospitality", "Developer / contractor", "Other"]} /><Field label="Country" name="country" required /></div>
          <SelectField label="Project type" name="projectType" options={["Collection sourcing", "Custom development", "Hospitality / contract", "Container order", "Other"]} />
          <div className="field-pair"><Field label="Phone" name="phone" /><Field label="Quantity" name="quantity" placeholder="e.g. 24 pieces" /></div>
          <SelectField label="Timing" name="timeline" options={["Exploring options", "Within 3 months", "3–6 months", "More than 6 months"]} />
          <label className="field"><span>Requirements</span><textarea name="message" minLength={10} required placeholder="Tell us about your specifications, references, finish requirements, or project context." rows={4} /></label>
          {status === "error" && <p className="form-error">We could not save your enquiry. Please try again or contact us at info@umaidcraftorium.com.</p>}
          <button className="button button--dark button--wide" type="submit" disabled={createInquiry.isPending}>{createInquiry.isPending ? "Sending enquiry…" : "Send enquiry"}<ArrowRight size={17} /></button>
          <button type="button" className="text-action" onClick={() => setFormOpen(false)}>Back to selection</button>
        </form>}
      </aside>
    </div>
  );
}

function Field({ label, name, type = "text", placeholder, required = false }: { label: string; name: string; type?: string; placeholder?: string; required?: boolean }) {
  return <label className="field"><span>{label}</span><input name={name} type={type} placeholder={placeholder} required={required} /></label>;
}

function SelectField({ label, name, options }: { label: string; name: string; options: string[] }) {
  return <label className="field"><span>{label}</span><span className="select-wrap"><select name={name} required><option value="">Select an option</option>{options.map((option) => <option key={option}>{option}</option>)}</select><ChevronDown size={15} /></span></label>;
}
