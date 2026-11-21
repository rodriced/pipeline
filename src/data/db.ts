// Couche données : connexion SQLite (node:sqlite, intégré à Node) et migrations du schéma.
// Passer à une base managée ne change que ce fichier et les implémentations des repositories.
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { DatabaseSync } from "node:sqlite";

// Migrations, dans l'ordre. L'indice + 1 est la version du schéma (PRAGMA user_version).
// Ne jamais modifier une migration publiée : en ajouter une nouvelle.
const MIGRATIONS = [
  // v1 · lot 1 (idempotente : les bases du lot 1 ont la table mais user_version = 0)
  `CREATE TABLE IF NOT EXISTS contacts (
     id         INTEGER PRIMARY KEY AUTOINCREMENT,
     name       TEXT    NOT NULL,
     stage      TEXT    NOT NULL,
     created_at TEXT    NOT NULL
   );`,
  // v2 · lot 2 : fiche contact
  `ALTER TABLE contacts ADD COLUMN company TEXT;
   ALTER TABLE contacts ADD COLUMN email   TEXT;
   ALTER TABLE contacts ADD COLUMN phone   TEXT;
   ALTER TABLE contacts ADD COLUMN notes   TEXT;`,
];

function migrate(db: DatabaseSync) {
  const { user_version: current } = db.prepare("PRAGMA user_version").get() as { user_version: number };
  for (let version = current + 1; version <= MIGRATIONS.length; version++) {
    db.exec("BEGIN");
    try {
      db.exec(MIGRATIONS[version - 1]);
      db.exec(`PRAGMA user_version = ${version}`);
      db.exec("COMMIT");
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }
  }
}

export type Database = DatabaseSync;

/** Ouvre (et crée si besoin) une base SQLite, schéma à jour. `:memory:` pour les tests. */
export function openDatabase(path: string): Database {
  if (path !== ":memory:") mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseSync(path);
  migrate(db);
  return db;
}

const globalForDb = globalThis as unknown as { pipelineDb?: Database };

/** Base de l'app, ouverte au premier usage. Partagée entre rechargements à chaud en dev. */
export function getDb(): Database {
  globalForDb.pipelineDb ??= openDatabase(
    process.env.PIPELINE_DB_PATH ?? join(process.cwd(), "data", "pipeline.db"),
  );
  return globalForDb.pipelineDb;
}
