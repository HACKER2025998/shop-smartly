import { useNavigate } from "react-router-dom";
import { Home, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-hero p-6">
      <div className="text-center space-y-6 max-w-sm">
        <div className="w-24 h-24 rounded-3xl bg-gradient-primary mx-auto flex items-center justify-center shadow-glow">
          <SearchX className="w-12 h-12 text-white" />
        </div>
        <div>
          <h1 className="font-display font-extrabold text-5xl text-primary mb-2">404</h1>
          <p className="text-lg font-semibold text-foreground">Page introuvable</p>
          <p className="text-sm text-muted-foreground mt-1">Cette page n'existe pas ou a été déplacée.</p>
        </div>
        <Button onClick={() => navigate("/")} className="bg-primary text-white shadow-glow w-full h-12 rounded-2xl font-semibold">
          <Home className="w-4 h-4 mr-2" />
          Retour à la boutique
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
