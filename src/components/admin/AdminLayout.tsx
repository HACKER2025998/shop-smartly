import { NavLink, useNavigate, Outlet } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import {
  LayoutDashboard, Package, ShoppingCart, Users, Crown, FolderTree,
  ScrollText, LogOut, ArrowLeft, Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const links = [
  { to: "/admin", end: true, icon: LayoutDashboard, label: "Dashboard" },
  { to: "/admin/produits", icon: Package, label: "Produits" },
  { to: "/admin/categories", icon: FolderTree, label: "Catégories" },
  { to: "/admin/commandes", icon: ShoppingCart, label: "Commandes" },
  { to: "/admin/utilisateurs", icon: Users, label: "Utilisateurs" },
  { to: "/admin/premium", icon: Crown, label: "Demandes Premium" },
  { to: "/admin/logs", icon: ScrollText, label: "Logs" },
];

export function AdminLayout() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 flex-col bg-sidebar border-r border-sidebar-border sticky top-0 h-screen">
        <div className="p-6 border-b border-sidebar-border">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <div className="font-display font-extrabold text-lg leading-none">E-shop</div>
              <div className="text-xs text-sidebar-accent-foreground/60 mt-0.5">Admin</div>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {links.map((l) => {
            const Icon = l.icon;
            return (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.end}
                className={({ isActive }) => cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium text-sm transition-colors",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-glow"
                    : "text-sidebar-foreground hover:bg-sidebar-accent"
                )}
              >
                <Icon className="w-4 h-4" /> {l.label}
              </NavLink>
            );
          })}
        </nav>
        <div className="p-3 border-t border-sidebar-border space-y-1">
          <div className="px-3 py-2 text-xs text-sidebar-accent-foreground/60 truncate">{profile?.email}</div>
          <Button onClick={() => navigate("/")} variant="ghost" size="sm" className="w-full justify-start text-sidebar-foreground"><ArrowLeft className="w-4 h-4 mr-2" />Voir la boutique</Button>
          <Button onClick={signOut} variant="ghost" size="sm" className="w-full justify-start text-sidebar-foreground"><LogOut className="w-4 h-4 mr-2" />Déconnexion</Button>
        </div>
      </aside>

      {/* Mobile top nav */}
      <div className="md:hidden fixed top-0 inset-x-0 z-40 bg-sidebar border-b border-sidebar-border">
        <div className="flex items-center gap-2 px-4 h-14">
          <Sparkles className="w-5 h-5 text-primary" />
          <span className="font-display font-bold">Admin</span>
          <Button onClick={() => navigate("/")} variant="ghost" size="sm" className="ml-auto">Boutique</Button>
        </div>
        <div className="flex gap-1 overflow-x-auto no-scrollbar px-3 pb-2">
          {links.map((l) => {
            const Icon = l.icon;
            return (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.end}
                className={({ isActive }) => cn(
                  "shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold",
                  isActive ? "bg-sidebar-primary text-sidebar-primary-foreground" : "text-sidebar-foreground bg-sidebar-accent"
                )}
              >
                <Icon className="w-3.5 h-3.5" />{l.label}
              </NavLink>
            );
          })}
        </div>
      </div>

      {/* Main */}
      <main className="flex-1 p-6 md:p-8 pt-28 md:pt-8 max-w-full overflow-x-hidden">
        <Outlet />
      </main>
    </div>
  );
}
