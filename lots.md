# Lots · Pipeline

Découpage de Pipeline en lots livrables de bout en bout (écran → service → base). Référence : `INTENT.md`.
Étapes du pipeline : Nouveau → Contacté → RDV → Gagné / Perdu.

## Lot 1 · Ajouter un contact et le retrouver dans la liste

Depuis la page d'accueil, je saisis le nom d'un contact et je valide. Il apparaît aussitôt dans la liste, à l'étape « Nouveau ». Il y est toujours après un redémarrage de l'app.

- [ ] Étant donné une liste vide, quand j'ajoute « Marie Durand », alors la liste affiche « Marie Durand » avec le badge « Nouveau ».
- [ ] Étant donné le formulaire d'ajout, quand je valide un nom vide ou fait seulement d'espaces, alors rien n'est enregistré et un message m'indique que le nom est requis.
- [ ] Étant donné un contact enregistré, quand je redémarre l'app, alors il est toujours dans la liste.
- [ ] Étant donné plusieurs contacts, quand j'ouvre la liste, alors ils sont triés du plus récent au plus ancien.

## Lot 2 · Compléter ou supprimer la fiche d'un contact

Je clique sur un contact de la liste et j'ouvre sa fiche. J'y renseigne ou modifie l'entreprise, l'email, le téléphone et des notes, puis j'enregistre. Depuis la fiche, je peux aussi supprimer le contact après confirmation.

- [ ] Étant donné un contact, quand je modifie son entreprise et que j'enregistre, alors la fiche et la liste affichent la nouvelle valeur, y compris après un redémarrage.
- [ ] Étant donné la fiche, quand je saisis un email mal formé, alors l'enregistrement est refusé avec un message clair.
- [ ] Étant donné la fiche, quand je vide le nom, alors l'enregistrement est refusé (même règle qu'au lot 1).
- [ ] Étant donné un contact, quand je le supprime et confirme, alors il disparaît de la liste, y compris après un redémarrage ; si j'annule, rien ne change.
- [ ] Étant donné un identifiant de contact inexistant, quand j'ouvre son URL, alors j'obtiens une page « introuvable ».

## Lot 3 · Faire avancer un contact d'étape

Sur la fiche ou dans la liste, je change l'étape d'un contact. Le badge prend la couleur de la nouvelle étape.

- [ ] Étant donné un contact « Nouveau », quand je le passe à « Contacté », alors son badge affiche « Contacté », dans la couleur de l'étape, partout où il apparaît.
- [ ] Étant donné un contact à n'importe quelle étape active, quand je le passe à « Perdu », alors le changement est accepté.
- [ ] Étant donné un contact « Gagné » ou « Perdu », quand je le remets à une étape active, alors le changement est accepté (on peut réouvrir un contact).
- [ ] Étant donné une étape qui n'existe pas (requête forgée), quand le service la reçoit, alors il la rejette sans rien modifier.

## Lot 4 · Planifier une relance

Sur la fiche d'un contact, je choisis la date de ma prochaine relance. La date s'affiche dans la fiche et dans la liste.

- [ ] Étant donné un contact sans relance, quand je fixe une relance au 25/11, alors la fiche et la liste affichent « Relance : 25/11 ».
- [ ] Étant donné un contact qui a une relance, quand je la supprime, alors plus aucune date n'est affichée.
- [ ] Étant donné la date du jour, quand je choisis une date passée, alors l'enregistrement est refusé.
- [ ] Étant donné un contact « Gagné » ou « Perdu », quand j'ouvre sa fiche, alors je ne peux pas planifier de relance.

## Lot 5 · Voir qui relancer aujourd'hui et marquer la relance faite

Une vue « Aujourd'hui » liste les contacts dont la relance tombe aujourd'hui ou est en retard. Je marque une relance comme faite, ou je la reporte à une autre date.

- [ ] Étant donné des relances hier, aujourd'hui et demain, quand j'ouvre « Aujourd'hui », alors je vois celles d'hier (en retard) et d'aujourd'hui, mais pas celle de demain.
- [ ] Étant donné un contact en retard, quand il est affiché, alors il est distingué visuellement (token `today`) et indique son nombre de jours de retard.
- [ ] Étant donné une relance du jour, quand je la marque « faite », alors elle disparaît de la vue et le contact n'a plus de relance planifiée.
- [ ] Étant donné une relance du jour, quand je la reporte au lendemain, alors elle disparaît de la vue d'aujourd'hui et réapparaîtra demain.
- [ ] Étant donné aucune relance due, quand j'ouvre la vue, alors un message indique qu'il n'y a rien à faire aujourd'hui.

## Lot 6 · Retrouver un contact par nom ou par étape

Dans la liste, je tape une partie d'un nom ou d'une entreprise, et/ou je filtre par étape. La liste se réduit aux contacts qui correspondent.

- [ ] Étant donné « Marie Durand » et « Paul Martin », quand je cherche « dur », alors seule Marie Durand s'affiche (recherche insensible à la casse et aux accents).
- [ ] Étant donné des contacts à plusieurs étapes, quand je filtre sur « RDV », alors seuls les contacts en RDV s'affichent.
- [ ] Étant donné une recherche et un filtre combinés, quand aucun contact ne correspond, alors un message « aucun résultat » s'affiche.
- [ ] Étant donné un filtre actif, quand je recharge la page, alors le filtre est conservé (dans l'URL).
