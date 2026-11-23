// Couche données : seul endroit autorisé à parler à la base.
// L'interface ContactRepository est le contrat stable ; seule l'implémentation change.
import { SQL, toContact, type ContactRow } from "@/data/contact.sql";
import { createLibsqlContactRepository } from "@/data/contact.repository.libsql";
import { getDb, type Database } from "@/data/db";
import { getTursoClient, repositoryKind } from "@/data/turso";

export type Stage = "new" | "contacted" | "meeting" | "won" | "lost";

export type Contact = {
  id: number;
  name: string;
  stage: Stage;
  createdAt: Date;
  company: string | null;
  email: string | null;
  phone: string | null;
  notes: string | null;
  /** Prochaine relance, date seule au format AAAA-MM-JJ. */
  nextFollowUp: string | null;
};

/** Ce qu'il faut pour créer un contact ; les champs de la fiche partent à null. */
export type NewContact = Pick<Contact, "name" | "stage" | "createdAt">;

/** Champs modifiables depuis la fiche. */
export type ContactFields = Pick<Contact, "name" | "company" | "email" | "phone" | "notes">;

export interface ContactRepository {
  create(input: NewContact): Promise<Contact>;
  listByMostRecent(): Promise<Contact[]>;
  findById(id: number): Promise<Contact | null>;
  /** Renvoie le contact modifié, ou null s'il n'existe pas. */
  update(id: number, fields: ContactFields): Promise<Contact | null>;
  /** Renvoie true si un contact a été supprimé. */
  delete(id: number): Promise<boolean>;
  /** Renvoie le contact avec sa nouvelle étape, ou null s'il n'existe pas. */
  updateStage(id: number, stage: Stage): Promise<Contact | null>;
  /** Fixe (date AAAA-MM-JJ) ou efface (null) la prochaine relance ; null si le contact n'existe pas. */
  setFollowUp(id: number, date: string | null): Promise<Contact | null>;
  /** Contacts dont la relance tombe au plus tard à `date` (AAAA-MM-JJ), la plus ancienne d'abord. */
  listWithFollowUpDueBy(date: string): Promise<Contact[]>;
}

export function createSqliteContactRepository(db: Database): ContactRepository {
  const insert = db.prepare(SQL.insert);
  const selectAll = db.prepare(SQL.selectAll);
  const selectById = db.prepare(SQL.selectById);
  const updateById = db.prepare(SQL.updateById);
  const deleteById = db.prepare(SQL.deleteById);
  const updateStageById = db.prepare(SQL.updateStageById);
  const setFollowUpById = db.prepare(SQL.setFollowUpById);
  const selectDueBy = db.prepare(SQL.selectDueBy);

  return {
    async create({ name, stage, createdAt }) {
      return toContact(insert.get(name, stage, createdAt.toISOString()) as ContactRow);
    },
    async listByMostRecent() {
      return (selectAll.all() as ContactRow[]).map(toContact);
    },
    async findById(id) {
      const row = selectById.get(id) as ContactRow | undefined;
      return row ? toContact(row) : null;
    },
    async update(id, { name, company, email, phone, notes }) {
      const row = updateById.get(name, company, email, phone, notes, id) as ContactRow | undefined;
      return row ? toContact(row) : null;
    },
    async delete(id) {
      return Number(deleteById.run(id).changes) > 0;
    },
    async updateStage(id, stage) {
      const row = updateStageById.get(stage, id) as ContactRow | undefined;
      return row ? toContact(row) : null;
    },
    async setFollowUp(id, date) {
      const row = setFollowUpById.get(date, id) as ContactRow | undefined;
      return row ? toContact(row) : null;
    },
    async listWithFollowUpDueBy(date) {
      return (selectDueBy.all(date) as ContactRow[]).map(toContact);
    },
  };
}

// Instance de l'app : la base est choisie et ouverte au premier appel (pas à l'import).
// Turso si TURSO_DATABASE_URL est définie (ex. sur Vercel), sinon SQLite local.
let appRepo: Promise<ContactRepository> | undefined;
function repo(): Promise<ContactRepository> {
  appRepo ??= (
    repositoryKind() === "turso"
      ? getTursoClient().then(createLibsqlContactRepository)
      : Promise.resolve().then(() => createSqliteContactRepository(getDb()))
  ).catch((error: unknown) => {
    appRepo = undefined; // nouvel essai au prochain appel
    throw error;
  });
  return appRepo;
}

export const contactRepository: ContactRepository = {
  create: async (input) => (await repo()).create(input),
  listByMostRecent: async () => (await repo()).listByMostRecent(),
  findById: async (id) => (await repo()).findById(id),
  update: async (id, fields) => (await repo()).update(id, fields),
  delete: async (id) => (await repo()).delete(id),
  updateStage: async (id, stage) => (await repo()).updateStage(id, stage),
  setFollowUp: async (id, date) => (await repo()).setFollowUp(id, date),
  listWithFollowUpDueBy: async (date) => (await repo()).listWithFollowUpDueBy(date),
};
