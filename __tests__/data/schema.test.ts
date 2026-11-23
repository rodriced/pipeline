// schema.sql (appliqué à la main sur Turso) doit donner exactement le schéma des migrations locales.
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { describe, expect, it } from "vitest";
import { openDatabase } from "@/data/db";
import { MIGRATIONS } from "@/data/db";

type Column = { name: string; type: string; notnull: number; pk: number };
const columns = (db: DatabaseSync) =>
  (db.prepare("SELECT name, type, \"notnull\", pk FROM pragma_table_info('contacts') ORDER BY name").all() as Column[]).map(
    ({ name, type, notnull, pk }) => ({ name, type, notnull, pk }),
  );

describe("Schéma de la base", () => {
  it("schema.sql donne les mêmes colonnes que toutes les migrations appliquées", () => {
    const migrated = openDatabase(":memory:");
    const fromSchema = new DatabaseSync(":memory:");
    fromSchema.exec(readFileSync("src/data/schema.sql", "utf8"));

    expect(columns(fromSchema)).toEqual(columns(migrated));
  });

  it("les migrations sont partagées et numérotées dans l'ordre (v1 → v3 aujourd'hui)", () => {
    expect(MIGRATIONS).toHaveLength(3);
    const db = openDatabase(":memory:");
    expect(db.prepare("PRAGMA user_version").get()).toEqual({ user_version: MIGRATIONS.length });
  });
});
