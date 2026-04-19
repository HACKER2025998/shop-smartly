import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ShopLayout } from "@/components/shop/ShopLayout";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { LogOut, Crown, Star, MessageCircle, Loader2, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatFCFA } from "@/lib/format";
import { toast } from "sonner";
import { buildPremiumWhatsAppMessage, openWhatsApp } from "@/lib/whatsapp";

type Order = {
  id: string;
  total: number;
  status: string;
  created_at: string;
};

export default function Account() {
  const navigate = useNavigate();
  const { user, profile, isAdmin, signOut, refreshProfile } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingPlan, setPendingPlan] = useState<string | null>(null);

  useEffect(() => {
    if (!user) { navigate("/auth"); return; }
    (async () => {
      const [{ data: o }, { data: pr }] = await Promise.all([
        supabase.from("orders").select("id, total, status, created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20),
        supabase.from("premium_requests").select("requested_plan, status").eq("user_id", user.id).eq("status", "pending").maybeSingle(),
      ]);
      setOrders((o as Order[]) ?? []);
      setPendingPlan((pr as any)?.requested_plan ?? null);
      setLoading(false);
    })();
  }, [user]);

  const requestUpgrade = async (plan: "medium" | "premium") => {
    if (!user || !profile) return;
    const { error } = await supabase.from("premium_requests").insert({ user_id: user.id, requested_plan: plan });
    if (error) { toast.error(error.message); return; }
    await supabase.from("activity_logs").insert({
      actor_id: user.id,
      action: "premium_requested",
      entity_type: "user",
      entity_id: user.id,
      metadata: { plan },
    });
    setPendingPlan(plan);
    const msg = buildPremiumWhatsAppMessage({
      customerName: profile.full_name ?? "",
      customerPhone: profile.phone,
      plan,
    });
    openWhatsApp(msg);
    toast.success("Demande envoyée à l'admin");
  };

  if (!profile) return <ShopLayout><div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div></ShopLayout>;

  const statusLabel: Record<string, { label: string; cls: string }> = {
    pending: { label: "En attente", cls: "bg-warning/20 text-warning" },
    validated: { label: "Validée", cls: "bg-success/20 text-success" },
    rejected: { label: "Rejetée", cls: "bg-destructive/20 text-destructive" },
    cancelled: { label: "Annulée", cls: "bg-muted text-muted-foreground" },
    delivered: { label: "Livrée", cls: "bg-primary/20 text-primary" },
  };

  const plans = [
    { id: "medium" as const, name: "Medium", icon: Star, gradient: "bg-secondary", desc: "Réductions dès le 3ème achat" },
    { id: "premium" as const, name: "Premium", icon: Crown, gradient: "bg-gradient-premium", desc: "Produits exclusifs + réductions" },
  ];

  return (
    <ShopLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Profile card */}
        <div className="bg-card border border-border rounded-3xl p-6 shadow-elegant">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="font-display font-extrabold text-2xl">{profile.full_name || "Mon compte"}</h1>
              <p className="text-sm text-muted-foreground">{profile.email}</p>
              <p className="text-sm text-muted-foreground">{profile.phone}</p>
            </div>
            <span className={cn(
              "text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider",
              profile.plan === "premium" ? "bg-gradient-premium text-primary-foreground" :
              profile.plan === "medium" ? "bg-secondary text-secondary-foreground" :
              "bg-muted text-muted-foreground"
            )}>
              {profile.plan}
            </span>
          </div>
          <div className="flex gap-2 flex-wrap">
            {isAdmin && (
              <Button onClick={() => navigate("/admin")} className="bg-primary text-primary-foreground"><Settings className="w-4 h-4 mr-2" />Espace admin</Button>
            )}
            <Button onClick={signOut} variant="outline"><LogOut className="w-4 h-4 mr-2" />Déconnexion</Button>
          </div>
        </div>

        {/* Plans */}
        {profile.plan !== "premium" && (
          <div>
            <h2 className="font-display font-bold text-xl mb-4">Passer à un plan supérieur</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {plans.filter((p) => p.id !== profile.plan && (profile.plan === "free" || p.id === "premium")).map((plan) => {
                const Icon = plan.icon;
                const requested = pendingPlan === plan.id;
                return (
                  <div key={plan.id} className={cn("rounded-2xl p-5 text-primary-foreground shadow-card", plan.gradient)}>
                    <Icon className="w-7 h-7 mb-2" />
                    <h3 className="font-display font-extrabold text-xl">{plan.name}</h3>
                    <p className="text-sm opacity-90 mb-4">{plan.desc}</p>
                    <Button
                      onClick={() => requestUpgrade(plan.id)}
                      disabled={requested}
                      variant="secondary"
                      className="w-full"
                    >
                      {requested ? "Demande en attente…" : <><MessageCircle className="w-4 h-4 mr-2" />Demander l'upgrade</>}
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Orders */}
        <div>
          <h2 className="font-display font-bold text-xl mb-4">Mes commandes</h2>
          {loading ? (
            <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto my-8" />
          ) : orders.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">Aucune commande</p>
          ) : (
            <div className="space-y-2">
              {orders.map((o) => {
                const s = statusLabel[o.status] ?? { label: o.status, cls: "bg-muted" };
                return (
                  <div key={o.id} className="bg-card border border-border rounded-xl p-4 flex items-center justify-between">
                    <div>
                      <div className="font-mono text-xs text-muted-foreground">#{o.id.slice(0, 8).toUpperCase()}</div>
                      <div className="font-bold">{formatFCFA(o.total)}</div>
                      <div className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleDateString("fr-FR")}</div>
                    </div>
                    <span className={cn("text-xs font-bold px-3 py-1 rounded-full uppercase", s.cls)}>{s.label}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </ShopLayout>
  );
}
