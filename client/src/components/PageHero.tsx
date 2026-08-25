import { ArrowRight } from "lucide-react";
import { Link } from "wouter";

export function PageHero({ eyebrow, title, copy, image, imageAlt, action }: { eyebrow: string; title: React.ReactNode; copy: string; image?: string; imageAlt?: string; action?: { label: string; href: string } }) {
  return <section className={`page-hero ${image ? "has-image" : ""}`}><div className="shell page-hero__inner"><div className="page-hero__copy"><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p>{copy}</p>{action && <Link href={action.href} className="button button--dark">{action.label} <ArrowRight size={17} /></Link>}</div>{image && <div className="page-hero__image"><img src={image} alt={imageAlt || ""} /></div>}</div></section>;
}

