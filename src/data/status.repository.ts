// Couche données : seul endroit autorisé à parler à la base.
// L'interface est le contrat stable ; seule l'implémentation change (SQLite → Turso).

export interface StatusRepository {
  getStatus(): Promise<{ ok: boolean }>;
}

export const statusRepository: StatusRepository = {
  async getStatus() {
    return { ok: true };
  },
};
