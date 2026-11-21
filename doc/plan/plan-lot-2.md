# Plan · Lot 2 · Compléter ou supprimer la fiche d'un contact (#2)

> Plan validé le 21/11/2026. Livré dans `07c11ed` (PR #8).

## Constats
- La base locale `data/pipeline.db` contient déjà 1 contact avec le schéma du lot 1. Il faut donc une **migration** (ajout de colonnes), pas seulement un `CREATE TABLE`.
- Avec `cacheComponents`, les `params` de la route `/contacts/[id]` doivent être lus sous `<Suspense>`, et `notFound()` doit être appelé dans le rendu (doc locale).
- Avec React 19, un formulaire est réinitialisé après l'action. Le formulaire d'édition renvoie donc les valeurs saisies dans son état, pour ne pas perdre la saisie en cas d'erreur.

## Données : `src/data`
- `db.ts` : migrations versionnées par `PRAGMA user_version`. v1 = table actuelle, v2 = `ALTER TABLE contacts ADD COLUMN company / email / phone / notes` (TEXT, nullable).
- `contact.repository.ts` : `Contact` reçoit `company`, `email`, `phone` et `notes` (`string | null`). Le contrat gagne trois méthodes :
  - `findById(id) → Contact | null` ;
  - `update(id, fields) → Contact | null` ;
  - `delete(id) → boolean`.

## Service : `src/services/contact.service.ts`
- `getContact(id) → Contact | null`.
- `updateContact(id, input)` : nettoie les espaces, et un champ vide devient `null`. Retourne `{ ok: true, contact }`, `{ ok: false, errors: { name?: "NAME_REQUIRED", email?: "EMAIL_INVALID" } }` ou `{ ok: false, error: "NOT_FOUND" }`.
- Le nom est validé par la même fonction qu'`addContact` (règle mutualisée). L'email est facultatif ; s'il est rempli, il doit avoir la forme `x@y.z`.
- `deleteContact(id)` → `{ ok: true }` ou `NOT_FOUND`.

## Présentation
- shadcn : `pnpm dlx shadcn@latest add textarea alert-dialog`.
- `contact-list.tsx` : chaque contact devient un lien vers `/contacts/{id}`, avec l'entreprise affichée sous le nom.
- `contact-form.tsx` (client) : champs nom, entreprise, email, téléphone, notes. Erreurs par champ (`aria-invalid` et message), valeurs conservées en cas d'erreur.
- `delete-contact-dialog.tsx` (client) : AlertDialog avec « Supprimer » et « Annuler ». Le formulaire de suppression n'existe que dans la confirmation.
- `src/app/contacts/[id]/page.tsx` : le contenu sous `<Suspense>`. L'id est lu et validé, `notFound()` est appelé s'il est absent ou non entier. Lien « ← Contacts ».
- `src/app/contacts/[id]/not-found.tsx` : page « Contact introuvable » avec un retour à la liste.
- `src/app/actions.ts` : `updateContactAction` (codes d'erreur traduits en messages, revalidation de `/` et de la fiche) et `deleteContactAction` (revalidation, puis `redirect("/")`).

## Critère → test (couche)

| Critère | Tests |
|---|---|
| 1. Modifier l'entreprise, la fiche et la liste l'affichent, y compris après redémarrage | service : `updateContact` → `getContact` et `listContacts` renvoient la nouvelle entreprise · données (contrat) : `update` puis `findById` et `listByMostRecent` · données : persistance de l'update sur fichier après fermeture et réouverture · données : migration v1 → v2 qui conserve les contacts existants · présentation : `ContactForm` pré-rempli, `ContactList` affiche l'entreprise et le lien `/contacts/{id}` |
| 2. Email mal formé refusé avec un message clair | service : `"camille@lumen"` et `"sans-arobase"` → `EMAIL_INVALID`, aucun `update` appelé ; email vide accepté · présentation : `ContactForm` avec erreur → « Adresse e-mail invalide. », `aria-invalid`, saisie conservée |
| 3. Nom vidé refusé | service : `updateContact` avec `"   "` → `NAME_REQUIRED`, contact inchangé · présentation : message « Le nom est requis. » |
| 4. Supprimer et confirmer : il disparaît, y compris après redémarrage ; annuler ne change rien | service : `deleteContact` → absent de `listContacts`, et `NOT_FOUND` sur un id inconnu · données (contrat) : `delete` → `true`, puis `findById` → `null`, puis `delete` → `false` · données : persistance de la suppression sur fichier · présentation : le bouton « Supprimer » de la fiche est en `type="button"` et ne déclenche aucune action, le formulaire de suppression est absent du rendu initial |
| 5. Id inexistant : page « introuvable » | service : `getContact(999)` → `null` · présentation : la page appelée avec `id: "999"` et `id: "abc"` (service simulé) → rejet `NEXT_HTTP_ERROR_FALLBACK;404` · rendu de `not-found.tsx` |

## Points flous ou difficiles à tester
- **« Si j'annule, rien ne change » (critère 4)** : le clic n'est pas testable sans jsdom, que CLAUDE.md exclut. On teste la structure (rien ne s'envoie sans confirmation) et on vérifie l'annulation à la main.
- **Code HTTP du critère 5** : comme le contenu est streamé sous `<Suspense>`, la réponse risque d'être un 200 avec l'interface « introuvable » plutôt qu'un vrai 404. Le critère demande la page ; à vérifier en e2e.
- **Téléphone** : le lot ne précise aucune validation, donc on n'en met pas.
- **Notes** : un champ texte libre, sans historique d'échanges. Le « Noter un échange » du design system est hors lot.

## Vérification
`pnpm test`, `lint` et `build`. Les greps des 3 règles. En e2e sur `pnpm start` : modifier, refuser un email invalide, refuser un nom vide, supprimer, redémarrer, ouvrir `/contacts/999`. Contrôle de la migration sur une copie de la base actuelle. Ensuite un commit `feat(lot-2): Compléter ou supprimer la fiche d'un contact`, puis la PR.

## Écarts constatés à l'exécution
- Le contenu de la fiche est dans `src/app/contacts/[id]/contact-detail.tsx` (pas dans `page.tsx`), pour pouvoir le tester : Next refuse les exports nommés dans un fichier de page.
- Token `overlay` ajouté au thème (clair/sombre) : l'`alert-dialog` shadcn utilisait `bg-black/10`, interdit par `presentation.md`. Documenté dans CLAUDE.md.
- Critère 5 : confirmé en e2e, la page « Contact introuvable » s'affiche avec un code HTTP 200.
- Critère 4 : suppression non testée en e2e (le formulaire n'existe qu'après le clic, côté client). Clic « Annuler » / « Supprimer » à vérifier à la main.
