import { all, batch, one, run, newId, nowIso } from "./db";
import type {
  CategoryRow,
  ChangelogRow,
  DeadlineRow,
  FaqRow,
  FileRow,
  FileWithMeta,
  NewsRow,
  PageTextRow,
  SectionRow,
  SettingsMap,
  SortKey,
} from "./types";

const FILE_SELECT = `
  SELECT f.*, s.slug AS section_slug, s.name_ar AS section_name_ar, s.name_en AS section_name_en,
         s.accent AS section_accent,
         c.slug AS category_slug, c.name_ar AS category_name_ar, c.name_en AS category_name_en
  FROM files f
  JOIN sections s ON s.id = f.section_id
  LEFT JOIN categories c ON c.id = f.category_id`;

export const PUBLISHED_SQL = `(f.visibility = 'published' OR (f.visibility = 'scheduled' AND f.publish_at IS NOT NULL AND f.publish_at <= '${""}' ))`;

/** SQL predicate for publicly visible rows (uses the DB clock via parameter). */
export function publishedPredicate(alias = "f"): { sql: string; args: string[] } {
  const now = new Date().toISOString();
  return {
    sql: `(${alias}.visibility = 'published' OR (${alias}.visibility = 'scheduled' AND ${alias}.publish_at IS NOT NULL AND ${alias}.publish_at <= ?))`,
    args: [now],
  };
}


const CORE_SECTIONS = [
  {
    id: "sec_case",
    slug: "case",
    name_ar: "القضية",
    name_en: "The Case",
    description_ar: "ملف القضية والمستندات المرتبطة بها.",
    description_en: "The case file and its supporting documents.",
    accent: "#0C873E",
    icon: "scale",
    sort_order: 10,
  },
  {
    id: "sec_laws",
    slug: "laws",
    name_ar: "القوانين",
    name_en: "Laws & Rules",
    description_ar: "القوانين والاتفاقيات واللوائح والقواعد.",
    description_en: "Legislation, conventions, regulations and rules.",
    accent: "#2975B2",
    icon: "book-open",
    sort_order: 20,
  },
  {
    id: "sec_books",
    slug: "books",
    name_ar: "الكتب",
    name_en: "Books",
    description_ar: "الكتب والمراجع والمؤلفات القانونية.",
    description_en: "Books and legal publications.",
    accent: "#EE940F",
    icon: "library",
    sort_order: 30,
  },
] as const;

/** Ensure the three core destinations exist without adding sample files or content. */
export async function ensureCoreSections(): Promise<void> {
  await batch(
    CORE_SECTIONS.map((section) => ({
      sql: `INSERT INTO sections
        (id, slug, name_ar, name_en, description_ar, description_en, accent, icon, sort_order, created_at)
        VALUES (?,?,?,?,?,?,?,?,?,?)
        ON CONFLICT(slug) DO NOTHING`,
      args: [
        section.id,
        section.slug,
        section.name_ar,
        section.name_en,
        section.description_ar,
        section.description_en,
        section.accent,
        section.icon,
        section.sort_order,
        nowIso(),
      ],
    })),
  );
}

export async function getSections(): Promise<SectionRow[]> {
  await ensureCoreSections();
  return all<SectionRow>("SELECT * FROM sections ORDER BY sort_order ASC, created_at ASC");
}

export async function getSectionBySlug(slug: string): Promise<SectionRow | null> {
  await ensureCoreSections();
  return one<SectionRow>("SELECT * FROM sections WHERE slug = ?", [slug]);
}

export async function getCategories(sectionId?: string): Promise<CategoryRow[]> {
  if (sectionId) {
    return all<CategoryRow>(
      "SELECT * FROM categories WHERE section_id = ? ORDER BY sort_order ASC, created_at ASC",
      [sectionId],
    );
  }
  return all<CategoryRow>("SELECT * FROM categories ORDER BY sort_order ASC");
}

export type FileQuery = {
  sectionId?: string;
  categoryId?: string | null;
  importance?: string;
  year?: string;
  sort?: SortKey;
  limit?: number;
  offset?: number;
  includeHidden?: boolean;
  pinnedOnly?: boolean;
  ids?: string[];
  q?: string;
};

function orderClause(sort: SortKey = "default"): string {
  switch (sort) {
    case "newest":
      return "f.created_at DESC";
    case "updated":
      return "f.updated_at DESC";
    case "views":
      return "f.views DESC, f.sort_order ASC";
    case "az":
      return "f.title_ar ASC";
    default:
      return "f.sort_order ASC, f.created_at DESC";
  }
}

