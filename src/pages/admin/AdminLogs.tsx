import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { ScrollText } from "lucide-react";

type Log = {
  id: string;
  actor_id: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  metadata: any;
  created_at: string;
};

const ACTION_LABEL: Record<string, string> = {
  order_created: "📦 Commande créée",
  order_validated: "✅ Commande validée",
  order_rejected: "❌ Commande rejetée",
  order_cancelled: "🚫 Commande annulée",
  order_delivered: "🚚 Commande livrée",
  product_created: "➕ Produit créé",
  product_updated: "✏️ Produit modifié",
  product_deleted: "🗑️ Produit supprimé",
  user_plan_changed: "👤 Plan utilisateur modifié",
  user_deleted: "🗑️ Utilisateur supprimé",
  admin_granted: "🛡️ Admin accordé",
  admin_revoked: "🛡️ Admin retiré",
  premium_requested: "⭐ Demande Premium",
  premium_approved: "⭐ Premium approuvé",
  premium_rejected: "⭐ Premium rejeté",
};

export default function AdminLogs() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [actors, setActors] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("activity_logs").select("*").order("created_at", { ascending: false }).limit(200);
      const list = (data as Log[]) ?? [];
      setLogs(list);
      const ids = Array.from(new Set(list.map((l) => l.actor_id).filter(Boolean))) as string[];
      if (ids.length) {
        const { data: profs } = await supabase.from("profiles").select("user_id, email").in("user_id", ids);
        setActors(new Map((profs ?? []).map((p: any) => [p.user_id, p.email])));
      }
    })();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2"><ScrollText className="w-7 h-7 text-primary" /><h1 className="font-display font-extrabold text-3xl">Logs d'activité</h1></div>

      <div className="space-y-1.5">
        {logs.map((l) => (
          <Card key={l.id} className="p-3 flex items-start gap-3 text-sm">
            <div className="flex-1 min-w-0">
              <div className="font-semibold">{ACTION_LABEL[l.action] ?? l.action}</div>
              <div className="text-xs text-muted-foreground">
                {l.actor_id ? (actors.get(l.actor_id) ?? l.actor_id.slice(0, 8)) : "Système"}
                {l.entity_id && <> · <span className="font-mono">{l.entity_id.slice(0, 8)}</span></>}
              </div>
              {l.metadata && Object.keys(l.metadata).length > 0 && (
                <div className="text-xs text-muted-foreground font-mono mt-1 truncate">{JSON.stringify(l.metadata)}</div>
              )}
            </div>
            <div className="text-xs text-muted-foreground shrink-0">{new Date(l.created_at).toLocaleString("fr-FR")}</div>
          </Card>
        ))}
        {logs.length === 0 && <p className="text-muted-foreground text-center py-12">Aucune activité</p>}
      </div>
    </div>
  );
}
