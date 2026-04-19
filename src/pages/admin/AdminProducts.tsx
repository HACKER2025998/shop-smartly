import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { Plus, Edit, Trash2, AlertTriangle, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { formatFCFA } from "@/lib/format";
import { useAuth } from "@/hooks/useAuth";
import { z } from "zod";

type Product = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  discounted_price: number | null;
  image_url: string | null;
  stock: number;
  stock_threshold: number;
  category_id: string | null;
  required_plan: "free" | "medium" | "premium";
  is_active: boolean;
};
type Category = { id: string; name: string };

const productSchema = z.object({
  name: z.string().trim().min(2).max(120),
  description: z.string().max(2000).optional(),
  price: z.number().min(0),
  discounted_price: z.number().min(0).nullable(),
  stock: z.number().int().min(0),
  stock_threshold: z.number().int().min(0),
  category_id: z.string().uuid().nullable(),
  required_plan: z.enum(["free", "medium", "premium"]),
  is_active: z.boolean(),
  image_url: z.string().nullable(),
});

const empty: Omit<Product, "id"> = {
  name: "", description: "", price: 0, discounted_price: null,
  image_url: null, stock: 0, stock_threshold: 5,
  category_id: null, required_plan: "free", is_active: true,
};

export default function AdminProducts() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<Omit<Product, "id">>(empty);
  const [uploading, setUploading] = useState(false);

  const load = async () => {
    const [{ data: p }, { data: c }] = await Promise.all([
      supabase.from("products").select("*").order("created_at", { ascending: false }),
      supabase.from("categories").select("id, name").order("name"),
    ]);
    setProducts((p as Product[]) ?? []);
    setCategories((c as Category[]) ?? []);
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setForm(empty); setOpen(true); };
  const openEdit = (p: Product) => { setEditing(p); setForm({ ...p }); setOpen(true); };

  const handleUpload = async (file: File) => {
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("product-images").upload(path, file);
    if (error) { toast.error(error.message); setUploading(false); return; }
    const { data } = supabase.storage.from("product-images").getPublicUrl(path);
    setForm({ ...form, image_url: data.publicUrl });
    setUploading(false);
  };

  const save = async () => {
    const parsed = productSchema.safeParse(form);
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    if (editing) {
      const { error } = await supabase.from("products").update(parsed.data).eq("id", editing.id);
      if (error) { toast.error(error.message); return; }
      await supabase.from("activity_logs").insert({ actor_id: user?.id, action: "product_updated", entity_type: "product", entity_id: editing.id });
      toast.success("Produit mis à jour");
    } else {
      const { data, error } = await supabase.from("products").insert(parsed.data).select().single();
      if (error) { toast.error(error.message); return; }
      await supabase.from("activity_logs").insert({ actor_id: user?.id, action: "product_created", entity_type: "product", entity_id: data.id });
      toast.success("Produit créé");
    }
    setOpen(false);
    load();
  };

  const remove = async (p: Product) => {
    if (!confirm(`Supprimer "${p.name}" ?`)) return;
    const { error } = await supabase.from("products").delete().eq("id", p.id);
    if (error) { toast.error(error.message); return; }
    await supabase.from("activity_logs").insert({ actor_id: user?.id, action: "product_deleted", entity_type: "product", entity_id: p.id });
    toast.success("Supprimé");
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display font-extrabold text-3xl">Produits</h1>
          <p className="text-muted-foreground">{products.length} produit(s)</p>
        </div>
        <Button onClick={openCreate} className="bg-primary text-primary-foreground"><Plus className="w-4 h-4 mr-2" />Nouveau produit</Button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.map((p) => {
          const lowStock = p.stock <= p.stock_threshold;
          return (
            <Card key={p.id} className="overflow-hidden">
              <div className="aspect-video bg-muted relative">
                {p.image_url ? <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" /> :
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground"><ImageIcon className="w-10 h-10 opacity-30" /></div>}
                {!p.is_active && <span className="absolute top-2 left-2 bg-destructive/90 text-destructive-foreground text-xs px-2 py-1 rounded">Inactif</span>}
                {lowStock && <span className="absolute top-2 right-2 bg-warning/90 text-warning-foreground text-xs px-2 py-1 rounded flex items-center gap-1"><AlertTriangle className="w-3 h-3" />Stock bas</span>}
              </div>
              <div className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold truncate">{p.name}</h3>
                  <span className="text-xs uppercase font-bold text-muted-foreground">{p.required_plan}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="font-display font-bold text-primary">{formatFCFA(p.discounted_price ?? p.price)}</div>
                  <div className="text-xs text-muted-foreground">Stock: {p.stock}</div>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button onClick={() => openEdit(p)} size="sm" variant="outline" className="flex-1"><Edit className="w-3.5 h-3.5 mr-1" />Modifier</Button>
                  <Button onClick={() => remove(p)} size="sm" variant="destructive"><Trash2 className="w-3.5 h-3.5" /></Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Modifier produit" : "Nouveau produit"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Nom</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div><Label>Description</Label><Textarea value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Prix (F)</Label><Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} /></div>
              <div><Label>Prix promo (F)</Label><Input type="number" value={form.discounted_price ?? ""} onChange={(e) => setForm({ ...form, discounted_price: e.target.value ? Number(e.target.value) : null })} /></div>
              <div><Label>Stock</Label><Input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })} /></div>
              <div><Label>Seuil alerte</Label><Input type="number" value={form.stock_threshold} onChange={(e) => setForm({ ...form, stock_threshold: Number(e.target.value) })} /></div>
            </div>
            <div>
              <Label>Catégorie</Label>
              <Select value={form.category_id ?? "none"} onValueChange={(v) => setForm({ ...form, category_id: v === "none" ? null : v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Aucune</SelectItem>
                  {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Plan requis</Label>
              <Select value={form.required_plan} onValueChange={(v: any) => setForm({ ...form, required_plan: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Free (tout le monde)</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="premium">Premium (adulte/exclusif)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Image</Label>
              <Input type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); }} disabled={uploading} />
              {form.image_url && <img src={form.image_url} alt="" className="mt-2 w-32 h-32 rounded-lg object-cover" />}
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <Label>Actif (visible en boutique)</Label>
              <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
            <Button onClick={save} className="bg-primary text-primary-foreground">{editing ? "Enregistrer" : "Créer"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
