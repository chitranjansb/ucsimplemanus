import { useEnquiry } from "@/contexts/EnquiryContext";
import { trackIntent } from "@/lib/analytics";
import { ACCEPTED_RAQ_ATTACHMENT_TYPES, encodeRfqAttachments, MAX_RAQ_ATTACHMENTS, MAX_RAQ_ATTACHMENT_BYTES, validateRfqFiles } from "@/lib/rfqAttachments";
import { publicNavigation, translate } from "@/lib/i18n";
import { SITE_ORIGIN } from "@/lib/seo";
import { trpc } from "@/lib/trpc";
import { ArrowRight, Check, ChevronDown, Menu, Minus, Plus, ShoppingBag, Upload, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "wouter";

const primaryLinks = publicNavigation();

type ProjectDetails = {
  name: string; email: string; company: string; phone: string; buyerType: string; projectType: string;
  shippingCountry: string; targetMarket: string; timeline: string; customizationRequirements: string; message: string; website: string;
};

const initialDetails: ProjectDetails = { name: "", email: "", company: "", phone: "", buyerType: "", projectType: "", shippingCountry: "", targetMarket: "", timeline: "", customizationRequirements: "", message: "", website: "" };

export function Meta({ title, description, image, structuredData }: { title: string; description: string; image?: string; structuredData?: Record<string, unknown> | Record<string, unknown>[] }) {
  useEffect(() => {
    const pageTitle = `${title} | Umaid Craftorium`;
    const canonicalUrl = `${SITE_ORIGIN}${window.location.pathname}`;
    const ensureMeta = (selector: string, attribute: "name" | "property", value: string) => {
      let element = document.querySelector(selector) as HTMLMetaElement | null;
      if (!element) { element = document.createElement("meta"); element.setAttribute(attribute, value); document.head.appendChild(element); }
      return element;
    };
    document.title = pageTitle;
    ensureMeta('meta[name="description"]', "name", "description").setAttribute("content", description);
    ensureMeta('meta[property="og:title"]', "property", "og:title").setAttribute("content", pageTitle);
    ensureMeta('meta[property="og:description"]', "property", "og:description").setAttribute("content", description);
    ensureMeta('meta[property="og:url"]', "property", "og:url").setAttribute("content", canonicalUrl);
    ensureMeta('meta[name="twitter:card"]', "name", "twitter:card").setAttribute("content", image ? "summary_large_image" : "summary");
    ensureMeta('meta[name="twitter:title"]', "name", "twitter:title").setAttribute("content", pageTitle);
    ensureMeta('meta[name="twitter:description"]', "name", "twitter:description").setAttribute("content", description);
    if (image) { ensureMeta('meta[property="og:image"]', "property", "og:image").setAttribute("content", `${SITE_ORIGIN}${image}`); ensureMeta('meta[name="twitter:image"]', "name", "twitter:image").setAttribute("content", `${SITE_ORIGIN}${image}`); }
    document.querySelector('link[rel="canonical"]')?.setAttribute("href", canonicalUrl);
    const scriptId = "umaid-page-structured-data";
    document.getElementById(scriptId)?.remove();
    if (structuredData) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.type = "application/ld+json";
      script.textContent = JSON.stringify(Array.isArray(structuredData) ? { "@context": "https://schema.org", "@graph": structuredData } : structuredData);
      document.head.appendChild(script);
    }
    return () => document.getElementById(scriptId)?.remove();
  }, [description, image, structuredData, title]);
  return null;
}

export function SiteHeader() {
  const [location] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const { items, openEnquiry } = useEnquiry();
  useEffect(() => setMenuOpen(false), [location]);
  return <header className="site-header"><div className="site-header__inner">
    <Link href="/" className="wordmark" aria-label="Umaid Craftorium home"><span className="wordmark__monogram" aria-hidden="true">UC</span><span className="wordmark__text"><strong>Umaid</strong><small>Craftorium</small></span></Link>
    <nav className="desktop-nav" aria-label="Primary navigation">{primaryLinks.map((link) => <Link key={link.href} href={link.href} className={location === link.href ? "is-active" : ""}>{link.label}</Link>)}</nav>
    <div className="site-header__actions"><button className="enquiry-count" type="button" onClick={() => { trackIntent("project_open", { source: "header", selectedProducts: items.length }); openEnquiry(); }} aria-label={`Open project enquiry with ${items.length} selected products`}><ShoppingBag size={17} strokeWidth={1.7} /><span>{translate("en", "enquiry")}</span><b>{items.length}</b></button><button className="mobile-menu-button" type="button" onClick={() => setMenuOpen((open) => !open)} aria-label="Toggle navigation" aria-expanded={menuOpen}>{menuOpen ? <X size={22} /> : <Menu size={22} />}</button></div>
  </div><nav className={`mobile-nav ${menuOpen ? "is-open" : ""}`} aria-label="Mobile navigation">{primaryLinks.map((link) => <Link key={link.href} href={link.href}>{link.label}<ArrowRight size={16} /></Link>)}<Link href="/contact" className="mobile-nav__cta">Request a quote <ArrowRight size={16} /></Link></nav></header>;
}

