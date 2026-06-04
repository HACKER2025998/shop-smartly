import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, ShieldCheck, ShieldOff, ShieldAlert } from "lucide-react";
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

type RoleRow = { user_id: string; role: string };

export default function AdminUsers() {
  const { user: me, isSuperAdmin } = useAuth();
  const [users, setUsers] = useState<Profile[]>([]);
  const [roles, setRoles] = useState<RoleRow[]>([]);

  const load = async () => {
    const [{ data: ps }, { data: rs }] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("user_roles").select("user_id, role"),
    ]);
    setUsers((ps as Profile[]) ?? []);
    setRoles((rs as RoleRow[]) ?? []);
  };

  useEffect(() => { load(); }, []);

  const getRoleOf = (uid: string): string => {
    const r = roles.find((r) => r.user_id === uid);
    return r?.role ?? "user";
  };

  const setPlan = async (u: Profile, plan: Profile["plan"]) => {
    const { error } = await supabase.from("profiles").update({ plan }).eq("user_id", u.user_id);
    if (error) { toast.error(error.message); return; }
    await supabase.from("activity_logs").insert({ actor_id: me?.id, action: "user_plan_changed", entity_type: "user", entity_id: u.user_id, metadata: { plan } });
    toast.success("Plan mis à jour");
    load();
  };

  const setRole = async (u: Profile, newRole: "user" | "admin" | "super_admin") => {
    if (u.user_id === me?.id) { toast.error("Impossible de modifier son propre rôle"); return; }

    // Seul super_admin peut attribuer super_admin
    if (newRole === "super_admin" && !isSuperAdmin) {
      toast.error("Seul un super admin peut attribuer ce rôle");
      return;
    }

    // Empêcher de retirer admin à un super_admin si pas super_admin soi-même
    const currentRole = getRoleOf(u.user_id);
    if (currentRole === "super_admin" && !isSuperAdmin) {
      toast.error("Impossible de modifier un super admin");
      return;
    }

    // Supprimer tous les rôles sauf 'user' de cet utilisateur
    await supabase.from("user_roles").delete().eq("user_id", u.user_id).neq("role", "user");

    // Attribuer le nouveau rôle
    if (newRole !== "user") {
      const { error } = await supabase.from("user_roles").upsert(
        { user_id: u.user_id, role: newRole },
        { onConflict: "user_id,role" }
      );
      if (error) { toast.error(error.message); return; }
    }

    await supabase.from("activity_logs").insert({
      actor_id: me?.id,
      action: "role_changed",
      entity_type: "user",
      entity_id: u.user_id,
      metadata: { from: currentRole, to: newRole },
    });
    toast.success(`Rôle mis à jour → ${newRole}`);
    load();
  };

  const removeUser = async (u: Profile) => {
    if (u.user_id === me?.id) { toast.error("Impossible de se supprimer soi-même"); return; }
    const role = getRoleOf(u.user_id);
    if (role === "super_admin") { toast.error("Impossible de supprimer un super admin"); return; }
    if (role === "admin" && !isSuperAdmin) { toast.error("Seul un super admin peut supprimer un admin"); return; }
    if (!confirm(`Supprimer ${u.email} ? Toutes ses données seront perdues.`)) return;
    const { error } = await supabase.from("profiles").delete().eq("user_id", u.user_id);
    if (error) { toast.error(error.message); return; }
    await supabase.from("activity_logs").insert({ actor_id: me?.id, action: "user_deleted", entity_type: "user", entity_id: u.user_id });
    toast.success("Utilisateur supprimé");
    load();
  };

  const RoleBadge = ({ role }: { role: string }) => {
    if (role === "super_admin") return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-gradient-premium text-white px-2 py-0.5 rounded-full">
        <ShieldAlert className="w-2.5 h-2.5" /> Super Admin
      </span>
    );
    if (role === "admin") return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-primary/15 text-primary px-2 py-0.5 rounded-full">
        <ShieldCheck className="w-2.5 h-2.5" /> Admin
      </span>
    );
    return null;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display font-extrabold text-3xl">Utilisateurs</h1>
        <p className="text-muted-foreground">{users.length} compte(s)</p>
      </div>

      <div className="space-y-2">
        {users.map((u) => {
          const role = getRoleOf(u.user_id);
          const isMe = u.user_id === me?.id;
          const isProtected = role === "super_admin" && !isSuperAdmin;

          return (
            <Card key={u.id} className="p-4 flex items-center gap-3 flex-wrap">
              <div className="flex-1 min-w-0">
                <div className="font-semibold flex items-center gap-2 flex-wrap">
                  {u.full_name || "—"}
                  <RoleBadge role={role} />
                  {isMe && <span className="text-[10px] text-muted-foreground">(vous)</span>}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">{u.email}</div>
                <div className="text-xs text-muted-foreground">{u.purchase_count} achat(s) · {u.country_code}</div>
              </div>

              {/* Plan */}
              <Select
                value={u.plan}
                onValueChange={(v: any) => setPlan(u, v)}
                disabled={isProtected || isMe}
              >
                <SelectTrigger className={cn("w-28", u.plan === "premium" && "border-accent")}><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                </SelectContent>
              </Select>

              {/* Rôle — seulement si super_admin peut voir option super_admin */}
              <Select
                value={role}
                onValueChange={(v: any) => setRole(u, v)}
                disabled={isMe || isProtected}
              >
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Utilisateur</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  {isSuperAdmin && <SelectItem value="super_admin">Super Admin</SelectItem>}
                </SelectContent>
              </Select>

              {/* Supprimer */}
              <Button
                onClick={() => removeUser(u)}
                size="icon"
                variant="destructive"
                disabled={isMe || role === "super_admin"}
                title={role === "super_admin" ? "Impossible de supprimer un super admin" : "Supprimer"}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
