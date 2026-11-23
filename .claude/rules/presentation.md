---
paths:
  - "src/app/**"
  - "src/components/**"
---

# Couche présentation

Périmètre : `src/app` (routes, pages, layouts) et `src/components`.

## Dépendances
- N'appelle que la couche service (`@/services/...`). Jamais `@/data/...`, jamais un pilote de base ni un client SQL.
- Les pages (Server Components) récupèrent les données via un service, puis les passent en props.
- Les composants de `src/components` sont purs : données en props, pas d'appel à un service ni d'accès réseau.
- Pas de règle métier ici (calcul d'étape, date de relance…) : elle va dans un service.
- Imports en `@/…` uniquement entre couches, pas d'import relatif qui sortirait de la couche.

## Design system « Papier »
- N'utilise que les composants shadcn de `src/components/ui` (ajout : `pnpm dlx shadcn@latest add <composant>`) et les composants du projet construits dessus.
- Aucune couleur en dur : pas de `#hex`, `rgb()`, `hsl()`, `oklch()`, ni de couleur de palette Tailwind (`bg-red-500`, `text-gray-700`, `bg-white`, `text-black`, `bg-[#…]`), ni de `style={{ color: … }}`.
- Seulement les tokens du thème (Papier v2) : ceux de shadcn (`bg-background`, `text-foreground`, `bg-primary`, `text-muted-foreground`, `border-border`, `ring`…) et ceux du projet : `stage-*` (étapes), `overdue` / `today` / `today-foreground` / `upcoming` (urgence des relances), `surface`, `subtle-foreground`, `border-strong`, `success`, `primary-hover`, `primary-soft`, `primary-border`, `destructive-foreground`, `overlay`, `shadow-card`.
- Un besoin de couleur nouveau → ajouter un token dans `src/app/globals.css` (clair et sombre), pas une valeur locale.
- Thème clair / sombre / système (`src/components/theme/`) : le choix est posé en `data-theme` sur `<html>` ; sans choix, le sombre suit `prefers-color-scheme`. Pour du sombre, utiliser les tokens ou la variante `dark:` (qui suit déjà cette règle). Jamais de `@media (prefers-color-scheme: dark)` seul dans un composant (il casserait le choix « Clair »), ni de classe `.dark`.
- Polices : `font-heading` (Fraunces) pour les titres, texte par défaut en Source Sans 3. Référence visuelle : `design-system.html`.

## Comment vérifier
- `pnpm lint` : aucune erreur `no-restricted-imports` (présentation ↛ données).
- Aucun accès base hors service/données :
  `grep -rnE "@/data|sqlite|libsql|drizzle|prisma" src/app src/components` → vide.
- Aucune couleur en dur :
  `grep -rnE "#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(|oklch\(|\[#|-(red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|slate|gray|zinc|neutral|stone)-[0-9]{2,3}\b|(bg|text|border)-(white|black)\b|style=\{\{[^}]*color" src/app src/components --include="*.tsx"` → vide.
- Les tests de composants (`__tests__/components/`, `renderToStaticMarkup`) passent sans faux service : les données arrivent en props.
- Contrôle visuel en clair et en sombre (`pnpm dev`) : rendu conforme à `design-system.html`.
