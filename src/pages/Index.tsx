import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ShopLayout } from "@/components/shop/ShopLayout";
import { ProductCard, type Product } from "@/components/shop/ProductCard";
import { useAuth } from "@/hooks/useAuth";
import { ArrowDown, Search, ShoppingBag, Loader2, RotateCcw } from "lucide-react";
import { effectivePrice } from "@/lib/format";
type Category = { id: string; name: string };
export default function Index() {
  const { user, profile } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [category, setCategory] = useState("");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("new");
  const [stock, setStock] = useState(false);
  const [promo, setPromo] = useState(false);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const load = async () => {
    setLoading(true); setError(false);
    try {
      const [p, c] = await Promise.all([supabase.from("products").select("*").eq("is_active", true).order("created_at", { ascending: false }), supabase.from("categories").select("id,name").order("name")]);
      if (p.error || c.error) throw new Error("catalogue");
      setProducts(p.data as Product[]); setCategories(c.data ?? []);
    } catch { setError(true); } finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, []);
  useEffect(() => {
    let current = true;
    setLikedIds(new Set());
    if (user) supabase.from("product_likes").select("product_id").eq("user_id", user.id).then(({ data }) => { if (current) setLikedIds(new Set(data?.map(l => l.product_id))); });
    return () => { current = false; };
  }, [user]);
  const normalize = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("fr");
  const filtered = products.filter(p => (!category || p.category_id === category) && (!stock || p.stock > 0) && (!promo || (p.discounted_price !== null && p.discounted_price < p.price)) && normalize(`${p.name} ${p.description ?? ""}`).includes(normalize(search.trim())));
  if (sort === "asc") filtered.sort((a,b) => effectivePrice(a) - effectivePrice(b));
  if (sort === "desc") filtered.sort((a,b) => effectivePrice(b) - effectivePrice(a));
  if (sort === "name") filtered.sort((a,b) => a.name.localeCompare(b.name, "fr"));
  const reset = () => { setSearch(""); setCategory(""); setPromo(false); setStock(false); setSort("new"); };
  return <ShopLayout><section className="editorial-hero"><div className="hero-copy"><p className="eyebrow">LA BOUTIQUE DU QUOTIDIEN</p><h1>De belles trouvailles.<br/><em>De bons choix.</em></h1><p className="hero-description">Une sélection à découvrir à votre rythme.<br/>Vos envies, vos essentiels, au même endroit.</p><a href="#collection" className="hero-link">Explorer la collection <ArrowDown size={17}/></a>{profile?.full_name && <p className="mt-5 text-sm text-muted-foreground">Heureux de vous retrouver, {profile.full_name.split(" ")[0]}.</p>}</div><div className="hero-art" aria-hidden="true"><span className="art-label">LA SÉLECTION<br/>SHOP SMARTLY</span><svg viewBox="0 0 340 340"><ellipse cx="177" cy="294" rx="104" ry="14" fill="#14382d" opacity=".12"/><path d="M86 119h171l-15 160H102Z" fill="#f4e9d5"/><path d="M130 125V93a41 41 0 0 1 82 0v32" fill="none" stroke="#b89464" strokeWidth="12"/><path d="M147 196l24 22 41-48" fill="none" stroke="#193f35" strokeWidth="9"/><path d="m247 67 9 20 22 3-16 15 4 22-20-11-20 11 4-22-16-15 23-3Z" fill="#e9b879"/><circle cx="69" cy="223" r="26" fill="#b9cbbb"/></svg><span className="art-caption">Bien choisir. Simplement.</span></div></section><div className="service-strip"><span>01 / Une sélection à explorer</span><span>02 / Vos favoris à retrouver</span><span>03 / Une équipe sur WhatsApp</span></div><section id="collection" className="scroll-mt-24"><div className="collection-heading"><div><p className="eyebrow">À DÉCOUVRIR</p><h2>La collection</h2></div><p className="text-sm text-muted-foreground">{loading ? "Chargement…" : `${filtered.length} article${filtered.length > 1 ? "s" : ""}`}</p></div><div className="catalog-tools"><label className="search-field"><Search size={18}/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Une envie, un produit…" aria-label="Rechercher un produit" type="search"/></label><select aria-label="Trier les produits" value={sort} onChange={e => setSort(e.target.value)}><option value="new">Les nouveautés</option><option value="asc">Prix croissant</option><option value="desc">Prix décroissant</option><option value="name">Nom : A à Z</option></select></div><div className="category-list"><button aria-pressed={!category} onClick={() => setCategory("")}>Tout découvrir</button>{categories.map(c => <button key={c.id} aria-pressed={category === c.id} onClick={() => setCategory(c.id)}>{c.name}</button>)}</div><div className="flex flex-wrap gap-5 mb-7 text-sm"><label className="flex gap-2 items-center"><input type="checkbox" checked={stock} onChange={e => setStock(e.target.checked)}/>En stock</label><label className="flex gap-2 items-center"><input type="checkbox" checked={promo} onChange={e => setPromo(e.target.checked)}/>En promotion</label>{(search || category || stock || promo) && <button onClick={reset} className="ml-auto flex gap-1 items-center text-muted-foreground"><RotateCcw size={13}/>Réinitialiser</button>}</div>{loading ? <div className="py-20 flex justify-center"><Loader2 className="animate-spin"/></div> : error ? <div className="py-16 text-center"><p>Le catalogue n’a pas pu être chargé.</p><button onClick={() => void load()} className="mt-4 underline">Réessayer</button></div> : filtered.length === 0 ? <div className="py-16 text-center"><ShoppingBag className="mx-auto mb-3 text-muted-foreground"/><h3>Aucun article pour le moment</h3><p className="text-sm text-muted-foreground mt-2">Essayez une autre recherche ou revenez bientôt.</p><button onClick={reset} className="mt-4 underline">Effacer les filtres</button></div> : <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">{filtered.map(p => <ProductCard key={p.id} product={p} isLiked={likedIds.has(p.id)} onLikeChange={() => setLikedIds(s => { const next = new Set(s); next.has(p.id) ? next.delete(p.id) : next.add(p.id); return next; })}/>)}</div>}</section></ShopLayout>;
}
