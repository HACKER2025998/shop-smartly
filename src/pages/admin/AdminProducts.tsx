import { cn } from "@/lib/utils";
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
import { Plus, Edit, Trash2, AlertTriangle, Image as ImageIcon, Loader2 } from "lucide-react";
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
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

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
    setForm((f) => ({ ...f, image_url: data.publicUrl }));
    setUploading(false);
  };

  const save = async () => {
    const parsed = productSchema.safeParse(form);
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    setSaving(true);
    const payload = {
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      price: parsed.data.price,
      discounted_price: parsed.data.discounted_price,
      stock: parsed.data.stock,
      stock_threshold: parsed.data.stock_threshold,
      category_id: parsed.data.category_id,
      required_plan: parsed.data.required_plan,
      is_active: parsed.data.is_active,
      image_url: parsed.data.image_url,
    };
    if (editing) {
      const { error } = await supabase.from("products").update(payload).eq("id", editing.id);
      if (error) { toast.error(error.message); setSaving(false); return; }
      await supabase.from("activity_logs").insert({ actor_id: user?.id, action: "product_updated", entity_type: "product", entity_id: editing.id });
      toast.success("Produit mis à jour");
    } else {
      const { data, error } = await supabase.from("products").insert(payload).select().single();
      if (error) { toast.error(error.message); setSaving(false); return; }
      await supabase.from("activity_logs").insert({ actor_id: user?.id, action: "product_created", entity_type: "product", entity_id: data.id });
      toast.success("Produit créé !");
    }
    setSaving(false);
    setOpen(false);
    load();
  };

  const remove = async (p: Product) => {
    if (!confirm(`Supprimer "${p.name}" ?\n\nL'historique des commandes existantes sera conservé.`)) return;
    setDeleting(p.id);

    // Désactiver d'abord pour éviter les achats en cours
    await supabase.from("products").update({ is_active: false }).eq("id", p.id);

    // Supprimer du panier
    await supabase.from("cart_items").delete().eq("product_id", p.id);

    // Supprimer les likes
    await supabase.from("product_likes").delete().eq("product_id", p.id);

    // Supprimer le produit (order_items garde la ref via SET NULL grâce à la migration)
    const { error } = await supabase.from("products").delete().eq("id", p.id);
    if (error) {
      toast.error(`Erreur: ${error.message}`);
      setDeleting(null);
      return;
    }

    await supabase.from("activity_logs").insert({ actor_id: user?.id, action: "product_deleted", entity_type: "product", entity_id: p.id });
    toast.success("Produit supprimé");
    setDeleting(null);
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display font-extrabold text-3xl">Produits</h1>
          <p className="text-muted-foreground">{products.length} produit(s)</p>
        </div>
        <Button onClick={openCreate} className="bg-primary text-white">
          <Plus className="w-4 h-4 mr-2" />Nouveau produit
        </Button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.map((p) => {
          const lowStock = p.stock <= p.stock_threshold;
          const isDeleting = deleting === p.id;
          return (
            <Card key={p.id} className={cn("overflow-hidden transition-opacity", isDeleting && "opacity-50 pointer-events-none")}>
              <div className="aspect-video bg-muted relative">
                {p.image_url ? (
                  <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="w-10 h-10 text-muted-foreground opacity-30" />
                  </div>
                )}
                {!p.is_active && (
                  <span className="absolute top-2 left-2 bg-destructive/90 text-white text-xs px-2 py-1 rounded-lg">Inactif</span>
                )}
                {lowStock && (
                  <span className="absolute top-2 right-2 bg-warning/90 text-warning-foreground text-xs px-2 py-1 rounded-lg flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />Stock bas
                  </span>
                )}
              </div>
              <div className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold truncate">{p.name}</h3>
                  <span className="text-xs uppercase font-bold text-muted-foreground shrink-0">{p.required_plan}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="font-display font-bold text-primary">{formatFCFA(p.discounted_price ?? p.price)}</div>
                  <div className="text-xs text-muted-foreground">Stock: {p.stock}</div>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button onClick={() => openEdit(p)} size="sm" variant="outline" className="flex-1">
                    <Edit className="w-3.5 h-3.5 mr-1" />Modifier
                  </Button>
                  <Button onClick={() => remove(p)} size="sm" variant="destructive" disabled={isDeleting}>
                    {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">{editing ? "Modifier le produit" : "Nouveau produit"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div><Label>Nom du produit</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex: Sac en cuir beige" /></div>
            <div><Label>Description</Label><Textarea value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} placeholder="Décris le produit…" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Prix (FCFA)</Label><Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} /></div>
              <div><Label>Prix promo (FCFA)</Label><Input type="number" value={form.discounted_price ?? ""} placeholder="Optionnel" onChange={(e) => setForm({ ...form, discounted_price: e.target.value ? Number(e.target.value) : null })} /></div>
              <div><Label>Stock</Label><Input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })} /></div>
              <div><Label>Seuil d'alerte stock</Label><Input type="number" value={form.stock_threshold} onChange={(e) => setForm({ ...form, stock_threshold: Number(e.target.value) })} /></div>
            </div>
            <div>
              <Label>Catégorie</Label>
              <Select value={form.category_id ?? "none"} onValueChange={(v) => setForm({ ...form, category_id: v === "none" ? null : v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Aucune catégorie</SelectItem>
                  {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Accès requis</Label>
              <Select value={form.required_plan} onValueChange={(v: any) => setForm({ ...form, required_plan: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">🌍 Free — visible par tous</SelectItem>
                  <SelectItem value="medium">⭐ Medium</SelectItem>
                  <SelectItem value="premium">👑 Premium — exclusif</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Image du produit</Label>
              <Input type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); }} disabled={uploading} />
              {uploading && <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" />Upload en cours…</p>}
              {form.image_url && <img src={form.image_url} alt="" className="mt-2 w-full h-32 rounded-2xl object-cover" />}
            </div>
            <div className="flex items-center justify-between rounded-2xl border border-border p-4">
              <div>
                <Label>Visible en boutique</Label>
                <p className="text-xs text-muted-foreground">Désactiver pour cacher sans supprimer</p>
              </div>
              <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
            <Button onClick={save} className="bg-primary text-white" disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {editing ? "Enregistrer" : "Créer le produit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

