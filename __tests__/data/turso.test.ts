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

describe("URL Turso contrôlée : jeton jamais envoyé sans TLS (#25)", () => {
  const token = { TURSO_AUTH_TOKEN: "jeton" };

  it("accepte les URL chiffrées vers un hôte distant (libsql, https, wss)", () => {
    for (const url of ["libsql://db.turso.io", "https://db.turso.io", "wss://db.turso.io"]) {
      expect(tursoConfig({ TURSO_DATABASE_URL: url, ...token }).url).toBe(url);
    }
  });

  it("refuse une URL non chiffrée vers un hôte distant", () => {
    for (const url of ["http://db.turso.io", "ws://db.turso.io", "libsql://db.turso.io:8080?tls=0"]) {
      expect(() => tursoConfig({ TURSO_DATABASE_URL: url, ...token })).toThrow(/non chiffrée/);
    }
  });

  it("exige un jeton pour un hôte distant", () => {
    expect(() => tursoConfig({ TURSO_DATABASE_URL: "libsql://db.turso.io" })).toThrow(/TURSO_AUTH_TOKEN manquant/);
    expect(() => tursoConfig({ TURSO_DATABASE_URL: "libsql://db.turso.io", TURSO_AUTH_TOKEN: " " })).toThrow(
      /TURSO_AUTH_TOKEN manquant/,
    );
  });

  it("autorise http, ws et l'absence de jeton en local (turso dev)", () => {
    for (const url of ["http://127.0.0.1:8080", "http://localhost:8080", "ws://localhost:8080", "http://[::1]:8080"]) {
      expect(tursoConfig({ TURSO_DATABASE_URL: url }).url).toBe(url);
      expect(tursoConfig({ TURSO_DATABASE_URL: url, ...token }).authToken).toBe("jeton");
    }
  });

  it("refuse une URL invalide ou d'un autre protocole, sans afficher l'URL ni le jeton", () => {
    for (const url of ["db.turso.io", "file:./local.db", "ftp://db.turso.io"]) {
      let message = "";
      try {
        tursoConfig({ TURSO_DATABASE_URL: url, TURSO_AUTH_TOKEN: "secret-jeton" });
      } catch (error) {
        message = (error as Error).message;
      }
      expect(message).toMatch(/TURSO_DATABASE_URL invalide/);
      expect(message).not.toContain(url);
      expect(message).not.toContain("secret-jeton");
    }
  });
});
