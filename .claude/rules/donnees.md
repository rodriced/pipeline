---
paths:
  - "src/data/**"
  - "__tests__/data/**"
---

# Couche données

Périmètre : `src/data`.

## Rôle
- Seule couche qui parle à la base : pilote, client, SQL, migrations, connexion.
- Chaque repository expose une interface `XxxRepository` (le contrat stable, utilisé par les services) et son implémentation.
- Le contrat ne laisse rien fuiter de la base : il retourne des objets du domaine, pas de lignes brutes, de types du pilote ni d'erreurs SQL.
- Passer de SQLite à Turso ne change que l'implémentation et la config de connexion, jamais l'interface ni les services.
- Aucune règle métier ici : la couche lit et écrit, le service décide.
- Ne dépend ni des services ni de la présentation.
- Connexion et identifiants via variables d'environnement (`.env.local`), jamais en dur ni versionnés.
- Sur Vercel le système de fichiers est éphémère : un fichier SQLite local n'y persiste pas.

## Comment vérifier
- `pnpm lint` : aucune erreur `no-restricted-imports` (données ↛ services/présentation).
- Le pilote de base n'est importé que dans `src/data` :
  `grep -rnE "sqlite|libsql|drizzle|prisma" src --include="*.ts" --include="*.tsx" | grep -v "^src/data/"` → vide.
- `pnpm test __tests__/data` passe : les tests vérifient que l'implémentation respecte le contrat de l'interface.
- Persistance : ajouter un contact, redémarrer `pnpm dev`, le contact est toujours là.
- Aucun secret versionné : `git grep -nE "authToken|TURSO_|DATABASE_URL\s*=" -- src` ne montre que des lectures de `process.env`.
