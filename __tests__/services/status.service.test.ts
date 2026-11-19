import { describe, expect, it } from "vitest";
import type { StatusRepository } from "@/data/status.repository";
import { createStatusService } from "@/services/status.service";

const fakeRepo = (ok: boolean): StatusRepository => ({
  getStatus: async () => ({ ok }),
});

describe("createStatusService", () => {
  it("renvoie up quand le repository est ok", async () => {
    await expect(createStatusService(fakeRepo(true)).getAppStatus()).resolves.toBe("up");
  });

  it("renvoie down sinon", async () => {
    await expect(createStatusService(fakeRepo(false)).getAppStatus()).resolves.toBe("down");
  });
});
