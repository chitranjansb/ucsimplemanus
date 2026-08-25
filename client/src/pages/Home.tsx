import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { ArrowUpRight, Check, ChevronRight, Instagram, Mail, Menu, MapPin, Phone, Sparkles, X } from "lucide-react";

const images = {
  hero: "/manus-storage/hero-craftsmanship_afcaa625.jpg",
  console: "/manus-storage/carved-console_af13fe5e.webp",
  heritage: "/manus-storage/heritage-architecture_dbe621ba.jpg",
  interiors: "/manus-storage/neutral-interiors_1abf43aa.webp",
};

export function buildInquiryMailto(name: string, email: string, project: string, message: string) {
  const subject = encodeURIComponent(`Umaid Craftorium inquiry from ${name}`);
  const body = encodeURIComponent(`Name: ${name}\\nEmail: ${email}\\nProject type: ${project}\\n\\nMessage:\\n${message}`);
  return `mailto:hello@umaidcraftorium.com?subject=${subject}&body=${body}`;
}

const collections = [
  { number: "01", title: "Statement Furniture", text: "Carved consoles, dining tables, and seating that bring quiet character to a room.", image: images.console },
  { number: "02", title: "Decorative Objects", text: "Small-batch pieces with a tactile point of view, made to be lived with and passed on.", image: images.interiors },
  { number: "03", title: "Bespoke Projects", text: "A considered path from a first sketch to a singular piece made for your space.", image: images.heritage },
];

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [inquiryState, setInquiryState] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const createInquiry = trpc.inquiries.create.useMutation({
    onSuccess: () => setInquiryState("success"),
    onError: () => setInquiryState("error"),
  });

  const submitInquiry = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setInquiryState("submitting");
    createInquiry.mutate({
      name: String(form.get("name")),
      email: String(form.get("email")),
      project: String(form.get("project")),
      message: String(form.get("message")),
    });
  };

  return (
    <main className="site-shell">
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Umaid Craftorium home">
          <span className="brand-mark">UC</span>
          <span>Umaid Craftorium</span>
        </a>
        <button className="menu-toggle" aria-expanded={menuOpen} aria-controls="main-navigation" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X size={20} /> : <Menu size={20} />}<span className="sr-only">Toggle navigation</span>
        </button>
        <nav id="main-navigation" className={`main-nav ${menuOpen ? "is-open" : ""}`} aria-label="Primary navigation">
          <a href="#collections" onClick={() => setMenuOpen(false)}>Collections</a>
          <a href="#craftsmanship" onClick={() => setMenuOpen(false)}>Craftsmanship</a>
          <a href="#story" onClick={() => setMenuOpen(false)}>Our story</a>
          <a className="nav-cta" href="#inquire" onClick={() => setMenuOpen(false)}>Start an inquiry <ArrowUpRight size={15} /></a>
        </nav>
      </header>

      <section id="top" className="hero section-pad">
        <div className="hero-copy">
          <p className="eyebrow"><span className="eyebrow-line" /> Handcrafted in India</p>
          <h1>Objects with a <em>point of view.</em></h1>
          <p className="hero-lede">Furniture and decorative pieces shaped by skilled hands, enduring materials, and the warmth of a well-made life.</p>
          <div className="hero-actions">
            <a className="button button-dark" href="#collections">Explore collections <ArrowUpRight size={17} /></a>
            <a className="text-link" href="#story">Discover our story <ChevronRight size={16} /></a>
          </div>
        </div>
        <div className="hero-visual">
          <img src={images.hero} alt="Artisan hand-carving a detailed wooden panel" />
          <div className="hero-caption"><span>01</span><span>Made slowly. Meant to last.</span></div>
        </div>
        <div className="hero-note"><Sparkles size={15} /> Crafted for considered spaces</div>
      </section>

      <section id="story" className="intro section-pad">
        <div className="section-kicker">A house of considered craft</div>
        <div className="intro-grid">
          <h2>Heritage in the hand.<br /><span>Modernity in the room.</span></h2>
          <div className="intro-copy"><p>Umaid Craftorium brings together the richness of Indian craft traditions and a clear, contemporary eye. Every piece begins with material: the grain of timber, the weight of stone, the irregular beauty of a hand-finished surface.</p><a className="text-link" href="#craftsmanship">How we make <ChevronRight size={16} /></a></div>
        </div>
      </section>

      <section id="collections" className="collections section-pad">
        <div className="section-heading"><div><div className="section-kicker">The edit</div><h2>Made to become part<br />of your story.</h2></div><p>Explore a considered selection of furniture and objects for homes, hospitality, and spaces with a point of view.</p></div>
        <div className="collection-grid">{collections.map((item) => <a className="collection-card" href="#inquire" key={item.number}><div className="collection-image"><img src={item.image} alt={`${item.title} from Umaid Craftorium`} /><span className="collection-number">{item.number}</span><span className="card-arrow"><ArrowUpRight size={19} /></span></div><h3>{item.title}</h3><p>{item.text}</p></a>)}</div>
      </section>

      <section id="craftsmanship" className="craft-section section-pad">
        <div className="craft-image"><img src={images.heritage} alt="Historic carved architecture reflecting Indian decorative craft" /><div className="image-stamp">Est. 1998<br /><span>Jodhpur · India</span></div></div>
        <div className="craft-copy"><div className="section-kicker">The craft behind the craft</div><h2>Good design<br /><em>takes its time.</em></h2><p>From the first cut to the final polish, our work is guided by patient making. We collaborate with master artisans whose knowledge lives in the details: a joinery line, a softened edge, a pattern held in balance.</p><div className="craft-points"><div><strong>01</strong><span>Honest materials</span></div><div><strong>02</strong><span>Skilled hands</span></div><div><strong>03</strong><span>Lasting forms</span></div></div><a className="button button-light" href="#inquire">Discuss a project <ArrowUpRight size={17} /></a></div>
      </section>

      <section className="quote-band"><p>“The beauty of a handmade object is that it carries the memory of how it came to be.”</p><span>— Umaid Craftorium</span></section>

      <section id="inquire" className="inquiry section-pad">
        <div className="inquiry-intro"><div className="section-kicker">Let’s make something meaningful</div><h2>Bring a little<br /><em>more soul home.</em></h2><p>Tell us what you are looking for, whether it is a single heirloom piece or a complete collection for a new space.</p><div className="contact-details"><a href="mailto:hello@umaidcraftorium.com"><Mail size={16} /> hello@umaidcraftorium.com</a><a href="tel:+919829000000"><Phone size={16} /> +91 98290 00000</a><span><MapPin size={16} /> Jodhpur, Rajasthan, India</span></div></div>
        <form className="inquiry-form" onSubmit={submitInquiry} aria-label="Project inquiry form">{inquiryState === "submitting" ? <div className="success-state"><div className="success-icon"><Sparkles size={19} /></div><h3>Sending your inquiry…</h3><p>We are saving your project details securely.</p></div> : inquiryState === "success" ? <div className="success-state"><div className="success-icon"><Check size={22} /></div><h3>Thank you for reaching out.</h3><p>Your inquiry has been received. Our team will review it and contact you soon. You can also email us directly if your request is time-sensitive.</p><button type="button" className="text-link" onClick={() => setInquiryState("idle")}>Send another inquiry <ChevronRight size={16} /></button></div> : inquiryState === "error" ? <div className="success-state"><div className="success-icon"><X size={22} /></div><h3>We could not save your inquiry.</h3><p>Please use the email link on the left to contact Umaid Craftorium directly, or try submitting again.</p><button type="button" className="text-link" onClick={() => setInquiryState("idle")}>Try again <ChevronRight size={16} /></button></div> : <><div className="form-row"><label>Name<input required name="name" placeholder="Your name" /></label><label>Email<input required type="email" name="email" placeholder="you@example.com" /></label></div><label>What can we help you with?<select name="project"><option>Tell us about a custom piece</option><option>Explore a collection</option><option>Hospitality or commercial project</option><option>Something else</option></select></label><label>Message<textarea required name="message" rows={5} placeholder="A little about your space, timeline, or the pieces you have in mind..." /></label><button className="button button-dark" type="submit">Send inquiry <ArrowUpRight size={17} /></button><p className="form-note">We respect your inbox. Your information is used only to respond to this inquiry.</p></>}</form>
      </section>

      <footer className="site-footer"><a className="brand" href="#top"><span className="brand-mark">UC</span><span>Umaid Craftorium</span></a><p>Made with patience in the Blue City.</p><div className="footer-links"><a href="#collections">Collections</a><a href="#story">About</a><a href="#inquire">Contact</a><a href="#top" aria-label="Instagram"><Instagram size={17} /></a></div></footer>
    </main>
  );
}
