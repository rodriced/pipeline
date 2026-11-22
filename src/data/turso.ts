// Couche données : connexion à Turso (libSQL). Identifiants lus dans l'environnement (.env.local, Vercel).
// Si TURSO_DATABASE_URL est absente, l'app reste sur SQLite local (src/data/db.ts).
import type { Client } from "@libsql/client";

type Env = Record<string, string | undefined>;

export type RepositoryKind = "turso" | "sqlite";

export const repositoryKind = (env: Env = process.env): RepositoryKind =>
  env.TURSO_DATABASE_URL?.trim() ? "turso" : "sqlite";

export function tursoConfig(env: Env = process.env): { url: string; authToken: string | undefined } {
  const url = env.TURSO_DATABASE_URL?.trim();
  if (!url) throw new Error("TURSO_DATABASE_URL manquante : impossible de se connecter à Turso.");
  return { url, authToken: env.TURSO_AUTH_TOKEN?.trim() || undefined };
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
