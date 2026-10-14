# Shop Smartly
React / TypeScript, Supabase, connexion Google et PWA.

## Développement
npm install
npm run dev
npm run build
npm test

Conserver les variables VITE_SUPABASE_* existantes. Aucune clé service_role dans le navigateur.

## Refonte locale
Identité crème et vert forêt, logo vectoriel, recherche insensible aux accents, tri, filtres stock/promotion, galerie et assistant FAQ local. Le guide ne consulte aucune donnée personnelle et ne transmet aucun message à une IA.

## Migration requise pour les galeries et protections des profils
Lire et appliquer supabase/migrations/20261012000001_gallery_and_profile_security.sql sur le projet existant après sauvegarde et validation sur une base de test.
Ajout de image_urls sans retrait de image_url, maximum huit photos, fichiers 5 Mo, champs sensibles des profils protégés. Sans migration, le catalogue et les couvertures restent compatibles. Enregistrer plusieurs photos affiche une erreur explicite. Formats de nouveaux uploads : JPG, PNG, WebP.
La migration est préparée localement, pas exécutée sur la base distante.

## Recette sur le domaine réel avant publication
- Connexion Google : retour OAuth, chargement du profil, déconnexion et reconnexion. Conserver les URL autorisées Google et Supabase.
- Boutique anonyme, favoris, panier, accès admin et commandes via WhatsApp.
- Galerie : ajout, choix de couverture, retrait et produit à photo unique.
- PWA : installation Android/iOS, redémarrage et mise à jour. Les données Supabase ne sont pas mises en cache par le service worker.
- Migration : un utilisateur ordinaire ne peut pas changer plan/purchase_count ; un administrateur autorisé conserve ses droits.

## Travail restant avant de certifier la sécurité
Le checkout utilise maintenant la fonction SQL transactionnelle décrite dans Étape 2. Sa migration doit être appliquée avant publication du frontend.
Configurer les en-têtes de sécurité sur votre hébergement ; tester une CSP report-only avec les domaines Supabase, Google OAuth et les polices avant activation.

## Indépendance de Lovable
Le flux de connexion utilisé est directement celui de Supabase. Le module historique est converti en adaptateur Supabase sans dépendance Lovable.
Aucun badge Edit with Lovable dans le code fourni. Si votre hébergement injecte ce badge, servir dist sur votre hébergement, puis vérifier les redirections OAuth du domaine choisi.
Les icônes PNG PWA originales sont conservées pour cette première refonte ; le nouveau logo est utilisé dans le site, la connexion et le favicon SVG.
La sauvegarde refonte-backup-* conserve les sources initiales sans le fichier .env.

## Étape 2 : commandes atomiques
Migration à appliquer après celle des galeries : `supabase/migrations/20261012000002_atomic_checkout.sql`.
Publier le nouveau frontend en même temps que cette migration. Le panier appelle uniquement la fonction checkout_cart ; sans migration, la commande est bloquée avec une explication, et le panier est conservé. Aucun retour vers la création non sécurisée des commandes.
Les prix et accès sont relus dans la base. La commande, les lignes, la réservation de stock, le journal et le retrait du panier se font dans une transaction. Une clé par tentative permet de retrouver une commande après une coupure réseau. Le stock est restitué lors du rejet ou de l’annulation. Les réservations en attente ne sont pas expirées automatiquement : les administrateurs doivent les rejeter ou annuler au besoin.
Les anciennes commandes ne réservent pas rétroactivement le stock. Le compteur d’achats est désormais géré par un trigger ; le code administrateur ne le modifie plus. Les commandes livrées, annulées ou rejetées sont terminales.
Tests SQL sur une base isolée : `npm run test:checkout`. Ces tests ne reproduisent pas des transactions concurrentes ni la configuration réelle de Supabase. Tester également deux acheteurs en concurrence et un retour OAuth sur un environnement de recette avant déploiement.
Références : https://supabase.com/docs/guides/database/functions et https://www.postgresql.org/docs/current/explicit-locking.html.

<img width="1917" height="1022" alt="Capture d&#39;écran 2026-10-14 232951" src="https://github.com/user-attachments/assets/c532a51f-de5b-4700-a34d-8b5e689cfe57" />
