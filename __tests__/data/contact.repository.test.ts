import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
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

  it("conserve les contacts après fermeture et réouverture de la base (redémarrage)", async () => {
    const dir = mkdtempSync(join(tmpdir(), "pipeline-"));
    dirs.push(dir);
    const file = join(dir, "sub", "pipeline.db");

    const first = openDatabase(file);
    const created = await createSqliteContactRepository(first).create({
      name: "Marie Durand",
      stage: "new",
      createdAt: new Date("2026-11-21T09:00:00.000Z"),
    });
    first.close();

    const second = openDatabase(file);
    await expect(createSqliteContactRepository(second).listByMostRecent()).resolves.toEqual([created]);
    second.close();
  });
});
