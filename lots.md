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

## Lot 7 · Voir le pipeline en colonnes et y déplacer un contact

Depuis une vue « Pipeline », je vois une colonne par étape (Nouveau, Contacté, RDV, Gagné, Perdu), avec les contacts rangés selon leur étape. Je fais passer un contact d'une colonne à une autre, à la souris ou au clavier, et il apparaît aussitôt dans sa nouvelle colonne.

- [ ] Étant donné des contacts à différentes étapes, quand j'ouvre la vue Pipeline, alors je vois cinq colonnes dans l'ordre du pipeline, chacune avec ses contacts et leur nombre.
- [ ] Étant donné un contact « Contacté », quand je le fais passer dans la colonne « RDV », alors il apparaît dans « RDV » et plus dans « Contacté », y compris après un rechargement.
- [ ] Étant donné un contact qui a une relance, quand je le fais passer dans « Gagné » ou « Perdu », alors sa relance est effacée (même règle qu'au lot 4).
- [ ] Étant donné la vue Pipeline, quand j'utilise seulement le clavier, alors je peux faire passer un contact dans une autre colonne.
- [ ] Étant donné une étape sans contact, quand j'ouvre la vue Pipeline, alors sa colonne affiche qu'elle est vide.

---

Lots 8 à 14 : refonte UX « Papier v2 ». Référence : maquette validée `design/maquette.html`, design system `design-system.html`, principes dans `design/README.md`. Ces lots ne sont pas encore dans le backlog GitHub.

## Lot 8 · Passer au design system Papier v2

J'ouvre l'app et je retrouve son identité (fond papier, encre brune, terracotta, Fraunces), en plus doux : coins arrondis, ombres légères, couleurs d'urgence pour les relances. Je choisis le thème clair, sombre ou celui du système, et ce choix est conservé.

- [ ] Étant donné l'app ouverte, quand je l'affiche, alors les couleurs, rayons et ombres sont ceux de `design-system.html` (tokens v2 dans `globals.css`, plus d'ombre décalée).
- [ ] Étant donné le thème du système en sombre, quand j'ouvre l'app sans avoir fait de choix, alors elle s'affiche en sombre.
- [ ] Étant donné le sélecteur de thème, quand je choisis « Clair », « Sombre » ou « Système », alors l'app change aussitôt de thème.
- [ ] Étant donné un thème choisi, quand je recharge la page, alors le thème est conservé.

## Lot 9 · Naviguer avec une barre latérale

Une barre latérale me donne accès à Aujourd'hui, Pipeline et Contacts, avec le nombre de relances à faire. En haut, une barre porte la recherche et « Nouveau contact ». Sur téléphone, la navigation passe en bas de l'écran.

- [ ] Étant donné n'importe quelle page, quand je regarde la barre latérale, alors je vois Aujourd'hui, Pipeline et Contacts, et la page courante est mise en évidence.
- [ ] Étant donné des relances en retard ou du jour, quand je regarde la barre latérale, alors « Aujourd'hui » affiche leur nombre ; sans relance due, aucun nombre n'est affiché.
- [ ] Étant donné un écran de téléphone, quand j'ouvre l'app, alors la barre latérale est remplacée par une navigation en bas de l'écran.
- [ ] Étant donné n'importe quelle page, quand je clique sur « Nouveau contact » dans la barre du haut, alors je peux ajouter un contact.

## Lot 10 · Voir et modifier un contact dans un panneau

Je clique sur un contact et sa fiche s'ouvre dans un panneau latéral, sans quitter la liste. Je modifie les champs, ils s'enregistrent tout seuls. Je change l'étape sur une frise et je planifie la relance avec des choix rapides (Demain, Dans 3 jours, Lundi prochain…).

- [ ] Étant donné une liste de contacts, quand je clique sur un contact, alors sa fiche s'ouvre dans un panneau latéral et la liste reste affichée ; Échap ou la croix ferme le panneau.
- [ ] Étant donné la fiche ouverte, quand je modifie l'entreprise puis que j'arrête de taper, alors la modification est enregistrée sans bouton « Enregistrer » et un indicateur « Enregistré » s'affiche.
- [ ] Étant donné la fiche ouverte, quand je saisis un e-mail mal formé ou que je vide le nom, alors l'erreur s'affiche sous le champ et rien n'est enregistré.
- [ ] Étant donné la fiche d'un contact actif, quand je choisis « Dans 3 jours », alors la relance est fixée à dans 3 jours ; pour un contact clôturé, aucun choix de relance n'est proposé.
- [ ] Étant donné l'adresse de la fiche, quand je l'ouvre directement ou que je recharge la page, alors la fiche s'affiche en pleine page.

## Lot 11 · Démarrer la journée depuis « Aujourd'hui »

L'accueil devient la vue du jour. En haut, quelques chiffres clés. En dessous, les relances en retard, du jour et de la semaine, chacune avec « Fait » et « Reporter ». Sur le côté, les contacts actifs qui n'ont pas de relance.

- [ ] Étant donné des contacts, quand j'ouvre l'app, alors j'arrive sur « Aujourd'hui » avec quatre chiffres : relances du jour, relances en retard, RDV en cours, taux de gain.
- [ ] Étant donné des relances passées, du jour et des 7 prochains jours, quand j'ouvre « Aujourd'hui », alors elles sont rangées dans « En retard », « Aujourd'hui » et « Cette semaine ».
- [ ] Étant donné une relance affichée, quand je choisis « Reporter » puis « Lundi prochain », alors la relance passe à lundi prochain et la liste se met à jour.
- [ ] Étant donné des contacts actifs sans relance, quand j'ouvre « Aujourd'hui », alors ils sont listés à part avec un moyen de planifier leur relance.
- [ ] Étant donné aucune relance cette semaine, quand j'ouvre « Aujourd'hui », alors un message indique que tout est à jour.

## Lot 12 · Gérer le pipeline d'un geste

Dans le pipeline, chaque carte montre l'avatar, l'entreprise et une puce de relance colorée selon l'urgence. Je déplace un contact par glisser-déposer, par le menu ⋯ de sa carte ou au clavier, et j'ajoute un contact directement dans une colonne.

- [ ] Étant donné une carte avec une relance, quand j'ouvre le pipeline, alors la puce de relance est rouge si elle est en retard, ambre si elle est aujourd'hui, bleue dans la semaine.
- [ ] Étant donné une carte, quand j'ouvre son menu ⋯ et choisis une étape, alors le contact change de colonne.
- [ ] Étant donné une carte sélectionnée au clavier, quand j'appuie sur Alt + flèche droite ou gauche, alors le contact passe à l'étape suivante ou précédente.
- [ ] Étant donné une colonne, quand je clique sur son « + », alors j'ajoute un contact directement à cette étape.
- [ ] Étant donné un contact déplacé, quand je clique sur « Annuler » dans la notification, alors il revient à son étape précédente, avec sa relance.

## Lot 13 · Parcourir les contacts en tableau

La vue Contacts devient un tableau (nom, entreprise, étape, prochaine relance, date d'ajout) que je trie par colonne. Je filtre par étape avec des puces qui affichent leur nombre, et la recherche se met à jour à chaque frappe.

- [ ] Étant donné des contacts, quand j'ouvre « Contacts », alors je les vois dans un tableau avec nom, entreprise, étape, prochaine relance et date d'ajout.
- [ ] Étant donné le tableau, quand je clique sur l'en-tête « Nom » puis à nouveau, alors le tri passe en ordre alphabétique puis inverse.
- [ ] Étant donné les puces d'étape, quand je les regarde, alors chacune affiche le nombre de contacts qui correspondent à la recherche en cours.
- [ ] Étant donné la recherche, quand je tape « emile », alors le tableau se réduit à chaque frappe, sans bouton à cliquer, et les filtres restent dans l'URL (lot 6).
- [ ] Étant donné un téléphone, quand j'ouvre « Contacts », alors chaque ligne s'affiche en carte lisible.

## Lot 14 · Ajouter et retrouver sans quitter le clavier

J'appuie sur `N` pour ajouter un contact dans une petite fenêtre, avec son étape et sa relance. `⌘K` ouvre une palette pour retrouver un contact ou lancer une commande. Après chaque action importante, une notification me propose d'annuler.

- [ ] Étant donné n'importe quelle page, quand j'appuie sur `N`, alors une fenêtre d'ajout s'ouvre ; le nom est obligatoire, l'entreprise, l'étape et la relance sont facultatives.
- [ ] Étant donné la fenêtre d'ajout, quand je choisis l'étape « Gagné », alors aucune relance n'est proposée.
- [ ] Étant donné n'importe quelle page, quand j'appuie sur `⌘K` (ou `Ctrl K`) et que je tape « zoe », alors Zoé Leroy est proposée et Entrée ouvre sa fiche.
- [ ] Étant donné une relance marquée faite, un contact supprimé ou un changement d'étape, quand je clique sur « Annuler » dans la notification, alors l'état d'avant est rétabli.
- [ ] Étant donné n'importe quelle page, quand j'appuie sur `?`, alors la liste des raccourcis clavier s'affiche.
