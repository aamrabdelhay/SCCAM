import { NextRequest } from "next/server";
import { getFile } from "@/lib/queries";
import { getObjectStream } from "@/lib/storage";
import { canOpenFile } from "@/lib/file-access";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  try {
    const file = await getFile(id);
    if (!file || !file.storage_key) return new Response("Stored file not found. Please upload it again.", { status: 404 });
    if (!(await canOpenFile(file))) return new Response("Password required", { status: 401 });

    let range: { start: number; end?: number } | undefined;
    const header = req.headers.get("range");
    if (header) {
      const match = /^bytes=(\d*)-(\d*)$/.exec(header.trim());
      if (match) {
        const start = match[1] ? Number(match[1]) : 0;
        const end = match[2] ? Number(match[2]) : undefined;
        if (!Number.isSafeInteger(start) || (end !== undefined && (!Number.isSafeInteger(end) || end < start))) {
          return new Response("Bad range", { status: 416 });
        }
        range = { start, end };
      }
    }

    const object = await getObjectStream(file.storage_key, range);
    if (!object) return new Response("Stored file not found", { status: 404 });

    const headers = new Headers({
      "Content-Type": file.mime || "application/octet-stream",
      "Accept-Ranges": "bytes",
      "Content-Disposition": "inline",
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    });
    if (object.contentRange) headers.set("Content-Range", object.contentRange);
    if (object.size > 0) headers.set("Content-Length", String(object.size));

    return new Response(object.stream, { status: object.statusCode, headers });
  } catch (err) {
    console.error("[files/stream] request failed", {
      fileId: id,
      error: err instanceof Error ? err.message : String(err),
    });
    return new Response("Unable to read the stored file", { status: 502 });
  }
}
