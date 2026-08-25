import { Meta, SiteFrame } from "@/components/SiteLayout";
import { useComparison } from "@/contexts/ComparisonContext";
import { useEnquiry } from "@/contexts/EnquiryContext";
import { products as fallbackProducts, type Product } from "@/lib/catalog";
import { formatDimensionValue, formatOptionalValue, formatWeightValue, type DisplayUnit } from "@/lib/units";
import { trpc } from "@/lib/trpc";
import { buildSharedComparisonUrl, buildSharedRfqUrl, parseSharedComparisonIds } from "@/lib/comparisonStorage";
import { ArrowRight, Check, Minus, Share2, Trash2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";

const requestOnly = "Available on request";

export default function Compare() {
  const { ids, replace, remove, clear, max } = useComparison();
  const [location] = useLocation();
  const { addItems, openEnquiry } = useEnquiry();
  const [unit, setUnit] = useState<DisplayUnit>("metric");
  const [shareStatus, setShareStatus] = useState<"idle" | "copied" | "error">("idle");
  const autoRfqOpened = useRef(false);
  const sharedSearch = typeof window === "undefined" ? "" : window.location.search;
  const sharedIds = useMemo(() => parseSharedComparisonIds(sharedSearch), [location, sharedSearch]);
  const wantsRfq = useMemo(() => new URLSearchParams(sharedSearch).get("rfq") === "1", [sharedSearch]);
  useEffect(() => { if (sharedIds.length && sharedIds.join(",") !== ids.join(",")) replace(sharedIds); }, [ids, replace, sharedIds]);
  const catalogue = trpc.catalogue.list.useQuery({ limit: 100 }, { retry: false });
  const comparedProducts = useMemo(() => {
    const byId = new Map<string, Product>(fallbackProducts.map((product) => [product.id, product]));
    catalogue.data?.forEach((product) => byId.set(product.id, product as Product));
    return ids.map((id) => byId.get(id)).filter((product): product is Product => Boolean(product));
  }, [catalogue.data, ids]);
  useEffect(() => { if (wantsRfq && sharedIds.length && comparedProducts.length && !autoRfqOpened.current) { autoRfqOpened.current = true; addItems(comparedProducts); openEnquiry(); } }, [addItems, comparedProducts, openEnquiry, sharedIds.length, wantsRfq]);
  const addAllToRfq = () => { addItems(comparedProducts); openEnquiry(); };
  const shareShortlist = async (rfq = false) => { try { await navigator.clipboard.writeText((rfq ? buildSharedRfqUrl : buildSharedComparisonUrl)(window.location.origin, ids)); setShareStatus("copied"); toast.success(rfq ? "RFQ shortlist link copied." : "Shortlist link copied."); } catch { setShareStatus("error"); toast.error("Copy was unavailable. Please copy the page URL instead."); } };

  return <SiteFrame><Meta title="Compare furniture references" description="Compare up to four Umaid Craftorium furniture references and add a considered shortlist to your trade enquiry." /><section className="catalogue-hero"><div className="shell"><p className="eyebrow">Trade shortlist · {ids.length}/{max}</p><h1>Compare your<br /><em>shortlist.</em></h1><p>Place up to four catalogue references side by side. Confirm live specifications, materials, and availability with the trade desk before ordering.</p></div></section><section className="section-space"><div className="shell">{comparedProducts.length === 0 ? <div className="catalogue-empty"><h2>No references selected.</h2><p>Choose products from the catalogue to compare their available details here.</p><Link href="/collections" className="button button--dark">Browse collections <ArrowRight size={17} /></Link></div> : <><div className="compare-toolbar"><div><p className="eyebrow">Structured comparison</p><p className="compare-toolbar__count">{comparedProducts.length} of {max} references selected</p></div><div className="compare-toolbar__actions"><label className="compare-unit"><span>Units</span><select value={unit} onChange={(event) => setUnit(event.target.value as DisplayUnit)} aria-label="Choose dimension and weight units"><option value="metric">Metric</option><option value="imperial">Imperial</option></select></label><button type="button" className="text-action" onClick={clear}>Clear all <Trash2 size={14} /></button><button type="button" className="text-action" onClick={() => shareShortlist(false)}><Share2 size={14} /> {shareStatus === "copied" ? "Link copied" : "Share shortlist"}</button><button type="button" className="text-action" onClick={() => shareShortlist(true)}><Share2 size={14} /> Share RFQ link</button><button type="button" className="button button--dark" onClick={addAllToRfq}>Add all to RFQ <ArrowRight size={17} /></button></div></div><div className="compare-scroll" role="region" aria-label="Product comparison table" tabIndex={0}><table className="compare-table"><thead><tr><th scope="col">Detail</th>{comparedProducts.map((product) => <th scope="col" key={product.id}><div className="compare-product"><img src={product.image} alt={product.imageAlt} /><Link href={`/collections/${product.id}`}>{product.name}</Link><span>{product.collection} collection</span><button type="button" className="compare-remove" onClick={() => remove(product.id)} aria-label={`Remove ${product.name} from comparison`}><Minus size={14} /> Remove</button></div></th>)}</tr></thead><tbody><CompareRow label="SKU" values={comparedProducts.map((product) => product.sku || product.productCode || requestOnly)} /><CompareRow label="Collection" values={comparedProducts.map((product) => product.collection)} /><CompareRow label="Category" values={comparedProducts.map((product) => product.category)} /><CompareRow label="Material" values={comparedProducts.map((product) => product.material || product.materials?.join(" · ") || requestOnly)} /><CompareRow label="Finish" values={comparedProducts.map((product) => product.finish || product.finishes?.join(" · ") || requestOnly)} /><CompareRow label="Dimensions" values={comparedProducts.map((product) => formatDimensionValue(product.dimensions, unit))} /><CompareRow label="Weight" values={comparedProducts.map((product) => formatWeightValue(product.weightKg, unit))} /><CompareRow label="MOQ" values={comparedProducts.map((product) => formatOptionalValue(product.moq))} /><CompareRow label="Customisation" values={comparedProducts.map((product) => product.customizable === undefined ? requestOnly : product.customizable ? "Available" : "Not specified")} /><CompareRow label="Availability" values={comparedProducts.map((product) => product.availability === "available" ? "Available" : product.availability === "discontinued" ? "Discontinued" : requestOnly)} /></tbody></table></div><div className="compare-footnote"><Check size={16} /> Missing commercial or technical details are intentionally shown as available on request.</div></>}</div></section></SiteFrame>;
}

function CompareRow({ label, values }: { label: string; values: string[] }) { return <tr><th scope="row">{label}</th>{values.map((value, index) => <td key={`${label}-${index}`}>{value}</td>)}</tr>; }
