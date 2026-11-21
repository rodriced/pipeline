// Couche données : seul endroit autorisé à parler à la base.
// L'interface ContactRepository est le contrat stable ; seule l'implémentation change.
import { getDb, type Database } from "@/data/db";

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
}

type ContactRow = {
  id: number;
  name: string;
  stage: string;
  created_at: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  notes: string | null;
  next_follow_up: string | null;
};

const COLUMNS = "id, name, stage, created_at, company, email, phone, notes, next_follow_up";

const toContact = (row: ContactRow): Contact => ({
  id: Number(row.id),
  name: row.name,
  stage: row.stage as Stage,
  createdAt: new Date(row.created_at),
  company: row.company,
  email: row.email,
  phone: row.phone,
  notes: row.notes,
  nextFollowUp: row.next_follow_up,
});

export function createSqliteContactRepository(db: Database): ContactRepository {
  const insert = db.prepare(
    `INSERT INTO contacts (name, stage, created_at) VALUES (?, ?, ?) RETURNING ${COLUMNS}`,
  );
  const selectAll = db.prepare(`SELECT ${COLUMNS} FROM contacts ORDER BY created_at DESC, id DESC`);
  const selectById = db.prepare(`SELECT ${COLUMNS} FROM contacts WHERE id = ?`);
  const updateById = db.prepare(
    `UPDATE contacts SET name = ?, company = ?, email = ?, phone = ?, notes = ? WHERE id = ? RETURNING ${COLUMNS}`,
  );
  const deleteById = db.prepare("DELETE FROM contacts WHERE id = ?");
  const updateStageById = db.prepare(`UPDATE contacts SET stage = ? WHERE id = ? RETURNING ${COLUMNS}`);
  const setFollowUpById = db.prepare(`UPDATE contacts SET next_follow_up = ? WHERE id = ? RETURNING ${COLUMNS}`);

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
  };
}

// Instance de l'app : la base n'est ouverte qu'au premier appel (pas à l'import).
let appRepo: ContactRepository | undefined;
const repo = () => (appRepo ??= createSqliteContactRepository(getDb()));

export const contactRepository: ContactRepository = {
  create: (input) => repo().create(input),
  listByMostRecent: () => repo().listByMostRecent(),
  findById: (id) => repo().findById(id),
  update: (id, fields) => repo().update(id, fields),
  delete: (id) => repo().delete(id),
  updateStage: (id, stage) => repo().updateStage(id, stage),
  setFollowUp: (id, date) => repo().setFollowUp(id, date),
};
