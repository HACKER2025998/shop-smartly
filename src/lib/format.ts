export function formatFCFA(amount: number | string | null | undefined): string {
  const n = typeof amount === "string" ? parseFloat(amount) : amount ?? 0;
  return `${(n || 0).toLocaleString("fr-FR")} F`;
}

export function effectivePrice(p: { price: number | string; discounted_price: number | string | null }): number {
  const base = typeof p.price === "string" ? parseFloat(p.price) : p.price;
  const disc = p.discounted_price ? (typeof p.discounted_price === "string" ? parseFloat(p.discounted_price) : p.discounted_price) : null;
  return disc && disc < base ? disc : base;
}
