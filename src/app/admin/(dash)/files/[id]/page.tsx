import Link from "next/link";
import { notFound } from "next/navigation";
import { getLang } from "@/lib/server-lang";
import { getCategories, getFile, getSections, listFiles } from "@/lib/queries";
import { all } from "@/lib/db";
import { t } from "@/lib/i18n";
import { pickText } from "@/lib/format";
import { FileEditor } from "@/components/admin/FileEditor";

export const dynamic = "force-dynamic";

export default async function AdminEditFile({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const lang = await getLang();
  const file = await getFile(id, true);
  if (!file) notFound();

  const [sections, categories, versions, links, allFiles] = await Promise.all([
    getSections(),
    getCategories(),
    all<{ version: number; created_at: string; changelog: string; page_count: number }>(
      "SELECT version, created_at, changelog, page_count FROM file_versions WHERE file_id = ? ORDER BY version DESC",
      [id],
    ),
    all<{ id: string; target_file_id: string; target_page: number; note: string; target_title: string }>(
      "SELECT l.id, l.target_file_id, l.target_page, l.note, f.title_ar AS target_title FROM clarification_links l JOIN files f ON f.id = l.target_file_id WHERE l.file_id = ?",
      [id],
    ),
    listFiles({ includeHidden: true, limit: 500 }),
  ]);

  const sectionOptions = sections.map((s) => ({
    id: s.id,
    name: pickText(lang, s.name_ar, s.name_en),
    categories: categories.filter((c) => c.section_id === s.id).map((c) => ({ id: c.id, name: pickText(lang, c.name_ar, c.name_en) })),
  }));

  return (
    <div className="space-y-3">
      <Link href="/admin/files" className="text-[11.5px] font-semibold text-[var(--muted)] hover:underline">
        ← {t(lang, "adminFiles")}
      </Link>
      <h2 className="text-[16px] font-extrabold" dir="auto">
        {pickText(lang, file.title_ar, file.title_en)}
      </h2>
      <FileEditor
        lang={lang}
        file={{
          id: file.id,
          title_ar: file.title_ar,
          title_en: file.title_en,
          description_ar: file.description_ar,
          description_en: file.description_en,
          section_id: file.section_id,
          category_id: file.category_id,
          tags: file.tags,
          edition_year: file.edition_year,
          doc_date: file.doc_date,
          importance: file.importance,
          pinned: file.pinned,
          sort_order: file.sort_order,
          visibility: file.visibility,
          publish_at: file.publish_at,
          download_allowed: file.download_allowed,
          print_allowed: file.print_allowed,
          source_note: file.source_note,
          current_version: file.current_version,
          text_status: file.text_status,
          text_error: file.text_error,
          page_count: file.page_count,
          mime: file.mime,
          hasPassword: Boolean(file.file_password_hash),
        }}
        sections={sectionOptions}
        versions={versions}
        clarificationLinks={links}
        allFiles={allFiles.map((f) => ({ id: f.id, title_ar: f.title_ar, title_en: f.title_en }))}
      />
    </div>
  );
}