export async function listFiles(q: FileQuery = {}): Promise<FileWithMeta[]> {
  const where: string[] = [];
  const args: (string | number)[] = [];
  if (!q.includeHidden) {
    const p = publishedPredicate("f");
    where.push(p.sql);
    args.push(...p.args);
  }
  if (q.sectionId) {
    where.push("f.section_id = ?");
    args.push(q.sectionId);
  }
  if (q.categoryId) {
    where.push("f.category_id = ?");
    args.push(q.categoryId);
  }
  if (q.importance) {
    where.push("f.importance = ?");
    args.push(q.importance);
  }
  if (q.year) {
    where.push("f.edition_year = ?");
    args.push(q.year);
  }
  if (q.pinnedOnly) where.push("f.pinned = 1");
  if (q.ids && q.ids.length) {
    where.push(`f.id IN (${q.ids.map(() => "?").join(",")})`);
    args.push(...q.ids);
  }
  if (q.q) {
    where.push("(lower(f.title_ar) LIKE ? OR lower(f.title_en) LIKE ? OR f.tags LIKE ?)");
    const like = `%${q.q.toLowerCase()}%`;
    args.push(like, like, like);
  }
  const sql = `${FILE_SELECT} ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
    ORDER BY ${q.pinnedOnly ? "f.sort_order ASC" : `f.pinned DESC, ${orderClause(q.sort)}`}
    LIMIT ? OFFSET ?`;
  args.push(q.limit ?? 200, q.offset ?? 0);
  return all<FileWithMeta>(sql, args);
}

export async function getFile(id: string, includeHidden = false): Promise<FileWithMeta | null> {
  const base = `${FILE_SELECT} WHERE f.id = ?`;
  const row = await one<FileWithMeta>(base, [id]);
  if (!row) return null;
  if (!includeHidden) {
    const visible =
      row.visibility === "published" ||
      (row.visibility === "scheduled" && row.publish_at !== null && row.publish_at <= new Date().toISOString());
    if (!visible) return null;
  }
  return row;
}

export async function getPageText(fileId: string, pageNo: number): Promise<PageTextRow | null> {
  return one<PageTextRow>("SELECT * FROM pages_text WHERE file_id = ? AND page_no = ?", [fileId, pageNo]);
}

export async function getPagesText(fileId: string, pages?: number[]): Promise<PageTextRow[]> {
  if (pages && pages.length) {
    return all<PageTextRow>(
      `SELECT * FROM pages_text WHERE file_id = ? AND page_no IN (${pages.map(() => "?").join(",")}) ORDER BY page_no`,
      [fileId, ...pages],
    );
  }
  return all<PageTextRow>("SELECT * FROM pages_text WHERE file_id = ? ORDER BY page_no", [fileId]);
}

export async function getPageCounts(): Promise<Record<string, { files: number; categories: number }>> {
  const rows = await all<{ section_id: string; c: number }>(
    `SELECT f.section_id, COUNT(*) AS c FROM files f WHERE ${publishedPredicate("f").sql} GROUP BY f.section_id`,
    publishedPredicate("f").args,
  );
  const out: Record<string, { files: number; categories: number }> = {};
  for (const r of rows) out[r.section_id] = { files: Number(r.c), categories: 0 };
  const cats = await all<{ section_id: string; c: number }>(
    "SELECT section_id, COUNT(*) AS c FROM categories GROUP BY section_id",
  );
  for (const c of cats) {
    if (!out[c.section_id]) out[c.section_id] = { files: 0, categories: 0 };
    out[c.section_id].categories = Number(c.c);
  }
  return out;
}

export async function getYears(): Promise<string[]> {
  const rows = await all<{ edition_year: string }>(
    "SELECT DISTINCT edition_year FROM files WHERE edition_year <> '' ORDER BY edition_year DESC",
  );
  return rows.map((r) => r.edition_year);
}

export async function getNews(limit = 6): Promise<NewsRow[]> {
  return all<NewsRow>("SELECT * FROM news ORDER BY is_pinned DESC, published_at DESC LIMIT ?", [limit]);
}

export async function getFaqs(): Promise<FaqRow[]> {
  return all<FaqRow>("SELECT * FROM faqs ORDER BY sort_order ASC");
}

export async function getDeadlines(): Promise<DeadlineRow[]> {
  return all<DeadlineRow>("SELECT * FROM deadlines ORDER BY due_at ASC");
}

export async function getChangelog(limit = 100): Promise<ChangelogRow[]> {
  return all<ChangelogRow>("SELECT * FROM changelog_entries ORDER BY created_at DESC LIMIT ?", [limit]);
}

