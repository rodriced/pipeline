import { describe, expect, it, vi } from "vitest";
import type { Contact, ContactFields, ContactRepository, NewContact } from "@/data/contact.repository";
import { createContactService } from "@/services/contact.service";

function fakeRepo() {
  const contacts: Contact[] = [];
  const repo: ContactRepository = {
    create: vi.fn(async (input: NewContact) => {
      const contact: Contact = {
        id: contacts.length + 1,
        company: null,
        email: null,
        phone: null,
        notes: null,
        ...input,
      };
      contacts.push(contact);
      return contact;
    }),
    listByMostRecent: async () =>
      [...contacts].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime() || b.id - a.id),
    findById: vi.fn(async (id: number) => contacts.find((c) => c.id === id) ?? null),
    update: vi.fn(async (id: number, fields: ContactFields) => {
      const contact = contacts.find((c) => c.id === id);
      if (!contact) return null;
      Object.assign(contact, fields);
      return { ...contact };
    }),
    delete: vi.fn(async (id: number) => {
      const index = contacts.findIndex((c) => c.id === id);
      if (index === -1) return false;
      contacts.splice(index, 1);
      return true;
    }),
  };
  return repo;
}

const fixedNow = () => new Date("2026-11-21T09:00:00Z");

async function withMarie() {
  const repo = fakeRepo();
  const service = createContactService(repo, fixedNow);
  const result = await service.addContact("Marie Durand");
  if (!result.ok) throw new Error("setup");
  return { repo, service, id: result.contact.id };
}

