import { NextRequest } from "next/server";
import { searchAll, logSearch } from "@/lib/search-query";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const q = (sp.get("q") ?? "").slice(0, 200);
  if (!q.trim()) return Response.json({ results: [], totalFiles: 0, totalPages: 0, interpretation: [] });

  const data = await searchAll(q, {
    section: sp.get("section") ?? undefined,
    category: sp.get("category") ?? undefined,
    importance: sp.get("importance") ?? undefined,
    year: sp.get("year") ?? undefined,
  });
  await logSearch(q, data.totalFiles);

  return Response.json(
    {
      ...data,
      results: data.results.map((r) => ({
        ...r,
        file: {
          id: r.file.id,
          title_ar: r.file.title_ar,
          title_en: r.file.title_en,
          description_ar: r.file.description_ar,
          description_en: r.file.description_en,
          section_slug: r.file.section_slug,
          section_name_ar: r.file.section_name_ar,
          section_name_en: r.file.section_name_en,
          section_accent: r.file.section_accent,
          importance: r.file.importance,
          pinned: r.file.pinned,
          page_count: r.file.page_count,
          mime: r.file.mime,
          updated_at: r.file.updated_at,
          created_at: r.file.created_at,
          edition_year: r.file.edition_year,
        },
      })),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
