import Link from "next/link";
import { Files, Layers, Eye, Search, ArrowUpRight, Inbox, Sparkles } from "lucide-react";
import { getLang } from "@/lib/server-lang";
import {
  getCategoriesWithCounts,
  getFileCounts,
  getSections,
  listFiles,
} from "@/lib/queries";
import { all, one } from "@/lib/db";
import { t } from "@/lib/i18n";
import { categoriesLabel, filesLabel, formatDate, formatNumber, pagesLabel, pickText, textStatusLabel } from "@/lib/format";
import { UploadPanel } from "@/components/admin/UploadPanel";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const lang = await getLang();
  const [sections, counts, fileCounts, latest] = await Promise.all([
    getSections(),
    getCategoriesWithCounts(""),
    getFileCounts(),
    listFiles({ includeHidden: true, sort: "newest", limit: 8 }),
  ]);
  void counts;

  const [categoriesAll, views, searches, inboxOpen, perSection] = await Promise.all([
    Promise.all(sections.map((s) => getCategoriesWithCounts(s.id))),
    one<{ v: number }>("SELECT COALESCE(SUM(views),0) AS v FROM files"),
    one<{ c: number }>("SELECT COUNT(*) AS c FROM analytics_events WHERE kind = 'search'"),
    one<{ c: number }>("SELECT COUNT(*) AS c FROM inbox_messages WHERE status = 'open'"),
    Promise.all(
      sections.map((s) =>
        one<{ c: number }>("SELECT COUNT(*) AS c FROM files WHERE section_id = ?", [s.id]),
      ),
    ),
  ]);

  const sectionOptions = sections.map((s, i) => ({
    id: s.id,
    name: pickText(lang, s.name_ar, s.name_en),
    categories: (categoriesAll[i] ?? []).map((c) => ({ id: c.id, name: pickText(lang, c.name_ar, c.name_en) })),
  }));

  const stats = [
    { label: t(lang, "adminFilesTotal"), value: formatNumber(perSection.reduce((n, r) => n + Number(r?.c ?? 0), 0), lang), icon: Files, href: "/admin/files" },
    { label: t(lang, "adminPagesTotal"), value: formatNumber(fileCounts.pages, lang), icon: Layers, href: "/admin/files" },
    { label: t(lang, "adminViewsTotal"), value: formatNumber(Number(views?.v ?? 0), lang), icon: Eye, href: "/admin/analytics" },
    { label: t(lang, "adminSearchCount"), value: formatNumber(Number(searches?.c ?? 0), lang), icon: Search, href: "/admin/analytics" },
    { label: t(lang, "adminInbox"), value: formatNumber(Number(inboxOpen?.c ?? 0), lang), icon: Inbox, href: "/admin/inbox" },
  ];

  return (
    <div className="space-y-4">
      <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-5">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="card card-hover p-3.5">
            <span className="flex items-center justify-between">
              <s.icon className="h-4 w-4 text-[var(--accent)]" aria-hidden="true" />
              <ArrowUpRight className="h-3 w-3 text-[var(--muted)]" />
            </span>
            <p className="font-display mt-2 text-[22px] font-extrabold leading-none">{s.value}</p>
            <p className="mt-1 text-[11px] text-[var(--muted)]">{s.label}</p>
          </Link>
        ))}
      </div>

      <UploadPanel lang={lang} sections={sectionOptions} />

      <section className="card p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-[14px] font-bold">{t(lang, "adminLastUploads")}</h2>
          <Link href="/admin/files" className="text-[11.5px] font-semibold link">
            {t(lang, "adminFiles")} →
          </Link>
        </div>
        <ul className="mt-2 divide-y divide-[var(--line)]">
          {latest.map((f) => (
            <li key={f.id} className="flex items-center justify-between gap-2 py-2">
              <div className="min-w-0">
                <Link href={`/admin/files/${f.id}`} className="block truncate text-[12.5px] font-semibold hover:underline">
                  {pickText(lang, f.title_ar, f.title_en)}
                </Link>
                <p className="text-[10.5px] text-[var(--muted)]">
                  {pickText(lang, f.section_name_ar, f.section_name_en)} · {pagesLabel(f.page_count, lang)} ·{" "}
                  {f.visibility !== "published" ? `${f.visibility} · ` : ""}
                  {formatDate(f.updated_at, lang)}
                </p>
              </div>
              <span
                className={`badge shrink-0 ${
                  f.text_status === "failed" ? "badge-essential" : f.text_status === "needs_ocr" ? "badge-important" : "badge-new"
                }`}
              >
                {textStatusLabel(lang, f.text_status)}
              </span>
            </li>
          ))}
          {latest.length === 0 && (
            <li className="py-6 text-center text-[12px] text-[var(--muted)]">
              <Sparkles className="mx-auto mb-1 h-4 w-4" /> {t(lang, "adminNoFiles")}
            </li>
          )}
        </ul>
      </section>

      <section className="card p-4">
        <h2 className="text-[14px] font-bold">{t(lang, "adminTaxonomy")}</h2>
        <div className="mt-2 grid gap-2 sm:grid-cols-3">
          {sections.map((s, i) => (
            <div key={s.id} className="rounded-xl border border-[var(--line)] p-3">
              <p className="text-[12.5px] font-bold">{pickText(lang, s.name_ar, s.name_en)}</p>
              <p className="mt-0.5 text-[10.5px] text-[var(--muted)]">
                {filesLabel(perSection[i]?.c ?? 0, lang)} · {categoriesLabel((categoriesAll[i] ?? []).length, lang)}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
