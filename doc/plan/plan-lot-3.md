# Plan · Lot 3 · Faire avancer un contact d'étape (#3)

> Lots 3 à 6 enchaînés en autonomie le 21/11/2026 (pas de validation intermédiaire du plan, à la demande de l'utilisateur).

## Règle métier
Les 5 étapes (Nouveau → Contacté → RDV → Gagné / Perdu) sont libres : toute étape valide peut succéder à toute autre (critères 2 et 3 : passer à « Perdu » depuis une étape active, rouvrir un contact « Gagné » ou « Perdu »). Seule une étape inconnue est refusée.

## Données : `src/data/contact.repository.ts`
- `updateStage(id, stage) → Contact | null`. Pas de migration : la colonne `stage` existe depuis le lot 1.

## Service : `src/services`
- `stageSchema` (zod, `contact.schema.ts`) : `z.enum(["new", "contacted", "meeting", "won", "lost"])`. `STAGES` exporté par le service (ordre du pipeline).
- `changeStage(id: unknown, stage: unknown)` → `{ ok: true, contact }`, `INVALID_STAGE` ou `NOT_FOUND`. Id et étape validés par zod (règle `validation-server-action.md`).

## Présentation
- `stage-badge.tsx` exporte `STAGE_OPTIONS` (ordre + libellés FR).
- `stage-selector.tsx` : un formulaire, un bouton d'envoi `name="stage"` par étape ; l'étape actuelle est `aria-pressed` et désactivée. Fonctionne sans JavaScript.
- Fiche (`contact-detail.tsx`) : section « Étape » avec le sélecteur. La liste affiche déjà le badge.
- `changeStageAction(id, formData)` : id lié et étape transmis bruts au service ; revalidation de `/` et de la fiche si succès, rien sinon.

## Critère → test (couche)
| Critère | Tests |
|---|---|
| 1. Nouveau → Contacté : le badge affiche « Contacté » partout | service `passe un contact « Nouveau » à « Contacté », visible sur la fiche et dans la liste` · données (contrat) `change l'étape d'un contact, visible par findById et dans la liste` · fichier `conserve un changement d'étape après redémarrage` · présentation `StageSelector`, fiche `propose de changer l'étape`, `StageBadge` (lot 1) · action `changeStageAction › transmet… puis rafraîchit la liste et la fiche` |
| 2. Étape active → Perdu accepté | service `accepte le passage de « new » / « contacted » / « meeting » à « Perdu »` |
| 3. Gagné ou Perdu → étape active accepté | service `rouvre un contact « won » / « lost » en le remettant à « new » / « contacted » / « meeting »` (6 cas) |
| 4. Étape forgée rejetée sans rien modifier | service `rejette une étape qui n'existe pas (…) sans rien modifier` (8 cas : inconnue, casse, espaces, vide, null, nombre, objet) · action `ne rafraîchit rien si le service refuse l'étape` · données : `changer l'étape ne touche ni aux autres contacts ni aux autres champs` |

## Vérification
E2E sur `pnpm start` : Nouveau → Contacté (liste et fiche), → Perdu, → RDV (réouverture), étape forgée `archived` ignorée, état conservé après redémarrage.
