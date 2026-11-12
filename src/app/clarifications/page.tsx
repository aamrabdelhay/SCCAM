import Link from "next/link";
import { HelpCircle, ArrowUpRight } from "lucide-react";
import { getLang } from "@/lib/server-lang";
import { getClarificationsWithLinks } from "@/lib/queries";
import { t } from "@/lib/i18n";
import { formatDate, pickText } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Clarifications" };

export default async function ClarificationsPage() {
  const lang = await getLang();
  const items = await getClarificationsWithLinks();

  return (
    <div className="container-x py-8">
      <header className="max-w-3xl">
        <p className="eyebrow">{t(lang, "navCase")}</p>
        <h1 className="font-display mt-2 flex items-center gap-2 text-[26px] font-extrabold sm:text-[32px]">
          <HelpCircle className="h-7 w-7 text-[var(--accent)]" aria-hidden="true" />
          {t(lang, "clarificationsTitle")}
        </h1>
        <p className="mt-2 text-[13.5px] leading-relaxed text-[var(--muted)]">{t(lang, "clarificationsDesc")}</p>
      </header>

      <ol className="mt-8 space-y-3 border-s-2 border-[var(--line)] ps-4 sm:ps-6">
        {items.map((c) => (
          <li key={c.id} className="relative">
            <span className="absolute -start-[21px] top-6 h-3 w-3 rounded-full border-2 border-[var(--bg)] bg-[var(--accent)] sm:-start-[29px]" />
            <article className="card p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-[var(--accent)]">
                    {formatDate(c.doc_date || c.created_at, lang, { day: "2-digit", month: "long", year: "numeric" })}
                  </p>
                  <h2 className="mt-1 text-[14.5px] font-bold leading-snug">
                    <Link href={`/file/${c.id}`} className="hover:underline">
                      {pickText(lang, c.title_ar, c.title_en)}
                    </Link>
                  </h2>
                  <p className="mt-1 line-clamp-2 text-[12.5px] text-[var(--muted)]">
                    {pickText(lang, c.description_ar, c.description_en)}
                  </p>
                </div>
                <Link href={`/file/${c.id}`} className="btn btn-outline btn-sm shrink-0 gap-1">
                  {t(lang, "openFile")} <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              {c.links.length > 0 && (
                <div className="mt-3 border-t border-[var(--line)] pt-2">
                  <p className="text-[10.5px] font-bold uppercase tracking-wide text-[var(--muted)]">
                    {t(lang, "linkedParagraphs")}
                  </p>
                  <ul className="mt-1 flex flex-wrap gap-1.5">
                    {c.links.map((l, i) => (
                      <li key={i}>
                        <Link
                          href={`/file/${l.target_file_id}?page=${l.target_page}&q=${encodeURIComponent(l.note || "")}`}
                          className="chip !py-1 !text-[11px]"
                        >
                          {l.target_title} · {t(lang, "page")} {l.target_page}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </article>
          </li>
        ))}
      </ol>

      {items.length === 0 && (
        <div className="card mt-6 p-10 text-center text-[13px] text-[var(--muted)]">{t(lang, "noClarifications")}</div>
      )}
    </div>
  );
}