export function SiteFooter() {
  return <footer className="site-footer"><div className="site-footer__top shell"><div><div className="footer-kicker">Trade furniture · Jodhpur, India</div><h2>Built for the people<br />who shape spaces.</h2></div><Link href="/contact" className="button button--light">Start an enquiry <ArrowRight size={17} /></Link></div><div className="site-footer__bottom shell"><div className="footer-brand"><span className="wordmark__monogram">UC</span><span><strong>Umaid</strong> Craftorium</span></div><div className="footer-links" aria-label="Footer navigation"><Link href="/collections">Collections</Link><Link href="/manufacturing">Manufacturing</Link><Link href="/export">Export</Link><Link href="/about">About</Link><Link href="/contact">Contact</Link></div><p>© {new Date().getFullYear()} Umaid Craftorium</p></div></footer>;
}

export function SiteFrame({ children }: { children: React.ReactNode }) {
  return <><SiteHeader /><main>{children}</main><SiteFooter /><EnquiryPanel /></>;
}

function EnquiryPanel() {
  const { items, isOpen, closeEnquiry, removeItem, updateQuantity, clearItems } = useEnquiry();
  const [step, setStep] = useState<"selection" | "details" | "review">("selection");
  const [details, setDetails] = useState<ProjectDetails>(initialDetails);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const createInquiry = trpc.inquiries.create.useMutation({
    onSuccess: () => { setStatus("success"); clearItems(); trackIntent("rfq_submit", { selectedProducts: items.length, attachmentCount: attachments.length }); },
    onError: () => { setStatus("error"); trackIntent("rfq_error", { selectedProducts: items.length }); },
  });

  const totalUnits = useMemo(() => items.reduce((sum, item) => sum + item.quantity, 0), [items]);

  useEffect(() => {
    const onKeydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") { closeEnquiry(); return; }
      if (event.key !== "Tab" || !panelRef.current) return;
      const focusable = Array.from(panelRef.current.querySelectorAll<HTMLElement>('button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled])')).filter((element) => element.offsetParent !== null);
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    if (isOpen) { window.addEventListener("keydown", onKeydown); window.setTimeout(() => closeButtonRef.current?.focus(), 0); }
    return () => window.removeEventListener("keydown", onKeydown);
  }, [closeEnquiry, isOpen]);

  const reset = () => { setStep("selection"); setStatus("idle"); setAttachments([]); setAttachmentError(null); setDetails(initialDetails); setStartedAt(null); };
  const handleClose = () => { closeEnquiry(); if (status === "success") reset(); };
  const startDetails = () => { setStep("details"); setStatus("idle"); setStartedAt(Date.now()); trackIntent("rfq_start", { selectedProducts: items.length }); };

  const selectAttachments = (files: FileList | null) => {
    const selected = files ? Array.from(files) : [];
    const error = validateRfqFiles(selected);
    setAttachmentError(error);
    if (!error) { setAttachments(selected); trackIntent("attachment_select", { attachmentCount: selected.length }); }
  };

  const review = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const next = Object.fromEntries(data.entries()) as Record<keyof ProjectDetails, string>;
    setDetails((current) => ({ ...current, ...next }));
    setStep("review");
    trackIntent("rfq_step_complete", { step: 1, selectedProducts: items.length });
  };

  const submit = async () => {
    setStatus("idle");
    try {
      const encodedAttachments = await encodeRfqAttachments(attachments);
      createInquiry.mutate({
        ...details,
        submittedAt: startedAt ?? Date.now(),
        items: items.map((item) => ({ productReference: item.name, collectionName: item.collection, quantity: item.quantity })),
        attachments: encodedAttachments,
      });
    } catch {
      setStatus("error");
      setAttachmentError("We could not prepare the selected attachment. Please try another file.");
    }
  };

  const heading = status === "success" ? "Thank you for your enquiry" : step === "selection" ? "Your project enquiry" : step === "details" ? "Tell us about your brief" : "Review your enquiry";

  return <div className={`enquiry-overlay ${isOpen ? "is-open" : ""}`} aria-hidden={!isOpen}><div className="enquiry-backdrop" onClick={handleClose} />
    <aside ref={panelRef} className="enquiry-panel" role="dialog" aria-modal="true" aria-labelledby="enquiry-heading">
      <div className="panel-heading"><div><span className="eyebrow">Trade desk · {step === "selection" ? "1" : step === "details" ? "2" : "3"} of 3</span><h2 id="enquiry-heading">{heading}</h2></div><button ref={closeButtonRef} type="button" className="icon-button" onClick={handleClose} aria-label="Close enquiry"><X size={22} /></button></div>
      {status === "success" ? <div className="panel-success" role="status"><span className="success-mark"><Check size={23} /></span><h3>Thank you for your enquiry.</h3><p>Your details have been received. The Umaid Craftorium team can follow up using the contact information you supplied.</p><button type="button" className="button button--dark" onClick={handleClose}>Close</button></div> : step === "selection" ? <SelectionStep items={items} totalUnits={totalUnits} onRemove={removeItem} onQuantity={updateQuantity} onContinue={startDetails} onBrowse={closeEnquiry} /> : step === "details" ? <DetailsStep details={details} attachments={attachments} attachmentError={attachmentError} onAttachmentChange={selectAttachments} onSubmit={review} onBack={() => setStep("selection")} /> : <ReviewStep details={details} attachments={attachments} items={items} totalUnits={totalUnits} pending={createInquiry.isPending} status={status} onBack={() => setStep("details")} onSubmit={submit} />}
    </aside>
  </div>;
}

