import { NextRequest } from "next/server";
import { getFile, incrementViews } from "@/lib/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const file = await getFile(id);
  if (!file) return new Response("Not found", { status: 404 });
  let page: number | undefined;
  try {
    const body = (await req.json()) as { page?: number };
    page = Number.isInteger(body.page) ? Number(body.page) : undefined;
  } catch {
    /* body optional */
  }
  await incrementViews(id, page);
  return Response.json({ ok: true });
}
