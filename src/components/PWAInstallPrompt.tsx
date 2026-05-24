import { useEffect, useState } from "react";
import { Download, X, Smartphone } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check if already dismissed
    const dismissed = localStorage.getItem("pwa-install-dismissed");
    if (dismissed) return;

    // Check iOS
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
    
    if (ios && !isStandalone) {
      setIsIOS(true);
      setShow(true);
      return;
    }

    // Android/Chrome install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShow(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setShow(false);
      }
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShow(false);
    setIsDismissed(true);
    localStorage.setItem("pwa-install-dismissed", "1");
  };

  if (!show || isDismissed) return null;

  return (
    <div className="fixed bottom-24 inset-x-4 z-50 animate-slide-up">
      <div className="bg-white rounded-3xl shadow-elegant border border-border p-4 flex gap-3 items-start">
        <div className="w-11 h-11 rounded-2xl bg-gradient-primary flex items-center justify-center shrink-0 shadow-glow">
          <Smartphone className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-display font-bold text-sm text-foreground">Installer l'application</p>
          {isIOS ? (
            <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
              Appuie sur <span className="font-semibold">Partager</span> puis <span className="font-semibold">Sur l'écran d'accueil</span>
            </p>
          ) : (
            <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
              Accès rapide depuis ton écran d'accueil, sans navigateur
            </p>
          )}
          {!isIOS && (
            <button
              onClick={handleInstall}
              className="mt-2 flex items-center gap-1.5 bg-primary text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-glow"
            >
              <Download className="w-3 h-3" />
              Installer
            </button>
          )}
        </div>
        <button onClick={handleDismiss} className="text-muted-foreground hover:text-foreground p-1 -mt-0.5 -mr-1">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
