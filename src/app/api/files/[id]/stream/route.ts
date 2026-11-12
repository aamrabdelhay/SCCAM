import { NextRequest } from "next/server";
import { getFile } from "@/lib/queries";
import { getObjectStream } from "@/lib/storage";
import { canOpenFile } from "@/lib/file-access";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Streams the stored file with HTTP byte-range support so pdf.js can render
 * page 1 without downloading the whole document.
 */
export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const file = await getFile(id);
  if (!file) return new Response("Not found", { status: 404 });

  if (!(await canOpenFile(file))) {
    return new Response("Password required", { status: 401 });
  }

  const rangeHeader = req.headers.get("range");
  let range: { start: number; end?: number } | undefined;
  if (rangeHeader) {
    const m = /^bytes=(\d*)-(\d*)$/.exec(rangeHeader.trim());
    if (m) {
      const start = m[1] ? Number(m[1]) : 0;
      const end = m[2] ? Number(m[2]) : undefined;
      if (end !== undefined && end < start) {
        return new Response("Bad range", { status: 416 });
      }
      range = { start, end };
    }
  }

  const obj = await getObjectStream(file.storage_key, range);
  if (!obj) return new Response("Not found", { status: 404 });

  const total = file.size_bytes || obj.size;
  const headers = new Headers({
    "Content-Type": file.mime || "application/octet-stream",
    "Accept-Ranges": "bytes",
    "Content-Disposition": "inline",
    "Cache-Control": "private, max-age=0, must-revalidate",
    "X-Content-Type-Options": "nosniff",
  });

  if (range) {
    const start = range.start;
    const end = range.end ?? (total ? total - 1 : undefined);
    headers.set("Content-Range", `bytes ${start}-${end ?? "*"}/${total || "*"}`);
    if (end !== undefined) headers.set("Content-Length", String(end - start + 1));
    return new Response(obj.stream, { status: 206, headers });
  }

  if (total) headers.set("Content-Length", String(total));
  return new Response(obj.stream, { status: 200, headers });
}
