import { NextRequest } from "next/server";
import { getFile, getPagesText } from "@/lib/queries";
import { canOpenFile } from "@/lib/file-access";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const file = await getFile(id);
  if (!file) return new Response("Not found", { status: 404 });
  if (!(await canOpenFile(file))) return new Response("Password required", { status: 401 });

  const pagesParam = req.nextUrl.searchParams.get("pages");
  let pages: number[] | undefined;
  if (pagesParam) {
    pages = pagesParam
      .split(",")
      .map((x) => Number(x))
      .filter((n) => Number.isInteger(n) && n > 0 && n <= Math.max(file.page_count, 1))
      .slice(0, 400);
    if (!pages.length) return Response.json({ pages: [] });
  }

  const rows = await getPagesText(id, pages);
  return Response.json(
    { pages: rows.map((r) => ({ pageNo: r.page_no, text: r.text, source: r.source })) },
    { headers: { "Cache-Control": "private, max-age=60" } },
  );
}
