import { Button } from "@/components/ui/button";
import { Meta, SiteFrame } from "@/components/SiteLayout";
import { ArrowRight } from "lucide-react";
import { Link } from "wouter";

export default function NotFound() {
  return <SiteFrame><Meta title="Page not found" description="The requested Umaid Craftorium page could not be found." /><section className="empty-page shell"><p className="eyebrow">404</p><h1>This page has moved<br />or does not exist.</h1><p>Return to the collection catalogue or start a direct trade enquiry.</p><div><Link href="/" className="button button--dark">Back home <ArrowRight size={17} /></Link><Link href="/collections" className="text-action">Browse collections <ArrowRight size={15} /></Link></div></section></SiteFrame>;
}
