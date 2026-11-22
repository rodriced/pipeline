# Plan · Lot 8 · Passer au design system Papier v2

> Plan validé le 22/11/2026. Lot hors backlog GitHub (lots 8 à 14 gardés pour plus tard) : pas d'issue liée.

## Constat
Lot **purement présentation** : le thème est une préférence d'affichage propre au navigateur, sans rapport avec la base ni les règles métier. Couches service et données non touchées, donc pas de test sur ces couches.

Persistance du choix : **`localStorage` + script inline dans `<head>`** qui pose `data-theme` sur `<html>` avant l'affichage (pas de flash, pages toujours pré-rendues). Alternative écartée : un cookie lu côté serveur, qui rendrait toutes les pages dynamiques (`cookies()` dans le layout avec Cache Components).

## Présentation
- `src/app/globals.css` : tokens v2 repris de `design-system.html` (clair sur `:root` ; sombre sous `@media (prefers-color-scheme: dark)` + `:root:not([data-theme="light"])`, et sur `:root[data-theme="dark"]`). Nouveaux tokens exposés au `@theme` (`surface`, `subtle-foreground`, `border-strong`, `overdue`, `upcoming`, `success`, `primary-hover`, `primary-soft`). `--shadow-card` = ombre douce, `--radius: 0.625rem`. `@custom-variant dark` suit `data-theme` et la préférence du système. Les tokens propres à shadcn (`sidebar-*`, `chart-*`, `*-foreground`) sont dérivés des valeurs v2.
- `src/components/theme/theme.ts` : `THEME_KEY`, `parseTheme`, `applyTheme`, `readStoredTheme`, `selectTheme`, `themeInitScript`.
- `src/components/theme/theme-switcher.tsx` (client) : sélecteur Clair / Sombre / Système (`aria-pressed`), état lu avec `useSyncExternalStore` (pas d'erreur d'hydratation), synchronisé entre onglets.
- `src/app/layout.tsx` : script dans `<head>`, `suppressHydrationWarning` sur `<html>` ; sélecteur dans `MainNav` (la barre latérale arrive au lot 9).
- `CLAUDE.md` : lignes sur le thème et les tokens mises à jour.

## Critère → test (couche : présentation)
| Critère | Tests |
|---|---|
| 1. Couleurs, rayons et ombres de `design-system.html`, plus d'ombre décalée | `globals-css.test.ts` : tokens comparés valeur par valeur avec `design-system.html` (clair, sombre du système, sombre choisi), `--radius: 0.625rem`, aucune ombre décalée, `--shadow-card` douce, nouveaux tokens dans `@theme` |
| 2. Système en sombre, aucun choix → sombre | CSS : bloc sombre sous `prefers-color-scheme: dark` avec `:not([data-theme="light"])`, variante `dark:` identique · `themeInitScript` sans choix valide → pas de `data-theme` |
| 3. Clair / Sombre / Système change aussitôt le thème | `applyTheme`, `selectTheme` · `ThemeSwitcher` (3 boutons étiquetés, choix en `aria-pressed`) |
| 4. Choix conservé au rechargement | `selectTheme` enregistre · `themeInitScript` relit `dark` / `light` ; valeur invalide ou stockage illisible → rien, sans erreur · layout : script dans `<head>` avant `<body>` |

## Non testable ici
- Rendu visuel réel et absence de flash au chargement : à vérifier dans un navigateur.

## Hors lot (signalé, non codé)
- Nouvelle mise en page (barre latérale : lot 9) ; puces d'urgence colorées (lot 12).
