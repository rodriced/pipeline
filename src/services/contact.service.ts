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
  contactFiltersSchema,
  contactIdSchema,
  isoDateSchema,
  nameSchema,
  stageSchema,
  toFieldErrors,
  type ContactFieldErrors,
} from "@/services/contact.schema";

export type { Contact, ContactFieldErrors, Stage };

/** Étapes du pipeline, dans l'ordre. */
export const STAGES: readonly Stage[] = stageSchema.options;

export type AddContactError = "NAME_REQUIRED";

export type AddContactResult =
  | { ok: true; contact: Contact }
  | { ok: false; error: AddContactError };

export type UpdateContactResult =
  | { ok: true; contact: Contact }
  | { ok: false; errors: ContactFieldErrors }
  | { ok: false; error: "NOT_FOUND" };

export type DeleteContactResult = { ok: true } | { ok: false; error: "NOT_FOUND" };

export type FollowUpError = "NOT_FOUND" | "CONTACT_CLOSED" | "DATE_INVALID" | "DATE_PAST";

export type ScheduleFollowUpResult = { ok: true; contact: Contact } | { ok: false; error: FollowUpError };

export type ClearFollowUpResult = { ok: true; contact: Contact } | { ok: false; error: "NOT_FOUND" };

/** Étapes clôturées : plus de relance possible. */
const CLOSED_STAGES: readonly Stage[] = ["won", "lost"];

export const isClosedStage = (stage: Stage) => CLOSED_STAGES.includes(stage);

/** Date locale (fuseau du serveur) au format AAAA-MM-JJ. */
export function toIsoDate(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

const DAY_MS = 24 * 60 * 60 * 1000;
const utcDay = (isoDate: string) => {
  const [y, m, d] = isoDate.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
};

/** Nombre de jours de `from` à `to` (dates AAAA-MM-JJ). */
export const daysBetween = (from: string, to: string) => Math.round((utcDay(to) - utcDay(from)) / DAY_MS);

/** Date AAAA-MM-JJ décalée de `days` jours. */
export const addDays = (isoDate: string, days: number) =>
  new Date(utcDay(isoDate) + days * DAY_MS).toISOString().slice(0, 10);

/** Filtres de la liste (lot 6). */
export type ContactFilters = { q: string; stage: Stage | null };

/** Texte comparable : sans accents, en minuscules. */
const normalize = (text: string) => text.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

/** Relance due : le contact et son retard en jours (0 = aujourd'hui). */
export type DueFollowUp = { contact: Contact; daysLate: number };

export type ChangeStageResult =
  | { ok: true; contact: Contact }
  | { ok: false; error: "NOT_FOUND" | "INVALID_STAGE" };

export function createContactService(repo: ContactRepository, now: () => Date = () => new Date()) {
  const service = {
    async addContact(rawName: unknown): Promise<AddContactResult> {
      const parsed = nameSchema.safeParse(rawName);
      if (!parsed.success) return { ok: false, error: "NAME_REQUIRED" };

      const contact = await repo.create({ name: parsed.data, stage: "new", createdAt: now() });
      return { ok: true, contact };
    },

    listContacts(): Promise<Contact[]> {
      return repo.listByMostRecent();
    },

    /** Filtres lus dans l'URL ; valeurs absentes ou invalides ignorées. */
    parseContactFilters(raw: unknown): ContactFilters {
      const parsed = contactFiltersSchema.safeParse(raw);
      return parsed.success ? { q: parsed.data.q ?? "", stage: parsed.data.stage ?? null } : { q: "", stage: null };
    },

    /** Contacts dont le nom ou l'entreprise contient la recherche (sans casse ni accents), à l'étape choisie. */
    async searchContacts(raw: unknown): Promise<Contact[]> {
      const { q, stage } = service.parseContactFilters(raw);
      const needle = normalize(q);
      const contacts = await repo.listByMostRecent();
      return contacts.filter(
        (contact) =>
          (stage === null || contact.stage === stage) &&
          (needle === "" || [contact.name, contact.company ?? ""].some((text) => normalize(text).includes(needle))),
      );
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

    async changeStage(rawId: unknown, rawStage: unknown): Promise<ChangeStageResult> {
      const id = contactIdSchema.safeParse(rawId);
      if (!id.success) return { ok: false, error: "NOT_FOUND" };
      const stage = stageSchema.safeParse(rawStage);
      if (!stage.success) return { ok: false, error: "INVALID_STAGE" };

      const contact = await repo.updateStage(id.data, stage.data);
      if (!contact) return { ok: false, error: "NOT_FOUND" };

      // Un contact clôturé n'a plus de relance (lot 4).
      if (isClosedStage(contact.stage) && contact.nextFollowUp !== null) {
        const cleared = await repo.setFollowUp(contact.id, null);
        return cleared ? { ok: true, contact: cleared } : { ok: false, error: "NOT_FOUND" };
      }
      return { ok: true, contact };
    },

    async scheduleFollowUp(rawId: unknown, rawDate: unknown): Promise<ScheduleFollowUpResult> {
      const id = contactIdSchema.safeParse(rawId);
      if (!id.success) return { ok: false, error: "NOT_FOUND" };
      const contact = await repo.findById(id.data);
      if (!contact) return { ok: false, error: "NOT_FOUND" };
      if (isClosedStage(contact.stage)) return { ok: false, error: "CONTACT_CLOSED" };

      const date = isoDateSchema.safeParse(rawDate);
      if (!date.success) return { ok: false, error: "DATE_INVALID" };
      // Les dates AAAA-MM-JJ se comparent comme des chaînes.
      if (date.data < toIsoDate(now())) return { ok: false, error: "DATE_PAST" };

      const updated = await repo.setFollowUp(contact.id, date.data);
      return updated ? { ok: true, contact: updated } : { ok: false, error: "NOT_FOUND" };
    },

    /** Relances dues aujourd'hui ou en retard, la plus en retard d'abord (lot 5). */
    async listDueFollowUps(): Promise<DueFollowUp[]> {
      const today = toIsoDate(now());
      const contacts = await repo.listWithFollowUpDueBy(today);
      return contacts
        .filter((contact) => !isClosedStage(contact.stage))
        .map((contact) => ({ contact, daysLate: daysBetween(contact.nextFollowUp!, today) }));
    },

    /** Reporte la relance au lendemain d'aujourd'hui (mêmes règles que scheduleFollowUp). */
    postponeFollowUp(rawId: unknown): Promise<ScheduleFollowUpResult> {
      return service.scheduleFollowUp(rawId, addDays(toIsoDate(now()), 1));
    },

    async clearFollowUp(rawId: unknown): Promise<ClearFollowUpResult> {
      const id = contactIdSchema.safeParse(rawId);
      if (!id.success) return { ok: false, error: "NOT_FOUND" };

      const contact = await repo.setFollowUp(id.data, null);
      return contact ? { ok: true, contact } : { ok: false, error: "NOT_FOUND" };
    },
  };
  return service;
}

// Instance câblée sur l'implémentation réelle, utilisée par la présentation.
export const contactService = createContactService(contactRepository);
