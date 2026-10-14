import { useEffect, useState } from "react";
import { ShoppingBag } from "lucide-react";
export function ProductGallery({ name, cover, images = [] }: { name: string; cover: string | null; images?: string[] }) {
 const photos = Array.from(new Set([cover,...images].filter((u): u is string => !!u && /^https?:\/\//i.test(u))));
 const [active,setActive] = useState(0);
 useEffect(() => { setActive(0); }, [cover, images.join("|")]);
 return <div><div className="aspect-square overflow-hidden rounded-xl bg-muted">{photos.length ? <img src={photos[active] ?? photos[0]} alt={`${name} — photo ${active+1}`} className="w-full h-full object-contain"/> : <div className="h-full flex items-center justify-center"><ShoppingBag size={64}/></div>}</div>{photos.length > 1 && <div className="flex gap-3 overflow-x-auto pt-3">{photos.map((url,i) => <button key={url} aria-label={`Afficher la photo ${i+1}`} aria-pressed={active === i} onClick={() => setActive(i)} className={`w-16 h-16 shrink-0 rounded-md border-2 overflow-hidden ${i === active ? "border-primary" : "border-transparent"}`}><img src={url} alt="" className="w-full h-full object-cover"/></button>)}</div>}</div>;
}
