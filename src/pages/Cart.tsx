import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ShopLayout } from "@/components/shop/ShopLayout";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { checkoutCart, checkoutError } from "@/lib/checkout";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, ShoppingBag, MessageCircle, Loader2, Plus, Minus } from "lucide-react";
import { toast } from "sonner";
import { formatFCFA, effectivePrice } from "@/lib/format";
import { buildOrderWhatsAppMessage, openWhatsApp, ADMIN_DISPLAY } from "@/lib/whatsapp";

type CartRow = {
  id: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    price: number;
    discounted_price: number | null;
    image_url: string | null;
    stock: number;
  };
};

export default function Cart() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [items, setItems] = useState<CartRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [notes, setNotes] = useState("");
  const submittingRef = useRef(false);
  const attempt = useRef<string | null>(null);
  const [loadError, setLoadError] = useState(false);

  const load = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("cart_items")
      .select("id, quantity, product:products(id, name, price, discounted_price, image_url, stock)")
      .eq("user_id", user.id);
    setLoadError(!!error);
    if (!error) setItems(((data as unknown as CartRow[]) ?? []).filter(i => i.product));
    setLoading(false);
  };

  useEffect(() => {
    if (!user) { navigate("/auth"); return; }
    load();
  }, [user]);

  const updateQty = async (id: string, q: number, max: number) => {
    if (q < 1) return remove(id);
    if (q > max) { toast.error("Stock insuffisant"); return; }
    if (submittingRef.current) return;
    const { error } = await supabase.from("cart_items").update({ quantity: q }).eq("id", id);
    if (error) { toast.error("Modification du panier impossible"); return; }
    window.dispatchEvent(new Event("cart-updated"));
    load();
  };

  const remove = async (id: string) => {
    if (submittingRef.current) return;
    const { error } = await supabase.from("cart_items").delete().eq("id", id);
    if (error) { toast.error("Suppression impossible"); return; }
    window.dispatchEvent(new Event("cart-updated"));
    load();
  };

  const total = items.reduce((s, i) => s + effectivePrice(i.product) * i.quantity, 0);

  const validate = async () => {
    if (!user || items.length === 0 || submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    const key = `shop-checkout-attempt:${user.id}`;
    try {
      if (!attempt.current) {
        try { attempt.current = sessionStorage.getItem(key); } catch { /* In-memory retry remains available. */ }
        attempt.current ??= crypto.randomUUID();
        try { sessionStorage.setItem(key, attempt.current); } catch { /* Private storage may be disabled. */ }
      }
      const order = await checkoutCart(attempt.current, notes);
      window.dispatchEvent(new Event("cart-updated"));
      try { sessionStorage.removeItem(key); } catch { /* Optional storage. */ }
      attempt.current = null;
      navigate(`/commande-confirmee/${order.id}`);
      openWhatsApp(buildOrderWhatsAppMessage({ orderId: order.id, customerName: order.customer_name ?? "", customerPhone: order.customer_phone, items: order.items, total: order.total, notes: order.notes ?? undefined }));
    } catch (error) {
      toast.error(checkoutError(error));
      await load();
    } finally { submittingRef.current = false; setSubmitting(false); }
  };

  if (loading) return <ShopLayout><div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div></ShopLayout>;

  return (
    <ShopLayout>
      <h1 className="font-display font-extrabold text-3xl mb-6">Mon panier</h1>

      {loadError ? <div role="alert" className="py-10 text-center"><p>Impossible de charger votre panier.</p><Button onClick={() => void load()} variant="outline" className="mt-4">Réessayer</Button></div> : items.length === 0 ? (
        <div className="text-center py-20 space-y-4">
          <ShoppingBag className="w-16 h-16 mx-auto text-muted-foreground opacity-30" />
          <p className="text-muted-foreground">Votre panier est vide</p>
          <Button onClick={() => navigate("/")} className="bg-primary text-primary-foreground">Découvrir la boutique</Button>
        </div>
      ) : (
        <div className="space-y-4 max-w-2xl">
          {items.map((it) => (
            <div key={it.id} className="bg-card border border-border rounded-2xl p-4 flex gap-4 shadow-card">
              <div className="w-20 h-20 rounded-xl bg-muted overflow-hidden shrink-0">
                {it.product.image_url && <img src={it.product.image_url} alt={it.product.name} className="w-full h-full object-cover" />}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold truncate">{it.product.name}</h3>
                <div className="text-primary font-bold mt-1">{formatFCFA(effectivePrice(it.product))}</div>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center border border-border rounded-lg">
                    <button disabled={submitting} onClick={() => updateQty(it.id, it.quantity - 1, it.product.stock)} className="w-8 h-8 hover:bg-muted flex items-center justify-center"><Minus className="w-3 h-3" /></button>
                    <span className="w-8 text-center font-bold text-sm">{it.quantity}</span>
                    <button disabled={submitting} onClick={() => updateQty(it.id, it.quantity + 1, it.product.stock)} className="w-8 h-8 hover:bg-muted flex items-center justify-center"><Plus className="w-3 h-3" /></button>
                  </div>
                  <button disabled={submitting} onClick={() => remove(it.id)} className="text-destructive hover:text-destructive/80 p-2"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            </div>
          ))}

          <div className="bg-card border border-border rounded-2xl p-5 space-y-4 shadow-elegant mt-6">
            <div className="space-y-2">
              <Label htmlFor="notes">Notes pour la commande (optionnel)</Label>
              <Textarea id="notes" disabled={submitting} value={notes} onChange={(e) => setNotes(e.target.value.slice(0, 500))} placeholder="Adresse de livraison, instructions…" rows={3} />
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-border">
              <span className="text-muted-foreground">Total</span>
              <span className="font-display font-extrabold text-3xl text-primary">{formatFCFA(total)}</span>
            </div>
            <Button onClick={validate} disabled={submitting} className="w-full h-14 bg-gradient-primary text-primary-foreground font-semibold text-base shadow-glow">
              {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><MessageCircle className="w-5 h-5 mr-2" />Valider via WhatsApp</>}
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              Votre commande sera envoyée à l'admin ({ADMIN_DISPLAY}) qui vous contactera pour le paiement et la livraison.
            </p>
          </div>
        </div>
      )}
    </ShopLayout>
  );
}
