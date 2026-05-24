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
    if (locked) { toast.error(`Réservé au plan ${product.required_plan}`); return; }
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
    toast.success("Ajouté au panier 🛍️");
  };

  return (
    <>
      <div
        onClick={() => navigate(`/produit/${product.id}`)}
        className="group bg-white rounded-2xl overflow-hidden shadow-card hover:shadow-elegant transition-all duration-300 hover:-translate-y-0.5 cursor-pointer border border-border"
      >
        {/* Image */}
        <div className="relative aspect-square bg-muted overflow-hidden">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-secondary/30">
              <ShoppingBag className="w-12 h-12 text-muted-foreground opacity-30" />
            </div>
          )}

          {hasDiscount && (
            <span className="absolute top-2 left-2 bg-accent text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
              Promo
            </span>
          )}
          {product.required_plan !== "free" && (
            <span className={cn(
              "absolute top-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase",
              product.required_plan === "premium" ? "bg-gradient-premium text-white" : "bg-secondary text-secondary-foreground"
            )}>
              {product.required_plan === "premium" ? "★ Premium" : "Medium"}
            </span>
          )}
          {locked && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center">
              <div className="bg-white rounded-2xl px-3 py-2 shadow-card flex items-center gap-2">
                <Lock className="w-4 h-4 text-primary" />
                <span className="text-xs font-semibold text-foreground">{product.required_plan}</span>
              </div>
            </div>
          )}

          {/* Like button */}
          <button
            onClick={toggleLike}
            disabled={busy}
            className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-white shadow-card flex items-center justify-center hover:scale-110 transition-transform active:scale-95"
            aria-label="J'aime"
          >
            <Heart className={cn("w-4 h-4 transition-all", isLiked ? "fill-accent text-accent" : "text-muted-foreground")} />
          </button>
        </div>

        {/* Infos */}
        <div className="p-3 space-y-2">
          <h3 className="font-semibold text-sm leading-tight line-clamp-2 text-foreground">{product.name}</h3>
          <div className="flex items-center justify-between gap-1">
            <div>
              {hasDiscount && (
                <div className="text-[10px] text-muted-foreground line-through">{formatFCFA(product.price)}</div>
              )}
              <div className="font-display font-extrabold text-base text-primary">{formatFCFA(price)}</div>
            </div>
            <div className="flex gap-1">
              <Button
                size="icon"
                variant="ghost"
                onClick={(e) => { e.stopPropagation(); setShareOpen(true); }}
                className="w-8 h-8 rounded-xl"
                aria-label="Partager"
              >
                <Share2 className="w-3.5 h-3.5" />
              </Button>
              <Button
                size="icon"
                onClick={addToCart}
                disabled={busy || locked || product.stock < 1}
                className="w-8 h-8 rounded-xl bg-primary text-white hover:bg-primary/90 shadow-glow"
                aria-label="Ajouter au panier"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
          {product.stock < 5 && product.stock > 0 && (
            <div className="text-[10px] font-semibold text-warning bg-warning/10 px-2 py-0.5 rounded-full inline-block">
              ⚡ Plus que {product.stock} en stock
            </div>
          )}
        </div>
      </div>
      <ShareDialog open={shareOpen} onOpenChange={setShareOpen} product={product} />
    </>
  );
}
