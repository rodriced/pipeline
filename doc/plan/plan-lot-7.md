# Plan · Lot 7 · Voir le pipeline en colonnes et y déplacer un contact (#10)

> Plan validé le 22/11/2026.

## Constats
- Le déplacement existe déjà : `changeStage` (lot 3, étape validée par zod), et la clôture (Gagné / Perdu) efface déjà la relance (lot 4). Réutilisé, sans dupliquer la règle.
- Couche données inchangée : `listByMostRecent`, `updateStage` et `setFollowUp` sont déjà couverts par le contrat, persistance comprise.

## Service
- `getPipelineBoard() → { stage, contacts }[]` : toujours 5 colonnes dans l'ordre du pipeline, contacts regroupés par étape, du plus récent au plus ancien ; colonne vide possible.

## Données
- Aucun changement. Les critères 2 et 3 s'appuient sur `updateStage` / `setFollowUp` (contrat + persistance sur fichier, lots 3 et 4).

## Présentation
- Route `/pipeline` : `pipeline-section.tsx` (testable, `connection()` puis `getPipelineBoard()`) sous `<Suspense>` ; lien « Pipeline » dans la navigation ; page large (`max-w-6xl`), colonnes défilant horizontalement sur mobile.
- `pipeline-board.tsx` (client) : une colonne par étape (titre, nombre, « Aucun contact » si vide) ; carte = nom (lien vers la fiche), entreprise, « Relance : JJ/MM » s'il y en a une.
- Déplacer :
  - **clavier / sans JavaScript** : sur chaque carte, liste « Déplacer vers… » (les 4 autres étapes, étiquetée « Déplacer <nom> vers ») + bouton « Déplacer », formulaire vers `changeStageAction` ;
  - **souris** : glisser-déposer HTML5 natif (pas de dépendance), même action, mise à jour optimiste (`useOptimistic`) pour un affichage immédiat.
- `changeStageAction` rafraîchit aussi `/pipeline`.

## Critère → test (couche)
| Critère | Tests |
|---|---|
| 1. Cinq colonnes dans l'ordre, avec leurs contacts et leur nombre | service `renvoie les cinq colonnes dans l'ordre du pipeline, avec les contacts de chaque étape` · présentation `PipelineBoard › affiche cinq colonnes dans l'ordre…`, `range chaque contact dans la colonne de son étape…`, `Vue Pipeline › attend la requête puis affiche les colonnes…`, `la navigation mène à la vue Pipeline` |
| 2. Contacté → RDV : change de colonne, y compris après rechargement | service `après un passage de « Contacté » à « RDV »…` · données `conserve un changement d'étape après redémarrage` (lot 3) · présentation `chaque carte peut être déplacée au clavier…` (formulaire `stage`) · action `changeStageAction › rafraîchit aussi la vue Pipeline` |
| 3. Vers Gagné / Perdu : relance effacée | service `un contact passé dans « Perdu » y arrive sans sa relance`, `clôturer un contact efface sa relance` (lot 4) · présentation `affiche la relance d'un contact seulement s'il en a une` |
| 4. Déplacement au clavier seul | présentation `chaque carte peut être déplacée au clavier : liste étiquetée des autres étapes et bouton d'envoi` |
| 5. Colonne vide : elle l'indique | service `une étape sans contact donne une colonne vide…` · présentation `une colonne sans contact indique qu'elle est vide` |

## Points non testables ici
- Glisser-déposer et affichage optimiste : pas de navigateur dans les tests (pas de jsdom). Structure testée (`draggable`, `data-contact-id`, colonnes `data-stage`) ; à vérifier à la main.
- Mobile : le glisser-déposer HTML5 ne fonctionne pas au doigt ; la liste « Déplacer vers… » couvre ce cas.
- Clavier : structure testée (éléments natifs, étiquettes), pas l'enchaînement réel des touches.
- Hors lot (signalé, non codé) : repère de relance en retard sur les cartes, filtre du tableau.

## Vérification
E2E sur une copie de la base locale (jeu de test) : nombres par colonne = base ; Toto Contacté → RDV par le formulaire de sa carte, conservé au rechargement ; Inès Moreau (relance) → Perdu, relance effacée ; étape forgée ignorée ; base avec un seul contact → 4 colonnes « Aucun contact ».
