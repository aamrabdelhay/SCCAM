import "server-only";
import { requireAdmin, verifyCsrf, sameOrigin } from "./auth";
import { headers } from "next/headers";

/** Every admin mutation goes through this: session + CSRF + same-origin. */
export async function adminGuard(): Promise<Response | null> {
  const session = await requireAdmin();
  if (!session) return Response.json({ error: "unauthorized" }, { status: 401 });
  if (!(await verifyCsrf())) return Response.json({ error: "csrf" }, { status: 403 });
  const hdrs = await headers();
  if (!sameOrigin(hdrs)) return Response.json({ error: "origin" }, { status: 403 });
  return null;
}

export function clean(value: unknown, max = 500): string {
  if (typeof value !== "string") return "";
  return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "").trim().slice(0, max);
}

export function bool(value: unknown): boolean {
  return value === true || value === "1" || value === "true" || value === "on";
}

export function int(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? Math.trunc(n) : fallback;
}

export const ALLOWED_MIME = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
  "text/plain",
  "text/markdown",
  "image/png",
  "image/jpeg",
  "image/webp",
];

export const MAX_UPLOAD_BYTES = 40 * 1024 * 1024;

export function validateFile(file: File): string | null {
  if (!file || file.size === 0) return "Empty file";
  if (file.size > MAX_UPLOAD_BYTES) return "File too large (max 40 MB)";
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  const okExt = ["pdf", "docx", "txt", "md", "png", "jpg", "jpeg", "webp"].includes(ext);
  const okMime = ALLOWED_MIME.includes(file.type) || file.type === "";
  if (!okExt || !okMime) return `Unsupported file type: ${file.type || ext}`;
  return null;
}
