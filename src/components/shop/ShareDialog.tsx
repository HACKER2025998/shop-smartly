import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MessageCircle, Instagram, Link2, Facebook } from "lucide-react";
import { toast } from "sonner";
import type { Product } from "./ProductCard";
import { formatFCFA, effectivePrice } from "@/lib/format";

export function ShareDialog({ open, onOpenChange, product }: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  product: Product;
}) {
  const url = `${window.location.origin}/produit/${product.id}`;
  const text = `Découvre "${product.name}" à ${formatFCFA(effectivePrice(product))} sur NEONO 🛍️\n${url}`;

  const share = (channel: "whatsapp" | "instagram" | "facebook" | "copy") => {
    if (channel === "whatsapp") window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
    else if (channel === "facebook") window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, "_blank");
    else if (channel === "instagram") {
      navigator.clipboard.writeText(text);
      toast.success("Lien copié — colle-le sur Instagram");
    } else {
      navigator.clipboard.writeText(url);
      toast.success("Lien copié");
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-display">Partager</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3 pt-2">
          <Button onClick={() => share("whatsapp")} variant="outline" className="h-20 flex-col gap-2">
            <MessageCircle className="w-6 h-6 text-success" /> WhatsApp
          </Button>
          <Button onClick={() => share("instagram")} variant="outline" className="h-20 flex-col gap-2">
            <Instagram className="w-6 h-6 text-accent" /> Instagram
          </Button>
          <Button onClick={() => share("facebook")} variant="outline" className="h-20 flex-col gap-2">
            <Facebook className="w-6 h-6 text-primary" /> Facebook
          </Button>
          <Button onClick={() => share("copy")} variant="outline" className="h-20 flex-col gap-2">
            <Link2 className="w-6 h-6" /> Copier
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
