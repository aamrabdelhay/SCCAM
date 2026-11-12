import { NextRequest } from "next/server";
import { getFile, logEvent } from "@/lib/queries";
import { run } from "@/lib/db";
import { canOpenFile } from "@/lib/file-access";
import { getObjectStream } from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const file = await getFile(id);
  if (!file) return new Response("Not found", { status: 404 });
  if (!file.download_allowed) return new Response("Download not permitted", { status: 403 });
  if (!(await canOpenFile(file))) return new Response("Password required", { status: 401 });

  const obj = await getObjectStream(file.storage_key);
  if (!obj) return new Response("Not found", { status: 404 });

  const ext = file.storage_key.split(".").pop() || "pdf";
  const safeName = (file.title_en || file.title_ar || "document").replace(/[^\p{L}\p{N}\-_. ]/gu, "").slice(0, 70).trim() || "document";
  await run("UPDATE files SET downloads = downloads + 1 WHERE id = ?", [id]);
  await logEvent("download", { fileId: id });

  const headers = new Headers({
    "Content-Type": file.mime || "application/octet-stream",
    "Content-Disposition": `attachment; filename="${encodeURIComponent(safeName)}.${ext}"; filename*=UTF-8''${encodeURIComponent(safeName)}.${ext}`,
    "Cache-Control": "private, max-age=0, no-store",
    "Accept-Ranges": "bytes",
  });
  if (file.size_bytes) headers.set("Content-Length", String(file.size_bytes));
  return new Response(obj.stream, { status: 200, headers });
}
