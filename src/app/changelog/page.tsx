import Link from "next/link";
import { History, PlusCircle, RefreshCw, MinusCircle, StickyNote } from "lucide-react";
import { getLang } from "@/lib/server-lang";
import { getChangelog, getNews } from "@/lib/queries";
import { t } from "@/lib/i18n";
import { dayBadge, formatDate, pickText } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Changelog" };

const ICONS = { add: PlusCircle, update: RefreshCw, remove: MinusCircle, note: StickyNote } as const;

export default async function ChangelogPage() {
  const lang = await getLang();
  const [entries, news] = await Promise.all([getChangelog(200), getNews(10)]);

  return (
    <div className="container-x py-8">
      <header className="max-w-3xl">
        <p className="eyebrow">{t(lang, "navArchive")}</p>
        <h1 className="font-display mt-2 flex items-center gap-2 text-[26px] font-extrabold sm:text-[32px]">
          <History className="h-7 w-7 text-[var(--accent)]" aria-hidden="true" />
          {t(lang, "changelogTitle")}
        </h1>
        <p className="mt-2 text-[13.5px] leading-relaxed text-[var(--muted)]">{t(lang, "changelogDesc")}</p>
      </header>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        <ol className="space-y-2">
          {entries.map((e) => {
            const Icon = ICONS[(e.kind as keyof typeof ICONS) ?? "update"] ?? RefreshCw;
            return (
              <li key={e.id} className="card flex items-start gap-3 p-3.5">
                <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[var(--surface)] text-[var(--accent)]">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-bold leading-snug">{pickText(lang, e.title_ar, e.title_en)}</p>
                  {pickText(lang, e.detail_ar, e.detail_en) && (
                    <p className="mt-0.5 text-[12px] leading-relaxed text-[var(--muted)]">
                      {pickText(lang, e.detail_ar, e.detail_en)}
                    </p>
                  )}
                  <p className="mt-1 text-[10.5px] font-semibold uppercase tracking-wide text-[var(--muted)]">
                    {formatDate(e.created_at, lang)} {e.version > 1 ? `· v${e.version}` : ""}
                  </p>
                </div>
                {e.file_id && (
                  <Link href={`/file/${e.file_id}`} className="link shrink-0 self-center text-[11.5px] font-semibold">
                    {t(lang, "openFile")}
                  </Link>
                )}
              </li>
            );
          })}
          {entries.length === 0 && <li className="card p-8 text-center text-[13px] text-[var(--muted)]">{t(lang, "noResults")}</li>}
        </ol>

        <aside>
          <h2 className="section-title text-[18px]">{t(lang, "newsTitle")}</h2>
          <div className="mt-3 space-y-2">
            {news.map((n) => {
              const badge = dayBadge(n.published_at, lang);
              return (
                <article key={n.id} className="card flex gap-3 p-3.5">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg border border-[var(--line)] bg-[var(--surface)]">
                    <span className="font-display text-[15px] font-extrabold leading-none">{badge.day}</span>
                    <span className="text-[8.5px] font-bold uppercase text-[var(--muted)]">{badge.month}</span>
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-[12.5px] font-bold leading-snug">{pickText(lang, n.title_ar, n.title_en)}</h3>
                    <p className="mt-0.5 line-clamp-3 text-[11.5px] leading-relaxed text-[var(--muted)]">
                      {pickText(lang, n.body_ar, n.body_en)}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        </aside>
      </div>
    </div>
  );
}
