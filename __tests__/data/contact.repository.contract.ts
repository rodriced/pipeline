// Suite de contrat de ContactRepository : toute implémentation (SQLite, base managée…)
// doit la passer. C'est elle qui garantit qu'un changement de base ne touche que src/data.
import { describe, expect, it } from "vitest";
import type { ContactRepository } from "@/data/contact.repository";

const at = (iso: string) => new Date(iso);

export function describeContactRepositoryContract(
  name: string,
  makeRepo: () => ContactRepository | Promise<ContactRepository>,
) {
  describe(`ContactRepository (contrat) · ${name}`, () => {
    it("renvoie une liste vide au départ", async () => {
      const repo = await makeRepo();
      await expect(repo.listByMostRecent()).resolves.toEqual([]);
    });

    it("crée un contact et le retrouve dans la liste", async () => {
      const repo = await makeRepo();

      const created = await repo.create({
        name: "Marie Durand",
        stage: "new",
        createdAt: at("2026-11-21T09:00:00.000Z"),
      });

      expect(created).toEqual({
        id: expect.any(Number),
        name: "Marie Durand",
        stage: "new",
        createdAt: at("2026-11-21T09:00:00.000Z"),
      });
      await expect(repo.listByMostRecent()).resolves.toEqual([created]);
    });

    it("liste du plus récent au plus ancien", async () => {
      const repo = await makeRepo();
      await repo.create({ name: "Milieu", stage: "new", createdAt: at("2026-11-21T10:00:00.000Z") });
      await repo.create({ name: "Récent", stage: "new", createdAt: at("2026-11-21T11:00:00.000Z") });
      await repo.create({ name: "Ancien", stage: "new", createdAt: at("2026-11-21T09:00:00.000Z") });

      const names = (await repo.listByMostRecent()).map((c) => c.name);
      expect(names).toEqual(["Récent", "Milieu", "Ancien"]);
    });

    it("à date égale, le dernier créé passe en premier", async () => {
      const repo = await makeRepo();
      const same = at("2026-11-21T09:00:00.000Z");
      await repo.create({ name: "Premier", stage: "new", createdAt: same });
      await repo.create({ name: "Second", stage: "new", createdAt: same });

      const names = (await repo.listByMostRecent()).map((c) => c.name);
      expect(names).toEqual(["Second", "Premier"]);
    });
  });
}
