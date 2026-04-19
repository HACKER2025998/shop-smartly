import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ShopLayout } from "@/components/shop/ShopLayout";
import { ProductCard, type Product } from "@/components/shop/ProductCard";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

type Category = { id: string; name: string; slug: string; is_adult: boolean };

const Index = () => {
  const { user, profile } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [{ data: prods }, { data: cats }] = await Promise.all([
        supabase.from("products").select("*").eq("is_active", true).order("created_at", { ascending: false }),
        supabase.from("categories").select("*").order("name"),
      ]);
      setProducts((prods as Product[]) ?? []);
      setCategories((cats as Category[]) ?? []);
      setLoading(false);
    };
    load();
  }, []);

  useEffect(() => {
    if (!user) { setLikedIds(new Set()); return; }
    supabase.from("product_likes").select("product_id").eq("user_id", user.id).then(({ data }) => {
      setLikedIds(new Set(data?.map((l) => l.product_id) ?? []));
    });
  }, [user]);

  const filtered = activeCategory
    ? products.filter((p) => p.category_id === activeCategory)
    : products;

  return (
    <ShopLayout>
      {/* Hero */}
      <section className="mb-8">
        <h1 className="font-display font-extrabold text-4xl md:text-5xl tracking-tight text-balance">
          {profile?.full_name ? <>Salut, <span className="text-primary">{profile.full_name.split(" ")[0]}</span> 👋</> : <>Découvre la <span className="text-primary">collection</span></>}
        </h1>
        <p className="text-muted-foreground mt-2">Commande, partage, kiffe — livraison express.</p>
      </section>

      {/* Categories */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 mb-6 -mx-6 px-6">
        <button
          onClick={() => setActiveCategory(null)}
          className={cn(
            "shrink-0 px-4 py-2 rounded-full font-semibold text-sm transition-all border",
            activeCategory === null
              ? "bg-primary text-primary-foreground border-primary shadow-glow"
              : "bg-card text-foreground border-border hover:border-primary"
          )}
        >
          Tout
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setActiveCategory(c.id)}
            className={cn(
              "shrink-0 px-4 py-2 rounded-full font-semibold text-sm transition-all border flex items-center gap-1.5",
              activeCategory === c.id
                ? "bg-primary text-primary-foreground border-primary shadow-glow"
                : "bg-card text-foreground border-border hover:border-primary"
            )}
          >
            {c.is_adult && <Sparkles className="w-3.5 h-3.5" />}
            {c.name}
          </button>
        ))}
      </div>

      {/* Products grid */}
      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <p className="text-lg">Aucun produit pour le moment</p>
          <p className="text-sm mt-2">Reviens bientôt !</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              isLiked={likedIds.has(p.id)}
              onLikeChange={() => {
                setLikedIds((s) => {
                  const n = new Set(s);
                  n.has(p.id) ? n.delete(p.id) : n.add(p.id);
                  return n;
                });
              }}
            />
          ))}
        </div>
      )}
    </ShopLayout>
  );
};

export default Index;
