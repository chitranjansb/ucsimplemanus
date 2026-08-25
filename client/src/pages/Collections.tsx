import { Meta, SiteFrame } from "@/components/SiteLayout";
import { ProductCard } from "@/components/ProductCard";
import { collections, filterProducts, productCategories } from "@/lib/catalog";
import { trackIntent } from "@/lib/analytics";
import { trpc } from "@/lib/trpc";
import { Search, SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";

export default function Collections() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<(typeof productCategories)[number]>("All");
  const [collection, setCollection] = useState("");
  const catalogueInput = useMemo(() => ({ query: query.trim() || undefined, category: category === "All" ? undefined : category.toLowerCase(), collection: collection || undefined, limit: 100 }), [category, collection, query]);
  const catalogueQuery = trpc.catalogue.list.useQuery(catalogueInput, { retry: false });
  const visibleProducts = useMemo(() => filterProducts(query, category, catalogueQuery.data || undefined, collection || undefined), [catalogueQuery.data, category, collection, query]);

  return <SiteFrame><Meta title="Collections" description="Browse Umaid Craftorium collection imagery and begin a trade enquiry for furniture, home interior, and project sourcing needs." />
    <section className="catalogue-hero"><div className="shell"><p className="eyebrow">The catalogue</p><h1>Find a useful<br /><em>starting point.</em></h1><p>Explore a broad furniture range and named collections, then request live specifications, materials, and availability directly from the trade desk.</p></div></section>
    <section className="catalogue section-space"><div className="shell"><div className="catalogue-toolbar"><label className="catalogue-search"><Search size={17} /><input value={query} onChange={(event) => { setQuery(event.target.value); trackIntent("catalogue_search", { query_length: event.target.value.length }); }} placeholder="Search a collection or furniture category" aria-label="Search catalogue" /></label><div className="catalogue-filter" aria-label="Filter by category"><SlidersHorizontal size={16} />{productCategories.map((item) => <button type="button" className={category === item ? "is-active" : ""} onClick={() => { setCategory(item); trackIntent("catalogue_filter", { category: item }); }} key={item}>{item}</button>)}</div><label className="catalogue-collection-select"><span>Collection</span><select value={collection} onChange={(event) => { setCollection(event.target.value); trackIntent("catalogue_collection_filter", { selected: event.target.value || "all" }); }} aria-label="Filter by named collection"><option value="">All collections</option>{collections.map((item) => <option value={item.slug} key={item.slug}>{item.name}</option>)}</select></label></div><div className="catalogue-meta"><p>{visibleProducts.length} product references shown</p><span>Use these references to begin a tailored trade enquiry.</span></div>{visibleProducts.length ? <div className="product-grid product-grid--three">{visibleProducts.map((product, index) => <ProductCard product={product} index={index} key={product.id} />)}</div> : <div className="catalogue-empty"><h2>No references found.</h2><p>Try another term or use the trade enquiry to describe a product category or custom brief.</p></div>}</div></section>
    <section className="named-collections section-space section-space--charcoal"><div className="shell"><div className="section-heading"><div><p className="eyebrow">Named collections</p><h2>Explore the wider<br />collection language.</h2></div><p>Each name can open a useful sourcing conversation. Confirm product availability and specifications directly with the trade desk.</p></div><div className="named-collections__grid">{collections.map((collection, index) => <span key={collection.slug}><b>{String(index + 1).padStart(2, "0")}</b>{collection.name}</span>)}</div></div></section>
  </SiteFrame>;
}
