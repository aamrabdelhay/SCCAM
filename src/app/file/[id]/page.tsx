import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Download,
  Eye,
  FileText,
  Layers,
  Printer,
  Ruler,
  ShieldCheck,
  Sparkles,
  Tag,
} from "lucide-react";
import { getLang } from "@/lib/server-lang";
import {
  getChangelogForFile,
  getFile,
  getRelatedFiles,
  getVersions,
  getGlossary,
  getCategories,
} from "@/lib/queries";
import { t } from "@/lib/i18n";
import type { Lang } from "@/lib/types";
import { formatBytes, formatDate, formatNumber, isNew, isUpdated, pagesLabel, pickText } from "@/lib/format";
import { canOpenFile } from "@/lib/file-access";
import { getSession } from "@/lib/auth";
import { FileViewer } from "@/components/file/FileViewer";
import { SharePanel } from "@/components/file/SharePanel";
import { PageRangeTool } from "@/components/file/PageRangeTool";
import { CitationBox } from "@/components/file/CitationBox";
import { UnlockForm } from "@/components/file/UnlockForm";
import { FileMiniCard } from "@/components/FileCard";
import { ImportanceBadge, NewBadge, PinnedBadge, UpdatedBadge } from "@/components/Badges";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ params, searchParams }: Params): Promise<Metadata> {
  const { id } = await params;
  const sp = await searchParams;
  const [file, lang] = await Promise.all([getFile(id), getLang()]);
  if (!file) return { title: "404" };
  const title = pickText(lang, file.title_ar, file.title_en);
  const page = typeof sp.page === "string" ? Number(sp.page) : 0;
  const desc = pickText(lang, file.description_ar, file.description_en) || title;
  return {
    title: page > 1 ? `${title} — ${t(lang, "page")} ${page}` : title,
    description: desc.slice(0, 180),
    alternates: { canonical: `/file/${id}` },
    openGraph: {
      type: "article",
      title: page > 1 ? `${title} — ${t(lang, "page")} ${page}` : title,
      description: desc.slice(0, 180),
      images: [{ url: "/og.png", width: 1200, height: 630, alt: title }],
    },
    twitter: { card: "summary_large_image", title, description: desc.slice(0, 180), images: ["/og.png"] },
    robots: file.file_password_hash ? { index: false, follow: false } : { index: true, follow: true },
  };
}

