import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ShopLayout } from "@/components/shop/ShopLayout";
import { ProductCard, type Product } from "@/components/shop/ProductCard";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, ShoppingBag, Tag } from "lucide-react";
import { cn } from "@/lib/utils";

type Category = { id: string; name: string; slug: string; is_adult: boolean };

export default function Index() {
  const { profile } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    (async () => {
      const [{ data: prods }, { data: cats }] = await Promise.all([
        supabase.from("products").select("*").eq("is_active", true).order("created_at", { ascending: false }),
        supabase.from("categories").select("*").order("name"),
      ]);
      setProducts((prods as Product[]) ?? []);
      setCategories((cats as Category[]) ?? []);
      setLoading(false);
    })();
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
      {/* Hero — accueil humain et chaleureux */}
      <section className="mb-7">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-primary p-6 shadow-glow">
          {/* Déco */}
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/8 -translate-y-8 translate-x-8" />
          <div className="absolute bottom-0 left-12 w-20 h-20 rounded-full bg-white/5 translate-y-6" />

          <div className="relative z-10">
            <p className="text-white/70 text-sm font-medium mb-1">
              {firstName ? `Bonjour, ${firstName} 👋` : "Bienvenue 👋"}
            </p>
            <h1 className="font-display font-bold text-white text-2xl leading-snug text-balance">
              Découvre notre sélection du moment
            </h1>
            <p className="text-white/65 text-xs mt-2 font-medium">
              Livraison rapide · Paiement sécurisé · Service client disponible
            </p>
          </div>
        </div>
      </section>

      {/* Filtres par catégorie */}
      {categories.length > 0 && (
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 mb-6 -mx-6 px-6">
          <CategoryPill active={activeCategory === null} onClick={() => setActiveCategory(null)}>
            Tout
          </CategoryPill>
          {categories.map((c) => (
            <CategoryPill
              key={c.id}
              active={activeCategory === c.id}
              onClick={() => setActiveCategory(c.id)}
            >
              {c.name}
            </CategoryPill>
          ))}
        </div>
      )}

      {/* Grille produits */}
      {loading ? (
        <div className="flex flex-col items-center gap-3 py-20">
          <Loader2 className="w-7 h-7 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Chargement…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-muted mx-auto flex items-center justify-center">
            <ShoppingBag className="w-8 h-8 text-muted-foreground opacity-40" />
          </div>
          <div>
            <p className="font-display font-bold text-lg text-foreground">Aucun produit</p>
            <p className="text-sm text-muted-foreground mt-1">Reviens bientôt !</p>
          </div>
        </div>
      ) : (
        <>
          <p className="text-xs text-muted-foreground mb-4 font-medium">
            {filtered.length} produit{filtered.length > 1 ? "s" : ""}
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {filtered.map((p, i) => (
              <div key={p.id} style={{ animationDelay: `${i * 40}ms` }} className="animate-fade-in">
                <ProductCard
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
              </div>
            ))}
          </div>
        </>
      )}
    </ShopLayout>
  );
}

function CategoryPill({ active, onClick, children }: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200",
        active
          ? "bg-primary text-white shadow-glow scale-[1.02]"
          : "bg-card text-foreground border border-border hover:border-primary/50 hover:text-primary"
      )}
    >
      {children}
    </button>
  );
}
