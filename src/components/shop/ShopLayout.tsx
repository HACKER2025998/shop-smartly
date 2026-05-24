import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Home, Heart, ShoppingBag, User, Store } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export function ShopLayout({ children }: { children: React.ReactNode }) {
  const { user, profile } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    if (!user) { setCartCount(0); return; }
    const load = async () => {
      const { data } = await supabase.from("cart_items").select("quantity").eq("user_id", user.id);
      setCartCount(data?.reduce((s, i) => s + i.quantity, 0) ?? 0);
    };
    load();
    const ch = supabase
      .channel("cart-count")
      .on("postgres_changes", { event: "*", schema: "public", table: "cart_items", filter: `user_id=eq.${user.id}` }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user]);

  const tabs = [
    { to: "/", icon: Home, label: "Boutique" },
    { to: "/favoris", icon: Heart, label: "Favoris" },
    { to: "/panier", icon: ShoppingBag, label: "Panier", badge: cartCount },
    { to: "/compte", icon: User, label: "Compte" },
  ];

  return (
    <div className="min-h-screen bg-gradient-hero pb-28">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-border shadow-card">
        <div className="container flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-glow group-hover:scale-105 transition-transform duration-200">
              <Store className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-extrabold text-xl text-foreground">Shop Smartly</span>
          </Link>
          <div className="flex items-center gap-3">
            {profile?.plan && profile.plan !== "free" && (
              <span className={cn(
                "text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide",
                profile.plan === "premium" ? "bg-gradient-premium text-white" : "bg-secondary text-secondary-foreground"
              )}>
                {profile.plan === "premium" ? "⭐ Premium" : "Medium"}
              </span>
            )}
            {!user && (
              <button
                onClick={() => navigate("/auth")}
                className="text-sm font-semibold text-primary hover:text-primary/80 transition-colors bg-primary/10 px-4 py-1.5 rounded-full"
              >
                Se connecter
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="container py-6 animate-fade-in">{children}</main>

      {/* Bottom nav — style app mobile */}
      <nav className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-xl border-t border-border pb-safe">
        <div className="container grid grid-cols-4 h-16">
          {tabs.map((t) => {
            const active = location.pathname === t.to;
            const Icon = t.icon;
            return (
              <Link
                key={t.to}
                to={t.to}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 transition-all duration-200 relative",
                  active ? "text-primary" : "text-muted-foreground"
                )}
              >
                <div className="relative">
                  <div className={cn(
                    "w-10 h-8 flex items-center justify-center rounded-xl transition-all duration-200",
                    active ? "bg-primary/12 scale-105" : "hover:bg-muted"
                  )}>
                    <Icon className={cn("w-5 h-5", active && "stroke-[2.5]")} />
                  </div>
                  {!!t.badge && t.badge > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 text-[10px] font-bold rounded-full bg-accent text-white flex items-center justify-center leading-none">
                      {t.badge > 9 ? "9+" : t.badge}
                    </span>
                  )}
                </div>
                <span className={cn("text-[10px] font-semibold", active ? "text-primary" : "text-muted-foreground")}>
                  {t.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
