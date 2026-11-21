// Suite de contrat de ContactRepository : toute implémentation (SQLite, base managée…)
// doit la passer. C'est elle qui garantit qu'un changement de base ne touche que src/data.
import { describe, expect, it } from "vitest";
import type { ContactRepository } from "@/data/contact.repository";

const at = (iso: string) => new Date(iso);

const marie = { name: "Marie Durand", stage: "new" as const, createdAt: at("2026-11-21T09:00:00.000Z") };

const fullFields = {
  name: "Marie Durand",
  company: "Atelier Lumen",
  email: "marie@lumen.fr",
  phone: "06 12 34 56 78",
  notes: "Rencontrée au salon",
};

export function describeContactRepositoryContract(
  name: string,
  makeRepo: () => ContactRepository | Promise<ContactRepository>,
) {
  describe(`ContactRepository (contrat) · ${name}`, () => {
    it("renvoie une liste vide au départ", async () => {
      const repo = await makeRepo();
      await expect(repo.listByMostRecent()).resolves.toEqual([]);
    });

    it("crée un contact (champs facultatifs à null) et le retrouve dans la liste", async () => {
      const repo = await makeRepo();

      const created = await repo.create(marie);

      expect(created).toEqual({
        id: expect.any(Number),
        name: "Marie Durand",
        stage: "new",
        createdAt: at("2026-11-21T09:00:00.000Z"),
        company: null,
        email: null,
        phone: null,
        notes: null,
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

    it("retrouve un contact par son identifiant, null s'il n'existe pas", async () => {
      const repo = await makeRepo();
      const created = await repo.create(marie);

      await expect(repo.findById(created.id)).resolves.toEqual(created);
      await expect(repo.findById(created.id + 1000)).resolves.toBeNull();
    });

    it("met à jour les champs d'un contact, visibles par findById et dans la liste", async () => {
      const repo = await makeRepo();
      const created = await repo.create(marie);

      const updated = await repo.update(created.id, fullFields);

      expect(updated).toEqual({ ...created, ...fullFields });
      await expect(repo.findById(created.id)).resolves.toEqual(updated);
      await expect(repo.listByMostRecent()).resolves.toEqual([updated]);
    });

    it("remet un champ à null", async () => {
      const repo = await makeRepo();
      const created = await repo.create(marie);
      await repo.update(created.id, fullFields);

      const updated = await repo.update(created.id, { ...fullFields, company: null });

      expect(updated?.company).toBeNull();
    });

    it("ne modifie que le contact visé, et renvoie null pour un identifiant inexistant", async () => {
      const repo = await makeRepo();
      const a = await repo.create(marie);
      const b = await repo.create({ ...marie, name: "Paul Martin" });

      await repo.update(a.id, fullFields);

      await expect(repo.findById(b.id)).resolves.toEqual(b);
      await expect(repo.update(b.id + 1000, fullFields)).resolves.toBeNull();
    });

    it("change l'étape d'un contact, visible par findById et dans la liste (lot 3)", async () => {
      const repo = await makeRepo();
      const created = await repo.create(marie);

      const updated = await repo.updateStage(created.id, "contacted");

      expect(updated).toEqual({ ...created, stage: "contacted" });
      await expect(repo.findById(created.id)).resolves.toEqual(updated);
      await expect(repo.listByMostRecent()).resolves.toEqual([updated]);
    });

    it("changer l'étape ne touche ni aux autres contacts ni aux autres champs ; null si inexistant (lot 3)", async () => {
      const repo = await makeRepo();
      const a = await repo.create(marie);
      await repo.update(a.id, fullFields);
      const b = await repo.create({ ...marie, name: "Paul Martin" });

      const updated = await repo.updateStage(a.id, "won");

      expect(updated).toMatchObject({ ...fullFields, stage: "won" });
      await expect(repo.findById(b.id)).resolves.toEqual(b);
      await expect(repo.updateStage(b.id + 1000, "won")).resolves.toBeNull();
    });

    it("supprime un contact : true, puis introuvable ; false s'il n'existe pas", async () => {
      const repo = await makeRepo();
      const a = await repo.create(marie);
      const b = await repo.create({ ...marie, name: "Paul Martin" });

      await expect(repo.delete(a.id)).resolves.toBe(true);
      await expect(repo.findById(a.id)).resolves.toBeNull();
      await expect(repo.listByMostRecent()).resolves.toEqual([b]);
      await expect(repo.delete(a.id)).resolves.toBe(false);
    });
  });
}
