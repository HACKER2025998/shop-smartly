// Admin WhatsApp number (Togo +228)
export const ADMIN_WHATSAPP = "22892176677";
export const ADMIN_DISPLAY = "+228 92 17 66 77";

export type OrderItemSummary = {
  name: string;
  quantity: number;
  unitPrice: number;
};

export function buildOrderWhatsAppMessage(opts: {
  orderId: string;
  customerName: string;
  customerPhone: string;
  items: OrderItemSummary[];
  total: number;
  notes?: string;
}): string {
  const lines = [
    `🛒 *NOUVELLE COMMANDE*`,
    `━━━━━━━━━━━━━━━━`,
    `🆔 Commande: ${opts.orderId.slice(0, 8).toUpperCase()}`,
    `👤 Client: ${opts.customerName || "—"}`,
    `📞 Téléphone: ${opts.customerPhone}`,
    ``,
    `📦 *Articles:*`,
    ...opts.items.map(
      (i) => `• ${i.name} × ${i.quantity} = ${(i.unitPrice * i.quantity).toLocaleString()} F`
    ),
    ``,
    `💰 *TOTAL: ${opts.total.toLocaleString()} FCFA*`,
  ];
  if (opts.notes) lines.push(``, `📝 Notes: ${opts.notes}`);
  lines.push(``, `Merci de contacter le client pour valider le paiement et la livraison.`);
  return lines.join("\n");
}

export function buildPremiumWhatsAppMessage(opts: {
  customerName: string;
  customerPhone: string;
  plan: string;
}): string {
  return [
    `⭐ *DEMANDE D'UPGRADE*`,
    `━━━━━━━━━━━━━━━━`,
    `👤 Client: ${opts.customerName || "—"}`,
    `📞 Téléphone: ${opts.customerPhone}`,
    `🎯 Plan demandé: ${opts.plan.toUpperCase()}`,
    ``,
    `Merci de contacter le client pour finaliser le paiement.`,
  ].join("\n");
}

export function openWhatsApp(message: string, phone: string = ADMIN_WHATSAPP) {
  const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  window.open(url, "_blank", "noopener,noreferrer");
}
