import { Link } from "react-router-dom";
export function Brand() {
  return <Link to="/" className="flex items-center gap-3" aria-label="Shop Smartly — accueil"><svg viewBox="0 0 48 48" width="42" height="42" aria-hidden="true"><rect width="48" height="48" rx="12" fill="#193f35"/><path d="M13 18h22l-2 20H15l-2-20Zm6 0v-3a5 5 0 0 1 10 0v3" fill="none" stroke="#faf7ee" strokeWidth="2"/><path d="m20 27 3 3 6-7" fill="none" stroke="#e9b879" strokeWidth="2.5"/></svg><span className="leading-tight"><span className="block font-display text-xl font-bold tracking-tight">Shop Smartly<span className="text-primary">.</span></span><span className="block text-[10px] uppercase tracking-[.22em] text-muted-foreground">Bien choisir. Simplement.</span></span></Link>;
}
