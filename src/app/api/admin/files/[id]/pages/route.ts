import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { all } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return new Response("Unauthorized", { status: 401 });
  const { id } = await ctx.params;
  const rows = await all<{ page_no: number; text: string; source: string; edited: number }>(
    "SELECT page_no, text, source, edited FROM pages_text WHERE file_id = ? ORDER BY page_no LIMIT 2000",
    [id],
  );
  return Response.json({
    pages: rows.map((r) => ({ pageNo: r.page_no, text: r.text, source: r.source, edited: r.edited })),
  });
}
