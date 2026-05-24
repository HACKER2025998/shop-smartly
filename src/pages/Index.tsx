import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ShopLayout } from "@/components/shop/ShopLayout";
import { ProductCard, type Product } from "@/components/shop/ProductCard";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, Sparkles, ShoppingBag } from "lucide-react";
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

  const firstName = profile?.full_name?.split(" ")[0];

  return (
    <ShopLayout>
      {/* Hero — chaleureux & personnel */}
      <section className="mb-7">
        <div className="bg-gradient-primary rounded-3xl p-6 text-white shadow-glow mb-1">
          <p className="text-sm font-semibold opacity-80 mb-1">
            {firstName ? `Bonjour ${firstName} 👋` : "Bienvenue 👋"}
          </p>
          <h1 className="font-display font-extrabold text-2xl leading-tight">
            Trouve ce qu'il te faut
          </h1>
          <p className="text-sm opacity-75 mt-1 flex items-center gap-1">
            <ShoppingBag className="w-3.5 h-3.5" />
            Livraison rapide · Paiement sécurisé
          </p>
        </div>
      </section>

      {/* Catégories */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 mb-6 -mx-6 px-6">
        <button
          onClick={() => setActiveCategory(null)}
          className={cn(
            "shrink-0 px-4 py-2 rounded-full font-semibold text-sm transition-all",
            activeCategory === null
              ? "bg-primary text-white shadow-glow"
              : "bg-white text-foreground border border-border hover:border-primary hover:text-primary"
          )}
        >
          Tout voir
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setActiveCategory(c.id)}
            className={cn(
              "shrink-0 px-4 py-2 rounded-full font-semibold text-sm transition-all flex items-center gap-1.5",
              activeCategory === c.id
                ? "bg-primary text-white shadow-glow"
                : "bg-white text-foreground border border-border hover:border-primary hover:text-primary"
            )}
          >
            {c.is_adult && <Sparkles className="w-3 h-3" />}
            {c.name}
          </button>
        ))}
      </div>

      {/* Grille produits */}
      {loading ? (
        <div className="flex flex-col items-center py-20 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Chargement des produits…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground space-y-3">
          <ShoppingBag className="w-14 h-14 mx-auto opacity-25" />
          <p className="font-semibold text-base">Aucun produit pour le moment</p>
          <p className="text-sm">Reviens bientôt !</p>
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
