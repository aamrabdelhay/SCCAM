import { createClient, type Client, type InValue, type Row } from "@libsql/client";
import { neon } from "@neondatabase/serverless";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { SCHEMA_SQL } from "./schema";

type NeonClient = ReturnType<typeof neon>;

const globalForDb = globalThis as unknown as {
  __sccamClient?: Client;
  __sccamNeon?: NeonClient;
  __sccamSchema?: Promise<void>;
};

function configuredDatabaseUrl(): string | undefined {
  return process.env.DATABASE_URL?.trim() || process.env.POSTGRES_URL?.trim() || undefined;
}

function usesNeon(): boolean {
  return /^postgres(?:ql)?:\/\//i.test(configuredDatabaseUrl() ?? "");
}

function dbUrl(): string {
  const url = configuredDatabaseUrl();
  if (url && !/^postgres(?:ql)?:\/\//i.test(url)) return url;

  // Zero-config local development: a SQLite file next to the project.
  const file = process.env.LOCAL_DB_PATH || "./data/app.db";
  try {
    mkdirSync(dirname(file), { recursive: true });
  } catch {
    /* ignore: serverless deployments use the configured remote database */
  }
  return "file:" + file;
}

/** Convert SQLite-style positional placeholders to PostgreSQL placeholders. */
function postgresSql(statement: string): string {
  let output = "";
  let parameterIndex = 0;
  let singleQuoted = false;
  let doubleQuoted = false;
  let lineComment = false;
  let blockComment = false;

  for (let i = 0; i < statement.length; i++) {
    const char = statement[i];
    const next = statement[i + 1];

    if (lineComment) {
      output += char;
      if (char === "\n") lineComment = false;
      continue;
    }
    if (blockComment) {
      output += char;
      if (char === "*" && next === "/") {
        output += next;
        i++;
        blockComment = false;
      }
      continue;
    }
    if (!singleQuoted && !doubleQuoted && char === "-" && next === "-") {
      output += "--";
      i++;
      lineComment = true;
      continue;
    }
    if (!singleQuoted && !doubleQuoted && char === "/" && next === "*") {
      output += "/*";
      i++;
      blockComment = true;
      continue;
    }
    if (char === "'" && !doubleQuoted) {
      output += char;
      if (singleQuoted && next === "'") {
        output += next;
        i++;
      } else {
        singleQuoted = !singleQuoted;
      }
      continue;
    }
    if (char === '"' && !singleQuoted) {
      output += char;
      doubleQuoted = !doubleQuoted;
      continue;
    }
    if (char === "?" && !singleQuoted && !doubleQuoted) {
      output += "$" + (++parameterIndex);
      continue;
    }
    output += char;
  }
  return output;
}

function postgresSchemaSql(statement: string): string | null {
  if (/^\s*PRAGMA\b/i.test(statement)) return null;
  return statement.replace(
    /\bINTEGER\s+PRIMARY\s+KEY\s+AUTOINCREMENT\b/gi,
    "BIGSERIAL PRIMARY KEY",
  );
}

export function getClient(): Client {
  if (usesNeon()) {
    throw new Error("getClient() is only available for SQLite/libSQL. Use the shared query helpers for Neon.");
  }
  if (!globalForDb.__sccamClient) {
    globalForDb.__sccamClient = createClient({
      url: dbUrl(),
      authToken: process.env.DATABASE_AUTH_TOKEN || undefined,
    });
  }
  return globalForDb.__sccamClient;
}

function getNeonClient(): NeonClient {
  if (!usesNeon()) throw new Error("A PostgreSQL DATABASE_URL is required to use Neon.");
  if (!globalForDb.__sccamNeon) {
    const url = configuredDatabaseUrl();
    if (!url) throw new Error("DATABASE_URL is not configured.");
    globalForDb.__sccamNeon = neon(url);
  }
  return globalForDb.__sccamNeon;
}

async function migrate(): Promise<void> {
  if (usesNeon()) {
    const sql = getNeonClient();
    for (const statement of SCHEMA_SQL) {
      const prepared = postgresSchemaSql(statement);
      if (!prepared) continue;
      try {
        await sql.query(postgresSql(prepared), []);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (!/already exists|duplicate column/i.test(msg)) throw err;
      }
    }
    return;
  }

  const client = getClient();
  for (const statement of SCHEMA_SQL) {
    try {
      await client.execute(statement);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
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
  if (usesNeon()) {
    return (await getNeonClient().query(postgresSql(sql), args)) as unknown as T[];
  }
  const res = await getClient().execute({ sql, args });
  return res.rows as unknown as T[];
}

export async function one<T = Row>(sql: string, args: InValue[] = []): Promise<T | null> {
  const rows = await all<T>(sql, args);
  return rows.length ? rows[0] : null;
}

export async function run(sql: string, args: InValue[] = []) {
  await ensureSchema();
  if (usesNeon()) return getNeonClient().query(postgresSql(sql), args);
  return getClient().execute({ sql, args });
}

export async function batch(statements: { sql: string; args?: InValue[] }[]) {
  await ensureSchema();
  if (!statements.length) return;
  if (usesNeon()) {
    const client = getNeonClient();
    return client.transaction(
      statements.map((statement) =>
        client.query(postgresSql(statement.sql), statement.args ?? []),
      ),
    );
  }
  return getClient().batch(
    statements.map((statement) => ({ sql: statement.sql, args: statement.args ?? [] })),
    "write",
  );
}

export function newId(prefix = ""): string {
  const bytes = new Uint8Array(9);
  crypto.getRandomValues(bytes);
  const id = Array.from(bytes, (b) => b.toString(36).padStart(2, "0")).join("").slice(0, 14);
  return prefix ? prefix + "_" + id : id;
}

export function nowIso(): string {
  return new Date().toISOString();
}
