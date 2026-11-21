// Couche service : règles métier des contacts. Le repository et l'horloge sont injectés
// pour pouvoir être remplacés (tests, autre base).
// Les entrées viennent de l'extérieur (Server Actions) : elles sont typées `unknown`
// et validées par les schémas zod de contact.schema.ts.
import {
  contactRepository,
  type Contact,
  type ContactRepository,
  type Stage,
} from "@/data/contact.repository";
import {
  contactFieldsSchema,
  nameSchema,
  toFieldErrors,
  type ContactFieldErrors,
} from "@/services/contact.schema";

export type { Contact, ContactFieldErrors, Stage };

export type AddContactError = "NAME_REQUIRED";

export type AddContactResult =
  | { ok: true; contact: Contact }
  | { ok: false; error: AddContactError };

export type UpdateContactResult =
  | { ok: true; contact: Contact }
  | { ok: false; errors: ContactFieldErrors }
  | { ok: false; error: "NOT_FOUND" };

export type DeleteContactResult = { ok: true } | { ok: false; error: "NOT_FOUND" };

export function createContactService(repo: ContactRepository, now: () => Date = () => new Date()) {
  return {
    async addContact(rawName: unknown): Promise<AddContactResult> {
      const parsed = nameSchema.safeParse(rawName);
      if (!parsed.success) return { ok: false, error: "NAME_REQUIRED" };

      const contact = await repo.create({ name: parsed.data, stage: "new", createdAt: now() });
      return { ok: true, contact };
    },

    listContacts(): Promise<Contact[]> {
      return repo.listByMostRecent();
    },

    getContact(id: number): Promise<Contact | null> {
      return repo.findById(id);
    },

    async updateContact(id: number, input: unknown): Promise<UpdateContactResult> {
      const parsed = contactFieldsSchema.safeParse(input);
      if (!parsed.success) return { ok: false, errors: toFieldErrors(parsed.error) };

      const contact = await repo.update(id, parsed.data);
      return contact ? { ok: true, contact } : { ok: false, error: "NOT_FOUND" };
    },

    async deleteContact(id: number): Promise<DeleteContactResult> {
      return (await repo.delete(id)) ? { ok: true } : { ok: false, error: "NOT_FOUND" };
    },
  };
}

// Instance câblée sur l'implémentation réelle, utilisée par la présentation.
export const contactService = createContactService(contactRepository);