function SelectionStep({ items, totalUnits, onRemove, onQuantity, onContinue, onBrowse }: { items: ReturnType<typeof useEnquiry>["items"]; totalUnits: number; onRemove: (id: string) => void; onQuantity: (id: string, quantity: number) => void; onContinue: () => void; onBrowse: () => void }) {
  return <><div className="enquiry-list">{items.length ? items.map((item) => <div className="enquiry-item" key={item.id}><img src={item.image} alt="" /><div><p>{item.name}</p><span>{item.collection} collection</span><div className="project-quantity" aria-label={`Quantity for ${item.name}`}><button type="button" onClick={() => onQuantity(item.id, item.quantity - 1)} disabled={item.quantity <= 1} aria-label={`Reduce quantity for ${item.name}`}><Minus size={13} /></button><input type="number" min="1" max="500" value={item.quantity} onChange={(event) => onQuantity(item.id, Number(event.target.value))} aria-label={`Quantity for ${item.name}`} /><button type="button" onClick={() => onQuantity(item.id, item.quantity + 1)} aria-label={`Increase quantity for ${item.name}`}><Plus size={13} /></button></div></div><button type="button" onClick={() => onRemove(item.id)} aria-label={`Remove ${item.name}`}><Minus size={15} /></button></div>) : <div className="enquiry-empty"><ShoppingBag size={25} /><p>Your selection is empty.</p><span>You can still send a general project brief, or add references from the catalogue.</span></div>}</div><p className="project-summary">{items.length ? `${items.length} selected reference${items.length === 1 ? "" : "s"} · ${totalUnits} requested unit${totalUnits === 1 ? "" : "s"}` : "General project enquiry"}</p><div className="panel-actions"><button className="button button--dark button--wide" type="button" onClick={onContinue}>Continue to project details <ArrowRight size={17} /></button><Link href="/collections" onClick={onBrowse} className="text-action">Browse collections <ArrowRight size={15} /></Link></div></>;
}

