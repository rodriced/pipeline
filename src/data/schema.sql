-- Schéma complet de la base Pipeline, à appliquer une fois sur une base Turso vide.
-- Équivaut aux migrations v1 à v3 de src/data/db.ts (vérifié par __tests__/data/schema.test.ts).
-- En local (SQLite), les migrations s'appliquent toutes seules au démarrage : ce fichier ne sert qu'à Turso.
CREATE TABLE IF NOT EXISTS contacts (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  name           TEXT    NOT NULL,
  stage          TEXT    NOT NULL,
  created_at     TEXT    NOT NULL,
  company        TEXT,
  email          TEXT,
  phone          TEXT,
  notes          TEXT,
  next_follow_up TEXT
);
