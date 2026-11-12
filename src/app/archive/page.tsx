import Link from "next/link";
import { Archive, FileText } from "lucide-react";
import { getLang } from "@/lib/server-lang";
import { listFiles, getSections } from "@/lib/queries";
import { t } from "@/lib/i18n";
import { formatNumber, pickText, filesLabel } from "@/lib/format";
import { FileCard } from "@/components/FileCard";

export const dynamic = "force-dynamic";
export const metadata = { title: "Archive" };

export default async function ArchivePage() {
  const lang = await getLang();
  const [files, sections] = await Promise.all([listFiles({ sort: "default", limit: 500 }), getSections()]);

  const grouped = new Map<string, typeof files>();
  for (const f of files) {
    const key = f.edition_year || (lang === "ar" ? "الإصدار الحالي" : "Current edition");
    grouped.set(key, [...(grouped.get(key) ?? []), f]);
  }
  const years = Array.from(grouped.keys()).sort((a, b) => b.localeCompare(a));

  return (
    <div className="container-x py-8">
      <div className="max-w-3xl">
        <p className="eyebrow">{t(lang, "navArchive")}</p>
        <h1 className="font-display mt-2 flex items-center gap-2 text-[26px] font-extrabold sm:text-[32px]">
          <Archive className="h-7 w-7 text-[var(--accent)]" aria-hidden="true" />
          {t(lang, "archiveTitle")}
        </h1>
        <p className="mt-2 text-[13.5px] leading-relaxed text-[var(--muted)]">{t(lang, "archiveDesc")}</p>
      </div>

      <nav aria-label={t(lang, "previousEditions")} className="mt-5 flex flex-wrap gap-1.5">
        {years.map((y) => (
          <a key={y} href={`#edition-${encodeURIComponent(y)}`} className="chip">
            {y} <span className="text-[10px] opacity-70">{formatNumber(grouped.get(y)?.length ?? 0, lang)}</span>
          </a>
        ))}
      </nav>

      <div className="mt-8 space-y-10">
        {years.map((y, idx) => (
          <section key={y} id={`edition-${encodeURIComponent(y)}`} className="scroll-mt-24">
            <div className="mb-3 flex items-center gap-3">
              <h2 className="font-display text-[20px] font-extrabold">{y}</h2>
              {idx === 0 && <span className="badge badge-new">{t(lang, "archiveCurrent")}</span>}
              <span className="h-px flex-1 bg-[var(--line)]" />
              <span className="text-[11px] font-semibold text-[var(--muted)]">
                {filesLabel(grouped.get(y)?.length ?? 0, lang)}
              </span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {(grouped.get(y) ?? []).map((f) => (
                <FileCard key={f.id} file={f} lang={lang} showSection />
              ))}
            </div>
          </section>
        ))}
        {files.length === 0 && (
          <div className="card flex items-center gap-2 p-6 text-[13px] text-[var(--muted)]">
            <FileText className="h-4 w-4" /> {t(lang, "noDocuments")}
          </div>
        )}
      </div>

      <div className="mt-10 flex flex-wrap gap-2">
        {sections.map((s) => (
          <Link key={s.id} href={`/${s.slug}`} className="btn btn-outline btn-sm">
            {pickText(lang, s.name_ar, s.name_en)}
          </Link>
        ))}
      </div>
    </div>
  );
}
