// Couche données : seul endroit autorisé à parler à la base.
// L'interface ContactRepository est le contrat stable ; seule l'implémentation change.
import { getDb, type Database } from "@/data/db";

export type Stage = "new" | "contacted" | "meeting" | "won" | "lost";

export type Contact = {
  id: number;
  name: string;
  stage: Stage;
  createdAt: Date;
};

export type NewContact = Omit<Contact, "id">;

export interface ContactRepository {
  create(input: NewContact): Promise<Contact>;
  listByMostRecent(): Promise<Contact[]>;
}

type ContactRow = { id: number; name: string; stage: string; created_at: string };

const toContact = (row: ContactRow): Contact => ({
  id: Number(row.id),
  name: row.name,
  stage: row.stage as Stage,
  createdAt: new Date(row.created_at),
});

export function createSqliteContactRepository(db: Database): ContactRepository {
  const insert = db.prepare(
    "INSERT INTO contacts (name, stage, created_at) VALUES (?, ?, ?) RETURNING id, name, stage, created_at",
  );
  const selectAll = db.prepare(
    "SELECT id, name, stage, created_at FROM contacts ORDER BY created_at DESC, id DESC",
  );

  return {
    async create({ name, stage, createdAt }) {
      return toContact(insert.get(name, stage, createdAt.toISOString()) as ContactRow);
    },
    async listByMostRecent() {
      return (selectAll.all() as ContactRow[]).map(toContact);
    },
  };
}

// Instance de l'app : la base n'est ouverte qu'au premier appel (pas à l'import).
let appRepo: ContactRepository | undefined;
const repo = () => (appRepo ??= createSqliteContactRepository(getDb()));

export const contactRepository: ContactRepository = {
  create: (input) => repo().create(input),
  listByMostRecent: () => repo().listByMostRecent(),
};
