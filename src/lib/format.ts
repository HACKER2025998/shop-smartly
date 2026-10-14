export function formatFCFA(amount: number | string | null | undefined): string {
  const n = typeof amount === "string" ? parseFloat(amount) : amount ?? 0;
  return `${(n || 0).toLocaleString("fr-FR")} F`;
}

export function effectivePrice(p: { price: number | string; discounted_price: number | string | null }): number {
  const base = typeof p.price === "string" ? parseFloat(p.price) : p.price;
  const disc = p.discounted_price == null ? null : Number(p.discounted_price);
  return disc !== null && disc >= 0 && disc < base ? disc : base;
}
