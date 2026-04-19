import { useState } from "react";
import { Heart, Share2, Lock, ShoppingBag } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatFCFA, effectivePrice } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { ShareDialog } from "./ShareDialog";

export type Product = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  discounted_price: number | null;
  image_url: string | null;
  stock: number;
  required_plan: "free" | "medium" | "premium";
  category_id: string | null;
};

export function ProductCard({ product, isLiked, onLikeChange }: {
  product: Product;
  isLiked?: boolean;
  onLikeChange?: () => void;
}) {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  const planRank = { free: 0, medium: 1, premium: 2 };
  const userRank = profile ? planRank[profile.plan] : 0;
  const requiredRank = planRank[product.required_plan];
  const locked = requiredRank > userRank;

  const price = effectivePrice(product);
  const hasDiscount = product.discounted_price && product.discounted_price < product.price;

  const toggleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) { navigate("/auth"); return; }
    setBusy(true);
    if (isLiked) {
      await supabase.from("product_likes").delete().eq("user_id", user.id).eq("product_id", product.id);
    } else {
      await supabase.from("product_likes").insert({ user_id: user.id, product_id: product.id });
    }
    setBusy(false);
    onLikeChange?.();
  };

  const addToCart = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) { navigate("/auth"); return; }
    if (locked) { toast.error(`Réservé au plan ${product.required_plan.toUpperCase()}`); return; }
    if (product.stock < 1) { toast.error("Rupture de stock"); return; }
    setBusy(true);
    const { data: existing } = await supabase
      .from("cart_items").select("*")
      .eq("user_id", user.id).eq("product_id", product.id).maybeSingle();
    if (existing) {
      await supabase.from("cart_items").update({ quantity: existing.quantity + 1 }).eq("id", existing.id);
    } else {
      await supabase.from("cart_items").insert({ user_id: user.id, product_id: product.id, quantity: 1 });
    }
    setBusy(false);
    toast.success("Ajouté au panier");
  };

  return (
    <>
      <div
        onClick={() => navigate(`/produit/${product.id}`)}
        className="group bg-card rounded-2xl overflow-hidden shadow-card hover:shadow-elegant transition-all duration-300 hover:-translate-y-1 cursor-pointer border border-border"
      >
        <div className="relative aspect-square bg-muted overflow-hidden">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              <ShoppingBag className="w-12 h-12 opacity-30" />
            </div>
          )}
          {hasDiscount && (
            <span className="absolute top-3 left-3 bg-accent text-accent-foreground text-xs font-bold px-2 py-1 rounded-md uppercase">
              Promo
            </span>
          )}
          {product.required_plan !== "free" && (
            <span className={cn(
              "absolute top-3 right-3 text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider",
              product.required_plan === "premium" ? "bg-gradient-premium text-primary-foreground" : "bg-secondary text-secondary-foreground"
            )}>
              {product.required_plan === "premium" ? "★ Premium" : "Medium"}
            </span>
          )}
          {locked && (
            <div className="absolute inset-0 bg-background/70 backdrop-blur-sm flex items-center justify-center">
              <Lock className="w-10 h-10 text-primary" />
            </div>
          )}
          <button
            onClick={toggleLike}
            disabled={busy}
            className="absolute bottom-3 right-3 w-10 h-10 rounded-full bg-background/80 backdrop-blur-md flex items-center justify-center hover:scale-110 transition-transform"
            aria-label="J'aime"
          >
            <Heart className={cn("w-5 h-5 transition-all", isLiked ? "fill-accent text-accent" : "text-foreground")} />
          </button>
        </div>
        <div className="p-4 space-y-3">
          <h3 className="font-semibold leading-tight line-clamp-2">{product.name}</h3>
          <div className="flex items-end justify-between">
            <div>
              {hasDiscount && (
                <div className="text-xs text-muted-foreground line-through">{formatFCFA(product.price)}</div>
              )}
              <div className="font-display font-extrabold text-xl text-primary">{formatFCFA(price)}</div>
            </div>
            <div className="flex gap-1">
              <Button
                size="icon"
                variant="ghost"
                onClick={(e) => { e.stopPropagation(); setShareOpen(true); }}
                aria-label="Partager"
              >
                <Share2 className="w-4 h-4" />
              </Button>
              <Button
                size="icon"
                onClick={addToCart}
                disabled={busy || locked || product.stock < 1}
                className="bg-primary text-primary-foreground hover:bg-primary-glow shadow-glow"
                aria-label="Ajouter au panier"
              >
                <ShoppingBag className="w-4 h-4" />
              </Button>
            </div>
          </div>
          {product.stock < 5 && product.stock > 0 && (
            <div className="text-xs text-warning">⚡ Plus que {product.stock} en stock</div>
          )}
        </div>
      </div>
      <ShareDialog open={shareOpen} onOpenChange={setShareOpen} product={product} />
    </>
  );
}
