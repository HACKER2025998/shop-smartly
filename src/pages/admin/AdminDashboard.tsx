import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Package, ShoppingCart, Users, TrendingUp, AlertTriangle, Crown } from "lucide-react";
import { formatFCFA } from "@/lib/format";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid } from "recharts";

type Stats = {
  revenue: number;
  ordersCount: number;
  productsCount: number;
  usersCount: number;
  pendingPremium: number;
  lowStock: number;
  byDay: { date: string; revenue: number; orders: number }[];
  byStatus: { status: string; count: number }[];
};

const STATUS_LABEL: Record<string, string> = {
  pending: "En attente", validated: "Validée", rejected: "Rejetée",
  cancelled: "Annulée", delivered: "Livrée",
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    (async () => {
      const [orders, products, profiles, premium] = await Promise.all([
        supabase.from("orders").select("total, status, created_at"),
        supabase.from("products").select("id, stock, stock_threshold"),
        supabase.from("profiles").select("id"),
        supabase.from("premium_requests").select("id").eq("status", "pending"),
      ]);

      const o = orders.data ?? [];
      const validated = o.filter((x: any) => x.status === "validated" || x.status === "delivered");
      const revenue = validated.reduce((s: number, x: any) => s + Number(x.total), 0);

      // Last 14 days aggregation
      const days: Record<string, { revenue: number; orders: number }> = {};
      const now = new Date();
      for (let i = 13; i >= 0; i--) {
        const d = new Date(now); d.setDate(d.getDate() - i);
        days[d.toISOString().slice(0, 10)] = { revenue: 0, orders: 0 };
      }
      for (const ord of o as any[]) {
        const day = ord.created_at.slice(0, 10);
        if (days[day]) {
          days[day].orders += 1;
          if (ord.status === "validated" || ord.status === "delivered") days[day].revenue += Number(ord.total);
        }
      }
      const byDay = Object.entries(days).map(([date, v]) => ({
        date: date.slice(5),
        revenue: v.revenue,
        orders: v.orders,
      }));

      const byStatusMap: Record<string, number> = {};
      for (const ord of o as any[]) byStatusMap[ord.status] = (byStatusMap[ord.status] ?? 0) + 1;
      const byStatus = Object.entries(byStatusMap).map(([status, count]) => ({ status: STATUS_LABEL[status] ?? status, count }));

      const lowStock = (products.data ?? []).filter((p: any) => p.stock <= p.stock_threshold).length;

      setStats({
        revenue,
        ordersCount: o.length,
        productsCount: products.data?.length ?? 0,
        usersCount: profiles.data?.length ?? 0,
        pendingPremium: premium.data?.length ?? 0,
        lowStock,
        byDay,
        byStatus,
      });
    })();
  }, []);

  if (!stats) return <div className="text-muted-foreground">Chargement…</div>;

  const cards = [
    { label: "Chiffre d'affaires", value: formatFCFA(stats.revenue), icon: TrendingUp, color: "text-success" },
    { label: "Commandes", value: stats.ordersCount, icon: ShoppingCart, color: "text-primary" },
    { label: "Produits", value: stats.productsCount, icon: Package, color: "text-accent" },
    { label: "Clients", value: stats.usersCount, icon: Users, color: "text-warning" },
    { label: "Demandes Premium", value: stats.pendingPremium, icon: Crown, color: "text-warning", alert: stats.pendingPremium > 0 },
    { label: "Stock faible", value: stats.lowStock, icon: AlertTriangle, color: "text-destructive", alert: stats.lowStock > 0 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display font-extrabold text-3xl">Dashboard</h1>
        <p className="text-muted-foreground">Vue d'ensemble de la boutique</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <Card key={c.label} className={`p-5 ${c.alert ? "ring-2 ring-warning" : ""}`}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs uppercase font-semibold text-muted-foreground tracking-wider">{c.label}</div>
                  <div className="font-display font-extrabold text-2xl mt-2">{c.value}</div>
                </div>
                <Icon className={`w-6 h-6 ${c.color}`} />
              </div>
            </Card>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="p-5">
          <h3 className="font-display font-bold mb-4">Revenus — 14 derniers jours</h3>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={stats.byDay}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12 }} />
              <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={3} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-5">
          <h3 className="font-display font-bold mb-4">Commandes par statut</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={stats.byStatus}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="status" stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12 }} />
              <Bar dataKey="count" fill="hsl(var(--accent))" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}
