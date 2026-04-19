import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Home, Heart, ShoppingBag, User, Sparkles } from "lucide-react";
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
    <div className="min-h-screen bg-gradient-hero pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-background/70 border-b border-border">
        <div className="container flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow group-hover:scale-110 transition-transform">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-display font-extrabold text-xl tracking-tight">NEONO</span>
          </Link>
          {profile?.plan && profile.plan !== "free" && (
            <span className={cn(
              "text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider",
              profile.plan === "premium" ? "bg-gradient-premium text-primary-foreground" : "bg-accent text-accent-foreground"
            )}>
              {profile.plan}
            </span>
          )}
          {!user && (
            <button
              onClick={() => navigate("/auth")}
              className="text-sm font-semibold text-primary hover:text-primary-glow transition-colors"
            >
              Se connecter
            </button>
          )}
        </div>
      </header>

      {/* Main */}
      <main className="container py-6 animate-fade-in">{children}</main>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 inset-x-0 z-40 backdrop-blur-xl bg-background/90 border-t border-border">
        <div className="container grid grid-cols-4 h-20">
          {tabs.map((t) => {
            const active = location.pathname === t.to;
            const Icon = t.icon;
            return (
              <Link
                key={t.to}
                to={t.to}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 transition-all relative",
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <div className="relative">
                  <Icon className={cn("w-6 h-6 transition-transform", active && "scale-110")} />
                  {!!t.badge && t.badge > 0 && (
                    <span className="absolute -top-2 -right-2 w-5 h-5 text-xs font-bold rounded-full bg-accent text-accent-foreground flex items-center justify-center">
                      {t.badge > 9 ? "9+" : t.badge}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-semibold uppercase tracking-wider">{t.label}</span>
                {active && <div className="absolute top-0 w-12 h-1 bg-gradient-primary rounded-b-full" />}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
