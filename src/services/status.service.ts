// Couche service : règles métier. Ne parle jamais à la base directement,
// le repository est injecté pour pouvoir être remplacé (tests, autre base).
import { statusRepository, type StatusRepository } from "@/data/status.repository";

export type AppStatus = "up" | "down";

export function createStatusService(repo: StatusRepository) {
  return {
    async getAppStatus(): Promise<AppStatus> {
      const { ok } = await repo.getStatus();
      return ok ? "up" : "down";
    },
  };
}

// Instance câblée sur l'implémentation réelle, utilisée par la présentation
// (qui n'a pas le droit d'importer la couche données).
export const statusService = createStatusService(statusRepository);
