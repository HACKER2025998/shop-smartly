import { useNavigate } from "react-router-dom";
import { Home, MoveLeft } from "lucide-react";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-6">
      <div className="text-center space-y-6 max-w-xs animate-fade-in">
        {/* Illustration */}
        <div className="relative mx-auto w-28 h-28">
          <div className="absolute inset-0 rounded-3xl bg-gradient-primary opacity-15 rotate-6" />
          <div className="relative w-full h-full rounded-3xl bg-gradient-primary flex items-center justify-center shadow-glow">
            <span className="font-display font-bold text-white text-4xl">404</span>
          </div>
        </div>

        <div>
          <h1 className="font-display font-bold text-2xl text-foreground mb-2">Page introuvable</h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Cette page n'existe pas ou a été déplacée.
          </p>
        </div>

        <button
          onClick={() => navigate("/")}
          className="inline-flex items-center gap-2 bg-primary text-white font-semibold px-6 py-3 rounded-2xl shadow-glow hover:bg-primary/90 transition-all active:scale-95"
        >
          <Home className="w-4 h-4" />
          Retour à la boutique
        </button>
      </div>
    </div>
  );
}
