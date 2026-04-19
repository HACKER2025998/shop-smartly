import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, X, MessageCircle, Crown } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

type Req = {
  id: string;
  user_id: string;
  requested_plan: "medium" | "premium";
  status: "pending" | "approved" | "rejected";
  created_at: string;
  profile?: { full_name: string | null; email: string; phone: string };
};

export default function AdminPremiumRequests() {
  const { user: me } = useAuth();
  const [reqs, setReqs] = useState<Req[]>([]);

  const load = async () => {
    const { data } = await supabase.from("premium_requests").select("*").eq("status", "pending").order("created_at", { ascending: false });
    const list = (data as Req[]) ?? [];
    if (list.length) {
      const ids = list.map((r) => r.user_id);
      const { data: profs } = await supabase.from("profiles").select("user_id, full_name, email, phone").in("user_id", ids);
      const map = new Map((profs ?? []).map((p: any) => [p.user_id, p]));
      list.forEach((r) => { r.profile = map.get(r.user_id); });
    }
    setReqs(list);
  };

  useEffect(() => { load(); }, []);

  const approve = async (r: Req) => {
    await supabase.from("profiles").update({ plan: r.requested_plan }).eq("user_id", r.user_id);
    await supabase.from("premium_requests").update({ status: "approved", processed_at: new Date().toISOString() }).eq("id", r.id);
    await supabase.from("activity_logs").insert({ actor_id: me?.id, action: "premium_approved", entity_type: "user", entity_id: r.user_id, metadata: { plan: r.requested_plan } });
    toast.success(`Plan ${r.requested_plan} accordé`);
    load();
  };

  const reject = async (r: Req) => {
    await supabase.from("premium_requests").update({ status: "rejected", processed_at: new Date().toISOString() }).eq("id", r.id);
    await supabase.from("activity_logs").insert({ actor_id: me?.id, action: "premium_rejected", entity_type: "user", entity_id: r.user_id });
    toast.success("Demande rejetée");
    load();
  };

  return (
    <div className="space-y-6">
      <div><h1 className="font-display font-extrabold text-3xl">Demandes Premium</h1><p className="text-muted-foreground">{reqs.length} en attente</p></div>

      {reqs.length === 0 ? <p className="text-muted-foreground text-center py-12">Aucune demande en attente</p> :
        <div className="space-y-2">
          {reqs.map((r) => (
            <Card key={r.id} className="p-4 flex items-center gap-3 flex-wrap">
              <Crown className={r.requested_plan === "premium" ? "w-6 h-6 text-warning" : "w-6 h-6 text-accent"} />
              <div className="flex-1 min-w-0">
                <div className="font-semibold">{r.profile?.full_name || "—"}</div>
                <div className="text-xs text-muted-foreground">{r.profile?.email} · {r.profile?.phone}</div>
                <div className="text-xs text-muted-foreground">Demandé: <span className="font-bold uppercase">{r.requested_plan}</span> · {new Date(r.created_at).toLocaleString("fr-FR")}</div>
              </div>
              <Button onClick={() => window.open(`https://wa.me/${r.profile?.phone.replace(/\D/g, "")}`, "_blank")} size="icon" variant="ghost"><MessageCircle className="w-4 h-4 text-success" /></Button>
              <Button onClick={() => reject(r)} size="sm" variant="destructive"><X className="w-4 h-4 mr-1" />Rejeter</Button>
              <Button onClick={() => approve(r)} size="sm" className="bg-success text-success-foreground"><Check className="w-4 h-4 mr-1" />Approuver</Button>
            </Card>
          ))}
        </div>}
    </div>
  );
}