export async function getChangelogForFile(fileId: string): Promise<ChangelogRow[]> {
  return all<ChangelogRow>(
    "SELECT * FROM changelog_entries WHERE file_id = ? ORDER BY created_at DESC",
    [fileId],
  );
}

export async function getVersions(fileId: string) {
  return all<{
    id: string;
    version: number;
    size_bytes: number;
    page_count: number;
    changelog: string;
    text_status: string;
    created_at: string;
    mime: string;
  }>("SELECT id, version, size_bytes, page_count, changelog, text_status, created_at, mime FROM file_versions WHERE file_id = ? ORDER BY version DESC", [
    fileId,
  ]);
}

export async function getRelatedFiles(file: FileWithMeta, limit = 4): Promise<FileWithMeta[]> {
  const rows = await all<FileWithMeta>(
    `${FILE_SELECT} WHERE f.id <> ? AND f.section_id = ? AND ${publishedPredicate("f").sql}
     ORDER BY f.pinned DESC, abs(f.sort_order - ?) ASC, f.updated_at DESC LIMIT ?`,
    [file.id, file.section_id, ...publishedPredicate("f").args, file.sort_order, limit],
  );
  if (rows.length >= limit) return rows;
  const extra = await all<FileWithMeta>(
    `${FILE_SELECT} WHERE f.id <> ? AND f.section_id <> ? AND ${publishedPredicate("f").sql}
     ORDER BY f.pinned DESC, f.updated_at DESC LIMIT ?`,
    [file.id, file.section_id, ...publishedPredicate("f").args, limit - rows.length],
  );
  return [...rows, ...extra];
}

export type CategoryWithCount = CategoryRow & { file_count: number };

export async function getCategoriesWithCounts(sectionId: string): Promise<CategoryWithCount[]> {
  const p = publishedPredicate("f");
  return all<CategoryWithCount>(
    `SELECT c.*, (SELECT COUNT(*) FROM files f WHERE f.category_id = c.id AND ${p.sql}) AS file_count
     FROM categories c WHERE c.section_id = ? ORDER BY c.sort_order ASC, c.created_at ASC`,
    [...p.args, sectionId],
  );
}

export type GlossaryRow = { id: string; term_ar: string; term_en: string; def_ar: string; def_en: string; sort_order: number };

export async function getGlossary(): Promise<GlossaryRow[]> {
  try {
    return await all<GlossaryRow>("SELECT * FROM glossary ORDER BY sort_order ASC, term_ar ASC");
  } catch {
    return [];
  }
}

export async function getSettings(): Promise<SettingsMap> {
  const rows = await all<{ key: string; value: string }>("SELECT key, value FROM settings");
  const map: SettingsMap = {};
  for (const r of rows) map[r.key] = r.value;
  return map;
}

export const DEFAULT_SETTINGS: SettingsMap = {
  site_name_ar: "SCCAM",
  site_name_en: "SCCAM",
  tagline_ar: "",
  tagline_en: "",
  timer_claimant_title_ar: "آخر موعد لتسليم مذكرة المدعي",
  timer_claimant_title_en: "Claimant's Memorial Submission Deadline",
  timer_claimant_due_at: "2026-12-06T21:59:59.999Z",
  timer_respondent_title_ar: "آخر موعد لتسليم مذكرة المدعى عليه",
  timer_respondent_title_en: "Respondent's Memorial Submission Deadline",
  timer_respondent_due_at: "2027-01-03T21:59:59.999Z",
  banner_ar: "موقع غير رسمي من إعداد المجتمع الطلابي — غير تابع للجهة المنظمة ولا معتمد منها.",
  banner_en: "Unofficial community site — not affiliated with or endorsed by the competition organizers.",
  notice_ar: "هذا الموقع غير رسمي ولا يتبع الجهة المنظمة للمنافسة ولا يمثلها. جميع المواد ملك لأصحابها وتُعرض للاستخدام التعليمي فقط.",
  notice_en: "This is an unofficial site, not affiliated with or endorsed by the competition organizers. All materials belong to their respective owners and are provided for educational use.",
  announcement_ar: "",
  announcement_en: "",
  announcement_enabled: "0",
  social_x: "",
  social_linkedin: "",
  social_whatsapp: "",
  social_facebook: "",
  social_instagram: "",
  contact_email: "library@example.org",
  footer_note_ar: "",
  footer_note_en: "",
  accent_case: "#238B46",
  accent_laws: "#0B527A",
  accent_books: "#F5A10B",
  color_primary: "#238B46",
  color_accent: "#F5A10B",
  color_bg: "#FBFDFB",
  color_surface: "#F0F6F1",
  color_text: "#173B2A",
  default_lang: "ar",
  whatsapp_share_prefix: "",
};

