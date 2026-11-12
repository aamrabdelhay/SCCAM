import "server-only";
import { cookies, headers } from "next/headers";
import { createHmac, timingSafeEqual, randomBytes, createHash } from "node:crypto";
import bcrypt from "bcryptjs";
import { all, one, run, newId, nowIso } from "./db";

export const SESSION_COOKIE = "sccam_admin";
export const CSRF_COOKIE = "sccam_csrf";
const SESSION_TTL_SECONDS = 60 * 60 * 8; // 8 hours
const BCRYPT_ROUNDS = 11;

type SessionPayload = { sub: string; iat: number; exp: number };

async function secret(): Promise<string> {
  if (process.env.AUTH_SECRET && process.env.AUTH_SECRET.length >= 16) return process.env.AUTH_SECRET;
  const existing = await one<{ value: string }>("SELECT value FROM settings WHERE key = 'auth_secret'");
  if (existing?.value) return existing.value;
  const generated = randomBytes(32).toString("hex");
  await run("INSERT INTO settings (key, value) VALUES ('auth_secret', ?) ON CONFLICT (key) DO NOTHING", [generated]);
  const stored = await one<{ value: string }>("SELECT value FROM settings WHERE key = 'auth_secret'");
  return stored?.value ?? generated;
}

function sign(data: string, key: string): string {
  return createHmac("sha256", key).update(data).digest("base64url");
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function adminExists(): Promise<boolean> {
  const row = await one<{ c: number }>("SELECT COUNT(*) AS c FROM admin_users");
  return Number(row?.c ?? 0) > 0;
}

export async function createAdmin(username: string, password: string) {
  const key = await secret();
  void key;
  const id = newId("adm");
  const hash = await hashPassword(password);
  await run(
    "INSERT INTO admin_users (id, username, password_hash, created_at, updated_at) VALUES (?,?,?,?,?)",
    [id, username.toLowerCase().slice(0, 64), hash, nowIso(), nowIso()],
  );
  return id;
}

export async function updateAdminPassword(id: string, password: string) {
  const hash = await hashPassword(password);
  await run("UPDATE admin_users SET password_hash = ?, updated_at = ? WHERE id = ?", [hash, nowIso(), id]);
}

export async function getAdminByUsername(username: string) {
  return one<{ id: string; username: string; password_hash: string }>(
    "SELECT id, username, password_hash FROM admin_users WHERE username = ?",
    [username.toLowerCase()],
  );
}

export async function createSession(adminId: string) {
  const exp = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  const payload: SessionPayload = { sub: adminId, iat: Math.floor(Date.now() / 1000), exp };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const token = `${body}.${sign(body, await secret())}`;
  const csrf = randomBytes(24).toString("base64url");
  const jar = await cookies();
  const secure = process.env.NODE_ENV === "production";
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
  jar.set(CSRF_COOKIE, csrf, {
    httpOnly: false,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
  return { csrf };
}

export async function destroySession() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
  jar.delete(CSRF_COOKIE);
}

export async function getSession(): Promise<{ sub: string } | null> {
  const jar = await cookies();
  const raw = jar.get(SESSION_COOKIE)?.value;
  if (!raw) return null;
  const [body, sig] = raw.split(".");
  if (!body || !sig) return null;
  const expected = sign(body, await secret());
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as SessionPayload;
    if (!payload.exp || payload.exp * 1000 < Date.now()) return null;
    const exists = await one<{ id: string }>("SELECT id FROM admin_users WHERE id = ?", [payload.sub]);
    return exists ? { sub: payload.sub } : null;
  } catch {
    return null;
  }
}

/** Server-side guard for every /admin page and /api/admin route. */
export async function requireAdmin(): Promise<{ sub: string } | null> {
  return getSession();
}

export async function verifyCsrf(): Promise<boolean> {
  const jar = await cookies();
  const hdrs = await headers();
  const header = hdrs.get("x-csrf-token");
  const cookie = jar.get(CSRF_COOKIE)?.value;
  if (!header || !cookie || header !== cookie) return false;
  return sameOrigin(hdrs);
}

export function sameOrigin(hdrs: Headers): boolean {
  const origin = hdrs.get("origin");
  if (!origin) return true; // same-origin form posts may omit Origin
  const host = hdrs.get("host");
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

/** CSRF check that also accepts `csrf` inside multipart/form-data. */
export async function verifyCsrfOrForm(formCsrf?: string | null): Promise<boolean> {
  const jar = await cookies();
  const hdrs = await headers();
  const cookie = jar.get(CSRF_COOKIE)?.value;
  const header = hdrs.get("x-csrf-token") ?? formCsrf ?? null;
  if (!cookie || !header || cookie !== header) return false;
  return sameOrigin(hdrs);
}

export function clientIpHash(hdrs: Headers): string {
  const ip =
    hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    hdrs.get("x-real-ip") ||
    hdrs.get("cf-connecting-ip") ||
    "local";
  return createHash("sha256").update(`${ip}|${process.env.AUTH_SECRET ?? "sccam"}`).digest("hex").slice(0, 32);
}

export async function rateLimit(ipHash: string, max = 8, windowMinutes = 15): Promise<{ allowed: boolean; retryIn: number }> {
  const since = new Date(Date.now() - windowMinutes * 60_000).toISOString();
  const row = await one<{ c: number }>(
    "SELECT COUNT(*) AS c FROM login_attempts WHERE ip_hash = ? AND ok = 0 AND created_at >= ?",
    [ipHash, since],
  );
  const fails = Number(row?.c ?? 0);
  if (fails < max) return { allowed: true, retryIn: 0 };
  const oldest = await one<{ created_at: string }>(
    "SELECT created_at FROM login_attempts WHERE ip_hash = ? AND ok = 0 AND created_at >= ? ORDER BY created_at ASC LIMIT 1",
    [ipHash, since],
  );
  const unlock = oldest ? new Date(new Date(oldest.created_at).getTime() + windowMinutes * 60_000) : new Date();
  return { allowed: false, retryIn: Math.max(1, Math.ceil((unlock.getTime() - Date.now()) / 1000)) };
}

export async function recordLoginAttempt(ipHash: string, ok: boolean) {
  await run("INSERT INTO login_attempts (ip_hash, ok, created_at) VALUES (?,?,?)", [ipHash, ok ? 1 : 0, nowIso()]);
  await run("DELETE FROM login_attempts WHERE created_at < ?", [new Date(Date.now() - 7 * 86400_000).toISOString()]);
}

export async function pruneAttempts() {
  await all("SELECT 1");
}
