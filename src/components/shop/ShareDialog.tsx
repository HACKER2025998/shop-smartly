import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MessageCircle, Link2, Facebook, Copy, X } from "lucide-react";
import { toast } from "sonner";
import type { Product } from "./ProductCard";
import { formatFCFA, effectivePrice } from "@/lib/format";
import { shareProductWhatsApp } from "@/lib/whatsapp";

export function ShareDialog({ open, onOpenChange, product }: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  product: Product;
}) {
  // Utilise le hash router → on construit une URL propre avec l'origine
  const productUrl = `${window.location.origin}${window.location.pathname}#/produit/${product.id}`;
  const price = formatFCFA(effectivePrice(product));

  const share = (channel: "whatsapp" | "facebook" | "copy") => {
    if (channel === "whatsapp") {
      shareProductWhatsApp({
        productName: product.name,
        price,
        productUrl,
        imageUrl: product.image_url,
      });
    } else if (channel === "facebook") {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(productUrl)}`, "_blank");
    } else {
      navigator.clipboard.writeText(productUrl);
      toast.success("Lien copié dans le presse-papier !");
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm rounded-3xl p-0 overflow-hidden border-0 shadow-elegant">
        {/* Aperçu produit */}
        {product.image_url && (
          <div className="relative h-36 bg-muted overflow-hidden">
            <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            <div className="absolute bottom-3 left-4 right-4">
              <p className="text-white font-display font-bold text-sm line-clamp-1">{product.name}</p>
              <p className="text-white/80 text-xs font-semibold">{price}</p>
            </div>
          </div>
        )}

        <div className="p-5">
          {!product.image_url && (
            <DialogHeader className="mb-4">
              <DialogTitle className="font-display text-lg">Partager ce produit</DialogTitle>
            </DialogHeader>
          )}
          {product.image_url && (
            <p className="font-display font-bold text-base mb-4">Partager via…</p>
          )}

          <div className="space-y-2">
            {/* WhatsApp — avec photo */}
            <button
              onClick={() => share("whatsapp")}
              className="w-full flex items-center gap-4 p-3.5 rounded-2xl hover:bg-muted transition-colors text-left border border-transparent hover:border-border"
            >
              <div className="w-11 h-11 rounded-2xl bg-[#25D366]/10 flex items-center justify-center shrink-0">
                <MessageCircle className="w-5 h-5 text-[#25D366]" />
              </div>
              <div>
                <p className="font-semibold text-sm">WhatsApp</p>
                <p className="text-xs text-muted-foreground">Envoie la photo + le lien</p>
              </div>
            </button>

            {/* Facebook */}
            <button
              onClick={() => share("facebook")}
              className="w-full flex items-center gap-4 p-3.5 rounded-2xl hover:bg-muted transition-colors text-left border border-transparent hover:border-border"
            >
              <div className="w-11 h-11 rounded-2xl bg-[#1877F2]/10 flex items-center justify-center shrink-0">
                <Facebook className="w-5 h-5 text-[#1877F2]" />
              </div>
              <div>
                <p className="font-semibold text-sm">Facebook</p>
                <p className="text-xs text-muted-foreground">Partage sur ton mur</p>
              </div>
            </button>

            {/* Copier lien */}
            <button
              onClick={() => share("copy")}
              className="w-full flex items-center gap-4 p-3.5 rounded-2xl hover:bg-muted transition-colors text-left border border-transparent hover:border-border"
            >
              <div className="w-11 h-11 rounded-2xl bg-muted flex items-center justify-center shrink-0">
                <Link2 className="w-5 h-5 text-foreground" />
              </div>
              <div>
                <p className="font-semibold text-sm">Copier le lien</p>
                <p className="text-xs text-muted-foreground">Colle-le où tu veux</p>
              </div>
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
