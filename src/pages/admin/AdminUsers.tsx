import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Shield, ShieldOff } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

type Profile = {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string;
  phone: string;
  country_code: string;
  plan: "free" | "medium" | "premium";
  purchase_count: number;
  created_at: string;
};

export default function AdminUsers() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState<Profile[]>([]);
  const [admins, setAdmins] = useState<Set<string>>(new Set());

  const load = async () => {
    const [{ data: ps }, { data: rs }] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("user_roles").select("user_id, role").eq("role", "admin"),
    ]);
    setUsers((ps as Profile[]) ?? []);
    setAdmins(new Set((rs ?? []).map((r) => r.user_id)));
  };

  useEffect(() => { load(); }, []);

  const setPlan = async (u: Profile, plan: Profile["plan"]) => {
    const { error } = await supabase.from("profiles").update({ plan }).eq("user_id", u.user_id);
    if (error) { toast.error(error.message); return; }
    await supabase.from("activity_logs").insert({ actor_id: me?.id, action: "user_plan_changed", entity_type: "user", entity_id: u.user_id, metadata: { plan } });
    toast.success("Plan mis à jour");
    load();
  };

  const toggleAdmin = async (u: Profile) => {
    if (admins.has(u.user_id)) {
      await supabase.from("user_roles").delete().eq("user_id", u.user_id).eq("role", "admin");
      await supabase.from("activity_logs").insert({ actor_id: me?.id, action: "admin_revoked", entity_type: "user", entity_id: u.user_id });
      toast.success("Admin retiré");
    } else {
      await supabase.from("user_roles").insert({ user_id: u.user_id, role: "admin" });
      await supabase.from("activity_logs").insert({ actor_id: me?.id, action: "admin_granted", entity_type: "user", entity_id: u.user_id });
      toast.success("Admin accordé");
    }
    load();
  };

  const removeUser = async (u: Profile) => {
    if (u.user_id === me?.id) { toast.error("Impossible de se supprimer soi-même"); return; }
    if (!confirm(`Supprimer ${u.email} ? Cette action supprime ses commandes, panier, etc.`)) return;
    // Deletes profile cascade; auth.users requires admin API. We delete profile only.
    const { error } = await supabase.from("profiles").delete().eq("user_id", u.user_id);
    if (error) { toast.error(error.message); return; }
    await supabase.from("activity_logs").insert({ actor_id: me?.id, action: "user_deleted", entity_type: "user", entity_id: u.user_id });
    toast.success("Utilisateur supprimé");
    load();
  };

  return (
    <div className="space-y-6">
      <div><h1 className="font-display font-extrabold text-3xl">Utilisateurs</h1><p className="text-muted-foreground">{users.length} compte(s)</p></div>

      <div className="space-y-2">
        {users.map((u) => {
          const isAdmin = admins.has(u.user_id);
          return (
            <Card key={u.id} className="p-4 flex items-center gap-3 flex-wrap">
              <div className="flex-1 min-w-0">
                <div className="font-semibold flex items-center gap-2">
                  {u.full_name || "—"}
                  {isAdmin && <span className="text-[10px] uppercase font-bold bg-primary/20 text-primary px-2 py-0.5 rounded">Admin</span>}
                </div>
                <div className="text-xs text-muted-foreground">{u.email} · {u.phone}</div>
                <div className="text-xs text-muted-foreground">{u.purchase_count} achat(s) · {u.country_code}</div>
              </div>
              <Select value={u.plan} onValueChange={(v: any) => setPlan(u, v)}>
                <SelectTrigger className={cn("w-32", u.plan === "premium" && "border-accent")}><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={() => toggleAdmin(u)} size="icon" variant={isAdmin ? "default" : "outline"} title={isAdmin ? "Retirer admin" : "Promouvoir admin"}>
                {isAdmin ? <ShieldOff className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
              </Button>
              <Button onClick={() => removeUser(u)} size="icon" variant="destructive"><Trash2 className="w-4 h-4" /></Button>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
