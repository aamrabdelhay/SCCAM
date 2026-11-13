import { NextRequest } from "next/server";
import { getFile, logEvent } from "@/lib/queries";
import { run } from "@/lib/db";
import { canOpenFile } from "@/lib/file-access";
import { getObjectStream } from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  try {
    const file = await getFile(id);
    if (!file || !file.storage_key) return new Response("Not found", { status: 404 });
    if (!file.download_allowed) return new Response("Download not permitted", { status: 403 });
    if (!(await canOpenFile(file))) return new Response("Password required", { status: 401 });

    const object = await getObjectStream(file.storage_key);
    if (!object) return new Response("Stored file not found", { status: 404 });

    const pathname = /^https?:\/\//i.test(file.storage_key)
      ? new URL(file.storage_key).pathname
      : file.storage_key;
    const storedName = pathname.split("/").pop() || "document.pdf";
    const ext = storedName.includes(".") ? storedName.split(".").pop() || "pdf" : "pdf";
    const safeName = (file.title_en || file.title_ar || "document")
      .replace(/[^\p{L}\p{N}\-_. ]/gu, "")
      .slice(0, 70)
      .trim() || "document";

    await run("UPDATE files SET downloads = downloads + 1 WHERE id = ?", [id]);
    await logEvent("download", { fileId: id });

    const headers = new Headers({
      "Content-Type": file.mime || "application/octet-stream",
      "Content-Disposition": "attachment; filename=\"" + encodeURIComponent(safeName) + "." + ext +
        "\"; filename*=UTF-8''" + encodeURIComponent(safeName) + "." + ext,
      "Cache-Control": "private, max-age=0, no-store",
      "Accept-Ranges": "bytes",
    });
    if (object.size) headers.set("Content-Length", String(object.size));
    return new Response(object.stream, { status: 200, headers });
  } catch (err) {
    console.error("[files/download] request failed", err);
    return new Response("Unable to download the stored file", { status: 502 });
  }
}
