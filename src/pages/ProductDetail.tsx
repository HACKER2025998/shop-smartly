import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ShopLayout } from "@/components/shop/ShopLayout";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Heart, Share2, ShoppingBag, Lock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatFCFA, effectivePrice } from "@/lib/format";
import { ShareDialog } from "@/components/shop/ShareDialog";
import type { Product } from "@/components/shop/ProductCard";

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [qty, setQty] = useState(1);
  const [shareOpen, setShareOpen] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data } = await supabase.from("products").select("*").eq("id", id).maybeSingle();
      setProduct(data as Product | null);
      setLoading(false);
      if (user && data) {
        const { data: likeRow } = await supabase.from("product_likes").select("id").eq("user_id", user.id).eq("product_id", id).maybeSingle();
        setLiked(!!likeRow);
      }
    })();
  }, [id, user]);

  if (loading) return <ShopLayout><div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div></ShopLayout>;
  if (!product) return <ShopLayout><div className="text-center py-20 text-muted-foreground">Produit introuvable</div></ShopLayout>;

  const planRank = { free: 0, medium: 1, premium: 2 };
  const userRank = profile ? planRank[profile.plan] : 0;
  const requiredRank = planRank[product.required_plan];
  const locked = requiredRank > userRank;
  const price = effectivePrice(product);
  const hasDiscount = product.discounted_price && product.discounted_price < product.price;

  const toggleLike = async () => {
    if (!user) { navigate("/auth"); return; }
    if (liked) {
      await supabase.from("product_likes").delete().eq("user_id", user.id).eq("product_id", product.id);
    } else {
      await supabase.from("product_likes").insert({ user_id: user.id, product_id: product.id });
    }
    setLiked(!liked);
  };

  const addToCart = async () => {
    if (!user) { navigate("/auth"); return; }
    if (locked) { toast.error(`Réservé au plan ${product.required_plan.toUpperCase()}`); return; }
    if (product.stock < qty) { toast.error("Stock insuffisant"); return; }
    const { data: existing } = await supabase
      .from("cart_items").select("*")
      .eq("user_id", user.id).eq("product_id", product.id).maybeSingle();
    if (existing) {
      await supabase.from("cart_items").update({ quantity: existing.quantity + qty }).eq("id", existing.id);
    } else {
      await supabase.from("cart_items").insert({ user_id: user.id, product_id: product.id, quantity: qty });
    }
    toast.success(`${qty} × ajouté au panier`);
  };

  return (
    <ShopLayout>
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="w-4 h-4" /> Retour
      </button>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="relative aspect-square rounded-3xl overflow-hidden bg-muted shadow-elegant">
          {product.image_url ? (
            <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center"><ShoppingBag className="w-20 h-20 opacity-20" /></div>
          )}
          {locked && (
            <div className="absolute inset-0 bg-background/70 backdrop-blur-md flex flex-col items-center justify-center gap-3">
              <Lock className="w-12 h-12 text-primary" />
              <p className="font-semibold">Plan {product.required_plan.toUpperCase()} requis</p>
              <Button onClick={() => navigate("/compte")} className="bg-gradient-premium text-primary-foreground">Passer au {product.required_plan}</Button>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div>
            {product.required_plan !== "free" && (
              <span className={cn(
                "inline-block text-xs font-bold px-2 py-1 rounded-md uppercase mb-3",
                product.required_plan === "premium" ? "bg-gradient-premium text-primary-foreground" : "bg-secondary text-secondary-foreground"
              )}>{product.required_plan === "premium" ? "★ Premium" : "Medium"}</span>
            )}
            <h1 className="font-display font-extrabold text-3xl md:text-4xl tracking-tight">{product.name}</h1>
            {product.description && <p className="text-muted-foreground mt-3 leading-relaxed">{product.description}</p>}
          </div>

          <div className="flex items-end gap-3">
            <div className="font-display font-extrabold text-4xl text-primary">{formatFCFA(price)}</div>
            {hasDiscount && <div className="text-lg text-muted-foreground line-through pb-1">{formatFCFA(product.price)}</div>}
          </div>

          <div className={cn("text-sm font-semibold", product.stock > 5 ? "text-success" : product.stock > 0 ? "text-warning" : "text-destructive")}>
            {product.stock > 5 ? "✓ En stock" : product.stock > 0 ? `⚡ Plus que ${product.stock} en stock` : "Rupture de stock"}
          </div>

          {product.stock > 0 && !locked && (
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold">Quantité:</span>
              <div className="flex items-center border border-border rounded-xl overflow-hidden">
                <button onClick={() => setQty(Math.max(1, qty - 1))} className="w-10 h-10 hover:bg-muted">−</button>
                <span className="w-10 text-center font-bold">{qty}</span>
                <button onClick={() => setQty(Math.min(product.stock, qty + 1))} className="w-10 h-10 hover:bg-muted">+</button>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button onClick={addToCart} disabled={product.stock < 1 || locked} className="flex-1 h-14 bg-gradient-primary text-primary-foreground hover:opacity-90 shadow-glow font-semibold text-base">
              <ShoppingBag className="w-5 h-5 mr-2" /> Ajouter au panier
            </Button>
            <Button onClick={toggleLike} variant="outline" size="icon" className="h-14 w-14">
              <Heart className={cn("w-5 h-5", liked && "fill-accent text-accent")} />
            </Button>
            <Button onClick={() => setShareOpen(true)} variant="outline" size="icon" className="h-14 w-14">
              <Share2 className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
      <ShareDialog open={shareOpen} onOpenChange={setShareOpen} product={product} />
    </ShopLayout>
  );
}
