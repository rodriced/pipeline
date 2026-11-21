// Couche service : règles métier des contacts. Le repository et l'horloge sont injectés
// pour pouvoir être remplacés (tests, autre base).
import {
  contactRepository,
  type Contact,
  type ContactFields,
  type ContactRepository,
  type Stage,
} from "@/data/contact.repository";

export type { Contact, Stage };

export type AddContactError = "NAME_REQUIRED";

export type AddContactResult =
  | { ok: true; contact: Contact }
  | { ok: false; error: AddContactError };

/** Saisie de la fiche : seul le nom est obligatoire. */
export type ContactInput = {
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  notes?: string;
};

export type ContactFieldErrors = { name?: "NAME_REQUIRED"; email?: "EMAIL_INVALID" };

export type UpdateContactResult =
  | { ok: true; contact: Contact }
  | { ok: false; errors: ContactFieldErrors }
  | { ok: false; error: "NOT_FOUND" };

export type DeleteContactResult = { ok: true } | { ok: false; error: "NOT_FOUND" };

// Forme minimale : une partie locale, un @, un domaine avec un point, sans espace.
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Espaces retirés ; une chaîne vide devient null. */
const optional = (value: string | undefined) => value?.trim() || null;

const isNameValid = (name: string) => name.length > 0;

export function createContactService(repo: ContactRepository, now: () => Date = () => new Date()) {
  return {
    async addContact(rawName: string): Promise<AddContactResult> {
      const name = rawName.trim();
      if (!isNameValid(name)) return { ok: false, error: "NAME_REQUIRED" };

      const contact = await repo.create({ name, stage: "new", createdAt: now() });
      return { ok: true, contact };
    },

    listContacts(): Promise<Contact[]> {
      return repo.listByMostRecent();
    },

    getContact(id: number): Promise<Contact | null> {
      return repo.findById(id);
    },

    async updateContact(id: number, input: ContactInput): Promise<UpdateContactResult> {
      const fields: ContactFields = {
        name: input.name.trim(),
        company: optional(input.company),
        email: optional(input.email),
        phone: optional(input.phone),
        notes: optional(input.notes),
      };

      const errors: ContactFieldErrors = {};
      if (!isNameValid(fields.name)) errors.name = "NAME_REQUIRED";
      if (fields.email !== null && !EMAIL.test(fields.email)) errors.email = "EMAIL_INVALID";
      if (Object.keys(errors).length > 0) return { ok: false, errors };

      const contact = await repo.update(id, fields);
      return contact ? { ok: true, contact } : { ok: false, error: "NOT_FOUND" };
    },

    async deleteContact(id: number): Promise<DeleteContactResult> {
      return (await repo.delete(id)) ? { ok: true } : { ok: false, error: "NOT_FOUND" };
    },
  };
}

// Instance câblée sur l'implémentation réelle, utilisée par la présentation.
export const contactService = createContactService(contactRepository);
