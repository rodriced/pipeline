// Couche service : règles métier des contacts. Le repository et l'horloge sont injectés
// pour pouvoir être remplacés (tests, autre base).
import {
  contactRepository,
  type Contact,
  type ContactRepository,
  type Stage,
} from "@/data/contact.repository";

export type { Contact, Stage };

export type AddContactError = "NAME_REQUIRED";

export type AddContactResult =
  | { ok: true; contact: Contact }
  | { ok: false; error: AddContactError };

export function createContactService(repo: ContactRepository, now: () => Date = () => new Date()) {
  return {
    async addContact(rawName: string): Promise<AddContactResult> {
      const name = rawName.trim();
      if (!name) return { ok: false, error: "NAME_REQUIRED" };

      const contact = await repo.create({ name, stage: "new", createdAt: now() });
      return { ok: true, contact };
    },

    listContacts(): Promise<Contact[]> {
      return repo.listByMostRecent();
    },
  };
}

// Instance câblée sur l'implémentation réelle, utilisée par la présentation.
export const contactService = createContactService(contactRepository);
