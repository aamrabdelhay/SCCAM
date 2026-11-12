import Link from "next/link";
import { BarChart3, Eye, Search, FileWarning } from "lucide-react";
import { getLang } from "@/lib/server-lang";
import { all, one } from "@/lib/db";
import { topQueries, zeroResultQueries } from "@/lib/search-query";
import { t } from "@/lib/i18n";
import { formatDate, formatNumber, pickText } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminAnalyticsPage() {
  const lang = await getLang();
  const [topFiles, topPages, searches, zero, totals, recent] = await Promise.all([
    all<{ id: string; title_ar: string; title_en: string; views: number; downloads: number }>(
      "SELECT id, title_ar, title_en, views, downloads FROM files ORDER BY views DESC LIMIT 10",
    ),
    all<{ file_id: string; page_no: number; c: number; title_ar: string }>(
      `SELECT e.file_id, e.page_no, COUNT(*) AS c, f.title_ar
       FROM analytics_events e JOIN files f ON f.id = e.file_id
       WHERE e.kind = 'view' AND e.page_no IS NOT NULL
       GROUP BY e.file_id, e.page_no ORDER BY c DESC LIMIT 10`,
    ),
    topQueries(12),
    zeroResultQueries(12),
    one<{ views: number; downloads: number; files: number; searches: number }>(
      `SELECT (SELECT COALESCE(SUM(views),0) FROM files) AS views,
              (SELECT COALESCE(SUM(downloads),0) FROM files) AS downloads,
              (SELECT COUNT(*) FROM files) AS files,
              (SELECT COUNT(*) FROM analytics_events WHERE kind='search') AS searches`,
    ),
    all<{ kind: string; created_at: string; query: string | null; file_id: string | null }>(
      "SELECT kind, created_at, query, file_id FROM analytics_events ORDER BY id DESC LIMIT 25",
    ),
  ]);

  const cards = [
    { label: t(lang, "adminViewsTotal"), value: Number(totals?.views ?? 0), icon: Eye },
    { label: t(lang, "adminSearchCount"), value: Number(totals?.searches ?? 0), icon: Search },
    { label: t(lang, "adminFilesTotal"), value: Number(totals?.files ?? 0), icon: BarChart3 },
    { label: t(lang, "download"), value: Number(totals?.downloads ?? 0), icon: FileWarning },
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-[16px] font-extrabold">{t(lang, "adminAnalytics")}</h2>

      <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="card p-3.5">
            <c.icon className="h-4 w-4 text-[var(--accent)]" aria-hidden="true" />
            <p className="font-display mt-2 text-[22px] font-extrabold leading-none">{formatNumber(c.value, lang)}</p>
            <p className="mt-1 text-[11px] text-[var(--muted)]">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="card p-4">
          <h3 className="text-[13.5px] font-bold">{t(lang, "adminTopFiles")}</h3>
          <ul className="mt-2 divide-y divide-[var(--line)] text-[12px]">
            {topFiles.map((f) => (
              <li key={f.id} className="flex items-center justify-between gap-2 py-1.5">
                <Link href={`/admin/files/${f.id}`} className="truncate hover:underline">
                  {pickText(lang, f.title_ar, f.title_en)}
                </Link>
                <span className="shrink-0 font-bold text-[var(--muted)]">{formatNumber(f.views, lang)}</span>
              </li>
            ))}
            {topFiles.length === 0 && <li className="py-3 text-[var(--muted)]">{t(lang, "adminNoData")}</li>}
          </ul>
        </section>

        <section className="card p-4">
          <h3 className="text-[13.5px] font-bold">{t(lang, "adminTopPages")}</h3>
          <ul className="mt-2 divide-y divide-[var(--line)] text-[12px]">
            {topPages.map((p) => (
              <li key={`${p.file_id}-${p.page_no}`} className="flex items-center justify-between gap-2 py-1.5">
                <Link href={`/file/${p.file_id}?page=${p.page_no}`} className="truncate hover:underline">
                  {pickText(lang, p.title_ar, "")} · {t(lang, "page")} {p.page_no}
                </Link>
                <span className="shrink-0 font-bold text-[var(--muted)]">{formatNumber(p.c, lang)}</span>
              </li>
            ))}
            {topPages.length === 0 && <li className="py-3 text-[var(--muted)]">{t(lang, "adminNoData")}</li>}
          </ul>
        </section>

        <section className="card p-4">
          <h3 className="text-[13.5px] font-bold">{t(lang, "adminTopQueries")}</h3>
          <ul className="mt-2 divide-y divide-[var(--line)] text-[12px]">
            {searches.map((q) => (
              <li key={q.query} className="flex items-center justify-between gap-2 py-1.5">
                <span className="truncate">{q.query}</span>
                <span className="shrink-0 text-[10.5px] text-[var(--muted)]">
                  {formatNumber(q.searches, lang)} × · {q.avg_results}
                </span>
              </li>
            ))}
            {searches.length === 0 && <li className="py-3 text-[var(--muted)]">{t(lang, "adminNoData")}</li>}
          </ul>
        </section>

        <section className="card p-4">
          <h3 className="text-[13.5px] font-bold">{t(lang, "adminZeroQueries")}</h3>
          <ul className="mt-2 divide-y divide-[var(--line)] text-[12px]">
            {zero.map((q) => (
              <li key={q.query} className="flex items-center justify-between gap-2 py-1.5">
                <span className="truncate">{q.query}</span>
                <span className="shrink-0 text-[10.5px] text-[var(--muted)]">{formatNumber(q.searches, lang)} ×</span>
              </li>
            ))}
            {zero.length === 0 && <li className="py-3 text-[var(--muted)]">{t(lang, "adminNoData")}</li>}
          </ul>
        </section>
      </div>

      <section className="card p-4">
        <h3 className="text-[13.5px] font-bold">{t(lang, "adminLastUploads")} — recent activity</h3>
        <ul className="mt-2 space-y-1 text-[11.5px] text-[var(--muted)]">
          {recent.map((r, i) => (
            <li key={i} className="flex items-center justify-between gap-2 border-b border-[var(--line)] py-1 last:border-0">
              <span className="truncate">
                {r.kind}
                {r.query ? ` · ${r.query}` : ""}
                {r.file_id ? ` · ${r.file_id.slice(0, 8)}` : ""}
              </span>
              <span className="shrink-0">{formatDate(r.created_at, lang, { hour: "2-digit", minute: "2-digit" })}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
