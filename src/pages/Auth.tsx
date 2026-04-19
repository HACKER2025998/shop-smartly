import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { z } from "zod";
import { isValidPhoneNumber, parsePhoneNumberFromString } from "libphonenumber-js";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { detectCountry } from "@/lib/geo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Sparkles, Loader2 } from "lucide-react";

const signupSchema = z.object({
  fullName: z.string().trim().min(2, "Nom trop court").max(80),
  email: z.string().trim().email("Email invalide").max(255),
  password: z.string().min(8, "8 caractères minimum").max(72),
  phone: z.string().min(6, "Numéro requis"),
});

const loginSchema = z.object({
  email: z.string().trim().email("Email invalide").min(1),
  password: z.string().min(1, "Requis"),
}).required();

export default function Auth() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [country, setCountry] = useState({ code: "TG", dialCode: "228", name: "Togo" });
  const [busy, setBusy] = useState(false);

  // signup form
  const [su, setSu] = useState({ fullName: "", email: "", password: "", phone: "" });
  // login form
  const [li, setLi] = useState({ email: "", password: "" });

  useEffect(() => {
    detectCountry().then(setCountry);
  }, []);

  useEffect(() => {
    if (!loading && user) navigate("/", { replace: true });
  }, [user, loading, navigate]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = signupSchema.safeParse(su);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    // Validate phone with country
    const fullPhone = `+${country.dialCode}${su.phone.replace(/^0+/, "")}`;
    if (!isValidPhoneNumber(fullPhone)) {
      toast.error(`Numéro invalide pour ${country.name}`);
      return;
    }
    const formatted = parsePhoneNumberFromString(fullPhone)?.number ?? fullPhone;

    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: {
          full_name: parsed.data.fullName,
          phone: formatted,
          country_code: country.code,
        },
      },
    });
    setBusy(false);
    if (error) {
      toast.error(error.message.includes("registered") ? "Email déjà utilisé" : error.message);
      return;
    }
    toast.success("Compte créé ! Bienvenue.");
    navigate("/", { replace: true });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = loginSchema.safeParse(li);
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.password,
    });
    setBusy(false);
    if (error) {
      toast.error(error.message.includes("Invalid") ? "Email ou mot de passe incorrect" : error.message);
      return;
    }
    navigate("/", { replace: true });
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center justify-center gap-2 mb-8 group">
          <div className="w-12 h-12 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-glow group-hover:scale-110 transition-transform">
            <Sparkles className="w-6 h-6 text-primary-foreground" />
          </div>
          <span className="font-display font-extrabold text-3xl">NEONO</span>
        </Link>

        <div className="bg-card border border-border rounded-3xl p-6 shadow-elegant">
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid grid-cols-2 w-full mb-6">
              <TabsTrigger value="login">Connexion</TabsTrigger>
              <TabsTrigger value="signup">Créer un compte</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="li-email">Email</Label>
                  <Input id="li-email" type="email" value={li.email} onChange={(e) => setLi({ ...li, email: e.target.value })} placeholder="vous@exemple.com" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="li-pwd">Mot de passe</Label>
                  <Input id="li-pwd" type="password" value={li.password} onChange={(e) => setLi({ ...li, password: e.target.value })} required />
                </div>
                <Button type="submit" className="w-full bg-gradient-primary text-primary-foreground hover:opacity-90 shadow-glow font-semibold h-12" disabled={busy}>
                  {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : "Se connecter"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="su-name">Nom complet</Label>
                  <Input id="su-name" value={su.fullName} onChange={(e) => setSu({ ...su, fullName: e.target.value })} placeholder="Kofi Adams" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="su-email">Email</Label>
                  <Input id="su-email" type="email" value={su.email} onChange={(e) => setSu({ ...su, email: e.target.value })} placeholder="vous@exemple.com" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="su-phone">Téléphone ({country.name})</Label>
                  <div className="flex gap-2">
                    <div className="flex items-center px-3 rounded-md bg-muted border border-input text-sm font-mono">
                      +{country.dialCode}
                    </div>
                    <Input id="su-phone" type="tel" value={su.phone} onChange={(e) => setSu({ ...su, phone: e.target.value })} placeholder="92 17 66 77" required className="flex-1" />
                  </div>
                  <p className="text-xs text-muted-foreground">Pays détecté automatiquement</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="su-pwd">Mot de passe (8+ car.)</Label>
                  <Input id="su-pwd" type="password" value={su.password} onChange={(e) => setSu({ ...su, password: e.target.value })} required />
                </div>
                <Button type="submit" className="w-full bg-gradient-primary text-primary-foreground hover:opacity-90 shadow-glow font-semibold h-12" disabled={busy}>
                  {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : "Créer mon compte"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          En continuant, vous acceptez nos conditions d'utilisation
        </p>
      </div>
    </div>
  );
}
