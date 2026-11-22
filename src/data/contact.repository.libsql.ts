// Couche données : implémentation libSQL (Turso) de ContactRepository.
// Même contrat et mêmes requêtes que l'implémentation SQLite locale (src/data/contact.sql.ts).
// Le schéma est appliqué à la main sur Turso (src/data/schema.sql), pas au démarrage.
import type { Client, Row } from "@libsql/client";
import type { ContactRepository } from "@/data/contact.repository";
import { SQL, toContact, type ContactRow } from "@/data/contact.sql";

const text = (value: unknown) => (value === null || value === undefined ? null : String(value));

const toRow = (row: Row): ContactRow => ({
  id: Number(row.id),
  name: String(row.name),
  stage: String(row.stage),
  created_at: String(row.created_at),
  company: text(row.company),
  email: text(row.email),
  phone: text(row.phone),
  notes: text(row.notes),
  next_follow_up: text(row.next_follow_up),
});

export function createLibsqlContactRepository(db: Client): ContactRepository {
  const first = async (sql: string, args: (string | number | null)[]) => {
    const { rows } = await db.execute({ sql, args });
    return rows[0] ? toContact(toRow(rows[0])) : null;
  };
  const all = async (sql: string, args: (string | number | null)[] = []) =>
    (await db.execute({ sql, args })).rows.map((row) => toContact(toRow(row)));

  return {
    async create({ name, stage, createdAt }) {
      const contact = await first(SQL.insert, [name, stage, createdAt.toISOString()]);
      if (!contact) throw new Error("Insertion d'un contact sans ligne renvoyée.");
      return contact;
    },
    listByMostRecent: () => all(SQL.selectAll),
    findById: (id) => first(SQL.selectById, [id]),
    update: (id, { name, company, email, phone, notes }) => first(SQL.updateById, [name, company, email, phone, notes, id]),
    async delete(id) {
      return (await db.execute({ sql: SQL.deleteById, args: [id] })).rowsAffected > 0;
    },
    updateStage: (id, stage) => first(SQL.updateStageById, [stage, id]),
    setFollowUp: (id, date) => first(SQL.setFollowUpById, [date, id]),
    listWithFollowUpDueBy: (date) => all(SQL.selectDueBy, [date]),
  };
}
