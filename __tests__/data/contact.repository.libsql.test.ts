// Implémentation Turso (libSQL) du contrat ContactRepository : même suite que SQLite.
// Le client Node de @libsql/client fait tourner libSQL en mémoire : pas de réseau, pas de compte Turso.
import { readFileSync } from "node:fs";
import { createClient } from "@libsql/client";
import { describe, expect, it } from "vitest";
import { createLibsqlContactRepository } from "@/data/contact.repository.libsql";
import { describeContactRepositoryContract } from "./contact.repository.contract";

const SCHEMA = readFileSync("src/data/schema.sql", "utf8");

async function freshRepo() {
  const client = createClient({ url: ":memory:" });
  await client.executeMultiple(SCHEMA);
  return createLibsqlContactRepository(client);
}

describeContactRepositoryContract("libSQL (Turso) en mémoire", freshRepo);

describe("libSQL : schéma Turso", () => {
  it("appliquer schema.sql deux fois ne casse rien et ne perd pas de données", async () => {
    const client = createClient({ url: ":memory:" });
    await client.executeMultiple(SCHEMA);
    const repo = createLibsqlContactRepository(client);
    await repo.create({ name: "Marie Durand", stage: "new", createdAt: new Date("2026-11-21T09:00:00.000Z") });

    await client.executeMultiple(SCHEMA);

    await expect(repo.listByMostRecent()).resolves.toHaveLength(1);
  });
});
