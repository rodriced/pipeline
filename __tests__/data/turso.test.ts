import { describe, expect, it } from "vitest";
import { repositoryKind, tursoConfig } from "@/data/turso";

describe("Choix de la base selon la configuration", () => {
  it("sans TURSO_DATABASE_URL : SQLite local", () => {
    expect(repositoryKind({})).toBe("sqlite");
    expect(repositoryKind({ TURSO_DATABASE_URL: "" })).toBe("sqlite");
    expect(repositoryKind({ TURSO_DATABASE_URL: "   " })).toBe("sqlite");
  });

  it("avec TURSO_DATABASE_URL : Turso", () => {
    expect(repositoryKind({ TURSO_DATABASE_URL: "libsql://pipeline-exemple.turso.io" })).toBe("turso");
  });

  it("lit l'URL et le jeton depuis l'environnement (jeton facultatif, ex. turso dev en local)", () => {
    expect(tursoConfig({ TURSO_DATABASE_URL: " libsql://db.turso.io ", TURSO_AUTH_TOKEN: "jeton" })).toEqual({
      url: "libsql://db.turso.io",
      authToken: "jeton",
    });
    expect(tursoConfig({ TURSO_DATABASE_URL: "http://127.0.0.1:8080" })).toEqual({
      url: "http://127.0.0.1:8080",
      authToken: undefined,
    });
  });

  it("refuse de démarrer sur Turso sans URL", () => {
    expect(() => tursoConfig({})).toThrow(/TURSO_DATABASE_URL/);
  });
});

describe("Sur Vercel, pas de repli silencieux sur SQLite (#26)", () => {
  it("sans TURSO_DATABASE_URL : erreur explicite au lieu de SQLite", () => {
    expect(() => repositoryKind({ VERCEL: "1" })).toThrow(/TURSO_DATABASE_URL manquante/);
    expect(() => repositoryKind({ VERCEL: "1", TURSO_DATABASE_URL: "  " })).toThrow(/TURSO_DATABASE_URL manquante/);
  });

  it("avec TURSO_DATABASE_URL : Turso", () => {
    expect(repositoryKind({ VERCEL: "1", TURSO_DATABASE_URL: "libsql://pipeline-exemple.turso.io" })).toBe("turso");
  });

  it("hors Vercel, SQLite local reste le défaut", () => {
    expect(repositoryKind({ VERCEL: "" })).toBe("sqlite");
  });
});
