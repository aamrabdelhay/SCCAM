import { createClient, type Client, type InValue, type Row } from "@libsql/client";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { SCHEMA_SQL } from "./schema";

const globalForDb = globalThis as unknown as {
  __sccamClient?: Client;
  __sccamSchema?: Promise<void>;
};

function dbUrl(): string {
  const url = process.env.DATABASE_URL?.trim();
  if (url && url.length > 0) return url;
  // Zero-config local development: a SQLite file next to the project.
  const file = process.env.LOCAL_DB_PATH || "./data/app.db";
  try {
    mkdirSync(dirname(file), { recursive: true });
  } catch {
    /* ignore */
  }
  return `file:${file}`;
}

export function getClient(): Client {
  if (!globalForDb.__sccamClient) {
    globalForDb.__sccamClient = createClient({
      url: dbUrl(),
      authToken: process.env.DATABASE_AUTH_TOKEN || undefined,
    });
  }
  return globalForDb.__sccamClient;
}

async function migrate(): Promise<void> {
  const client = getClient();
  for (const sql of SCHEMA_SQL) {
    try {
      await client.execute(sql);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      // Ignore "duplicate column" style drift on older local databases.
      if (!/already exists|duplicate column/i.test(msg)) throw err;
    }
  }
}

/** Runs schema migration once per process before any query. */
export function ensureSchema(): Promise<void> {
  if (!globalForDb.__sccamSchema) globalForDb.__sccamSchema = migrate();
  return globalForDb.__sccamSchema;
}

export async function all<T = Row>(sql: string, args: InValue[] = []): Promise<T[]> {
  await ensureSchema();
  const res = await getClient().execute({ sql, args });
  return res.rows as unknown as T[];
}

export async function one<T = Row>(sql: string, args: InValue[] = []): Promise<T | null> {
  const rows = await all<T>(sql, args);
  return rows.length ? rows[0] : null;
}

export async function run(sql: string, args: InValue[] = []) {
  await ensureSchema();
  return getClient().execute({ sql, args });
}

export async function batch(statements: { sql: string; args?: InValue[] }[]) {
  await ensureSchema();
  if (!statements.length) return;
  return getClient().batch(
    statements.map((s) => ({ sql: s.sql, args: s.args ?? [] })),
    "write",
  );
}

export function newId(prefix = ""): string {
  const bytes = new Uint8Array(9);
  crypto.getRandomValues(bytes);
  const id = Array.from(bytes, (b) => b.toString(36).padStart(2, "0")).join("").slice(0, 14);
  return prefix ? `${prefix}_${id}` : id;
}

export function nowIso(): string {
  return new Date().toISOString();
}
