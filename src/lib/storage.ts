/**
 * File storage abstraction.
 *  - default: local disk (`data/uploads`) — zero-config local dev / self-host
 *  - production: Vercel Blob (private store) when BLOB_READ_WRITE_TOKEN is set
 *
 * Files are always served through /api/files/[id]/stream so that password
 * protection, visibility rules and byte-range requests are enforced server side.
 */
import { createReadStream, promises as fsp, existsSync } from "node:fs";
import { dirname, join, normalize } from "node:path";
import { Readable } from "node:stream";

const LOCAL_ROOT = process.env.LOCAL_UPLOAD_DIR || "./data/uploads";

function useBlob(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

function safeKey(key: string): string {
  const clean = normalize(key).replace(/^(\.\.[/\\])+/, "").replace(/^[/\\]+/, "");
  if (clean.includes("..")) throw new Error("Invalid storage key");
  return clean;
}

function localPath(key: string): string {
  return join(LOCAL_ROOT, safeKey(key));
}

export async function putObject(
  key: string,
  data: Uint8Array,
  contentType: string,
): Promise<string> {
  if (useBlob()) {
    const res = await fetch(`https://blob.vercel-storage.com/${encodeURIComponent(key)}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}`,
        "x-api-version": "7",
        "x-content-type": contentType,
        "x-vercel-blob-access": "private",
        "x-add-random-suffix": "0",
      },
      body: data as unknown as BodyInit,
    });
    if (!res.ok) throw new Error(`Blob upload failed: ${res.status} ${await res.text()}`);
    const json = (await res.json()) as { url: string };
    return json.url; // absolute URL becomes the storage key
  }
  const p = localPath(key);
  await fsp.mkdir(dirname(p), { recursive: true });
  await fsp.writeFile(p, data);
  return key;
}

export async function getObjectSize(key: string): Promise<number> {
  if (/^https?:\/\//.test(key)) return 0;
  const stat = await fsp.stat(localPath(key));
  return stat.size;
}

/** Byte-range aware stream. Returns a Web ReadableStream plus total size. */
export async function getObjectStream(
  key: string,
  range?: { start: number; end?: number },
): Promise<{ stream: ReadableStream<Uint8Array>; size: number } | null> {
  if (/^https?:\/\//.test(key)) {
    const headers: Record<string, string> = {};
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      headers.Authorization = `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}`;
    }
    if (range) headers.Range = `bytes=${range.start}-${range.end ?? ""}`;
    const res = await fetch(key, { headers });
    if (!res.ok) return null;
    const size = Number(res.headers.get("content-length") ?? 0);
    return { stream: res.body as ReadableStream<Uint8Array>, size };
  }
  const p = localPath(key);
  if (!existsSync(p)) return null;
  const stat = await fsp.stat(p);
  const start = range?.start ?? 0;
  const end = Math.min(range?.end ?? stat.size - 1, stat.size - 1);
  const nodeStream = createReadStream(p, { start, end });
  return { stream: Readable.toWeb(nodeStream) as ReadableStream<Uint8Array>, size: stat.size };
}

export async function getObjectBuffer(key: string): Promise<Buffer | null> {
  if (/^https?:\/\//.test(key)) {
    const headers: Record<string, string> = {};
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      headers.Authorization = `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}`;
    }
    const res = await fetch(key, { headers });
    if (!res.ok) return null;
    return Buffer.from(await res.arrayBuffer());
  }
  try {
    return await fsp.readFile(localPath(key));
  } catch {
    return null;
  }
}

export async function deleteObject(key: string): Promise<void> {
  if (/^https?:\/\//.test(key)) {
    if (!process.env.BLOB_READ_WRITE_TOKEN) return;
    await fetch(key, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}` },
    });
    return;
  }
  try {
    await fsp.unlink(localPath(key));
  } catch {
    /* already gone */
  }
}

export function buildStorageKey(fileId: string, version: number, ext: string): string {
  return `files/${fileId}/v${version}.${ext.toLowerCase().replace(/^\./, "")}`;
}
