// Numéro WhatsApp admin (Togo +228)
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
    `🛒 *NOUVELLE COMMANDE — Shop Smartly*`,
    `━━━━━━━━━━━━━━━━━━━━`,
    `🆔 Réf: ${opts.orderId.slice(0, 8).toUpperCase()}`,
    `👤 Client: ${opts.customerName || "—"}`,
    `📞 Téléphone: ${opts.customerPhone}`,
    ``,
    `📦 *Articles commandés:*`,
    ...opts.items.map(
      (i) => `  • ${i.name} × ${i.quantity} = ${(i.unitPrice * i.quantity).toLocaleString("fr-FR")} FCFA`
    ),
    ``,
    `💰 *TOTAL: ${opts.total.toLocaleString("fr-FR")} FCFA*`,
  ];
  if (opts.notes) lines.push(``, `📝 Notes: ${opts.notes}`);
  lines.push(``, `➡️ Merci de contacter le client pour valider le paiement et organiser la livraison.`);
  return lines.join("\n");
}

export function buildPremiumWhatsAppMessage(opts: {
  customerName: string;
  customerPhone: string;
  plan: string;
}): string {
  return [
    `⭐ *DEMANDE D'UPGRADE — Shop Smartly*`,
    `━━━━━━━━━━━━━━━━━━━━`,
    `👤 Client: ${opts.customerName || "—"}`,
    `📞 Téléphone: ${opts.customerPhone}`,
    `🎯 Plan demandé: *${opts.plan.toUpperCase()}*`,
    ``,
    `➡️ Merci de contacter le client pour finaliser le paiement.`,
  ].join("\n");
}

/**
 * Partage d'un produit via WhatsApp avec image + lien
 * WhatsApp ne supporte pas l'envoi direct d'image via URL,
 * mais on inclut l'URL de l'image dans le texte pour le preview OG
 */
export function buildProductShareMessage(opts: {
  productName: string;
  price: string;
  productUrl: string;
  imageUrl?: string | null;
}): string {
  const lines = [
    `🛍️ *${opts.productName}*`,
    `💰 ${opts.price}`,
    ``,
    `Disponible sur Shop Smartly :`,
    opts.productUrl,
  ];
  if (opts.imageUrl) {
    lines.push(``, `📸 Photo : ${opts.imageUrl}`);
  }
  return lines.join("\n");
}

export function openWhatsApp(message: string, phone: string = ADMIN_WHATSAPP) {
  const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  window.open(url, "_blank", "noopener,noreferrer");
}

export function shareProductWhatsApp(opts: {
  productName: string;
  price: string;
  productUrl: string;
  imageUrl?: string | null;
}) {
  const message = buildProductShareMessage(opts);
  // wa.me sans numéro = choisir le destinataire soi-même
  const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
  window.open(url, "_blank", "noopener,noreferrer");
}
