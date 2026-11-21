# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Projet

Lis INTENT.md avant tout travail.

Pipeline : mini CRM de prospection mono-utilisateur. L'intention produit, l'architecture cible et les critères d'acceptation sont dans `INTENT.md` — c'est la référence.

Hors périmètre : authentification, droits, multi-utilisateur.

## Commandes

```bash
pnpm dev                              # serveur de dev, http://localhost:3000
pnpm build                            # build de prod
pnpm lint                             # ESLint (flat config, eslint.config.mjs)
pnpm test                             # Vitest, une passe
pnpm test:watch                       # Vitest en watch
pnpm test __tests__/services/contact.service.test.ts  # un seul fichier
pnpm test -t "nom du test"            # un seul test par nom
pnpm dlx shadcn@latest add <composant>  # ajoute un composant shadcn dans src/components/ui
```

Les tests sont dans `__tests__/` (racine), qui reproduit l'arborescence de `src/`. Vitest ne ramasse que `__tests__/**/*.test.{ts,tsx}` (environnement `node`, alias `@` → `src`), voir `vitest.config.mts`. Les composants se testent avec `renderToStaticMarkup` (`react-dom/server`), sans jsdom.

## Stack

- Next.js 16 (App Router, `src/app`), React 19, TypeScript strict, alias `@/*` → `src/*`.
- Tailwind CSS 4 : pas de `tailwind.config`, la config est dans `src/app/globals.css` (`@import "tailwindcss"`, `shadcn/tailwind.css`, variables CSS du thème).
- shadcn/ui, style `base-nova` sur **Base UI** (`@base-ui/react`), pas Radix. Icônes : `lucide-react`. `cn()` vient du paquet `cn`, réexporté par `src/lib/utils.ts` (pas de dépendance directe à `clsx`/`tailwind-merge`).
- Design system « Papier » (référence visuelle : `design-system.html`) : tokens dans `src/app/globals.css`, polices Fraunces (titres, `font-heading`, appliquée aux h1–h4) et Source Sans 3 (texte), chargées par `next/font` dans `layout.tsx`. Tokens en plus de shadcn : `stage-*` (couleurs d'étape), `today` / `today-foreground` (relances du jour), `primary-border`, `destructive-foreground`, et `shadow-card` (ombre franche des cartes).
- Le mode sombre suit `prefers-color-scheme` (variante `dark:` en media query, pas de classe `.dark`).
- Déploiement cible : Vercel.

## Architecture (définie par INTENT.md)

Trois couches : présentation → service → données.
- Présentation : `src/app` (routes) et `src/components`. Composants purs, données reçues en props.
- Service : `src/services`. Règles métier, avec tests unitaires. Le repository est injecté (`createXxxService(repo)`), ce qui permet de tester avec un faux repo.
- Données : `src/data`. Seule couche qui accède à la base. Elle expose une interface `XxxRepository` (le contrat stable) et son implémentation : passer à Turso ne change que l'implémentation.
- `src/services/contact.service.ts` (et `src/data/contact.repository.ts`) est la référence du schéma.
- `eslint.config.mjs` applique les règles de dépendance (`no-restricted-imports`) : présentation ↛ data, services ↛ présentation, data ↛ services/présentation. Seuls les imports `@/…` sont contrôlés, donc pas d'import relatif entre couches.
- Base type SQLite, migrable vers Turso. Attention : sur Vercel le système de fichiers est éphémère, un fichier SQLite local n'y persiste pas.

## Workflow

- On travaille uniquement sur la branche `dev`.
- Repo GitHub public : aucun secret versionné, `.env*` et `*.db*` sont ignorés.