export default async function FilePage({ params, searchParams }: Params) {
  const { id } = await params;
  const sp = await searchParams;
  const lang = await getLang();
  const isAdmin = Boolean(await getSession());
  const file = await getFile(id, isAdmin);
  if (!file) notFound();

  const [versions, related, changelog, glossary, categories] = await Promise.all([
    getVersions(id),
    getRelatedFiles(file),
    getChangelogForFile(id),
    getGlossary(),
    getCategories(file.section_id),
  ]);

  const viewLang = lang;
  const title = pickText(viewLang, file.title_ar, file.title_en);
  const description = pickText(viewLang, file.description_ar, file.description_en);
  const sectionName = pickText(viewLang, file.section_name_ar, file.section_name_en);
  const category = categories.find((c) => c.id === file.category_id);
  const categoryName = category ? pickText(viewLang, category.name_ar, category.name_en) : null;
  const initialPage = Math.max(1, Math.min(file.page_count || 1, Number(sp.page) || 1));
  const query = typeof sp.q === "string" ? sp.q : undefined;
  const unlocked = await canOpenFile(file);
  const Arrow = viewLang === "ar" ? ArrowLeft : ArrowRight;

  const tags = file.tags
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
  const hasText = file.page_count > 0 && !["pending", "failed", "processing"].includes(file.text_status);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "DigitalDocument",
    name: title,
    description,
    inLanguage: /[\u0600-\u06FF]/.test(title) ? "ar" : "en",
    dateModified: file.updated_at,
    datePublished: file.created_at,
    keywords: tags.join(", "),
    isAccessibleForFree: true,
    publisher: { "@type": "Organization", name: "Unofficial community library" },
  };

  return (
    <div className="container-x py-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <nav aria-label="breadcrumb" className="flex flex-wrap items-center gap-1.5 text-[11.5px] font-medium text-[var(--muted)]">
        <Link href="/" className="hover:text-[var(--text)]">
          {t(lang, "navHome")}
        </Link>
        <span>/</span>
        <Link href={`/${file.section_slug}`} className="hover:text-[var(--text)]">
          {sectionName}
        </Link>
        {category && (
          <>
            <span>/</span>
            <Link href={`/${file.section_slug}?c=${category.slug}`} className="hover:text-[var(--text)]">
              {categoryName}
            </Link>
          </>
        )}
      </nav>

      <header className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <ImportanceBadge importance={file.importance} lang={lang} />
            {file.pinned === 1 && <PinnedBadge lang={lang} />}
            {isNew(file.created_at) && <NewBadge lang={lang} />}
            {isUpdated(file.updated_at, file.created_at) && <UpdatedBadge lang={lang} />}
            <span
              className="badge"
              style={{ background: `color-mix(in srgb, ${file.section_accent} 14%, transparent)`, color: file.section_accent }}
            >
              {sectionName}
            </span>
            {categoryName && <span className="badge badge-reference">{categoryName}</span>}
          </div>
          <h1 className="font-display mt-2 text-[24px] font-extrabold leading-tight sm:text-[30px]" dir="auto">
            {title}
          </h1>
          {pickText(lang, file.title_en, file.title_ar) !== title && (
            <p className="mt-1 text-[13px] text-[var(--muted)]" dir="auto">
              {pickText(lang, file.title_en, file.title_ar)}
            </p>
          )}
          {description && (
            <p className="mt-2 max-w-3xl text-[13.5px] leading-relaxed text-[var(--muted)]" dir="auto">
              {description}
            </p>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11.5px] font-medium text-[var(--muted)]">
            <span className="inline-flex items-center gap-1">
              <Layers className="h-3.5 w-3.5" /> {pagesLabel(file.page_count, lang)}
            </span>
            <span className="inline-flex items-center gap-1">
              <Eye className="h-3.5 w-3.5" /> {t(lang, "viewsShort", { n: formatNumber(file.views, lang) })}
            </span>
            <span className="inline-flex items-center gap-1">
              <CalendarDays className="h-3.5 w-3.5" /> {t(lang, "updatedOn", { date: formatDate(file.updated_at, lang) })}
            </span>
            <span className="inline-flex items-center gap-1">
              <Ruler className="h-3.5 w-3.5" /> {formatBytes(file.size_bytes)}
            </span>
            <span className="inline-flex items-center gap-1 uppercase">
              <FileText className="h-3.5 w-3.5" /> {file.mime.split("/").pop()?.replace("vnd.openxmlformats-officedocument.wordprocessingml.document", "docx")}
            </span>
            {file.edition_year && (
              <span className="inline-flex items-center gap-1">
                <CalendarDays className="h-3.5 w-3.5" /> {file.edition_year}
              </span>
            )}
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Link href={`/${file.section_slug}`} className="btn btn-outline btn-sm gap-1.5">
            <Arrow className="h-3.5 w-3.5 rtl:rotate-180" /> {t(lang, "backToSection")}
          </Link>
          {file.download_allowed && unlocked ? (
            <a href={`/api/files/${file.id}/download`} className="btn btn-primary btn-sm gap-1.5" download>
              <Download className="h-3.5 w-3.5" /> {t(lang, "downloadPdf")}
            </a>
          ) : (
            <span className="chip !cursor-not-allowed opacity-70" title={t(lang, "downloadNotAllowed")}>
              <Download className="h-3.5 w-3.5" /> {t(lang, "downloadNotAllowed")}
            </span>
          )}
          {file.print_allowed && unlocked && (
            <a href={`/file/${file.id}/print`} target="_blank" rel="noopener" className="btn btn-outline btn-sm gap-1.5">
              <Printer className="h-3.5 w-3.5" /> {t(lang, "print")}
            </a>
          )}
        </div>
      </header>

      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0">
          {unlocked ? (
            <FileViewer
              fileId={file.id}
              fileTitle={title}
              mime={file.mime}
              pageCount={file.page_count}
              lang={lang}
              initialPage={initialPage}
              initialQuery={query}
              downloadAllowed={Boolean(file.download_allowed)}
              printAllowed={Boolean(file.print_allowed)}
              glossary={glossary.map((g) => ({ termAr: g.term_ar, termEn: g.term_en, defAr: g.def_ar, defEn: g.def_en }))}
              sectionSlug={file.section_slug}
              sectionName={sectionName}
            />
          ) : (
            <UnlockForm fileId={file.id} lang={lang} />
          )}

          {file.text_status === "needs_ocr" && (
            <p className="mt-3 flex items-start gap-2 rounded-xl border border-[color-mix(in_srgb,var(--accent)_50%,var(--line))] bg-[color-mix(in_srgb,var(--accent)_10%,var(--bg))] p-3 text-[12px] leading-relaxed">
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent)]" aria-hidden="true" />
              {t(lang, "viewerNoticeScan")}
            </p>
          )}

          {file.source_note && (
            <p className="mt-3 rounded-xl border border-[var(--line)] bg-[var(--surface)] p-3 text-[11.5px] leading-relaxed text-[var(--muted)]">
              <strong className="font-bold text-[var(--text)]">{t(lang, "sourceCredit")}: </strong>
              {file.source_note}
            </p>
          )}

          {tags.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              <Tag className="h-3.5 w-3.5 text-[var(--muted)]" aria-hidden="true" />
              {tags.map((tag) => (
                <Link key={tag} href={`/search?q=${encodeURIComponent(tag)}`} className="chip !py-1 !text-[11px]">
                  {tag}
                </Link>
              ))}
            </div>
          )}

          {/* Versions + changelog */}
          <section className="mt-8">
            <h2 className="section-title text-[19px]">{t(lang, "versionsTab")}</h2>
            <div className="mt-3 overflow-hidden rounded-2xl border border-[var(--line)]">
              <table className="w-full text-start text-[12px]">
                <thead className="bg-[var(--surface)] text-[11px] font-bold uppercase tracking-wide text-[var(--muted)]">
                  <tr>
                    <th className="px-3 py-2 text-start">#</th>
                    <th className="px-3 py-2 text-start">{t(lang, "updated")}</th>
                    <th className="hidden px-3 py-2 text-start sm:table-cell">{t(lang, "fileDetails")}</th>
                    <th className="px-3 py-2 text-end">{t(lang, "openFile")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--line)] bg-[var(--card)]">
                  {versions.map((v) => (
                    <tr key={v.id}>
                      <td className="px-3 py-2 font-bold">
                        v{v.version}
                        {v.version === file.current_version && (
                          <span className="ms-1.5 badge badge-new">{t(lang, "archiveCurrent")}</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-[var(--muted)]">{formatDate(v.created_at, lang)}</td>
                      <td className="hidden px-3 py-2 text-[var(--muted)] sm:table-cell">
                        {v.changelog || "—"} · {pagesLabel(v.page_count, lang)} · {formatBytes(v.size_bytes)}
                      </td>
                      <td className="px-3 py-2 text-end">
                        <Link href={`/file/${file.id}/versions`} className="link text-[11.5px] font-semibold">
                          {t(lang, "compareVersions")}
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {changelog.length > 0 && (
              <ul className="mt-3 space-y-1.5">
                {changelog.slice(0, 6).map((c) => (
                  <li key={c.id} className="flex items-start gap-2 text-[11.5px] text-[var(--muted)]">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--accent)]" />
                    <span>
                      <strong className="font-semibold text-[var(--text)]">
                        {pickText(lang, c.title_ar, c.title_en)}
                      </strong>{" "}
                      · {formatDate(c.created_at, lang)}
                      {pickText(lang, c.detail_ar, c.detail_en) ? ` — ${pickText(lang, c.detail_ar, c.detail_en)}` : ""}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {related.length > 0 && (
            <section className="mt-8">
              <h2 className="section-title text-[19px]">{t(lang, "relatedTitle")}</h2>
              <p className="mt-1 text-[12.5px] text-[var(--muted)]">{t(lang, "relatedDesc")}</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {related.map((r) => (
                  <FileMiniCard key={r.id} file={r} lang={lang} />
                ))}
              </div>
            </section>
          )}
        </div>

        <aside className="space-y-3 lg:sticky lg:top-24 lg:self-start">
          <section className="card p-4">
            <h2 className="text-[13px] font-bold">{t(lang, "fileDetails")}</h2>
            <dl className="mt-2.5 space-y-1.5 text-[11.5px]">
              {[
                [t(lang, "section"), sectionName],
                [t(lang, "subCategory"), categoryName ?? "—"],
                [t(lang, "importance"), t(lang, file.importance === "essential" ? "essential" : file.importance === "important" ? "important" : "reference")],
                [t(lang, "edition"), file.edition_year || "—"],
                [t(lang, "pages"), formatNumber(file.page_count, lang)],
                [t(lang, "formatLabel"), file.mime.includes("pdf") ? "PDF" : file.mime.split("/").pop()],
                [t(lang, "sizeLabel"), formatBytes(file.size_bytes)],
                [t(lang, "dateAdded"), formatDate(file.created_at, lang)],
                [t(lang, "textStatus"), t(lang, statusKey(file.text_status))],
                [t(lang, "allowDownload"), file.download_allowed ? t(lang, "yes") : t(lang, "no")],
                [t(lang, "allowPrint"), file.print_allowed ? t(lang, "yes") : t(lang, "no")],
              ].map(([k, v]) => (
                <div key={k} className="flex items-center justify-between gap-2">
                  <dt className="text-[var(--muted)]">{k}</dt>
                  <dd className="text-end font-semibold">{v}</dd>
                </div>
              ))}
            </dl>
            {file.file_password_hash && (
              <p className="mt-2.5 flex items-center gap-1.5 rounded-lg bg-[var(--surface)] px-2 py-1.5 text-[10.5px] font-semibold text-[var(--muted)]">
                <ShieldCheck className="h-3.5 w-3.5" /> {t(lang, "viewerPasswordTitle")}
              </p>
            )}
          </section>

          <SharePanel lang={lang} title={title} page={initialPage} fileId={file.id} />
          <CitationBox lang={lang} fileId={file.id} title={title} pageCount={file.page_count} />
          <PageRangeTool
            fileId={file.id}
            fileTitle={title}
            pageCount={file.page_count}
            lang={lang}
            hasTextLayer={hasText}
          />

        </aside>
      </div>
    </div>
  );
}

function statusKey(status: string) {
  switch (status) {
    case "extracted":
      return "statusExtracted" as const;
    case "ocr":
      return "statusOcr" as const;
    case "needs_ocr":
      return "statusNeedsOcr" as const;
    case "edited":
      return "statusEdited" as const;
    case "processing":
      return "statusProcessing" as const;
    case "failed":
      return "statusFailed" as const;
    default:
      return "statusPending" as const;
  }
}
