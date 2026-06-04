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
      <header className="sticky top-0 z-40 bg-card/85 backdrop-blur-xl border-b border-border/60">
        <div className="container flex items-center justify-between h-16 gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group shrink-0">
            <div className="w-9 h-9 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-glow group-hover:scale-105 transition-all duration-200">
              <Store className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <span className="font-display font-bold text-xl text-foreground tracking-tight">Shop Smartly</span>
          </Link>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {profile?.plan && profile.plan !== "free" && (
              <span className={cn(
                "text-[11px] font-bold px-2.5 py-1 rounded-full tracking-wide uppercase",
                profile.plan === "premium"
                  ? "bg-gradient-premium text-white shadow-sm"
                  : "bg-secondary text-secondary-foreground"
              )}>
                {profile.plan === "premium" ? "✦ Premium" : "Medium"}
              </span>
            )}
            {!user && (
              <button
                onClick={() => navigate("/auth")}
                className="text-sm font-semibold text-primary bg-primary/8 hover:bg-primary/15 px-4 py-1.5 rounded-full transition-all"
              >
                Connexion
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Page content */}
      <main className="container py-6 animate-fade-in">{children}</main>

      {/* Bottom navigation */}
      <nav className="fixed bottom-0 inset-x-0 z-40 bg-card/95 backdrop-blur-2xl border-t border-border/60 pb-safe">
        <div className="container grid grid-cols-4 h-16">
          {tabs.map((t) => {
            const isActive = location.pathname === t.to;
            const Icon = t.icon;
            return (
              <Link
                key={t.to}
                to={t.to}
                className="flex flex-col items-center justify-center gap-0.5 relative transition-all duration-200"
              >
                {/* Active indicator */}
                {isActive && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-b-full" />
                )}
                <div className={cn(
                  "w-10 h-8 flex items-center justify-center rounded-2xl transition-all duration-200 relative",
                  isActive ? "bg-primary/10" : ""
                )}>
                  <Icon
                    className={cn(
                      "w-5 h-5 transition-all duration-200",
                      isActive ? "text-primary" : "text-muted-foreground"
                    )}
                    strokeWidth={isActive ? 2.5 : 1.8}
                  />
                  {!!t.badge && t.badge > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] text-[10px] font-bold rounded-full bg-primary text-white flex items-center justify-center px-1 leading-none animate-scale-in">
                      {t.badge > 9 ? "9+" : t.badge}
                    </span>
                  )}
                </div>
                <span className={cn(
                  "text-[9px] font-semibold uppercase tracking-widest transition-colors duration-200",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}>
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
