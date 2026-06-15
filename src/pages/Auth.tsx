import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Loader2, Store } from "lucide-react";

export default function Auth() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate("/", { replace: true });
  }, [user, loading, navigate]);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        navigate("/", { replace: true });
      }
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  const handleGoogleLogin = async () => {
    setBusy(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
        extraParams: { prompt: "select_account" },
      });
      if (result.error) {
        console.error("OAuth error:", result.error);
        toast.error("Erreur lors de la connexion Google");
        setBusy(false);
        return;
      }
      if (result.redirected) return;
      navigate("/", { replace: true });
    } catch (e) {
      console.error(e);
      toast.error("Erreur lors de la connexion Google");
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-hero">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero flex flex-col items-center justify-center p-6">
      {/* Logo */}
      <div className="flex items-center gap-3 mb-10">
        <div className="w-14 h-14 rounded-3xl bg-gradient-primary shadow-glow flex items-center justify-center">
          <Store className="w-7 h-7 text-white" />
        </div>
        <div>
          <div className="font-display font-extrabold text-3xl text-foreground leading-none">Shop Smartly</div>
          <div className="text-sm text-muted-foreground mt-0.5">Votre boutique préférée</div>
        </div>
      </div>

      {/* Card connexion */}
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-3xl shadow-elegant p-8 border border-border">
          <h1 className="font-display font-extrabold text-2xl text-center mb-2">Bienvenue 👋</h1>
          <p className="text-muted-foreground text-sm text-center mb-8 leading-relaxed">
            Connectez-vous pour commander, sauvegarder vos favoris et suivre vos achats.
          </p>

          <button
            onClick={handleGoogleLogin}
            disabled={busy}
            className="w-full flex items-center justify-center gap-3 bg-white border-2 border-border hover:border-primary rounded-2xl h-14 font-semibold text-foreground transition-all hover:shadow-card active:scale-[0.98] disabled:opacity-60"
          >
            {busy ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                {/* Google G logo SVG */}
                <svg width="20" height="20" viewBox="0 0 48 48" fill="none">
                  <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 35 24 35c-6.1 0-11-4.9-11-11s4.9-11 11-11c2.8 0 5.3 1 7.2 2.7l5.7-5.7C33.5 6.7 29 5 24 5 13.5 5 5 13.5 5 24s8.5 19 19 19 19-8.5 19-19c0-1.2-.1-2.3-.4-3.5z"/>
                  <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 16.1 19 13 24 13c2.8 0 5.3 1 7.2 2.7l5.7-5.7C33.5 6.7 29 5 24 5 16.3 5 9.7 9 6.3 14.7z"/>
                  <path fill="#4CAF50" d="M24 43c4.9 0 9.3-1.8 12.7-4.8l-5.9-5c-1.7 1.2-3.9 2-6.8 2-5.3 0-9.7-3.3-11.3-8H6.3C9.6 39 16.3 43 24 43z"/>
                  <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4 5.4l5.9 5C40.8 35.6 43 30.2 43 24c0-1.2-.1-2.3-.4-3.5z"/>
                </svg>
                Continuer avec Google
              </>
            )}
          </button>

          <p className="text-center text-xs text-muted-foreground mt-6 leading-relaxed">
            En vous connectant, vous acceptez nos{" "}
            <span className="text-primary font-medium">conditions d'utilisation</span>
          </p>
        </div>

        {/* Réassurance */}
        <div className="mt-6 flex items-center justify-center gap-6 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">🔒 Sécurisé</span>
          <span className="flex items-center gap-1.5">⚡ Rapide</span>
          <span className="flex items-center gap-1.5">✅ Fiable</span>
        </div>
      </div>
    </div>
  );
}
