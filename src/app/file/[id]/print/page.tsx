import Link from "next/link";
import { notFound } from "next/navigation";
import { getLang } from "@/lib/server-lang";
import { getFile, getPagesText } from "@/lib/queries";
import { t } from "@/lib/i18n";
import { formatDate, pickText } from "@/lib/format";
import { PrintTrigger } from "@/components/file/PrintTrigger";

export const dynamic = "force-dynamic";

export default async function PrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const lang = await getLang();
  const file = await getFile(id);
  if (!file) notFound();
  if (!file.print_allowed) {
    return <div className="container-x py-16 text-center text-[14px]">{t(lang, "print")} — {t(lang, "downloadNotAllowed")}</div>;
  }
  const pages = await getPagesText(id);
  const title = pickText(lang, file.title_ar, file.title_en);
  const hasText = pages.some((p) => p.text.trim().length > 0);

  return (
    <div className="container-x max-w-3xl py-8 print:max-w-none print:py-0">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 no-print">
        <Link href={`/file/${id}`} className="btn btn-outline btn-sm">
          ← {t(lang, "backToFile")}
        </Link>
        <div className="flex items-center gap-2">
          <p className="text-[11px] text-[var(--muted)]">{t(lang, "printHint")}</p>
          <PrintTrigger lang={lang} auto />
        </div>
      </div>

      <header className="border-b border-[var(--line)] pb-3">
        <h1 className="text-[20px] font-extrabold" dir="auto">
          {title}
        </h1>
        <p className="mt-1 text-[11px] text-[var(--muted)]">
          {pickText(lang, file.section_name_ar, file.section_name_en)} · {formatDate(file.updated_at, lang)} · v{file.current_version}
        </p>
      </header>

      {hasText ? (
        <div className="mt-4">
          {pages.map((p) => (
            <section key={p.page_no} className="print-page-break">
              <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">
                {t(lang, "page")} {p.page_no}
              </p>
              <article className="whitespace-pre-wrap text-[12.5px] leading-[1.9]" dir="auto">
                {p.text}
              </article>
            </section>
          ))}
        </div>
      ) : (
        <iframe src={`/api/files/${id}/stream`} title={title} className="mt-4 h-[80vh] w-full rounded-xl border border-[var(--line)]" />
      )}

      <footer className="mt-8 border-t border-[var(--line)] pt-2 text-[9.5px] text-[var(--muted)]">
        {t(lang, "citationLine", { title, pages: `1–${file.page_count}` })} · {t(lang, "unofficialShort")}
      </footer>
    </div>
  );
}
