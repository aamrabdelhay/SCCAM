import { NextRequest } from "next/server";
import { all } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Resolves file ids saved in local storage to titles for the "My library" page. */
export async function GET(req: NextRequest) {
  const ids = (req.nextUrl.searchParams.get("ids") ?? "")
    .split(",")
    .map((x) => x.trim())
    .filter((x) => /^[a-z0-9_]{3,32}$/i.test(x))
    .slice(0, 100);
  if (!ids.length) return Response.json({ files: [] });

  const rows = await all<{ id: string; title_ar: string; title_en: string; section_slug: string; section_name_ar: string; section_name_en: string; section_accent: string; page_count: number }>(
    `SELECT f.id, f.title_ar, f.title_en, f.page_count, s.slug AS section_slug,
            s.name_ar AS section_name_ar, s.name_en AS section_name_en, s.accent AS section_accent
     FROM files f JOIN sections s ON s.id = f.section_id
     WHERE f.id IN (${ids.map(() => "?").join(",")}) AND f.visibility = 'published'`,
    ids,
  );
  return Response.json({ files: rows }, { headers: { "Cache-Control": "private, max-age=120" } });
}
