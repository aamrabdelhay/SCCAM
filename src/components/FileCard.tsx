import Link from "next/link";
import { ArrowLeft, ArrowRight, Eye, FileLock2, Layers } from "lucide-react";
import type { FileWithMeta, Lang } from "@/lib/types";
import { t } from "@/lib/i18n";
import { formatDate, formatNumber, isNew, isUpdated, pagesLabel, pickText, truncate } from "@/lib/format";
import { FormatIcon, ImportanceBadge, NewBadge, PinnedBadge, SectionPill, UpdatedBadge } from "./Badges";
import { cn } from "@/lib/format";

export function FileCard({
  file,
  lang,
  showSection = false,
  variant = "tile",
  matchCount,
}: {
  file: FileWithMeta;
  lang: Lang;
  showSection?: boolean;
  variant?: "tile" | "row";
  matchCount?: number;
}) {
  const title = pickText(lang, file.title_ar, file.title_en);
  const description = pickText(lang, file.description_ar, file.description_en);
  const sectionName = pickText(lang, file.section_name_ar, file.section_name_en);
  const sectionColor = file.section_slug === "laws" ? "var(--sky)" : file.section_slug === "books" ? "var(--accent)" : "var(--primary)";
  const categoryName = file.category_name_ar ? pickText(lang, file.category_name_ar, file.category_name_en) : null;
  const Arrow = lang === "ar" ? ArrowLeft : ArrowRight;
  const badges = (
    <div className="flex flex-wrap items-center gap-1.5">
      <ImportanceBadge importance={file.importance} lang={lang} />
      {file.pinned === 1 && <PinnedBadge lang={lang} />}
      {isNew(file.created_at) && <NewBadge lang={lang} />}
      {isUpdated(file.updated_at, file.created_at) && <UpdatedBadge lang={lang} />}
      {file.file_password_hash && <FileLock2 className="h-3.5 w-3.5 text-[var(--muted)]" aria-label={t(lang, "viewerPasswordTitle")} />}
    </div>
  );

  const meta = (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-[var(--muted)]">
      {showSection && <SectionPill name={sectionName} accent={sectionColor} lang={lang} />}
      {categoryName && <span className="font-medium">{categoryName}</span>}
      <span className="inline-flex items-center gap-1">
        <Layers className="h-3 w-3" aria-hidden="true" />
        {pagesLabel(file.page_count, lang)}
      </span>
      <span className="inline-flex items-center gap-1">
        <Eye className="h-3 w-3" aria-hidden="true" />
        {formatNumber(file.views, lang)}
      </span>
      <span>{formatDate(file.doc_date || file.updated_at, lang)}</span>
      {matchCount ? <span className="font-semibold text-[var(--primary)] dark:text-[var(--accent)]">{t(lang, "matchCount", { n: matchCount })}</span> : null}
    </div>
  );

  if (variant === "row") {
    return (
      <Link
        href={`/file/${file.id}`}
        className="group card card-hover flex items-start gap-3.5 p-4 focus-visible:outline-offset-2"
      >
        <span
          className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-xl"
          style={{ background: `color-mix(in srgb, ${sectionColor} 12%, transparent)`, color: sectionColor }}
        >
          <FormatIcon mime={file.mime} className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h3 className="text-[14px] font-bold leading-snug text-[var(--text)] group-hover:text-[var(--primary)] dark:group-hover:text-[var(--accent)]">
              {title}
            </h3>
            {badges}
          </div>
          {description && <p className="mt-1 line-clamp-2 text-[12.5px] leading-relaxed text-[var(--muted)]">{description}</p>}
          <div className="mt-2">{meta}</div>
        </div>
        <Arrow className="mt-1 h-4 w-4 shrink-0 text-[var(--muted)] transition-transform group-hover:-translate-x-0.5 rtl:group-hover:translate-x-0.5" aria-hidden="true" />
      </Link>
    );
  }

  return (
    <Link
      href={`/file/${file.id}`}
      className={cn("group card card-hover flex h-full flex-col p-5 focus-visible:outline-offset-2")}
    >
      <div className="flex items-start justify-between gap-2">
        <span
          className="grid h-11 w-11 place-items-center rounded-xl"
          style={{ background: `color-mix(in srgb, ${sectionColor} 12%, transparent)`, color: sectionColor }}
        >
          <FormatIcon mime={file.mime} className="h-5 w-5" />
        </span>
        {badges}
      </div>
      <h3 className="mt-3 text-[14.5px] font-bold leading-snug group-hover:text-[var(--primary)] dark:group-hover:text-[var(--accent)]">
        {title}
      </h3>
      {description && <p className="mt-1.5 line-clamp-2 text-[12.5px] leading-relaxed text-[var(--muted)]">{description}</p>}
      <div className="mt-auto pt-3">{meta}</div>
    </Link>
  );
}

export function FileMiniCard({ file, lang }: { file: FileWithMeta; lang: Lang }) {
  const title = pickText(lang, file.title_ar, file.title_en);
  const sectionColor = file.section_slug === "laws" ? "var(--sky)" : file.section_slug === "books" ? "var(--accent)" : "var(--primary)";
  return (
    <Link href={`/file/${file.id}`} className="group flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-[var(--surface)]">
      <span
        className="grid h-9 w-9 shrink-0 place-items-center rounded-lg"
        style={{ background: `color-mix(in srgb, ${sectionColor} 12%, transparent)`, color: sectionColor }}
      >
        <FormatIcon mime={file.mime} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] font-semibold">{title}</span>
        <span className="block truncate text-[11px] text-[var(--muted)]">
          {pickText(lang, file.section_name_ar, file.section_name_en)} · {pagesLabel(file.page_count, lang)}
        </span>
      </span>
    </Link>
  );
}

export function FileTitleText({ file, lang, max = 80 }: { file: FileWithMeta; lang: Lang; max?: number }) {
  return <>{truncate(pickText(lang, file.title_ar, file.title_en), max)}</>;
}
