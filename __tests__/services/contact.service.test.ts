import { describe, expect, it, vi } from "vitest";
import type { Contact, ContactRepository, NewContact } from "@/data/contact.repository";
import { createContactService } from "@/services/contact.service";

function fakeRepo() {
  const contacts: Contact[] = [];
  const repo: ContactRepository = {
    create: vi.fn(async (input: NewContact) => {
      const contact = { id: contacts.length + 1, ...input };
      contacts.push(contact);
      return contact;
    }),
    listByMostRecent: async () =>
      [...contacts].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime() || b.id - a.id),
  };
  return repo;
}

const fixedNow = () => new Date("2026-11-21T09:00:00Z");

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
});
