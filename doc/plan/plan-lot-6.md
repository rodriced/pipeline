# Plan · Lot 6 · Retrouver un contact par nom ou par étape (#6)

> Enchaîné en autonomie le 21/11/2026.

## Décisions
- Recherche sur le **nom ou l'entreprise** (parcours du lot), par sous-chaîne, sans tenir compte de la casse ni des accents (`NFD` + suppression des diacritiques).
- Filtrage dans le **service**, sur `listByMostRecent` : l'insensibilité aux accents est difficile en SQL SQLite, et le volume d'un CRM mono-utilisateur est faible. **Pas de changement de la couche données** (contrat déjà couvert).
- Filtres dans l'**URL** (formulaire GET `?q=…&stage=…`) : conservés au rechargement, partageables.
- Paramètres d'URL validés par zod (`contactFiltersSchema`) : valeur absente, multiple (première retenue), d'un mauvais type ou étape inconnue → ignorée, sans erreur.

## Service
- `parseContactFilters(raw: unknown) → { q, stage }`.
- `searchContacts(raw: unknown) → Contact[]` (ordre : du plus récent au plus ancien).

## Présentation
- shadcn `native-select` (base-nova).
- `contact-filters.tsx` : formulaire GET vers `/` (recherche, étape « Toutes les étapes » + 5 étapes, « Filtrer », « Réinitialiser » si un filtre est actif), valeurs reprises de l'URL.
- `contact-list.tsx` : prop `filtered` → « Aucun résultat. » au lieu de « Aucun contact pour l'instant. ».
- `src/app/contacts-section.tsx` (testable) : lit `searchParams`, `connection()`, filtres + liste ; `page.tsx` le rend sous `<Suspense>`.

## Critère → test (couche)
| Critère | Tests |
|---|---|
| 1. « dur » → Marie Durand (casse et accents ignorés) | service `cherche une partie du nom, sans tenir compte de la casse` · `cherche aussi dans l'entreprise` · `ignore les accents, dans la recherche comme dans les contacts` · données : `listByMostRecent` (contrat, lot 1) · présentation `ContactsSection › transmet les paramètres d'URL bruts au service et affiche ses résultats` |
| 2. Filtre « RDV » → seuls les contacts en RDV | service `filtre par étape` · présentation `ContactFilters › propose une recherche et un choix d'étape` |
| 3. Recherche + filtre sans correspondance → « aucun résultat » | service `combine recherche et étape` · `renvoie une liste vide quand rien ne correspond` · présentation `ContactList › affiche « Aucun résultat. »…`, `ContactsSection › affiche « Aucun résultat. »…`, `sans filtre et sans contact : « Aucun contact pour l'instant. »` |
| 4. Filtre conservé au rechargement (URL) | présentation `ContactFilters › est un formulaire GET vers la liste`, `reprend les filtres de l'URL (rechargement)`, `propose de réinitialiser…` · `ContactsSection › garde les filtres de l'URL dans le formulaire` · service `lit les filtres de l'URL (…) : valeurs invalides ignorées` (7 cas) |

## Vérification
E2E sur `pnpm start` : `?q=dur` (Marie Durand + Zoé Leroy, dont l'entreprise est « Durandal SA »), `?q=DUR`, `?q=zoe` (Zoé), `?stage=meeting`, `?q=dur&stage=won` → « Aucun résultat. », `?q=dur&stage=meeting` → Marie Durand ; filtres repris dans le formulaire après rechargement ; `?stage=archived` ignoré.

## Note
Le composant shadcn `native-select` colore ses options avec `bg-[Canvas] text-[CanvasText]` : ce sont des couleurs système CSS, qui suivent le mode clair ou sombre. Ce ne sont pas des valeurs en dur au sens de `presentation.md`, et le grep de la règle passe.
