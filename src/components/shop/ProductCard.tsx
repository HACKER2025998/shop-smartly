import { useState } from "react";
import { Heart, Share2, Lock, ShoppingBag, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatFCFA, effectivePrice } from "@/lib/format";
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
  const [added, setAdded] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  const planRank = { free: 0, medium: 1, premium: 2 };
  const userRank = profile ? planRank[profile.plan] : 0;
  const locked = planRank[product.required_plan] > userRank;
  const price = effectivePrice(product);
  const hasDiscount = product.discounted_price && product.discounted_price < product.price;
  const outOfStock = product.stock < 1;

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
    if (outOfStock) { toast.error("Rupture de stock"); return; }
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
    setAdded(true);
    toast.success("Ajouté au panier");
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <>
      <div
        onClick={() => navigate(`/produit/${product.id}`)}
        className="group bg-card rounded-2xl overflow-hidden shadow-card hover:shadow-elegant transition-all duration-300 cursor-pointer border border-border/50 hover:border-border hover:-translate-y-0.5"
      >
        {/* Image */}
        <div className="relative aspect-square overflow-hidden bg-muted">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              loading="lazy"
              className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-secondary/20">
              <ShoppingBag className="w-10 h-10 text-muted-foreground/30" />
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {hasDiscount && (
              <span className="bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                Promo
              </span>
            )}
            {product.required_plan !== "free" && (
              <span className={cn(
                "text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm",
                product.required_plan === "premium"
                  ? "bg-gradient-premium text-white"
                  : "bg-secondary text-secondary-foreground"
              )}>
                {product.required_plan === "premium" ? "✦ Premium" : "Medium"}
              </span>
            )}
          </div>

          {/* Lock overlay */}
          {locked && (
            <div className="absolute inset-0 bg-card/75 backdrop-blur-[2px] flex flex-col items-center justify-center gap-1.5">
              <div className="w-9 h-9 rounded-2xl bg-card shadow-card flex items-center justify-center">
                <Lock className="w-4 h-4 text-primary" />
              </div>
              <span className="text-[10px] font-semibold text-foreground/70 capitalize">
                Plan {product.required_plan}
              </span>
            </div>
          )}

          {/* Like button */}
          <button
            onClick={toggleLike}
            disabled={busy}
            className="absolute bottom-2 right-2 w-8 h-8 rounded-xl bg-white/90 backdrop-blur-sm shadow-card flex items-center justify-center hover:scale-110 active:scale-90 transition-all duration-150"
          >
            <Heart
              className={cn("w-4 h-4 transition-all", isLiked ? "fill-red-500 text-red-500 scale-110" : "text-foreground/50")}
            />
          </button>
        </div>

        {/* Info */}
        <div className="p-3">
          <p className="font-semibold text-sm leading-tight line-clamp-2 text-foreground mb-2">{product.name}</p>

          <div className="flex items-end justify-between gap-1">
            <div>
              {hasDiscount && (
                <span className="text-[10px] text-muted-foreground line-through block">
                  {formatFCFA(product.price)}
                </span>
              )}
              <span className="font-display font-bold text-base text-primary leading-none">{formatFCFA(price)}</span>
            </div>

            <div className="flex gap-1 shrink-0">
              <button
                onClick={(e) => { e.stopPropagation(); setShareOpen(true); }}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
              >
                <Share2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={addToCart}
                disabled={busy || locked || outOfStock}
                className={cn(
                  "w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200 shadow-sm",
                  added
                    ? "bg-success text-white"
                    : outOfStock || locked
                    ? "bg-muted text-muted-foreground cursor-not-allowed"
                    : "bg-primary text-white hover:bg-primary/90 active:scale-90 shadow-glow"
                )}
              >
                {added
                  ? <CheckCircle className="w-3.5 h-3.5" />
                  : <ShoppingBag className="w-3.5 h-3.5" />
                }
              </button>
            </div>
          </div>

          {product.stock > 0 && product.stock < 5 && (
            <p className="text-[10px] text-warning font-semibold mt-1.5 bg-warning/8 px-2 py-0.5 rounded-full inline-block">
              ⚡ Plus que {product.stock}
            </p>
          )}
          {outOfStock && (
            <p className="text-[10px] text-muted-foreground mt-1.5 font-medium">Épuisé</p>
          )}
        </div>
      </div>
      <ShareDialog open={shareOpen} onOpenChange={setShareOpen} product={product} />
    </>
  );
}
