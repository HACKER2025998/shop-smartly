import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ShopLayout } from "@/components/shop/ShopLayout";
import { ProductCard, type Product } from "@/components/shop/ProductCard";
import { useAuth } from "@/hooks/useAuth";
import { Heart, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Favorites() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("product_likes")
      .select("product:products(*)")
      .eq("user_id", user.id);
    const prods = (data ?? []).map((d: any) => d.product).filter(Boolean) as Product[];
    setProducts(prods);
    setLoading(false);
  };

  useEffect(() => {
    if (!user) { navigate("/auth"); return; }
    load();
  }, [user]);

  return (
    <ShopLayout>
      <h1 className="font-display font-extrabold text-3xl mb-6 flex items-center gap-2">
        <Heart className="w-7 h-7 text-accent fill-accent" /> Mes favoris
      </h1>
      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : products.length === 0 ? (
        <div className="text-center py-20 space-y-4">
          <Heart className="w-16 h-16 mx-auto text-muted-foreground opacity-30" />
          <p className="text-muted-foreground">Aucun favori pour l'instant</p>
          <Button onClick={() => navigate("/")} className="bg-primary text-primary-foreground">Explorer</Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((p) => <ProductCard key={p.id} product={p} isLiked onLikeChange={load} />)}
        </div>
      )}
    </ShopLayout>
  );
}
