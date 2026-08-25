import { ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { getImageFocalStyle, type ImageFocalPoint } from "@/lib/imageFocal";

export function PageHero({ eyebrow, title, copy, image, imageAlt, imageFocal, action }: { eyebrow: string; title: React.ReactNode; copy: string; image?: string; imageAlt?: string; imageFocal?: ImageFocalPoint; action?: { label: string; href: string } }) {
  return <section className={`page-hero ${image ? "has-image" : ""}`}><div className="shell page-hero__inner"><div className="page-hero__copy"><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p>{copy}</p>{action && <Link href={action.href} className="button button--dark">{action.label} <ArrowRight size={17} /></Link>}</div>{image && <div className="page-hero__image"><img src={image} alt={imageAlt || ""} style={getImageFocalStyle(imageFocal)} /></div>}</div></section>;
}
