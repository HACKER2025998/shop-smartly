import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

type Cat = { id: string; name: string; slug: string; is_adult: boolean; description: string | null };

export default function AdminCategories() {
  const [cats, setCats] = useState<Cat[]>([]);
  const [name, setName] = useState("");
  const [adult, setAdult] = useState(false);

  const load = async () => {
    const { data } = await supabase.from("categories").select("*").order("name");
    setCats((data as Cat[]) ?? []);
  };

  useEffect(() => { load(); }, []);

  const create = async () => {
    if (name.trim().length < 2) { toast.error("Nom trop court"); return; }
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const { error } = await supabase.from("categories").insert({ name: name.trim(), slug, is_adult: adult });
    if (error) { toast.error(error.message); return; }
    toast.success("Catégorie créée");
    setName(""); setAdult(false); load();
  };

  const remove = async (c: Cat) => {
    if (!confirm(`Supprimer "${c.name}" ?`)) return;
    const { error } = await supabase.from("categories").delete().eq("id", c.id);
    if (error) { toast.error(error.message); return; }
    load();
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div><h1 className="font-display font-extrabold text-3xl">Catégories</h1></div>

      <Card className="p-5 space-y-3">
        <h3 className="font-bold">Nouvelle catégorie</h3>
        <div><Label>Nom</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Mode, Tech, Adulte…" /></div>
        <div className="flex items-center justify-between">
          <Label>Catégorie adulte (Premium uniquement)</Label>
          <Switch checked={adult} onCheckedChange={setAdult} />
        </div>
        <Button onClick={create} className="bg-primary text-primary-foreground"><Plus className="w-4 h-4 mr-2" />Créer</Button>
      </Card>

      <div className="space-y-2">
        {cats.map((c) => (
          <Card key={c.id} className="p-4 flex items-center justify-between">
            <div>
              <div className="font-semibold">{c.name} {c.is_adult && <span className="text-xs ml-2 px-2 py-0.5 rounded bg-accent/20 text-accent">18+</span>}</div>
              <div className="text-xs text-muted-foreground font-mono">/{c.slug}</div>
            </div>
            <Button onClick={() => remove(c)} size="icon" variant="destructive"><Trash2 className="w-4 h-4" /></Button>
          </Card>
        ))}
      </div>
    </div>
  );
}
