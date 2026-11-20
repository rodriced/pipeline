---
paths:
  - "src/services/**"
  - "__tests__/services/**"
---

# Couche service

Périmètre : `src/services`.

## Rôle
- Porte toutes les règles métier : validation d'un contact, passage d'une étape à l'autre, calcul de qui relancer aujourd'hui, etc.
- Ne parle jamais à la base : passe par une interface `XxxRepository` de `src/data`.
- Ne dépend pas de la présentation (`@/app`, `@/components`), ni de React/Next.
- Schéma : `createXxxService(repo: XxxRepository)` qui retourne les fonctions métier, plus une instance câblée `xxxService = createXxxService(xxxRepository)` pour la présentation. Modèle : `status.service.ts`.
- La date du jour (relances) est injectée ou passée en paramètre, pour être testable.

## Tests d'abord
- Le test est écrit avant le code : `__tests__/services/xxx.service.test.ts`, lancé et vu en échec (rouge), puis le code minimal pour le faire passer (vert), puis refactor.
- Chaque règle métier a au moins un test, cas limites compris (contact invalide, dernière étape, relance passée / du jour / future).
- Les tests utilisent un faux repository en mémoire, jamais la vraie base.
- Pas de correction de bug sans un test qui le reproduit d'abord.

## Comment vérifier
- `pnpm test __tests__/services` passe.
- Chaque `src/services/*.service.ts` a son `__tests__/services/*.service.test.ts` :
  `for f in src/services/*.service.ts; do t="__tests__/services/$(basename "$f" .ts).test.ts"; [ -f "$t" ] || echo "manque : $t"; done` → vide.
- Tests d'abord : le test a été vu rouge avant l'implémentation (montrer la sortie en échec), et dans l'historique il n'arrive pas après le code (`git log --follow --format=%h --diff-filter=A -- <fichier>`).
- `pnpm lint` : aucune erreur `no-restricted-imports` (services ↛ présentation).
- Aucun accès direct à la base : `grep -rnE "sqlite|libsql|drizzle|prisma|SELECT |INSERT " src/services` → vide.
