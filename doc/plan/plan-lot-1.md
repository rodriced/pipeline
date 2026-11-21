# Plan · Lot 1 · Ajouter un contact et le retrouver dans la liste (#1)

> Plan validé le 21/11/2026. Livré dans `c7177fb` (PR #7).

## Contexte
Premier lot de bout en bout : sur la page d'accueil, je saisis un nom, le contact apparaît dans la liste à l'étape « Nouveau », et il y est encore après un redémarrage. Ce lot pose aussi le contrat `ContactRepository`. Ce contrat est stable : passer plus tard à une base managée ne touchera que `src/data` (critère 3 d'INTENT.md). SQLite local, pas de Turso (décision du 20/11).

Constats qui orientent le plan :
- Node v26 a `node:sqlite` intégré (testé : SQLite 3.54.1, sans flag), donc aucune dépendance native. Je ne sais pas si l'API est encore marquée « release candidate » dans cette version de Node.
- `next.config.ts` a `cacheComponents: true`, et `node:sqlite` est **synchrone**. Selon la doc locale (`08-caching.md`), du travail synchrone est figé au prerender, même sous `<Suspense>`. Il faut donc `await connection()` avant la lecture, et un `<Suspense>` autour.
- Formulaire : Server Action + `useActionState` dans un Client Component, et `revalidatePath("/")` après la mutation (`02-guides/forms.md`, `07-mutating-data.md`).
- `.gitignore` couvre déjà `*.db*`. Aucun composant shadcn n'est installé.

Décision prise pendant la planification : l'entreprise reste au lot 2, le lot 1 ne gère que le nom.

## Ordre (TDD, règle `service.md`)
Pour chaque couche : test d'abord → `pnpm test` rouge → code → vert. Ordre : service → données → présentation.

## Couche service : `src/services/contact.service.ts`
- `createContactService(repo: ContactRepository, now = () => new Date())`, sur le modèle de `status.service.ts`.
  - `addContact(name: string)` : nettoie les espaces au début et à la fin. Si le nom est vide, retourne `{ ok: false, error: "NAME_REQUIRED" }` sans appeler le repo. Sinon `repo.create({ name, stage: "new", createdAt: now() })` → `{ ok: true, contact }`.
  - `listContacts()` → `repo.listByMostRecent()`.
- Instance câblée `contactService = createContactService(contactRepository)`, réexport des types `Contact` et `Stage` pour la présentation.
- Test : `__tests__/services/contact.service.test.ts`, avec un faux repo en mémoire et une horloge injectée.

## Couche données
- `src/data/db.ts` : ouvre une `DatabaseSync` (`node:sqlite`). Chemin dans `PIPELINE_DB_PATH`, par défaut `./data/pipeline.db` (dossier créé si absent, déjà ignoré par git). Crée la table si elle n'existe pas :
  `contacts(id INTEGER PK, name TEXT NOT NULL, stage TEXT NOT NULL, created_at TEXT NOT NULL)`.
- `src/data/contact.repository.ts` :
  - types du domaine `Stage = "new" | "contacted" | "meeting" | "won" | "lost"` et `Contact { id, name, stage, createdAt: Date }` ;
  - interface `ContactRepository { create(input): Promise<Contact>; listByMostRecent(): Promise<Contact[]> }`, async pour rester compatible avec un futur client distant ;
  - `createSqliteContactRepository(db)` : requêtes préparées, `ORDER BY created_at DESC, id DESC`, conversion des lignes en `Contact` (pas de ligne brute qui fuite) ;
  - instance `contactRepository` sur la base par défaut.
- Tests :
  - `__tests__/data/contact.repository.contract.ts` : une suite de contrat réutilisable `describeContactRepositoryContract(makeRepo)`, qu'une future implémentation devra passer ;
  - `__tests__/data/contact.repository.test.ts` : lance cette suite sur SQLite `:memory:`, plus le test de persistance sur fichier temporaire.

## Couche présentation
- shadcn : `pnpm dlx shadcn@latest add button input label card badge`.
- `src/components/stage-badge.tsx` : étape → libellé FR (« Nouveau »…) + classes de tokens `stage-*`, sans couleur en dur.
- `src/components/contact-list.tsx` : composant pur `contacts` en props, avec un état vide « Aucun contact pour l'instant ».
- `src/components/add-contact-form.tsx` (`"use client"`) : reçoit `action` et `initialState` en props, `useActionState`, input `name` `required`, message d'erreur `aria-live`, bouton désactivé pendant l'envoi.
- `src/app/actions.ts` (`"use server"`) : `addContactAction(prev, formData)` → `contactService.addContact`, traduit `NAME_REQUIRED` en « Le nom est requis. », puis `revalidatePath("/")`.
- `src/app/page.tsx` : titre + formulaire (l'action passée en prop) + `<Suspense>` autour de `ContactsSection` (`await connection()` puis `contactService.listContacts()` → `ContactList`).
- Test : `__tests__/components/stage-badge.test.tsx`, `contact-list.test.tsx`, `add-contact-form.test.tsx` (`renderToStaticMarkup`).

## Critère → test qui le prouve
| Critère | Test(s) |
|---|---|
| 1. J'ajoute « Marie Durand » → la liste l'affiche avec « Nouveau » | service : `addContact("Marie Durand")` puis `listContacts()` contient Marie, `stage: "new"` · contrat données : `create` puis `listByMostRecent` la retourne · composant : `ContactList` avec Marie → markup contient « Marie Durand » et « Nouveau » |
| 2. Nom vide ou fait d'espaces → rien d'enregistré, message « nom requis » | service : `""` et `"   "` → `NAME_REQUIRED`, `repo.create` jamais appelé, liste toujours vide · service : `"  Marie  "` est enregistré « Marie » · composant : `AddContactForm` avec `initialState.error` → markup contient « Le nom est requis. », input `required` |
| 3. Contact toujours là après redémarrage | données : fichier temporaire → `create` → `db.close()` → nouvelle connexion sur le même fichier → `listByMostRecent` contient le contact · manuel : ajout, arrêt et relance de `pnpm dev`, il est toujours là |
| 4. Liste triée du plus récent au plus ancien | contrat données : 3 contacts avec `createdAt` croissants → liste dans l'ordre inverse (départage par `id` si dates égales) · service : `createdAt` vient de l'horloge injectée · composant : `ContactList` respecte l'ordre reçu |
| INTENT 3. Base managée = seule la couche données change | suite de contrat réutilisable + `pnpm lint` (règles d'import) + grep `donnees.md` |

## Vérification finale
- `pnpm test`, `pnpm lint`, `pnpm build` passent.
- Les greps « Comment vérifier » des 3 règles (`.claude/rules/`) ne renvoient rien.
- Manuel avec `pnpm dev` : ajout, nom vide refusé, redémarrage, ordre, rendu clair/sombre.
- Commit sur `dev`, puis push et PR `Closes #1` **seulement sur ta demande**.

## Risques à surveiller
- Vitest/Vite et Turbopack doivent laisser `node:sqlite` en externe. Si ça casse, je te le signale avant de passer à `better-sqlite3`.

## Écarts constatés à l'exécution
- `@types/node` passé de `^20` à `^26` : la v20 ne type pas `node:sqlite` (le build échouait).
- La base n'est ouverte qu'au premier appel du repository, pas à l'import : ni les tests ni le build ne créent `data/pipeline.db`.
- Après le lot, l'exemple `status` du squelette a été supprimé (`56c0a1b`) ; `contact.service.ts` est devenu le modèle cité par CLAUDE.md et `service.md`.
