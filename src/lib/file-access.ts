import "server-only";
import { cookies } from "next/headers";
import { createHmac } from "node:crypto";
import bcrypt from "bcryptjs";
import { one } from "./db";

const TTL_MS = 12 * 60 * 60 * 1000;

async function secret(): Promise<string> {
  if (process.env.AUTH_SECRET) return process.env.AUTH_SECRET;
  const row = await one<{ value: string }>("SELECT value FROM settings WHERE key = 'auth_secret'");
  return row?.value ?? "sccam-dev-secret";
}

export function accessCookieName(fileId: string) {
  return `fa_${fileId.slice(0, 12)}`;
}

export async function issueFileAccess(fileId: string) {
  const exp = Date.now() + TTL_MS;
  const sig = createHmac("sha256", await secret()).update(`${fileId}.${exp}`).digest("base64url");
  const jar = await cookies();
  jar.set(accessCookieName(fileId), `${exp}.${sig}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: Math.floor(TTL_MS / 1000),
  });
}

export async function hasFileAccess(fileId: string): Promise<boolean> {
  const jar = await cookies();
  const raw = jar.get(accessCookieName(fileId))?.value;
  if (!raw) return false;
  const [expStr, sig] = raw.split(".");
  const exp = Number(expStr);
  if (!exp || exp < Date.now()) return false;
  const expected = createHmac("sha256", await secret()).update(`${fileId}.${exp}`).digest("base64url");
  return sig === expected;
}

export async function verifyFilePassword(fileId: string, password: string): Promise<boolean> {
  const row = await one<{ file_password_hash: string | null }>("SELECT file_password_hash FROM files WHERE id = ?", [fileId]);
  if (!row?.file_password_hash) return true;
  return bcrypt.compare(password, row.file_password_hash);
}

export async function canOpenFile(file: { id: string; file_password_hash: string | null }): Promise<boolean> {
  if (!file.file_password_hash) return true;
  return hasFileAccess(file.id);
}
