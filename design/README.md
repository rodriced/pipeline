# Refonte UX · Papier v2

Proposition de refonte de l'interface de Pipeline, à valider **sur maquette** avant de modifier l'app Next.

| Fichier | Contenu |
|---|---|
| `design/maquette.html` | Maquette cliquable et dynamique de toute l'application |
| `design-system.html` (racine) | Design system « Papier v2 » : tokens, composants, motifs |

## Ouvrir la maquette

Double-cliquer sur `design/maquette.html` (ou `open design/maquette.html`). Aucune installation, aucun serveur.

- Données : les 28 contacts de `pnpm seed`, avec des dates recalculées par rapport au jour d'ouverture.
- Tout est modifiable. L'état est gardé dans le navigateur (`localStorage`) ; « Réinitialiser les données » (barre latérale ou palette ⌘K) remet le jeu de démo.
- Thème clair / sombre / système en bas de la barre latérale.
- Raccourcis : `⌘K` (ou `Ctrl K`) palette, `N` nouveau contact, `G` puis `T` / `P` / `C` pour changer de vue, `/` rechercher, `Alt ←/→` sur une carte du pipeline, `Échap` fermer, `?` aide.

## Ce qui ne va pas dans l'app actuelle

- **Accueil sans priorité** : formulaire d'ajout, filtres et liste empilés ; rien ne dit quoi faire maintenant.
- **Fiche sur une page à part**, avec 4 formulaires et 4 boutons « Enregistrer / Planifier / Supprimer… » : on perd la liste à chaque ouverture, et chaque modification demande un envoi explicite.
- **Peu d'actions rapides** : rien depuis la liste ; dans le Pipeline, une liste déroulante et un bouton par carte qui l'encombrent.
- **Pas de retour** après une action (pas de notification, pas d'annulation), pas de recherche globale, pas de raccourcis.
- **Relances laborieuses** : un champ date nu, sans « demain » ni « dans 3 jours ».
- **Pas de choix clair / sombre**, états vides peu guidants, visuel daté (ombre décalée de 3 px, coins de 4 px, beaucoup de bordures).

## Principes retenus

1. **Aujourd'hui d'abord** : l'accueil répond à « qui je relance maintenant ? » (INTENT.md), avec les actions sur place : « Fait », « Reporter ».
2. **La fiche en panneau latéral** : la liste ou le pipeline restent visibles ; tout s'enregistre automatiquement, les erreurs s'affichent en direct.
3. **Une action, un clic** : choix rapides de date, menu ⋯ sur chaque carte, glisser-déposer, palette ⌘K.
4. **Toujours un retour, toujours une annulation** : chaque action affiche une notification avec « Annuler » (relance faite, report, changement d'étape, suppression).
5. **Clavier partout** : raccourcis visibles dans l'interface, focus visible et piégé dans les fenêtres, menus au clavier.
6. **Papier, en plus doux** : même identité (papier, encre brune, terracotta, Fraunces), coins arrondis, ombres légères, couleurs d'urgence pour les relances, vrai mode sombre.
7. **Mêmes règles métier** : nom requis, e-mail valide, pas de relance passée ni sur un contact clôturé, clôture → relance effacée, toute étape vers toute autre.

## Découpage proposé pour l'implémentation

À ajouter à `lots.md` puis traiter avec `/lot N`, une fois la maquette validée. Ordre conseillé : chaque lot est livrable seul.

| Lot | Titre | Contenu |
|---|---|---|
| 8 | Passer au design system Papier v2 | Tokens v2 dans `globals.css` (rayons, élévation, surfaces, urgence), choix clair / sombre / système mémorisé |
| 9 | Naviguer avec une barre latérale | Coquille : barre latérale (badge des relances dues), barre du haut, navigation en bas sur téléphone |
| 10 | Voir et modifier un contact dans un panneau | Fiche en panneau latéral (route interceptée), enregistrement automatique, frise d'étapes, choix rapides de relance |
| 11 | Démarrer la journée depuis « Aujourd'hui » | Accueil : chiffres clés, En retard / Aujourd'hui / Cette semaine, « Fait » et « Reporter » sur place, contacts sans relance |
| 12 | Gérer le pipeline d'un geste | Cartes enrichies, menu ⋯, « + » par colonne, déplacement au clavier, notification avec annulation |
| 13 | Parcourir les contacts en tableau | Tableau triable, filtres en puces avec nombres, recherche instantanée (filtres dans l'URL, déjà acquis au lot 6) |
| 14 | Ajouter et retrouver sans quitter le clavier | Ajout rapide (`N`), palette ⌘K, notifications avec « Annuler » généralisées |

## Vérification faite sur la maquette

- Syntaxe du JavaScript contrôlée ; tokens identiques entre la maquette et le design system ; aucune couleur en dur hors des tokens.
- Parcours rejoués automatiquement dans un DOM simulé (61 vérifications) : accueil et chiffres, « Fait » + annuler, report, fiche (étape, clôture qui efface la relance, date passée refusée, e-mail et nom validés, enregistrement automatique), suppression + annuler, pipeline (menu, glisser-déposer, clavier), contacts (recherche sans accents, filtres, tri, filtres relus depuis l'adresse), ajout rapide, palette, raccourcis, thème, persistance, réinitialisation.
- **Non vérifié** : le rendu visuel réel (aucun navigateur disponible pendant la réalisation). À regarder : clair et sombre, largeur téléphone, glisser-déposer à la souris.
