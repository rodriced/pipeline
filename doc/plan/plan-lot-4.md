# Plan · Lot 4 · Planifier une relance (#4)

> Enchaîné en autonomie le 21/11/2026.

## Décisions
- Une relance = une **date seule** `AAAA-MM-JJ` (colonne `next_follow_up`), sans heure : pas de problème de fuseau, et les dates se comparent comme des chaînes.
- « Aujourd'hui » = date locale du serveur (`toIsoDate(now())`, horloge injectée). Sur Vercel, le fuseau du serveur est UTC.
- Relance aujourd'hui acceptée ; date passée refusée.
- **Règle de cohérence ajoutée** : passer un contact à Gagné ou Perdu efface sa relance. Sinon un contact clôturé garderait une relance qu'on ne peut plus modifier, et apparaîtrait dans la vue « Aujourd'hui » du lot 5.

## Données
- Migration **v3** : `ALTER TABLE contacts ADD COLUMN next_follow_up TEXT`.
- `Contact.nextFollowUp: string | null` ; `setFollowUp(id, date | null) → Contact | null`.

## Service
- `isoDateSchema` (zod) : format `AAAA-MM-JJ` et date existante (pas de 30 février).
- `scheduleFollowUp(id: unknown, date: unknown)` → `NOT_FOUND` | `CONTACT_CLOSED` | `DATE_INVALID` | `DATE_PAST` | `{ ok, contact }`.
- `clearFollowUp(id: unknown)` → `{ ok, contact }` | `NOT_FOUND`.
- `changeStage` vers Gagné / Perdu efface la relance.
- Exports : `isClosedStage`, `toIsoDate`.

## Présentation
- `format-date.ts` : `formatDayMonth("2026-11-25") → "25/11"`.
- Liste : « Relance : 25/11 » sous le nom.
- `follow-up-form.tsx` (client) : état « Relance : 25/11 » ou « Aucune relance planifiée. », champ date + « Planifier », bouton « Supprimer la relance » si une relance existe ; contact clôturé → « Contact clôturé : pas de relance à planifier. » et aucun formulaire.
- Fiche : section « Relance ».
- Actions : `scheduleFollowUpAction` (codes → messages, saisie conservée), `clearFollowUpAction`.

## Critère → test (couche)
| Critère | Tests |
|---|---|
| 1. Relance au 25/11 → « Relance : 25/11 » sur la fiche et dans la liste | service `planifie une relance, visible sur la fiche et dans la liste` · `accepte une relance aujourd'hui` · données (contrat) `planifie puis supprime une relance…` · fichier `conserve une relance après redémarrage` · présentation `formatDayMonth`, `ContactList › affiche la date de relance`, `FollowUpForm › avec une relance…`, fiche `propose de planifier une relance sur un contact actif` · action `scheduleFollowUpAction transmet…` |
| 2. Supprimer la relance → plus de date | service `supprime une relance : plus aucune date` · présentation `ContactList › n'affiche aucune date sans relance`, `FollowUpForm › sans relance…` · action `clearFollowUpAction…` |
| 3. Date passée refusée | service `refuse une date passée, sans rien modifier` · `refuse une date invalide (…)` (9 cas) · présentation `FollowUpForm › affiche l'erreur…` · action `traduit DATE_PAST / DATE_INVALID / CONTACT_CLOSED en message` |
| 4. Contact Gagné / Perdu : pas de relance possible | service `refuse de planifier une relance pour un contact « won » / « lost »` · `clôturer un contact efface sa relance` · `changer pour une étape active conserve la relance` · présentation `FollowUpForm › contact clôturé`, fiche `ne propose pas de relance sur un contact « won » / « lost »` |

## Vérification
E2E sur une copie de la base locale (migration v2 → v3) : relance planifiée et affichée (liste, fiche), date passée et date invalide refusées sans modification, suppression, contact gagné → relance effacée et plus de formulaire, état conservé après redémarrage.

## Note
Le HTML de la fiche est streamé : un formulaire `useActionState` peut arriver plus loin dans le flux que sa place affichée. L'outil d'e2e choisit donc les formulaires par leur contenu, pas par leur rang.