export async function getSetting(key: string): Promise<string | undefined> {
  const row = await one<{ value: string }>("SELECT value FROM settings WHERE key = ?", [key]);
  return row?.value;
}

export async function setSettings(values: SettingsMap) {
  const entries = Object.entries(values);
  if (!entries.length) return;
  const stmts = entries.map(([key, value]) => ({
    sql: "INSERT INTO settings (key, value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
    args: [key, value],
  }));
  await batch(stmts);
}

export async function getSiteSettings(): Promise<SettingsMap> {
  return { ...DEFAULT_SETTINGS, ...(await getSettings()) };
}

export async function logEvent(kind: string, data: { fileId?: string; pageNo?: number; query?: string; resultCount?: number } = {}) {
  try {
    await run(
      "INSERT INTO analytics_events (kind, file_id, page_no, query, result_count, created_at) VALUES (?,?,?,?,?,?)",
      [kind, data.fileId ?? null, data.pageNo ?? null, data.query ?? null, data.resultCount ?? null, nowIso()],
    );
  } catch {
    /* analytics must never break a request */
  }
}

export async function incrementViews(fileId: string, pageNo?: number) {
  try {
    await run("UPDATE files SET views = views + 1 WHERE id = ?", [fileId]);
    await logEvent("view", { fileId, pageNo });
  } catch {
    /* ignore */
  }
}

export async function addChangelog(entry: {
  fileId?: string | null;
  kind?: string;
  titleAr: string;
  titleEn?: string;
  detailAr?: string;
  detailEn?: string;
  version?: number;
}) {
  await run(
    `INSERT INTO changelog_entries (id, file_id, kind, title_ar, title_en, detail_ar, detail_en, version, created_at)
     VALUES (?,?,?,?,?,?,?,?,?)`,
    [
      newId("cl"),
      entry.fileId ?? null,
      entry.kind ?? "update",
      entry.titleAr,
      entry.titleEn ?? "",
      entry.detailAr ?? "",
      entry.detailEn ?? "",
      entry.version ?? 1,
      nowIso(),
    ],
  );
}

export async function getClarificationsWithLinks() {
  const rows = await all<FileWithMeta & { doc_date: string | null }>(
    `${FILE_SELECT} WHERE c.slug = 'clarifications' AND ${publishedPredicate("f").sql} ORDER BY f.doc_date DESC, f.created_at DESC`,
    publishedPredicate("f").args,
  );
  const links = await all<{ file_id: string; target_file_id: string; target_page: number; note: string; target_title: string }>(
    `SELECT l.*, tf.title_ar AS target_title FROM clarification_links l
     JOIN files tf ON tf.id = l.target_file_id`,
  );
  return rows.map((r) => ({ ...r, links: links.filter((l) => l.file_id === r.id) }));
}

export async function getFileCounts() {
  const p = publishedPredicate("f");
  const row = await one<{ files: number; pages: number }>(
    `SELECT (SELECT COUNT(*) FROM files f WHERE ${p.sql}) AS files,
            (SELECT COALESCE(SUM(page_count),0) FROM files f WHERE ${p.sql}) AS pages`,
    [...p.args, ...p.args],
  );
  return { files: Number(row?.files ?? 0), pages: Number(row?.pages ?? 0) };
}

export async function searchFileRowsByTitle(term: string, limit = 5): Promise<FileRow[]> {
  const like = `%${term}%`;
  return all<FileRow>(
    "SELECT * FROM files WHERE visibility = 'published' AND (title_ar LIKE ? OR title_en LIKE ?) LIMIT ?",
    [like, like, limit],
  );
}

/** Text for a specific version: current version lives in pages_text, older ones in pages_history. */
export async function getVersionText(fileId: string, version: number, currentVersion: number): Promise<string> {
  const rows =
    version === currentVersion
      ? await all<{ page_no: number; text: string }>(
          "SELECT page_no, text FROM pages_text WHERE file_id = ? ORDER BY page_no",
          [fileId],
        )
      : await all<{ page_no: number; text: string }>(
          "SELECT page_no, text FROM pages_history WHERE file_id = ? AND version = ? ORDER BY page_no",
          [fileId, version],
        );
  return rows.map((r) => r.text).join("\n\n");
}
