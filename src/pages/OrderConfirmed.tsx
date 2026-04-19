import { useParams, useNavigate, Link } from "react-router-dom";
import { ShopLayout } from "@/components/shop/ShopLayout";
import { Button } from "@/components/ui/button";
import { CheckCircle2, MessageCircle, Home } from "lucide-react";
import { ADMIN_DISPLAY } from "@/lib/whatsapp";

export default function OrderConfirmed() {
  const { id } = useParams();
  const navigate = useNavigate();

  return (
    <ShopLayout>
      <div className="max-w-md mx-auto text-center py-10 space-y-6 animate-fade-in">
        <div className="w-24 h-24 rounded-full bg-gradient-primary mx-auto flex items-center justify-center shadow-glow animate-pulse-glow">
          <CheckCircle2 className="w-12 h-12 text-primary-foreground" />
        </div>
        <div>
          <h1 className="font-display font-extrabold text-3xl mb-2">Commande envoyée !</h1>
          <p className="text-muted-foreground">N° {id?.slice(0, 8).toUpperCase()}</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-6 text-left space-y-3 shadow-card">
          <div className="flex items-start gap-3">
            <MessageCircle className="w-5 h-5 text-success shrink-0 mt-0.5" />
            <p className="text-sm">L'administrateur ({ADMIN_DISPLAY}) a reçu votre commande sur WhatsApp.</p>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <p className="text-sm">Vous serez contacté très bientôt pour valider le paiement et organiser la livraison.</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => navigate("/")} variant="outline" className="flex-1"><Home className="w-4 h-4 mr-2" />Boutique</Button>
          <Button asChild className="flex-1 bg-primary text-primary-foreground"><Link to="/compte">Mes commandes</Link></Button>
        </div>
      </div>
    </ShopLayout>
  );
}
