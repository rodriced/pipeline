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
  contactIdSchema,
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

    async getContact(rawId: unknown): Promise<Contact | null> {
      const id = contactIdSchema.safeParse(rawId);
      return id.success ? repo.findById(id.data) : null;
    },

    async updateContact(rawId: unknown, input: unknown): Promise<UpdateContactResult> {
      const id = contactIdSchema.safeParse(rawId);
      if (!id.success) return { ok: false, error: "NOT_FOUND" };

      const parsed = contactFieldsSchema.safeParse(input);
      if (!parsed.success) return { ok: false, errors: toFieldErrors(parsed.error) };

      const contact = await repo.update(id.data, parsed.data);
      return contact ? { ok: true, contact } : { ok: false, error: "NOT_FOUND" };
    },

    async deleteContact(rawId: unknown): Promise<DeleteContactResult> {
      const id = contactIdSchema.safeParse(rawId);
      if (!id.success) return { ok: false, error: "NOT_FOUND" };

      return (await repo.delete(id.data)) ? { ok: true } : { ok: false, error: "NOT_FOUND" };
    },
  };
}

// Instance câblée sur l'implémentation réelle, utilisée par la présentation.
export const contactService = createContactService(contactRepository);
