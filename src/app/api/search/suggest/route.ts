import { NextRequest } from "next/server";
import { suggest } from "@/lib/search-query";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("q") ?? "").slice(0, 80);
  if (!q.trim()) return Response.json({ terms: [], files: [] });
  const data = await suggest(q, 8);
  return Response.json(data, { headers: { "Cache-Control": "private, max-age=30" } });
}