function DetailsStep({ details, attachments, attachmentError, onAttachmentChange, onSubmit, onBack }: { details: ProjectDetails; attachments: File[]; attachmentError: string | null; onAttachmentChange: (files: FileList | null) => void; onSubmit: (event: React.FormEvent<HTMLFormElement>) => void; onBack: () => void }) {
  return <form className="rfq-form" onSubmit={onSubmit}><div className="field-pair"><Field label="Name" name="name" defaultValue={details.name} required /><Field label="Work email" name="email" type="email" defaultValue={details.email} required /></div><div className="field-pair"><Field label="Company" name="company" defaultValue={details.company} /><Field label="Phone" name="phone" defaultValue={details.phone} /></div><div className="field-pair"><SelectField label="Buyer type" name="buyerType" value={details.buyerType} options={["Architect / designer", "Retailer / wholesaler", "Hospitality", "Developer / contractor", "Other"]} /><Field label="Shipping destination" name="shippingCountry" defaultValue={details.shippingCountry} required /></div><div className="field-pair"><SelectField label="Project type" name="projectType" value={details.projectType} options={["Collection sourcing", "Custom development", "Hospitality / contract", "Container order", "Other"]} /><Field label="Target market" name="targetMarket" defaultValue={details.targetMarket} placeholder="e.g. Italy" /></div><SelectField label="Timing" name="timeline" value={details.timeline} options={["Exploring options", "Within 3 months", "3–6 months", "More than 6 months"]} /><label className="field"><span>Customisation requirements</span><textarea name="customizationRequirements" defaultValue={details.customizationRequirements} placeholder="Optional: materials, finish direction, packaging, or other custom requirements." rows={3} /></label><label className="field"><span>Project context</span><textarea name="message" defaultValue={details.message} minLength={10} required placeholder="Tell us about your specifications, references, or project context." rows={4} /></label><label className="field rfq-attachments"><span>Reference files <em>Optional</em></span><input type="file" multiple accept={ACCEPTED_RAQ_ATTACHMENT_TYPES.join(",")} onChange={(event) => onAttachmentChange(event.currentTarget.files)} aria-describedby="attachment-help attachment-error" /><span id="attachment-help" className="field-help"><Upload size={14} /> PDF, JPG, PNG, WebP, XLS/XLSX, or TXT · up to {MAX_RAQ_ATTACHMENTS} files · 1.5 MB each</span>{attachments.length > 0 && <span className="attachment-list">{attachments.map((file) => <span key={`${file.name}-${file.size}`}>{file.name}</span>)}</span>}{attachmentError && <span id="attachment-error" className="form-error" role="alert">{attachmentError}</span>}</label><label className="honeypot" aria-hidden="true"><span>Website</span><input name="website" tabIndex={-1} autoComplete="off" /></label><button className="button button--dark button--wide" type="submit">Review enquiry <ArrowRight size={17} /></button><button type="button" className="text-action" onClick={onBack}>Back to selection</button></form>;
}

function ReviewStep({ details, attachments, items, totalUnits, pending, status, onBack, onSubmit }: { details: ProjectDetails; attachments: File[]; items: ReturnType<typeof useEnquiry>["items"]; totalUnits: number; pending: boolean; status: "idle" | "success" | "error"; onBack: () => void; onSubmit: () => void }) {
  return <div className="rfq-review"><p>Confirm the information below. Commercial details, specifications, and availability remain subject to discussion with the trade desk.</p><div className="review-block"><span>Contact</span><strong>{details.name} · {details.email}</strong>{details.company && <small>{details.company}</small>}</div><div className="review-block"><span>Project</span><strong>{[details.buyerType, details.projectType, details.shippingCountry].filter(Boolean).join(" · ") || "General project enquiry"}</strong><small>{details.targetMarket ? `Target market: ${details.targetMarket}` : "Target market not supplied"}{details.timeline ? ` · ${details.timeline}` : ""}</small></div><div className="review-block"><span>Selected references</span>{items.length ? <strong>{items.length} reference{items.length === 1 ? "" : "s"} · {totalUnits} unit{totalUnits === 1 ? "" : "s"}</strong> : <strong>No catalogue references selected</strong>}{items.map((item) => <small key={item.id}>{item.name} × {item.quantity}</small>)}</div><div className="review-block"><span>Attachments</span><strong>{attachments.length ? `${attachments.length} selected file${attachments.length === 1 ? "" : "s"}` : "No attachments"}</strong></div>{status === "error" && <p className="form-error" role="alert">We could not save your enquiry. Please try again or contact us at info@umaidcraftorium.com.</p>}<button className="button button--dark button--wide" type="button" disabled={pending} onClick={onSubmit}>{pending ? "Sending enquiry…" : "Send enquiry"}<ArrowRight size={17} /></button><button type="button" className="text-action" onClick={onBack}>Edit details</button></div>;
}

function Field({ label, name, type = "text", placeholder, required = false, defaultValue }: { label: string; name: string; type?: string; placeholder?: string; required?: boolean; defaultValue?: string }) {
  return <label className="field"><span>{label}</span><input name={name} type={type} placeholder={placeholder} required={required} defaultValue={defaultValue} /></label>;
}

function SelectField({ label, name, options, value }: { label: string; name: string; options: string[]; value?: string }) {
  return <label className="field"><span>{label}</span><span className="select-wrap"><select name={name} required defaultValue={value || ""}><option value="">Select an option</option>{options.map((option) => <option key={option} value={option}>{option}</option>)}</select><ChevronDown size={15} /></span></label>;
}
