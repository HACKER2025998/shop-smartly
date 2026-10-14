import { supabase } from "@/integrations/supabase/client";
import type { OrderItemSummary } from "@/lib/whatsapp";
export type CheckoutOrder = { id: string; total: number; customer_name: string | null; customer_phone: string; notes: string | null; items: OrderItemSummary[] };
export async function checkoutCart(requestId: string, notes: string): Promise<CheckoutOrder> {
 const { data,error } = await supabase.rpc("checkout_cart", { p_request_id: requestId, p_notes: notes || null });
 if (error) throw error;
 const order = data as unknown as CheckoutOrder;
 if (!order?.id || !Array.isArray(order.items)) throw new Error("Réponse de commande invalide");
 return order;
}
export function checkoutError(error: unknown): string {
 const e = error as { message?: string; code?: string };
 if (e?.code === "PGRST202") return "Le service de commande doit être activé dans Supabase. Votre panier est conservé.";
 const message = e?.message ?? "";
 if (message.includes("STOCK_INSUFFICIENT")) return "Le stock a changé. Vérifiez les quantités de votre panier.";
 if (message.includes("PLAN_REQUIRED")) return "Votre formule ne permet pas de commander un de ces articles.";
 if (message.includes("PRODUCT_UNAVAILABLE")) return "Un article est devenu indisponible. Vérifiez votre panier.";
 if (message.includes("CART_EMPTY")) return "Votre panier est vide ou a déjà été commandé.";
 if (message.includes("AUTH_REQUIRED") || message.includes("PROFILE_REQUIRED")) return "Reconnectez-vous pour commander.";
 return "La commande ne peut pas être confirmée. Réessayez : la même tentative ne créera pas de doublon.";
}
