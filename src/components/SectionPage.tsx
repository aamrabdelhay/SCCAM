import Link from "next/link";
import { notFound } from "next/navigation";
import { BookOpen, Files, Library, Scale, Filter, X } from "lucide-react";
import { getLang } from "@/lib/server-lang";
import {
  getCategoriesWithCounts,
  getSectionBySlug,
  getYears,
  listFiles,
} from "@/lib/queries";
import { t } from "@/lib/i18n";
import type { SortKey } from "@/lib/types";
import { categoriesLabel, filesLabel, formatNumber, pickText } from "@/lib/format";
import { FileCard } from "@/components/FileCard";
import { SortSelect } from "@/components/SortSelect";
import { SearchBox } from "@/components/SearchBox";
import { FilterSelect } from "@/components/FilterSelect";

const ICONS: Record<string, typeof Scale> = { case: Scale, laws: BookOpen, books: Library };
const DESC: Record<string, "sectionCaseDesc" | "sectionLawsDesc" | "sectionBooksDesc"> = {
  case: "sectionCaseDesc",
  laws: "sectionLawsDesc",
  books: "sectionBooksDesc",
};

export async function SectionPage({
  slug,
  searchParams,
}: {
  slug: string;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const lang = await getLang();
  const params = await searchParams;
  const section = await getSectionBySlug(slug);
  if (!section) notFound();

  const sort = (typeof params.sort === "string" ? params.sort : "default") as SortKey;
  const categorySlug = typeof params.c === "string" ? params.c : undefined;
  const importance = typeof params.i === "string" ? params.i : undefined;
  const year = typeof params.year === "string" ? params.year : undefined;

  const [categories, years, allInSection] = await Promise.all([
    getCategoriesWithCounts(section.id),
    getYears(),
    listFiles({ sectionId: section.id, limit: 1000 }),
  ]);
  const activeCategory = categories.find((c) => c.slug === categorySlug);
  const files = await listFiles({
    sectionId: section.id,
    categoryId: activeCategory?.id,
    importance,
    year,
    sort,
    limit: 300,
  });

  const Icon = ICONS[slug] ?? Files;
  const total = allInSection.length;

  const buildHref = (patch: Record<string, string | undefined>) => {
    const next = new URLSearchParams();
    const current: Record<string, string | undefined> = { c: categorySlug, i: importance, year, sort: sort === "default" ? undefined : sort };
    const merged = { ...current, ...patch };
    for (const [k, v] of Object.entries(merged)) if (v) next.set(k, v);
    return `/${slug}${next.toString() ? `?${next}` : ""}`;
  };

  const hasFilters = Boolean(categorySlug || importance || year);

  return (
    <>
      <section
        className="relative overflow-hidden border-b border-[var(--line)]"
        style={{
          background: `linear-gradient(135deg, color-mix(in srgb, ${section.accent} 12%, var(--bg)), var(--bg) 60%)`,
        }}
      >
        <div className="container-x py-9 sm:py-11">
          <nav aria-label="breadcrumb" className="text-[11.5px] font-medium text-[var(--muted)]">
            <Link href="/" className="hover:text-[var(--text)]">
              {t(lang, "navHome")}
            </Link>
            <span className="mx-1.5">/</span>
            <span aria-current="page">{pickText(lang, section.name_ar, section.name_en)}</span>
          </nav>
          <div className="mt-4 flex flex-wrap items-start gap-4">
            <span
              className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border"
              style={{
                background: `color-mix(in srgb, ${section.accent} 14%, var(--card))`,
                color: section.accent,
                borderColor: `color-mix(in srgb, ${section.accent} 25%, var(--line))`,
              }}
            >
              <Icon className="h-7 w-7" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <h1 className="font-display text-[26px] font-extrabold leading-tight sm:text-[32px]">
                {pickText(lang, section.name_ar, section.name_en)}
              </h1>
              <p className="mt-1.5 max-w-2xl text-[13.5px] leading-relaxed text-[var(--muted)]">
                {pickText(lang, section.description_ar, section.description_en) || t(lang, DESC[slug] ?? "sectionCaseDesc")}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-[11.5px] font-semibold text-[var(--muted)]">
                <span className="rounded-full border border-[var(--line)] bg-[var(--card)] px-2.5 py-1">
                  {filesLabel(total, lang)}
                </span>
                <span className="rounded-full border border-[var(--line)] bg-[var(--card)] px-2.5 py-1">
                  {categoriesLabel(categories.length, lang)}
                </span>
              </div>
            </div>
            <div className="w-full max-w-sm">
              <SearchBox lang={lang} size="sm" placeholder={t(lang, "inThisSection")} />
            </div>
          </div>
        </div>
      </section>

      <div className="container-x py-6">
        <div className="no-scrollbar -mx-4 flex items-center gap-2 overflow-x-auto px-4 pb-2 sm:mx-0 sm:flex-wrap sm:px-0">
          <Link href={buildHref({ c: undefined })} className={`chip ${!categorySlug ? "chip-active" : ""}`}>
            {t(lang, "filterAll")}
            <span className="rounded-full bg-black/10 px-1.5 text-[10px] font-bold">{formatNumber(total, lang)}</span>
          </Link>
          {categories.map((c) => (
            <Link key={c.id} href={buildHref({ c: c.slug })} className={`chip ${categorySlug === c.slug ? "chip-active" : ""}`}>
              {pickText(lang, c.name_ar, c.name_en)}
              <span className="rounded-full bg-black/10 px-1.5 text-[10px] font-bold">{formatNumber(Number(c.file_count), lang)}</span>
            </Link>
          ))}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2 border-y border-[var(--line)] py-3">
          <span className="inline-flex items-center gap-1.5 text-[11.5px] font-bold text-[var(--muted)]">
            <Filter className="h-3.5 w-3.5" aria-hidden="true" />
            {t(lang, "importance")}:
          </span>
          {[
            { key: undefined, label: t(lang, "filterAll") },
            { key: "essential", label: t(lang, "essential") },
            { key: "important", label: t(lang, "important") },
            { key: "reference", label: t(lang, "reference") },
          ].map((opt) => (
            <Link
              key={opt.key ?? "all"}
              href={buildHref({ i: opt.key })}
              className={`chip !py-1 !text-[11.5px] ${importance === opt.key || (!importance && !opt.key) ? "chip-active" : ""}`}
            >
              {opt.label}
            </Link>
          ))}

          {years.length > 0 && (
            <div className="inline-flex items-center">
              <FilterSelect
                label={t(lang, "edition")}
                param="year"
                basePath={`/${slug}`}
                options={[{ value: "", label: t(lang, "yearAll") }, ...years.map((y) => ({ value: y, label: y }))]}
              />
            </div>
          )}

          <div className="ms-auto flex items-center gap-2">
            {hasFilters && (
              <Link href={`/${slug}`} className="btn btn-ghost btn-sm gap-1">
                <X className="h-3.5 w-3.5" /> {t(lang, "resetFilters")}
              </Link>
            )}
            <SortSelect lang={lang} basePath={`/${slug}`} />
          </div>
        </div>

        <p className="mt-4 text-[12px] font-semibold text-[var(--muted)]">
          {t(lang, "resultsCount")}: {formatNumber(files.length, lang)}
          {importance ? ` · ${t(lang, importance as "essential")}` : ""}
        </p>

        <div className="mt-3 space-y-2.5">
          {files.map((f) => (
            <FileCard key={f.id} file={f} lang={lang} variant="row" />
          ))}
        </div>

        {files.length === 0 && (
          <div className="card mt-6 flex flex-col items-center gap-3 p-12 text-center">
            <Files className="h-10 w-10 text-[var(--muted)]" aria-hidden="true" />
            <p className="text-[14px] font-bold">{t(lang, "noDocuments")}</p>
            <Link href={`/${slug}`} className="btn btn-outline btn-sm">
              {t(lang, "resetFilters")}
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