describe("createContactService", () => {
  describe("addContact", () => {
    it("ajoute un contact à l'étape « new » et il apparaît dans la liste", async () => {
      const service = createContactService(fakeRepo(), fixedNow);

      const result = await service.addContact("Marie Durand");

      expect(result).toMatchObject({ ok: true, contact: { name: "Marie Durand", stage: "new" } });
      await expect(service.listContacts()).resolves.toEqual([
        expect.objectContaining({ name: "Marie Durand", stage: "new" }),
      ]);
    });

    it.each(["", "   ", "\t\n"])("refuse un nom vide ou fait d'espaces (%j) sans rien enregistrer", async (name) => {
      const repo = fakeRepo();
      const service = createContactService(repo, fixedNow);

      await expect(service.addContact(name)).resolves.toEqual({ ok: false, error: "NAME_REQUIRED" });
      expect(repo.create).not.toHaveBeenCalled();
      await expect(service.listContacts()).resolves.toEqual([]);
    });

    it("retire les espaces autour du nom", async () => {
      const service = createContactService(fakeRepo(), fixedNow);

      await service.addContact("  Marie Durand  ");

      await expect(service.listContacts()).resolves.toEqual([
        expect.objectContaining({ name: "Marie Durand" }),
      ]);
    });

    it("date le contact avec l'horloge injectée", async () => {
      const repo = fakeRepo();
      const service = createContactService(repo, fixedNow);

      await service.addContact("Marie Durand");

      expect(repo.create).toHaveBeenCalledWith({
        name: "Marie Durand",
        stage: "new",
        createdAt: fixedNow(),
      });
    });
  });

  describe("listContacts", () => {
    it("renvoie les contacts du plus récent au plus ancien", async () => {
      let t = Date.parse("2026-11-21T09:00:00Z");
      const service = createContactService(fakeRepo(), () => new Date((t += 60_000)));

      await service.addContact("Ancien");
      await service.addContact("Milieu");
      await service.addContact("Récent");

      const names = (await service.listContacts()).map((c) => c.name);
      expect(names).toEqual(["Récent", "Milieu", "Ancien"]);
    });
  });

  describe("getContact", () => {
    it("renvoie le contact demandé", async () => {
      const { service, id } = await withMarie();
      await expect(service.getContact(id)).resolves.toMatchObject({ id, name: "Marie Durand" });
    });

    it("renvoie null pour un identifiant inexistant", async () => {
      const { service } = await withMarie();
      await expect(service.getContact(999)).resolves.toBeNull();
    });
  });

  describe("updateContact", () => {
    it("enregistre l'entreprise, visible sur la fiche et dans la liste", async () => {
      const { service, id } = await withMarie();

      const result = await service.updateContact(id, { name: "Marie Durand", company: "Atelier Lumen" });

      expect(result).toMatchObject({ ok: true, contact: { company: "Atelier Lumen" } });
      await expect(service.getContact(id)).resolves.toMatchObject({ company: "Atelier Lumen" });
      await expect(service.listContacts()).resolves.toEqual([
        expect.objectContaining({ id, company: "Atelier Lumen" }),
      ]);
    });

    it("enregistre tous les champs, nettoyés, et met les champs vides à null", async () => {
      const { repo, service, id } = await withMarie();

      await service.updateContact(id, {
        name: "  Marie Durand ",
        company: "  ",
        email: " marie@lumen.fr ",
        phone: " 06 12 34 56 78 ",
        notes: "  Rencontrée au salon  ",
      });

      expect(repo.update).toHaveBeenCalledWith(id, {
        name: "Marie Durand",
        company: null,
        email: "marie@lumen.fr",
        phone: "06 12 34 56 78",
        notes: "Rencontrée au salon",
      });
    });

    it.each(["camille@lumen", "sans-arobase", "a b@c.fr", "@lumen.fr"])(
      "refuse un email mal formé (%j) sans rien modifier",
      async (email) => {
        const { repo, service, id } = await withMarie();

        const result = await service.updateContact(id, { name: "Marie Durand", email });

        expect(result).toEqual({ ok: false, errors: { email: "EMAIL_INVALID" } });
        expect(repo.update).not.toHaveBeenCalled();
      },
    );

    it("accepte un email vide (champ facultatif)", async () => {
      const { service, id } = await withMarie();
      await expect(service.updateContact(id, { name: "Marie Durand", email: "  " })).resolves.toMatchObject({
        ok: true,
        contact: { email: null },
      });
    });

    it("refuse un nom vidé, sans rien modifier", async () => {
      const { repo, service, id } = await withMarie();

      const result = await service.updateContact(id, { name: "   ", company: "Atelier Lumen" });

      expect(result).toEqual({ ok: false, errors: { name: "NAME_REQUIRED" } });
      expect(repo.update).not.toHaveBeenCalled();
      await expect(service.getContact(id)).resolves.toMatchObject({ name: "Marie Durand", company: null });
    });

    it("signale toutes les erreurs à la fois", async () => {
      const { service, id } = await withMarie();
      await expect(service.updateContact(id, { name: "", email: "x@y" })).resolves.toEqual({
        ok: false,
        errors: { name: "NAME_REQUIRED", email: "EMAIL_INVALID" },
      });
    });

    it("renvoie NOT_FOUND pour un identifiant inexistant", async () => {
      const { service } = await withMarie();
      await expect(service.updateContact(999, { name: "Paul" })).resolves.toEqual({
        ok: false,
        error: "NOT_FOUND",
      });
    });
  });

  describe("validation des données reçues (entrée non typée)", () => {
    it.each([undefined, null, 42, {}])("addContact refuse un nom qui n'est pas une chaîne (%j)", async (name) => {
      const repo = fakeRepo();
      const service = createContactService(repo, fixedNow);

      await expect(service.addContact(name)).resolves.toEqual({ ok: false, error: "NAME_REQUIRED" });
      expect(repo.create).not.toHaveBeenCalled();
    });

    it.each([undefined, null, "texte", 42])("updateContact refuse une saisie qui n'est pas un objet (%j)", async (input) => {
      const { repo, service, id } = await withMarie();

      await expect(service.updateContact(id, input)).resolves.toEqual({ ok: false, errors: { name: "NAME_REQUIRED" } });
      expect(repo.update).not.toHaveBeenCalled();
    });

    it("updateContact refuse un nom absent ou non textuel", async () => {
      const { service, id } = await withMarie();

      await expect(service.updateContact(id, { company: "Atelier Lumen" })).resolves.toEqual({
        ok: false,
        errors: { name: "NAME_REQUIRED" },
      });
      await expect(service.updateContact(id, { name: 42 })).resolves.toEqual({
        ok: false,
        errors: { name: "NAME_REQUIRED" },
      });
    });

    it("updateContact refuse un email non textuel", async () => {
      const { service, id } = await withMarie();
      await expect(service.updateContact(id, { name: "Marie Durand", email: 42 })).resolves.toEqual({
        ok: false,
        errors: { email: "EMAIL_INVALID" },
      });
    });

    it("updateContact ignore les champs inconnus (ex. champs techniques du formulaire)", async () => {
      const { repo, service, id } = await withMarie();

      await service.updateContact(id, { name: "Marie Durand", $ACTION_REF_1: "", stage: "won", id: 999 });

      expect(repo.update).toHaveBeenCalledWith(id, {
        name: "Marie Durand",
        company: null,
        email: null,
        phone: null,
        notes: null,
      });
    });
  });

  describe("validation de l'identifiant (URL, argument lié d'une action)", () => {
    const invalidIds = ["abc", "1.5", "0", "-3", "", " 1", "1e2", "0x1", "9007199254740993", 0, -1, 1.5, NaN, null, undefined, {}];

    it("accepte un identifiant numérique ou une chaîne de chiffres", async () => {
      const { service, id } = await withMarie();

      await expect(service.getContact(id)).resolves.toMatchObject({ name: "Marie Durand" });
      await expect(service.getContact(String(id))).resolves.toMatchObject({ name: "Marie Durand" });
    });

    it.each(invalidIds)("getContact renvoie null pour un identifiant invalide (%j), sans interroger la base", async (bad) => {
      const { repo, service } = await withMarie();

      await expect(service.getContact(bad)).resolves.toBeNull();
      expect(repo.findById).not.toHaveBeenCalled();
    });

    it.each(invalidIds)("updateContact renvoie NOT_FOUND pour un identifiant invalide (%j), sans rien modifier", async (bad) => {
      const { repo, service } = await withMarie();

      await expect(service.updateContact(bad, { name: "Paul" })).resolves.toEqual({ ok: false, error: "NOT_FOUND" });
      expect(repo.update).not.toHaveBeenCalled();
    });

    it.each(invalidIds)("deleteContact renvoie NOT_FOUND pour un identifiant invalide (%j), sans rien supprimer", async (bad) => {
      const { repo, service } = await withMarie();

      await expect(service.deleteContact(bad)).resolves.toEqual({ ok: false, error: "NOT_FOUND" });
      expect(repo.delete).not.toHaveBeenCalled();
      await expect(service.listContacts()).resolves.toHaveLength(1);
    });
  });

  describe("deleteContact", () => {
    it("supprime le contact, qui disparaît de la liste", async () => {
      const { service, id } = await withMarie();

      await expect(service.deleteContact(id)).resolves.toEqual({ ok: true });
      await expect(service.listContacts()).resolves.toEqual([]);
      await expect(service.getContact(id)).resolves.toBeNull();
    });

    it("renvoie NOT_FOUND pour un identifiant inexistant", async () => {
      const { service } = await withMarie();
      await expect(service.deleteContact(999)).resolves.toEqual({ ok: false, error: "NOT_FOUND" });
      await expect(service.listContacts()).resolves.toHaveLength(1);
    });
  });
});
