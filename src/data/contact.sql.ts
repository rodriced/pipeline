// Couche données : SQL et conversion des lignes, partagés par les implémentations SQLite (local) et libSQL (Turso).
// Les deux parlent le même dialecte SQLite : une seule source pour les requêtes évite qu'elles divergent.
import type { Contact, Stage } from "@/data/contact.repository";

export type ContactRow = {
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

export const SQL = {
  insert: `INSERT INTO contacts (name, stage, created_at) VALUES (?, ?, ?) RETURNING ${COLUMNS}`,
  selectAll: `SELECT ${COLUMNS} FROM contacts ORDER BY created_at DESC, id DESC`,
  selectById: `SELECT ${COLUMNS} FROM contacts WHERE id = ?`,
  updateById: `UPDATE contacts SET name = ?, company = ?, email = ?, phone = ?, notes = ? WHERE id = ? RETURNING ${COLUMNS}`,
  deleteById: "DELETE FROM contacts WHERE id = ?",
  updateStageById: `UPDATE contacts SET stage = ? WHERE id = ? RETURNING ${COLUMNS}`,
  setFollowUpById: `UPDATE contacts SET next_follow_up = ? WHERE id = ? RETURNING ${COLUMNS}`,
  selectDueBy: `SELECT ${COLUMNS} FROM contacts WHERE next_follow_up IS NOT NULL AND next_follow_up <= ? ORDER BY next_follow_up, id`,
} as const;

/** Ligne de la base → objet du domaine (rien du pilote ne sort de la couche données). */
export const toContact = (row: ContactRow): Contact => ({
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
