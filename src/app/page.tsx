import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock3,
  Layers,
  Library,
  Scale,
  Search,
  Sparkles,
  Smartphone,
  Files,
} from "lucide-react";
import { getLang } from "@/lib/server-lang";
import {
  getDeadlines,
  getFaqs,
  getFileCounts,
  getNews,
  getPageCounts,
  getSections,
  getSiteSettings,
  listFiles,
} from "@/lib/queries";
import { t } from "@/lib/i18n";
import { dayBadge, formatDate, formatNumber, pickText, filesLabel } from "@/lib/format";
import { SearchBox } from "@/components/SearchBox";
import { FileCard } from "@/components/FileCard";
import { Countdown } from "@/components/Countdown";
import { FaqAccordion } from "@/components/FaqAccordion";
import { ContinueReading } from "@/components/ContinueReading";
import { ImportanceBadge } from "@/components/Badges";

export const dynamic = "force-dynamic";

const SECTION_ICONS: Record<string, typeof Scale> = { case: Scale, laws: BookOpen, books: Library };

export default async function HomePage() {
  const lang = await getLang();
  const [settings, sections, counts, fileCounts, pinned, latest, news, faqs, deadlines] = await Promise.all([
    getSiteSettings(),
    getSections(),
    getPageCounts(),
    getFileCounts(),
    listFiles({ pinnedOnly: true, limit: 6 }),
    listFiles({ sort: "newest", limit: 6 }),
    getNews(4),
    getFaqs(),
    getDeadlines(),
  ]);

  const Arrow = lang === "ar" ? ArrowLeft : ArrowRight;
  const upcoming = deadlines.filter((d) => new Date(d.due_at).getTime() > Date.now() - 86400000).slice(0, 3);
  const featured = pinned.length ? pinned : latest.slice(0, 3);

  return (
    <>
      {/* ---------------- HERO ---------------- */}
      <section className="relative overflow-hidden border-b border-[var(--line)]">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(1000px 400px at 85% -10%, color-mix(in srgb, var(--accent) 22%, transparent), transparent 70%), radial-gradient(700px 320px at 10% 0%, color-mix(in srgb, var(--primary) 14%, transparent), transparent 70%)",
          }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.35] dark:opacity-[0.12]"
          style={{
            backgroundImage:
              "linear-gradient(to right, var(--line) 1px, transparent 1px), linear-gradient(to bottom, var(--line) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
            maskImage: "radial-gradient(ellipse at 50% 0%, black 25%, transparent 72%)",
            WebkitMaskImage: "radial-gradient(ellipse at 50% 0%, black 25%, transparent 72%)",
          }}
        />
        <div className="container-x relative grid gap-10 py-14 lg:grid-cols-[1.15fr_0.85fr] lg:py-20">
          <div className="animate-fade-up">
            <p className="eyebrow flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              {t(lang, "heroEyebrow")}
            </p>
            <h1 className="font-display mt-3 max-w-2xl text-[32px] font-extrabold leading-[1.15] tracking-tight sm:text-[42px] lg:text-[48px]">
              {t(lang, "heroTitle")}
            </h1>
            <p className="mt-4 max-w-xl text-[14.5px] leading-relaxed text-[var(--muted)] sm:text-base">
              {t(lang, "heroSubtitle")}
            </p>

            <div className="mt-7 max-w-2xl">
              <SearchBox lang={lang} size="lg" />
              <p className="mt-2 flex items-center gap-1.5 text-[11.5px] text-[var(--muted)]">
                <kbd className="rounded border border-[var(--line)] bg-[var(--card)] px-1.5 py-0.5 font-sans text-[10px] font-bold">/</kbd>
                {t(lang, "searchHint", { key: "/" })}
              </p>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-2.5">
              <Link href="/case" className="btn btn-primary">
                {t(lang, "heroCtaPrimary")}
                <Arrow className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link href="/laws" className="btn btn-outline">
                {t(lang, "heroCtaSecondary")}
              </Link>
            </div>

            <dl className="mt-8 grid max-w-lg grid-cols-3 gap-3">
              {[
                { label: t(lang, "allFiles"), value: formatNumber(fileCounts.files, lang), icon: Files },
                { label: t(lang, "pages"), value: formatNumber(fileCounts.pages, lang), icon: Layers },
                { label: t(lang, "footerSections"), value: formatNumber(sections.length, lang), icon: Library },
              ].map((s) => (
                <div key={s.label} className="rounded-xl border border-[var(--line)] bg-[var(--card)]/80 p-3 backdrop-blur">
                  <s.icon className="h-4 w-4 text-[var(--accent)]" aria-hidden="true" />
                  <dd className="font-display mt-1 text-lg font-extrabold leading-none">{s.value}</dd>
                  <dt className="mt-1 text-[10.5px] font-medium text-[var(--muted)]">{s.label}</dt>
                </div>
              ))}
            </dl>
          </div>

          {/* Decorative document stack — abstract, original */}
          <div className="relative hidden min-h-[340px] lg:block" aria-hidden="true">
            <div className="absolute inset-x-6 top-6 h-full rotate-[-4deg] rounded-2xl border border-[var(--line)] bg-[var(--card)] opacity-70 shadow-sm" />
            <div className="absolute inset-x-3 top-3 h-full rotate-[-2deg] rounded-2xl border border-[var(--line)] bg-[var(--card)] opacity-85 shadow-sm" />
            <div className="card relative h-full overflow-hidden p-5">
              <div className="flex items-center justify-between">
                <span className="badge badge-essential">{t(lang, "essential")}</span>
                <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--muted)]">MEMO / 2026</span>
              </div>
              <div className="mt-4 h-2.5 w-2/3 rounded-full bg-[var(--primary)] opacity-80" />
              <div className="mt-2 h-2 w-1/2 rounded-full bg-[var(--muted)] opacity-30" />
              <div className="mt-6 space-y-2.5">
                {[92, 88, 76, 95, 60, 84, 70].map((w, i) => (
                  <div key={i} className="h-1.5 rounded-full bg-[var(--muted)] opacity-[0.18]" style={{ width: `${w}%` }} />
                ))}
              </div>
              <div className="mt-6 flex items-center gap-2 rounded-xl bg-[var(--surface)] p-2.5">
                <CheckCircle2 className="h-4 w-4 text-[var(--primary)]" />
                <div className="h-1.5 w-24 rounded-full bg-[var(--primary)] opacity-40" />
                <div className="ms-auto rounded-md px-2 py-1 text-[9px] font-bold" style={{ background: "color-mix(in srgb, var(--accent) 25%, transparent)" }}>
                  {t(lang, "viewerSearch")}
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                {["New York Convention", "UNCITRAL", "IBA Rules"].map((x) => (
                  <span key={x} className="rounded-full border border-[var(--line)] px-2 py-1 text-[9px] font-semibold text-[var(--muted)]">
                    {x}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- WHY ---------------- */}
      <section aria-labelledby="why-title" className="container-x mt-14">
        <div className="mb-5 flex items-end justify-between gap-4">
          <h2 id="why-title" className="section-title">
            {t(lang, "whyTitle")}
          </h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { icon: Layers, title: t(lang, "why1Title"), body: t(lang, "why1Body") },
            { icon: Search, title: t(lang, "why2Title"), body: t(lang, "why2Body") },
            { icon: Smartphone, title: t(lang, "why3Title"), body: t(lang, "why3Body") },
          ].map((c, i) => (
            <article key={c.title} className="card card-hover p-5" style={{ animationDelay: `${i * 60}ms` }}>
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--primary-soft)] text-[var(--primary)] dark:text-[var(--accent)]">
                <c.icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <h3 className="mt-3.5 text-[14.5px] font-bold">{c.title}</h3>
              <p className="mt-1.5 text-[12.5px] leading-relaxed text-[var(--muted)]">{c.body}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ---------------- SECTIONS ---------------- */}
      <section aria-labelledby="sections-title" className="container-x mt-14">
        <div className="mb-5 flex items-end justify-between gap-4">
          <h2 id="sections-title" className="section-title">
            {t(lang, "sectionsTitle")}
          </h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {sections.map((s) => {
            const Icon = SECTION_ICONS[s.slug] ?? Scale;
            const c = counts[s.id] ?? { files: 0, categories: 0 };
            const descKey =
              s.slug === "laws" ? "sectionLawsDesc" : s.slug === "books" ? "sectionBooksDesc" : "sectionCaseDesc";
            return (
              <Link
                key={s.id}
                href={`/${s.slug}`}
                className="card card-hover group relative overflow-hidden p-5"
                style={{ borderTopColor: s.accent, borderTopWidth: 3 }}
              >
                <div className="flex items-start justify-between">
                  <span
                    className="grid h-11 w-11 place-items-center rounded-xl"
                    style={{ background: `color-mix(in srgb, ${s.accent} 13%, transparent)`, color: s.accent }}
                  >
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span className="rounded-full bg-[var(--surface)] px-2.5 py-1 text-[10.5px] font-bold text-[var(--muted)]">
                    {filesLabel(c.files, lang)}
                  </span>
                </div>
                <h3 className="font-display mt-3.5 text-[19px] font-extrabold">{pickText(lang, s.name_ar, s.name_en)}</h3>
                <p className="mt-1.5 text-[12.5px] leading-relaxed text-[var(--muted)]">
                  {pickText(lang, s.description_ar, s.description_en) || t(lang, descKey)}
                </p>
                <div className="mt-4 flex items-center justify-between border-t border-[var(--line)] pt-3 text-[12px] font-semibold" style={{ color: s.accent }}>
                  <span>{t(lang, "browseSection")}</span>
                  <Arrow className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ---------------- MUST READ ---------------- */}
      {featured.length > 0 && (
        <section aria-labelledby="mustread-title" className="container-x mt-14">
          <div className="card overflow-hidden" style={{ borderColor: "color-mix(in srgb, var(--accent) 45%, var(--line))" }}>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--line)] bg-[color-mix(in_srgb,var(--accent)_10%,var(--bg))] px-5 py-4">
              <div>
                <h2 id="mustread-title" className="flex items-center gap-2 text-[16px] font-extrabold">
                  <Sparkles className="h-4 w-4 text-[var(--accent)]" aria-hidden="true" />
                  {t(lang, "mustReadTitle")}
                </h2>
                <p className="mt-0.5 text-[12px] text-[var(--muted)]">{t(lang, "mustReadSubtitle")}</p>
              </div>
              <Link href="/search?sort=views" className="text-[12.5px] font-semibold link">
                {t(lang, "searchGlobal")}
              </Link>
            </div>
            <div className="grid gap-1 p-2 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((f) => (
                <Link
                  key={f.id}
                  href={`/file/${f.id}`}
                  className="group flex items-start gap-3 rounded-xl p-3 transition-colors hover:bg-[var(--surface)]"
                >
                  <span
                    className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg text-[12px] font-extrabold"
                    style={{ background: `color-mix(in srgb, ${f.section_accent} 14%, transparent)`, color: f.section_accent }}
                  >
                    {formatNumber(f.page_count, lang)}
                  </span>
                  <span className="min-w-0">
                    <span className="line-clamp-2 text-[13px] font-bold leading-snug group-hover:text-[var(--primary)] dark:group-hover:text-[var(--accent)]">
                      {pickText(lang, f.title_ar, f.title_en)}
                    </span>
                    <span className="mt-1 flex items-center gap-1.5">
                      <ImportanceBadge importance={f.importance} lang={lang} />
                      <span className="truncate text-[10.5px] text-[var(--muted)]">
                        {pickText(lang, f.section_name_ar, f.section_name_en)}
                      </span>
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ---------------- LATEST ---------------- */}
      <section aria-labelledby="latest-title" className="container-x mt-14">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h2 id="latest-title" className="section-title">
              {t(lang, "latestTitle")}
            </h2>
            <p className="mt-1 text-[13px] text-[var(--muted)]">{t(lang, "latestSubtitle")}</p>
          </div>
          <Link href="/archive" className="text-[12.5px] font-semibold link">
            {t(lang, "searchGlobal")}
          </Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {latest.map((f) => (
            <FileCard key={f.id} file={f} lang={lang} showSection />
          ))}
        </div>
      </section>

      <ContinueReading lang={lang} />

      {/* ---------------- DEADLINES + NEWS ---------------- */}
      <section className="container-x mt-14 grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        {upcoming.length > 0 && (
          <div>
            <div className="mb-4">
              <h2 className="section-title flex items-center gap-2">
                <Clock3 className="h-5 w-5 text-[var(--accent)]" aria-hidden="true" />
                {t(lang, "deadlinesTitle")}
              </h2>
              <p className="mt-1 text-[13px] text-[var(--muted)]">{t(lang, "deadlinesSubtitle")}</p>
            </div>
            <div className="space-y-3">
              {upcoming.map((d) => (
                <Countdown
                  key={d.id}
                  id={d.id}
                  dueAt={d.due_at}
                  title={pickText(lang, d.title_ar, d.title_en)}
                  note={pickText(lang, d.note_ar, d.note_en)}
                  kind={d.kind}
                  lang={lang}
                />
              ))}
            </div>
          </div>
        )}

        <div>
          <div className="mb-4 flex items-end justify-between gap-4">
            <h2 className="section-title">{t(lang, "newsTitle")}</h2>
            <Link href="/changelog" className="text-[12.5px] font-semibold link">
              {t(lang, "newsAll")}
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {news.map((n) => {
              const badge = dayBadge(n.published_at, lang);
              return (
                <article key={n.id} className="card card-hover flex gap-3.5 p-4">
                  <div
                    className="grid h-14 w-14 shrink-0 place-items-center rounded-xl border"
                    style={{ borderColor: "color-mix(in srgb, var(--accent) 45%, var(--line))", background: "color-mix(in srgb, var(--accent) 10%, var(--bg))" }}
                  >
                    <span className="font-display text-[19px] font-extrabold leading-none">{badge.day}</span>
                    <span className="mt-0.5 text-[9.5px] font-bold uppercase tracking-wider text-[var(--muted)]">{badge.month}</span>
                  </div>
                  <div className="min-w-0">
                    <h3 className="line-clamp-2 text-[13.5px] font-bold leading-snug">{pickText(lang, n.title_ar, n.title_en)}</h3>
                    <p className="mt-1 line-clamp-2 text-[12px] leading-relaxed text-[var(--muted)]">
                      {pickText(lang, n.body_ar, n.body_en)}
                    </p>
                    {n.link && (
                      <a href={n.link} className="mt-1.5 inline-block text-[11.5px] font-semibold link" target="_blank" rel="noreferrer">
                        {t(lang, "openFile")}
                      </a>
                    )}
                  </div>
                </article>
              );
            })}
            {news.length === 0 && (
              <div className="card p-6 text-[13px] text-[var(--muted)]">{t(lang, "noResults")}</div>
            )}
          </div>
        </div>
      </section>

      {/* ---------------- FAQ ---------------- */}
      <section aria-labelledby="faq-title" className="container-x mt-14">
        <div className="grid gap-6 lg:grid-cols-[0.7fr_1.3fr]">
          <div>
            <h2 id="faq-title" className="section-title">
              {t(lang, "faqTitle")}
            </h2>
            <p className="mt-1 text-[13px] text-[var(--muted)]">{t(lang, "faqSubtitle")}</p>
            <Link href="/contact" className="btn btn-outline mt-4">
              {t(lang, "askAdmin")}
            </Link>
          </div>
          <FaqAccordion items={faqs} lang={lang} />
        </div>
      </section>

      {/* ---------------- CTA ---------------- */}
      <section className="container-x mt-16">
        <div
          className="relative overflow-hidden rounded-3xl border border-[var(--line)] p-8 sm:p-10"
          style={{ background: "linear-gradient(120deg, color-mix(in srgb, var(--primary) 12%, var(--bg)), color-mix(in srgb, var(--accent) 14%, var(--bg)))" }}
        >
          <div className="relative max-w-2xl">
            <h2 className="font-display text-[22px] font-extrabold sm:text-[26px]">{t(lang, "myLibrary")}</h2>
            <p className="mt-2 text-[13.5px] leading-relaxed text-[var(--muted)]">{t(lang, "myLibraryDesc")}</p>
            <div className="mt-5 flex flex-wrap gap-2.5">
              <Link href="/library" className="btn btn-primary">
                {t(lang, "myLibrary")}
              </Link>
              <Link href="/glossary" className="btn btn-outline">
                {t(lang, "glossaryTitle")}
              </Link>
            </div>
          </div>
        </div>
        <p className="mt-4 text-center text-[11px] text-[var(--muted)]">{t(lang, "unofficialFooter")}</p>
      </section>
    </>
  );
}
