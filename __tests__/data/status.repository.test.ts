import { describe, expect, it } from "vitest";
import { statusRepository } from "@/data/status.repository";

describe("statusRepository", () => {
  it("renvoie un statut ok", async () => {
    await expect(statusRepository.getStatus()).resolves.toEqual({ ok: true });
  });
});
