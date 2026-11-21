# Plan · Lot 5 · Voir qui relancer aujourd'hui et marquer la relance faite (#5)

> Enchaîné en autonomie le 21/11/2026.

## Décisions
- Vue sur une route dédiée `/aujourdhui`, accessible par une navigation principale (Contacts / Aujourd'hui) ajoutée au layout.
- Relance due = date de relance ≤ aujourd'hui (date locale du serveur). Tri : la plus en retard d'abord.
- « Fait » = la relance est effacée (`clearFollowUp`, lot 4) : le contact n'a plus de relance planifiée.
- « Demain » = la relance est fixée au lendemain d'**aujourd'hui** (même pour une relance en retard), avec les règles de `scheduleFollowUp`.
- La page lit la date de la requête : `await connection()` sous `<Suspense>` (Cache Components), sinon la liste serait figée au build.

## Données
- `listWithFollowUpDueBy(date) → Contact[]` : `next_follow_up <= date`, trié par date puis id.

## Service
- `listDueFollowUps() → { contact, daysLate }[]` (0 = aujourd'hui ; contacts clôturés exclus par sécurité).
- `postponeFollowUp(id: unknown)` → `scheduleFollowUp(id, demain)`.
- Utilitaires de dates seules : `daysBetween`, `addDays` (calcul en UTC sur des dates AAAA-MM-JJ, pas d'effet de changement d'heure).

## Présentation
- `follow-up-list.tsx` (composant pur) : nom (lien vers la fiche), entreprise, « En retard de N jour(s) » ou « Aujourd'hui » (token `today-foreground`), bordure gauche `today` et `data-late` pour les retards, boutons « Fait » et « Demain » (un formulaire chacun, fonctionne sans JavaScript). Liste vide → « Rien à faire aujourd'hui. »
- `src/app/aujourdhui/page.tsx` + `today-section.tsx` (testable, `connection()` puis service).
- `main-nav.tsx` dans le layout.
- Actions `markFollowUpDoneAction`, `postponeFollowUpAction` (id lié transmis brut, revalidation de `/aujourdhui`, `/` et de la fiche).

## Critère → test (couche)
| Critère | Tests |
|---|---|
| 1. Relances hier / aujourd'hui / demain → hier et aujourd'hui, pas demain | service `liste les relances en retard et du jour, pas celles de demain` · `interroge la base avec la date du jour` · données (contrat) `liste les contacts dont la relance est due à une date…` · présentation `FollowUpList › affiche chaque contact dû…`, `TodaySection › attend la requête puis affiche les relances dues` |
| 2. Retard mis en évidence (token today) avec le nombre de jours | service `indique le nombre de jours de retard (0 pour aujourd'hui)` · `compte les jours de retard d'un mois à l'autre et d'une année à l'autre` · présentation `FollowUpList › une relance en retard est mise en évidence…` · `une relance du jour est indiquée « Aujourd'hui »…` |
| 3. « Fait » → disparaît, plus de relance planifiée | service `marquer une relance faite la retire de la liste…` · présentation `FollowUpList › chaque relance propose « Fait » et « Demain »` · action `markFollowUpDoneAction…` |
| 4. Reporter au lendemain → disparaît aujourd'hui, réapparaît demain | service `reporter au lendemain la retire aujourd'hui ; elle réapparaît demain` · `reporter une relance en retard la fixe à demain` · `NOT_FOUND…` · action `postponeFollowUpAction…` · `ne rafraîchit rien si le service refuse` |
| 5. Aucune relance due → message | service `liste vide quand aucune relance n'est due` · présentation `FollowUpList › affiche un message…`, `TodaySection › affiche « Rien à faire aujourd'hui »` |

## Vérification
E2E sur `pnpm start` : 4 contacts (relance hier, aujourd'hui, demain, aucune) → la vue montre Hier (« En retard de 1 jour », bordure today) et Aujourd'hui ; « Fait » sur la relance du jour l'efface ; « Demain » sur Hier la fixe au 22/11 ; serveur relancé avec `TZ=Pacific/Kiritimati` (déjà le 22/11) → Hier et Demain apparaissent « Aujourd'hui » ; plus aucune relance → « Rien à faire aujourd'hui. »
