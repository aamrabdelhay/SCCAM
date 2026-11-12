import { NextRequest } from "next/server";
import { PDFDocument } from "pdf-lib";
import { getFile } from "@/lib/queries";
import { canOpenFile } from "@/lib/file-access";
import { getObjectBuffer } from "@/lib/storage";
import { parsePageRange } from "@/lib/format";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Builds a new PDF containing only the requested pages (page-range tool). */
export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const file = await getFile(id);
  if (!file) return new Response("Not found", { status: 404 });
  if (!(await canOpenFile(file))) return new Response("Password required", { status: 401 });
  if (!file.mime.includes("pdf")) return new Response("Not a PDF", { status: 415 });

  const pages = parsePageRange(req.nextUrl.searchParams.get("pages") ?? "", file.page_count || 5000);
  if (!pages?.length) return new Response("Invalid page range", { status: 400 });

  const buffer = await getObjectBuffer(file.storage_key);
  if (!buffer) return new Response("Not found", { status: 404 });

  const src = await PDFDocument.load(buffer, { ignoreEncryption: true });
  const out = await PDFDocument.create();
  const indices = pages.filter((p) => p <= src.getPageCount()).map((p) => p - 1);
  const copied = await out.copyPages(src, indices);
  for (const page of copied) out.addPage(page);
  out.setTitle(`${file.title_en || file.title_ar} — pages ${pages.join(",")}`);
  const bytes = await out.save();

  const name = `pages-${pages[0]}-${pages[pages.length - 1]}.pdf`;
  return new Response(new Uint8Array(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${name}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
