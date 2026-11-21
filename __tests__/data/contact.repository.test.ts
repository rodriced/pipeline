import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { afterEach, describe, expect, it } from "vitest";
import { createSqliteContactRepository } from "@/data/contact.repository";
import { openDatabase } from "@/data/db";
import { describeContactRepositoryContract } from "./contact.repository.contract";

describeContactRepositoryContract("SQLite en mémoire", () =>
  createSqliteContactRepository(openDatabase(":memory:")),
);

describe("SQLite sur fichier", () => {
  const dirs: string[] = [];
  afterEach(() => {
    for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
  });

  function tempDbFile() {
    const dir = mkdtempSync(join(tmpdir(), "pipeline-"));
    dirs.push(dir);
    return join(dir, "sub", "pipeline.db");
  }

  /** Ouvre la base, exécute `fn`, ferme : simule une vie de l'app entre deux redémarrages. */
  async function session<T>(file: string, fn: (repo: ReturnType<typeof createSqliteContactRepository>) => Promise<T>) {
    const db = openDatabase(file);
    try {
      return await fn(createSqliteContactRepository(db));
    } finally {
      db.close();
    }
  }

  const marie = { name: "Marie Durand", stage: "new" as const, createdAt: new Date("2026-11-21T09:00:00.000Z") };

  it("conserve les contacts après fermeture et réouverture de la base (redémarrage)", async () => {
    const file = tempDbFile();
    const created = await session(file, (repo) => repo.create(marie));

    await expect(session(file, (repo) => repo.listByMostRecent())).resolves.toEqual([created]);
  });

  it("conserve une modification après redémarrage", async () => {
    const file = tempDbFile();
    const { id } = await session(file, (repo) => repo.create(marie));
    await session(file, (repo) =>
      repo.update(id, { name: "Marie Durand", company: "Atelier Lumen", email: null, phone: null, notes: null }),
    );

    await expect(session(file, (repo) => repo.findById(id))).resolves.toMatchObject({ company: "Atelier Lumen" });
  });

  it("conserve une suppression après redémarrage", async () => {
    const file = tempDbFile();
    const { id } = await session(file, (repo) => repo.create(marie));
    await session(file, (repo) => repo.delete(id));

    await expect(session(file, (repo) => repo.listByMostRecent())).resolves.toEqual([]);
  });

  it("migre une base du lot 1 sans perdre les contacts existants", async () => {
    const file = tempDbFile();
    openDatabase(file).close(); // crée le dossier
    rmSync(file);
    const legacy = new DatabaseSync(file);
    legacy.exec(`CREATE TABLE contacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, stage TEXT NOT NULL, created_at TEXT NOT NULL)`);
    legacy.prepare("INSERT INTO contacts (name, stage, created_at) VALUES (?, ?, ?)").run(
      "Marie Durand",
      "new",
      "2026-11-21T09:00:00.000Z",
    );
    legacy.close();

    const contacts = await session(file, (repo) => repo.listByMostRecent());
    expect(contacts).toEqual([
      expect.objectContaining({ name: "Marie Durand", company: null, email: null, phone: null, notes: null }),
    ]);
    await session(file, (repo) =>
      repo.update(contacts[0].id, { name: "Marie Durand", company: "Atelier Lumen", email: null, phone: null, notes: null }),
    );
    await expect(session(file, (repo) => repo.findById(contacts[0].id))).resolves.toMatchObject({
      company: "Atelier Lumen",
    });
  });

  it("rouvrir une base à jour ne rejoue pas les migrations", async () => {
    const file = tempDbFile();
    await session(file, (repo) => repo.create(marie));

    await expect(session(file, (repo) => repo.listByMostRecent())).resolves.toHaveLength(1);
  });
});
