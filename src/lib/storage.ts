/**
 * Persistent file storage abstraction.
 * Production uses the connected private Vercel Blob store through Vercel OIDC.
 * Local disk is only permitted outside Vercel for local development.
 *
 * Private files are delivered through /api/files/[id]/stream so that access,
 * download, print and byte-range rules remain enforced by this application.
 */
import { del as deleteBlob, get as getBlob, head as headBlob, put as putBlob } from "@vercel/blob";
import { createReadStream, promises as fsp, existsSync } from "node:fs";
import { dirname, join, normalize } from "node:path";
import { Readable } from "node:stream";

const LOCAL_ROOT = process.env.LOCAL_UPLOAD_DIR || "./data/uploads";

function useBlob(): boolean {
  return Boolean(process.env.BLOB_STORE_ID?.trim() || process.env.BLOB_READ_WRITE_TOKEN?.trim());
}

function assertStorageBackend(): "blob" | "local" {
  if (useBlob()) return "blob";
  if (process.env.VERCEL) {
    throw new Error("Persistent Vercel Blob storage is not connected to this deployment.");
  }
  return "local";
}

function safeKey(key: string): string {
  const clean = normalize(key).replace(/^(\.\.[/\\])+/, "").replace(/^[/\\]+/, "");
  if (clean.includes("..")) throw new Error("Invalid storage key");
  return clean;
}

function localPath(key: string): string {
  return join(LOCAL_ROOT, safeKey(key));
}

export type StoredObjectStream = {
  stream: ReadableStream<Uint8Array>;
  size: number;
  totalSize: number;
  statusCode: 200 | 206;
  contentRange?: string;
};

export async function putObject(key: string, data: Uint8Array, contentType: string): Promise<string> {
  if (assertStorageBackend() === "blob") {
    const blob = await putBlob(key, Buffer.from(data), {
      access: "private",
      contentType,
      addRandomSuffix: false,
      allowOverwrite: true,
    });
    // Persist the canonical private URL, not the temporary pathname.
    return blob.url;
  }

  const path = localPath(key);
  await fsp.mkdir(dirname(path), { recursive: true });
  await fsp.writeFile(path, data);
  return key;
}

export async function getObjectSize(key: string): Promise<number> {
  if (!key) return 0;
  if (assertStorageBackend() === "blob") {
    const result = await headBlob(key);
    return result.size;
  }
  const stat = await fsp.stat(localPath(key));
  return stat.size;
}

export async function getObjectStream(
  key: string,
  range?: { start: number; end?: number },
): Promise<StoredObjectStream | null> {
  if (!key) return null;

  if (assertStorageBackend() === "blob") {
    const requestHeaders: Record<string, string> = {};
    if (range) requestHeaders.Range = "bytes=" + range.start + "-" + (range.end ?? "");
    const result = await getBlob(key, { access: "private", headers: requestHeaders });
    if (!result || result.statusCode !== 200) return null;

    const contentRange = result.headers.get("content-range") ?? undefined;
    const match = contentRange ? /^bytes (\d+)-(\d+)\/(\d+)$/.exec(contentRange) : null;
    const contentLength = Number(result.headers.get("content-length") ?? result.blob.size ?? 0);

    return {
      stream: result.stream,
      size: contentLength,
      totalSize: match ? Number(match[3]) : result.blob.size,
      statusCode: match ? 206 : 200,
      contentRange,
    };
  }

  const path = localPath(key);
  if (!existsSync(path)) return null;
  const stat = await fsp.stat(path);
  if (range && range.start >= stat.size) return null;

  const start = range?.start ?? 0;
  const end = Math.min(range?.end ?? stat.size - 1, stat.size - 1);
  const nodeStream = createReadStream(path, { start, end });
  return {
    stream: Readable.toWeb(nodeStream) as ReadableStream<Uint8Array>,
    size: Math.max(0, end - start + 1),
    totalSize: stat.size,
    statusCode: range ? 206 : 200,
    contentRange: range ? "bytes " + start + "-" + end + "/" + stat.size : undefined,
  };
}

export async function getObjectBuffer(key: string): Promise<Buffer | null> {
  if (!key) return null;

  if (assertStorageBackend() === "blob") {
    const result = await getBlob(key, { access: "private" });
    if (!result || result.statusCode !== 200) return null;
    return Buffer.from(await new Response(result.stream).arrayBuffer());
  }

  try {
    return await fsp.readFile(localPath(key));
  } catch {
    return null;
  }
}

export async function deleteObject(key: string): Promise<void> {
  if (!key) return;
  if (assertStorageBackend() === "blob") {
    await deleteBlob(key);
    return;
  }
  try {
    await fsp.unlink(localPath(key));
  } catch {
    /* already gone */
  }
}

export function buildStorageKey(fileId: string, version: number, ext: string): string {
  return "files/" + fileId + "/v" + version + "." + ext.toLowerCase().replace(/^\./, "");
}
