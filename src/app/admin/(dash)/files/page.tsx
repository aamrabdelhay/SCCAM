import Link from "next/link";
import { Plus } from "lucide-react";
import { getLang } from "@/lib/server-lang";
import { getCategories, getSections, listFiles } from "@/lib/queries";
import { t } from "@/lib/i18n";
import { pickText } from "@/lib/format";
import { FileListAdmin, type AdminFileRow } from "@/components/admin/FileListAdmin";

export const dynamic = "force-dynamic";

export default async function AdminFilesPage() {
  const lang = await getLang();
  const [sections, categories, files] = await Promise.all([
    getSections(),
    getCategories(),
    listFiles({ includeHidden: true, limit: 1000, sort: "default" }),
  ]);

  const sectionOptions = sections.map((s) => ({
    id: s.id,
    name: pickText(lang, s.name_ar, s.name_en),
    categories: categories
      .filter((c) => c.section_id === s.id)
      .map((c) => ({ id: c.id, name: pickText(lang, c.name_ar, c.name_en) })),
  }));

  const rows: AdminFileRow[] = files.map((f) => ({
    id: f.id,
    title_ar: f.title_ar,
    title_en: f.title_en,
    section_id: f.section_id,
    section_slug: f.section_slug,
    category_id: f.category_id,
    category_name_ar: f.category_name_ar,
    category_name_en: f.category_name_en,
    importance: f.importance,
    pinned: f.pinned,
    visibility: f.visibility,
    sort_order: f.sort_order,
    text_status: f.text_status,
    page_count: f.page_count,
    views: f.views,
    updated_at: f.updated_at,
  }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-[16px] font-extrabold">{t(lang, "adminFiles")}</h2>
        <Link href="/admin/files/new" className="btn btn-primary btn-sm gap-1">
          <Plus className="h-3.5 w-3.5" /> {t(lang, "adminNewFile")}
        </Link>
      </div>
      <FileListAdmin lang={lang} files={rows} sections={sectionOptions} />
    </div>
  );
}
