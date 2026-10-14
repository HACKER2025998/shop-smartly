import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { MessageCircle, X, Send } from "lucide-react";
import { ADMIN_WHATSAPP } from "@/lib/whatsapp";
type Message = { role: "assistant" | "user"; text: string };
function answer(question: string): string {
  const q = question.toLocaleLowerCase("fr").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (/livrai|delai|adresse/.test(q)) return "Ajoutez votre adresse dans les notes du panier. Le service client confirme avec vous les frais et le délai de livraison sur WhatsApp avant de finaliser la commande.";
  if (/pai|command|acheter|panier/.test(q)) return "Connectez-vous avec Google, ajoutez vos articles au panier puis choisissez « Valider via WhatsApp ». Le service client vous contacte pour confirmer le paiement et la livraison. Aucun paiement bancaire n’est effectué ici.";
  if (/google|connect|compte/.test(q)) return "Choisissez « Connexion », puis « Continuer avec Google ». Votre compte vous permet de retrouver vos favoris et vos commandes. Ne partagez jamais votre mot de passe ni vos codes de connexion.";
  if (/favori|sauvegard|coeur/.test(q)) return "Touchez le cœur d’un produit pour le sauvegarder. Vos articles sont disponibles dans Favoris après connexion.";
  if (/premium|medium|abonnement/.test(q)) return "Certains articles sont réservés aux comptes Medium ou Premium. Consultez la rubrique Compte pour demander un changement de formule auprès du service client.";
  if (/retour|rembours|annul|probleme/.test(q)) return "Contactez le service client sur WhatsApp avec la référence de votre commande. Il vous indiquera les possibilités d’annulation ou de retour pour votre achat.";
  return "Je peux vous expliquer les commandes, la livraison, la connexion Google et les favoris. Pour le stock précis, une commande personnelle ou une question particulière, contactez notre équipe sur WhatsApp.";
}
export function HelpChat() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([{ role: "assistant", text: "Bonjour ! Je suis le guide de la boutique, un assistant automatique d’aide. Comment puis-je vous orienter ?" }]);
  const end = useRef<HTMLDivElement>(null);
  const field = useRef<HTMLInputElement>(null);
  useEffect(() => { if (open) { end.current?.scrollIntoView({ block: "nearest" }); field.current?.focus(); } }, [open, messages]);
  const send = (text: string) => { if (!text.trim()) return; setMessages(m => [...m.slice(-38), { role: "user", text: text.trim() }, { role: "assistant", text: answer(text) }]); setInput(""); };
  return <div className="help-chat">{open && <section id="shop-help" aria-label="Assistant de la boutique" className="chat-panel"><header className="flex items-center justify-between border-b p-4"><div><strong>Un coup de main ?</strong><p className="text-xs text-muted-foreground">Guide automatique · sans accès à vos données</p></div><button aria-label="Fermer l’assistant" onClick={() => setOpen(false)} className="p-2"><X size={18}/></button></header><div className="chat-messages" role="log" aria-live="polite">{messages.map((m, i) => <p key={i} className={m.role === "user" ? "chat-user" : "chat-answer"}>{m.text}</p>)}<div ref={end}/></div><div className="flex flex-wrap gap-2 px-4 pb-3">{["Commander", "Livraison", "Connexion"].map(q => <button key={q} onClick={() => send(q)} className="rounded-full border px-3 py-1 text-xs">{q}</button>)}</div><form onSubmit={e => { e.preventDefault(); send(input); }} className="flex gap-2 border-t p-3"><input ref={field} aria-label="Votre question" value={input} onChange={e => setInput(e.target.value)} maxLength={500} placeholder="Votre question…" className="min-w-0 flex-1 rounded-lg border bg-background px-3 text-sm"/><button disabled={!input.trim()} aria-label="Envoyer" className="rounded-lg bg-primary p-3 text-primary-foreground disabled:opacity-40"><Send size={16}/></button></form><div className="flex justify-between px-4 pb-3 text-xs"><Link to="/compte" onClick={() => setOpen(false)}>Mon compte</Link><a href={`https://wa.me/${ADMIN_WHATSAPP}`} target="_blank" rel="noopener noreferrer">Parler à notre équipe ↗</a></div></section>}<button onClick={() => setOpen(!open)} aria-expanded={open} aria-controls="shop-help" className="chat-launch"><MessageCircle size={20}/><span>Aide</span></button></div>;
}
