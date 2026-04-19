import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Eye, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { formatFCFA } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

type Order = {
  id: string;
  total: number;
  status: "pending" | "validated" | "rejected" | "cancelled" | "delivered";
  customer_phone: string;
  customer_name: string | null;
  notes: string | null;
  admin_notes: string | null;
  created_at: string;
  user_id: string;
};
type OrderItem = { product_name: string; unit_price: number; quantity: number; subtotal: number };

const STATUS_OPTS = [
  { v: "pending", label: "En attente", cls: "bg-warning/20 text-warning" },
  { v: "validated", label: "Validée", cls: "bg-success/20 text-success" },
  { v: "rejected", label: "Rejetée", cls: "bg-destructive/20 text-destructive" },
  { v: "cancelled", label: "Annulée", cls: "bg-muted text-muted-foreground" },
  { v: "delivered", label: "Livrée", cls: "bg-primary/20 text-primary" },
];

export default function AdminOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [adminNotes, setAdminNotes] = useState("");

  const load = async () => {
    const { data } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
    setOrders((data as Order[]) ?? []);
  };

  useEffect(() => { load(); }, []);

  const openOrder = async (o: Order) => {
    setSelected(o);
    setAdminNotes(o.admin_notes ?? "");
    const { data } = await supabase.from("order_items").select("*").eq("order_id", o.id);
    setItems((data as OrderItem[]) ?? []);
    setOpen(true);
  };

  const updateStatus = async (status: Order["status"]) => {
    if (!selected) return;
    const { error } = await supabase.from("orders").update({ status, admin_notes: adminNotes || null }).eq("id", selected.id);
    if (error) { toast.error(error.message); return; }

    // increment purchase_count if validated/delivered (transitions only — simple version)
    if ((status === "validated" || status === "delivered") && selected.status === "pending") {
      const { data: prof } = await supabase.from("profiles").select("purchase_count").eq("user_id", selected.user_id).maybeSingle();
      if (prof) await supabase.from("profiles").update({ purchase_count: (prof.purchase_count ?? 0) + 1 }).eq("user_id", selected.user_id);
    }

    await supabase.from("activity_logs").insert({
      actor_id: user?.id, action: `order_${status}`, entity_type: "order", entity_id: selected.id,
      metadata: { admin_notes: adminNotes },
    });
    toast.success("Commande mise à jour");
    setOpen(false); load();
  };

  const filtered = filter === "all" ? orders : orders.filter((o) => o.status === filter);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div><h1 className="font-display font-extrabold text-3xl">Commandes</h1></div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes</SelectItem>
            {STATUS_OPTS.map((s) => <SelectItem key={s.v} value={s.v}>{s.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        {filtered.length === 0 ? <p className="text-muted-foreground text-center py-12">Aucune commande</p> :
          filtered.map((o) => {
            const s = STATUS_OPTS.find((x) => x.v === o.status)!;
            return (
              <Card key={o.id} className="p-4 flex items-center justify-between gap-3 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="font-mono text-xs text-muted-foreground">#{o.id.slice(0, 8).toUpperCase()}</div>
                  <div className="font-semibold">{o.customer_name || "—"} · {o.customer_phone}</div>
                  <div className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString("fr-FR")}</div>
                </div>
                <div className="text-right">
                  <div className="font-display font-bold text-primary">{formatFCFA(o.total)}</div>
                  <span className={cn("text-xs font-bold px-2 py-1 rounded uppercase", s.cls)}>{s.label}</span>
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => openOrder(o)} size="sm" variant="outline"><Eye className="w-4 h-4 mr-1" />Voir</Button>
                  <Button onClick={() => window.open(`https://wa.me/${o.customer_phone.replace(/\D/g, "")}`, "_blank")} size="icon" variant="ghost"><MessageCircle className="w-4 h-4 text-success" /></Button>
                </div>
              </Card>
            );
          })}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Commande #{selected?.id.slice(0, 8).toUpperCase()}</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="text-sm space-y-1">
                <div><span className="text-muted-foreground">Client:</span> {selected.customer_name}</div>
                <div><span className="text-muted-foreground">Tel:</span> {selected.customer_phone}</div>
                <div><span className="text-muted-foreground">Date:</span> {new Date(selected.created_at).toLocaleString("fr-FR")}</div>
                {selected.notes && <div><span className="text-muted-foreground">Notes client:</span> {selected.notes}</div>}
              </div>
              <div className="border border-border rounded-lg divide-y divide-border">
                {items.map((it, i) => (
                  <div key={i} className="p-3 flex justify-between text-sm">
                    <div>{it.product_name} × {it.quantity}</div>
                    <div className="font-bold">{formatFCFA(it.subtotal)}</div>
                  </div>
                ))}
                <div className="p-3 flex justify-between font-bold bg-muted/50">
                  <div>Total</div><div className="text-primary">{formatFCFA(selected.total)}</div>
                </div>
              </div>
              <div>
                <Label>Notes admin (interne)</Label>
                <Textarea value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} rows={2} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button onClick={() => updateStatus("validated")} className="bg-success text-success-foreground">Valider</Button>
                <Button onClick={() => updateStatus("delivered")} className="bg-primary text-primary-foreground">Livrée</Button>
                <Button onClick={() => updateStatus("rejected")} variant="destructive">Rejeter</Button>
                <Button onClick={() => updateStatus("cancelled")} variant="outline">Annuler</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
