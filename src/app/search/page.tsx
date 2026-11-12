import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, FileText, Filter, Layers, SearchX, Sparkles, X } from "lucide-react";
import { getLang } from "@/lib/server-lang";
import { getCategories, getSections, getYears } from "@/lib/queries";
import { searchAll, logSearch, type FileSearchResult } from "@/lib/search-query";
import { t } from "@/lib/i18n";
import type { Lang } from "@/lib/types";
import { formatDate, formatNumber, isNew, isUpdated, pagesLabel, pickText } from "@/lib/format";
import { SearchBox } from "@/components/SearchBox";
import { RecentSearches } from "@/components/search/RecentSearches";
import { Snippet } from "@/components/search/Snippet";
import { ImportanceBadge, NewBadge, PinnedBadge, UpdatedBadge } from "@/components/Badges";
import { FilterSelect } from "@/components/FilterSelect";

export const dynamic = "force-dynamic";

export async function generateMetadata({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }): Promise<Metadata> {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : "";
  const lang = await getLang();
  return {
    title: q ? `${t(lang, "resultsFor", { q })}` : t(lang, "searchGlobal"),
    robots: { index: false, follow: true },
  };
}

export default async function SearchPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const lang = await getLang();
  const sp = await searchParams;
  const q = (typeof sp.q === "string" ? sp.q : "").trim().slice(0, 200);
  const section = typeof sp.section === "string" ? sp.section : undefined;
  const category = typeof sp.category === "string" ? sp.category : undefined;
  const importance = typeof sp.importance === "string" ? sp.importance : undefined;
  const year = typeof sp.year === "string" ? sp.year : undefined;

  const [sections, categories, years] = await Promise.all([getSections(), getCategories(), getYears()]);
  const data = q ? await searchAll(q, { section, category, importance, year }) : null;
  if (q && data) await logSearch(q, data.totalFiles);

  const buildHref = (patch: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    const merged = { q, section, category, importance, year, ...patch };
    for (const [k, v] of Object.entries(merged)) if (v) params.set(k, String(v));
    return `/search?${params}`;
  };
  const hasFilters = Boolean(section || category || importance || year);

  return (
    <div className="container-x py-8">
      <div className="mx-auto max-w-3xl text-center">
        <p className="eyebrow">{t(lang, "searchGlobal")}</p>
        <h1 className="font-display mt-2 text-[26px] font-extrabold sm:text-[32px]">
          {q ? t(lang, "resultsFor", { q }) : t(lang, "searchPlaceholder")}
        </h1>
        <div className="mt-5">
          <SearchBox lang={lang} size="lg" initialQuery={q} />
        </div>
        <RecentSearches lang={lang} />
      </div>

      {q && data && (
        <>
          <div className="mt-8 flex flex-wrap items-center gap-2 border-y border-[var(--line)] py-3">
            <span className="inline-flex items-center gap-1.5 text-[11.5px] font-bold text-[var(--muted)]">
              <Filter className="h-3.5 w-3.5" aria-hidden="true" />
              {t(lang, "section")}:
            </span>
            <Link href={buildHref({ section: undefined, category: undefined })} className={`chip !py-1 !text-[11.5px] ${!section ? "chip-active" : ""}`}>
              {t(lang, "filterAll")}
            </Link>
            {sections.map((s) => (
              <Link key={s.id} href={buildHref({ section: s.slug, category: undefined })} className={`chip !py-1 !text-[11.5px] ${section === s.slug ? "chip-active" : ""}`}>
                {pickText(lang, s.name_ar, s.name_en)}
              </Link>
            ))}
            <div className="ms-auto flex flex-wrap items-center gap-2">
              <FilterSelect
                label={t(lang, "subCategory")}
                param="category"
                basePath="/search"
                options={[
                  { value: "", label: t(lang, "categoryAll") },
                  ...categories
                    .filter((c) => !section || c.section_id === sections.find((s) => s.slug === section)?.id)
                    .map((c) => ({ value: c.slug, label: pickText(lang, c.name_ar, c.name_en) })),
                ]}
              />
              <FilterSelect
                label={t(lang, "importance")}
                param="importance"
                basePath="/search"
                options={[
                  { value: "", label: t(lang, "filterAll") },
                  { value: "essential", label: t(lang, "essential") },
                  { value: "important", label: t(lang, "important") },
                  { value: "reference", label: t(lang, "reference") },
                ]}
              />
              {years.length > 0 && (
                <FilterSelect
                  label={t(lang, "year")}
                  param="year"
                  basePath="/search"
                  options={[{ value: "", label: t(lang, "yearAll") }, ...years.map((y) => ({ value: y, label: y }))]}
                />
              )}
              {hasFilters && (
                <Link href={`/search?q=${encodeURIComponent(q)}`} className="btn btn-ghost btn-sm gap-1">
                  <X className="h-3.5 w-3.5" /> {t(lang, "resetFilters")}
                </Link>
              )}
            </div>
          </div>

          <p className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] font-semibold text-[var(--muted)]">
            <span>
              {t(lang, "resultsCount")}: {formatNumber(data.totalFiles, lang)} · {pagesLabel(data.totalPages, lang)}
            </span>
            <span className="inline-flex items-center gap-1">
              <Layers className="h-3 w-3" /> {data.took} ms
            </span>
            {data.interpretation.length > 0 && (
              <span className="font-normal opacity-80">({data.interpretation.join(" · ")})</span>
            )}
          </p>

          <div className="mt-4 space-y-3">
            {data.results.map((r) => (
              <FileResultCard key={r.file.id} result={r} lang={lang} q={q} />
            ))}
          </div>

          {data.results.length === 0 && (
            <div className="card mt-6 flex flex-col items-center gap-3 p-12 text-center">
              <SearchX className="h-10 w-10 text-[var(--muted)]" aria-hidden="true" />
              <p className="text-[15px] font-bold">{t(lang, "noResults")}</p>
              <p className="max-w-md text-[12.5px] text-[var(--muted)]">{t(lang, "noResultsHint")}</p>
              {data.suggestion && (
                <Link href={`/search?q=${encodeURIComponent(data.suggestion)}`} className="btn btn-outline btn-sm gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" /> {t(lang, "didYouMean")} {data.suggestion}
                </Link>
              )}
            </div>
          )}
        </>
      )}

      {!q && (
        <div className="mx-auto mt-10 max-w-2xl">
          <div className="card p-5">
            <h2 className="text-[14px] font-bold">{t(lang, "searchHint", { key: "/" })}</h2>
            <ul className="mt-2 space-y-1.5 text-[12.5px] leading-relaxed text-[var(--muted)]">
              <li>· {lang === "ar" ? "ابحث في العنوان والوصف والوسوم ونص كل صفحة." : "Searches titles, descriptions, tags and the full text of every page."}</li>
              <li>· {lang === "ar" ? "استخدم علامات التنصيص لعبارة حرفية: \"arbitral tribunal\"." : "Use quotes for an exact phrase: \"arbitral tribunal\"."}</li>
              <li>· {lang === "ar" ? "البحث يتجاهل التشكيل وفروق الألف والياء والتاء المربوطة." : "Diacritics, alef/ya variants and ta-marbuta are normalised."}</li>
              <li>· {lang === "ar" ? "لا حاجة لكلمات كاملة — البحث يطابق بدايات الكلمات." : "Partial words match as prefixes."}</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

function FileResultCard({ result, lang, q }: { result: FileSearchResult; lang: Lang; q: string }) {
  const f = result.file;
  const title = pickText(lang, f.title_ar, f.title_en);
  return (
    <article className="card overflow-hidden">
      <div className="flex flex-wrap items-start gap-3 border-b border-[var(--line)] bg-[var(--surface)]/60 p-4">
        <span
          className="grid h-10 w-10 shrink-0 place-items-center rounded-xl"
          style={{ background: `color-mix(in srgb, ${f.section_accent} 14%, transparent)`, color: f.section_accent }}
        >
          <FileText className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-[14.5px] font-bold leading-snug">
            <Link href={`/file/${f.id}?q=${encodeURIComponent(q)}`} className="hover:underline">
              {title}
            </Link>
          </h2>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <span className="badge" style={{ background: `color-mix(in srgb, ${f.section_accent} 14%, transparent)`, color: f.section_accent }}>
              {pickText(lang, f.section_name_ar, f.section_name_en)}
            </span>
            <ImportanceBadge importance={f.importance} lang={lang} />
            {f.pinned === 1 && <PinnedBadge lang={lang} />}
            {isNew(f.created_at) && <NewBadge lang={lang} />}
            {isUpdated(f.updated_at, f.created_at) && <UpdatedBadge lang={lang} />}
            <span className="text-[11px] text-[var(--muted)]">
              {pagesLabel(f.page_count, lang)} · {formatDate(f.updated_at, lang)}
            </span>
          </div>
        </div>
        <span className="rounded-full bg-[var(--card)] px-2.5 py-1 text-[10.5px] font-bold text-[var(--muted)]">
          {t(lang, "matchCount", { n: result.matchCount })}
        </span>
      </div>
      <ul className="divide-y divide-[var(--line)]">
        {result.pages.map((p, i) => (
          <li key={`${p.pageNo}-${i}`} className="flex flex-wrap items-start gap-3 p-3.5 hover:bg-[var(--surface)]/50">
            <span className="mt-0.5 inline-flex shrink-0 items-center gap-1 rounded-md bg-[var(--surface)] px-2 py-1 text-[10.5px] font-bold text-[var(--muted)]">
              {t(lang, "page")} {p.pageNo}
            </span>
            <div className="min-w-0 flex-1">
              <Snippet snippet={p.snippet} dir="auto" />
              {p.kind === "metadata" && (
                <span className="mt-1 inline-block text-[10px] font-semibold uppercase tracking-wide text-[var(--accent)]">
                  {t(lang, "fileDetails")}
                </span>
              )}
            </div>
            <Link
              href={`/file/${f.id}?page=${p.pageNo}&q=${encodeURIComponent(q)}`}
              className="btn btn-outline btn-sm shrink-0 gap-1"
            >
              {t(lang, "openFile")} <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </li>
        ))}
      </ul>
    </article>
  );
}
