# Shop Smartly

Boutique e-commerce React + Supabase, installable comme application mobile (PWA).

## Installation des dépendances

```bash
npm install
```

## Développement

```bash
npm run dev
```

## Build de production

```bash
npm run build
```

## Déploiement

### Vercel (recommandé)
1. Push le code sur GitHub
2. Connecte le repo sur vercel.com
3. Variables d'environnement à ajouter :
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

### Netlify
Même procédé. Pas besoin de `_redirects` car on utilise HashRouter.

### Hébergement statique (Apache/Nginx)
Build puis upload le dossier `dist/`. Aucune config serveur requise (HashRouter).

## Application mobile (PWA)

### Android
Ouvre le lien dans Chrome → menu ⋮ → "Ajouter à l'écran d'accueil"

### iOS (iPhone/iPad)
Ouvre le lien dans Safari → bouton Partager → "Sur l'écran d'accueil"

## Structure des fichiers modifiés

- `src/App.tsx` — HashRouter (fix 404), QueryClient optimisé
- `src/index.css` — Nouveau design chaud/humain (orange/rose/crème)
- `src/components/shop/ShopLayout.tsx` — Header & navbar redesignés
- `src/components/shop/ProductCard.tsx` — Cartes produits redessinées
- `src/components/PWAInstallPrompt.tsx` — Bannière d'installation PWA (nouveau)
- `src/pages/Index.tsx` — Page accueil redessinée
- `src/pages/NotFound.tsx` — Page 404 améliorée
- `vite.config.ts` — Ajout vite-plugin-pwa
- `index.html` — Métadonnées PWA complètes
- `tailwind.config.ts` — Nouvelles polices (Nunito/Inter)
- `package.json` — Ajout vite-plugin-pwa
- `public/pwa-192x192.png` — Icône PWA
- `public/pwa-512x512.png` — Icône PWA HD
- `public/apple-touch-icon.png` — Icône iOS
