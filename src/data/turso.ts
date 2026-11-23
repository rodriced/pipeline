// Couche données : connexion à Turso (libSQL). Identifiants lus dans l'environnement (.env.local, Vercel).
// Si TURSO_DATABASE_URL est absente, l'app reste sur SQLite local (src/data/db.ts),
// sauf sur Vercel (système de fichiers en lecture seule) : erreur explicite plutôt qu'un repli silencieux.
import type { Client } from "@libsql/client";

type Env = Record<string, string | undefined>;

export type RepositoryKind = "turso" | "sqlite";

export function repositoryKind(env: Env = process.env): RepositoryKind {
  if (env.TURSO_DATABASE_URL?.trim()) return "turso";
  if (env.VERCEL) {
    throw new Error(
      "TURSO_DATABASE_URL manquante : sur Vercel, SQLite local est impossible. Définir TURSO_DATABASE_URL et TURSO_AUTH_TOKEN dans les variables d'environnement du projet.",
    );
  }
  return "sqlite";
}

const PROTOCOLS = new Set(["libsql:", "https:", "wss:", "http:", "ws:"]);
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);

/**
 * URL et jeton Turso, contrôlés : vers un hôte distant, la connexion doit être chiffrée et le jeton présent.
 * http/ws et l'absence de jeton ne sont admis qu'en local (turso dev). Les messages n'affichent ni l'URL ni le jeton.
 */
export function tursoConfig(env: Env = process.env): { url: string; authToken: string | undefined } {
  const url = env.TURSO_DATABASE_URL?.trim();
  if (!url) throw new Error("TURSO_DATABASE_URL manquante : impossible de se connecter à Turso.");
  const authToken = env.TURSO_AUTH_TOKEN?.trim() || undefined;

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error("TURSO_DATABASE_URL invalide : attendu libsql://<base>-<organisation>.turso.io.");
  }
  if (!PROTOCOLS.has(parsed.protocol)) {
    throw new Error("TURSO_DATABASE_URL invalide : protocoles admis libsql, https, wss (http, ws en local).");
  }

  if (!LOCAL_HOSTS.has(parsed.hostname)) {
    const unencrypted =
      parsed.protocol === "http:" ||
      parsed.protocol === "ws:" ||
      (parsed.protocol === "libsql:" && parsed.searchParams.get("tls") === "0");
    if (unencrypted) {
      throw new Error("TURSO_DATABASE_URL non chiffrée : utiliser libsql://, https:// ou wss:// pour un hôte distant.");
    }
    if (!authToken) throw new Error("TURSO_AUTH_TOKEN manquant : obligatoire pour une base Turso distante.");
  }
  return { url, authToken };
}

let client: Client | undefined;

/** Client Turso, créé au premier usage. Client « web » (HTTP) : sans module natif, adapté à Vercel. */
export async function getTursoClient(): Promise<Client> {
  if (!client) {
    const { createClient } = await import("@libsql/client/web");
    client = createClient(tursoConfig());
  }
  return client;
}
