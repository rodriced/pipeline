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
pnpm test src/chemin/fichier.test.ts  # un seul fichier de test
pnpm test -t "nom du test"            # un seul test par nom
pnpm dlx shadcn@latest add <composant>  # ajoute un composant shadcn dans src/components/ui
```

Vitest ne ramasse que `src/**/*.test.ts` (environnement `node`, alias `@` → `src`), voir `vitest.config.mts`.

## Stack

- Next.js 16 (App Router, `src/app`), React 19, TypeScript strict, alias `@/*` → `src/*`.
- Tailwind CSS 4 : pas de `tailwind.config`, la config est dans `src/app/globals.css` (`@import "tailwindcss"`, `shadcn/tailwind.css`, variables CSS du thème).
- shadcn/ui, style `base-nova` sur **Base UI** (`@base-ui/react`), pas Radix. Icônes : `lucide-react`. `cn()` vient du paquet `cn`, réexporté par `src/lib/utils.ts` (pas de dépendance directe à `clsx`/`tailwind-merge`).
- Déploiement cible : Vercel.

## Architecture (cible, définie par INTENT.md)

Trois couches : présentation → service → données.
- Seule la couche données accède à la base. Présentation et service n'importent jamais le client de base.
- Base type SQLite, migrable vers Turso : passer à une base managée ne doit modifier que la couche données.
- Les règles métier ont des tests unitaires.
- Attention : sur Vercel le système de fichiers est éphémère, un fichier SQLite local n'y persiste pas.

## Workflow

- On travaille uniquement sur la branche `dev`.
- Repo GitHub public : aucun secret versionné, `.env*` et `*.db*` sont ignorés.
