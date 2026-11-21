// Couche données : connexion SQLite (node:sqlite, intégré à Node).
// Passer à une base managée ne change que ce fichier et les implémentations des repositories.
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { DatabaseSync } from "node:sqlite";

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS contacts (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT    NOT NULL,
    stage      TEXT    NOT NULL,
    created_at TEXT    NOT NULL
  );
`;

export type Database = DatabaseSync;

/** Ouvre (et crée si besoin) une base SQLite, schéma compris. `:memory:` pour les tests. */
export function openDatabase(path: string): Database {
  if (path !== ":memory:") mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseSync(path);
  db.exec(SCHEMA);
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
