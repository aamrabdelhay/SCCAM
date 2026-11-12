import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Files,
  Library,
  Scale,
  Sparkles,
} from "lucide-react";
import { getLang } from "@/lib/server-lang";
import { getFileCounts, getPageCounts, getSections, getSiteSettings, listFiles } from "@/lib/queries";
import { formatNumber, pickText, filesLabel } from "@/lib/format";
import { SearchBox } from "@/components/SearchBox";
import { FileCard } from "@/components/FileCard";
import { SubmissionCountdown } from "@/components/SubmissionCountdown";
import { ImportanceBadge } from "@/components/Badges";
import { t } from "@/lib/i18n";

export const dynamic = "force-dynamic";

const SECTION_ICONS: Record<string, typeof Scale> = { case: Scale, laws: BookOpen, books: Library };

export default async function HomePage() {
  const lang = await getLang();
  const [sections, counts, fileCounts, pinned, allFiles, settings] = await Promise.all([
    getSections(),
    getPageCounts(),
    getFileCounts(),
    listFiles({ pinnedOnly: true, limit: 6 }),
    listFiles({ limit: 1000 }),
    getSiteSettings(),
  ]);
  const Arrow = lang === "ar" ? ArrowLeft : ArrowRight;
  const bestMemos = allFiles
    .filter((file) => /(?:مذكر(?:ة|ات)|memorials?|memorand(?:um|a)|skeleton\s+argument)/i.test(
      [file.title_ar, file.title_en, file.description_ar, file.description_en, file.tags].join(" "),
    ))
    .slice(0, 6);

  return (
    <>
      <SubmissionCountdown lang={lang} settings={settings} />
      <section className="relative mt-4 overflow-hidden border-b border-[var(--line)]">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{
          background: "radial-gradient(900px 380px at 88% -8%, color-mix(in srgb, var(--brand-blue) 20%, transparent), transparent 70%), radial-gradient(720px 340px at 5% 0%, color-mix(in srgb, var(--brand-green) 17%, transparent), transparent 70%), radial-gradient(520px 300px at 50% 16%, color-mix(in srgb, var(--brand-yellow) 15%, transparent), transparent 70%), radial-gradient(440px 280px at 100% 78%, color-mix(in srgb, var(--brand-orange) 11%, transparent), transparent 70%)",
        }} />
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-30" style={{
          backgroundImage: "linear-gradient(to right, var(--line) 1px, transparent 1px), linear-gradient(to bottom, var(--line) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage: "radial-gradient(ellipse at 50% 0%, black 25%, transparent 72%)",
          WebkitMaskImage: "radial-gradient(ellipse at 50% 0%, black 25%, transparent 72%)",
        }} />
        <div className="container-x relative grid gap-10 py-14 lg:grid-cols-[1.15fr_0.85fr] lg:py-20">
          <div className="animate-fade-up">
            <h1 className="font-display max-w-2xl text-[32px] font-extrabold leading-[1.15] tracking-tight sm:text-[42px] lg:text-[48px]">
              {lang === "ar" ? "مكتبتك للبحث القانوني" : "Your legal research library"}
            </h1>
            <p className="mt-4 max-w-xl text-[14.5px] leading-relaxed text-[var(--muted)] sm:text-base">
              {lang === "ar"
                ? "ملف القضية والقوانين والكتب والمراجع والأحكام المنشورة في مساحة واحدة."
                : "Case materials, laws, books, references and published judgments in one place."}
            </p>
            <div className="mt-7 max-w-2xl">
              <SearchBox lang={lang} size="lg" />
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-2.5">
              <Link href="/case" className="btn btn-primary">
                {lang === "ar" ? "تصفح ملف القضية" : "Browse the case file"} <Arrow className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link href="/references" className="btn btn-outline">
                {lang === "ar" ? "تصفح المراجع" : "Browse references"}
              </Link>
            </div>
            <dl className="mt-8 grid max-w-lg grid-cols-3 gap-3">
              {[
                { label: lang === "ar" ? "الملفات" : "Files", value: formatNumber(fileCounts.files, lang), icon: Files },
                { label: lang === "ar" ? "الصفحات" : "Pages", value: formatNumber(fileCounts.pages, lang), icon: BookOpen },
                { label: lang === "ar" ? "الأقسام" : "Sections", value: formatNumber(sections.length, lang), icon: Library },
              ].map((item) => (
                <div key={item.label} className="rounded-xl border border-[var(--line)] bg-[var(--card)]/85 p-3 backdrop-blur">
                  <item.icon className="h-4 w-4 text-[var(--accent)]" aria-hidden="true" />
                  <dd className="font-display mt-1 text-lg font-extrabold leading-none">{item.value}</dd>
                  <dt className="mt-1 text-[10.5px] font-medium text-[var(--muted)]">{item.label}</dt>
                </div>
              ))}
            </dl>
          </div>
          <div className="relative hidden min-h-[330px] lg:block" aria-hidden="true">
            <div className="absolute inset-x-6 top-6 h-full rotate-[-4deg] rounded-2xl border border-[var(--line)] bg-[var(--card)] opacity-70 shadow-sm" />
            <div className="absolute inset-x-3 top-3 h-full rotate-[-2deg] rounded-2xl border border-[var(--line)] bg-[var(--card)] opacity-85 shadow-sm" />
            <div className="card relative h-full overflow-hidden p-5">
              <div className="flex items-center justify-between">
                <span className="badge badge-important">{lang === "ar" ? "بحث قانوني" : "LEGAL RESEARCH"}</span>
                <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--muted)]">SCCAM / LIBRARY</span>
              </div>
              <div className="mt-5 h-2.5 w-2/3 rounded-full bg-[var(--primary)] opacity-80" />
              <div className="mt-2 h-2 w-1/2 rounded-full bg-[var(--muted)] opacity-30" />
              <div className="mt-7 space-y-3">
                {[92, 88, 76, 95, 60, 84, 70].map((width, index) => (
                  <div key={index} className="h-1.5 rounded-full bg-[var(--muted)] opacity-[0.18]" style={{ width: width + "%" }} />
                ))}
              </div>
              <div className="mt-7 flex items-center gap-2 rounded-xl bg-[var(--surface)] p-3">
                <span className="h-3 w-3 rounded-full bg-[var(--primary)]" />
                <span className="h-1.5 w-24 rounded-full bg-[var(--primary)] opacity-40" />
                <span className="ms-auto h-5 w-12 rounded-md bg-[var(--accent)] opacity-80" />
              </div>
              <div className="mt-5 flex gap-2">
                {["UNCITRAL", "ICSID", "PCA"].map((label) => (
                  <span key={label} className="rounded-full border border-[var(--line)] px-2.5 py-1 text-[9px] font-semibold text-[var(--muted)]">{label}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section aria-labelledby="sections-title" className="container-x mt-14">
        <div className="mb-5">
          <h2 id="sections-title" className="section-title">{t(lang, "sectionsTitle")}</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {sections.map((section) => {
            const Icon = SECTION_ICONS[section.slug] ?? Scale;
            const count = counts[section.id] ?? { files: 0, categories: 0 };
            const sectionColor = section.slug === "laws" ? "var(--sky)" : section.slug === "books" ? "var(--accent)" : "var(--primary)";
            const descKey = section.slug === "laws" ? "sectionLawsDesc" : section.slug === "books" ? "sectionBooksDesc" : "sectionCaseDesc";
            return (
              <Link key={section.id} href={"/" + section.slug} className="card card-hover group relative overflow-hidden p-5" style={{ borderTopColor: sectionColor, borderTopWidth: 3 }}>
                <div className="flex items-start justify-between">
                  <span className="grid h-11 w-11 place-items-center rounded-xl" style={{ background: "color-mix(in srgb, " + sectionColor + " 13%, transparent)", color: sectionColor }}>
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span className="rounded-full bg-[var(--surface)] px-2.5 py-1 text-[10.5px] font-bold text-[var(--muted)]">{filesLabel(count.files, lang)}</span>
                </div>
                <h3 className="font-display mt-3.5 text-[19px] font-extrabold">{pickText(lang, section.name_ar, section.name_en)}</h3>
                <p className="mt-1.5 text-[12.5px] leading-relaxed text-[var(--muted)]">{pickText(lang, section.description_ar, section.description_en) || t(lang, descKey)}</p>
                <div className="mt-4 flex items-center justify-between border-t border-[var(--line)] pt-3 text-[12px] font-semibold" style={{ color: sectionColor }}>
                  <span>{t(lang, "browseSection")}</span><Arrow className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {pinned.length > 0 && (
        <section aria-labelledby="featured-title" className="container-x mt-14">
          <div className="card overflow-hidden" style={{ borderColor: "color-mix(in srgb, var(--accent) 45%, var(--line))" }}>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--line)] bg-[color-mix(in_srgb,var(--accent)_10%,var(--bg))] px-5 py-4">
              <h2 id="featured-title" className="flex items-center gap-2 text-[16px] font-extrabold">
                <Sparkles className="h-4 w-4 text-[var(--accent)]" aria-hidden="true" />
                {t(lang, "mustReadTitle")}
              </h2>
              <Link href="/search?sort=views" className="text-[12.5px] font-semibold link">{t(lang, "searchGlobal")}</Link>
            </div>
            <div className="grid gap-1 p-2 sm:grid-cols-2 lg:grid-cols-3">
              {pinned.map((file) => {
                const sectionColor = file.section_slug === "laws" ? "var(--sky)" : file.section_slug === "books" ? "var(--accent)" : "var(--primary)";
                return (
                <Link key={file.id} href={"/file/" + file.id} className="group flex items-start gap-3 rounded-xl p-3 transition-colors hover:bg-[var(--surface)]">
                  <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg text-[12px] font-extrabold" style={{ background: "color-mix(in srgb, " + sectionColor + " 14%, transparent)", color: sectionColor }}>
                    {formatNumber(file.page_count, lang)}
                  </span>
                  <span className="min-w-0">
                    <span className="line-clamp-2 text-[13px] font-bold leading-snug group-hover:text-[var(--primary)]">{pickText(lang, file.title_ar, file.title_en)}</span>
                    <span className="mt-1 flex items-center gap-1.5">
                      <ImportanceBadge importance={file.importance} lang={lang} />
                      <span className="truncate text-[10.5px] text-[var(--muted)]">{pickText(lang, file.section_name_ar, file.section_name_en)}</span>
                    </span>
                  </span>
                </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      <section aria-labelledby="best-memos-title" className="container-x mt-14">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="best-memos-title" className="section-title">{lang === "ar" ? "أفضل المذكرات" : "Best memoranda"}</h2>
            <p className="mt-1 text-[13px] text-[var(--muted)]">{lang === "ar" ? "مذكرات ومرافعات المنافسة المتاحة داخل المكتبة." : "Competition memoranda and written submissions available in the library."}</p>
          </div>
          <Link href="/memoranda" className="text-[12.5px] font-semibold link">{lang === "ar" ? "عرض القسم" : "View section"}</Link>
        </div>
        {bestMemos.length ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {bestMemos.slice(0, 4).map((file) => <FileCard key={file.id} file={file} lang={lang} showSection />)}
          </div>
        ) : (
          <div className="card p-5 text-[13px] leading-relaxed text-[var(--muted)]">
            {lang === "ar" ? "سيظهر هنا كل ملف يُصنّف كمذكرة أو مرافعة. لا توجد مذكرات مطابقة منشورة حاليًا." : "Memoranda and written submissions will appear here when published. No matching files are currently available."}
          </div>
        )}
      </section>

      <section aria-labelledby="tools-title" className="container-x mb-14 mt-14">
        <div className="mb-5"><h2 id="tools-title" className="section-title">{lang === "ar" ? "أدوات ومصادر الباحث" : "Research tools and resources"}</h2></div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {[
            { href: "/guidelines", title: lang === "ar" ? "الإرشادات" : "Guidelines", body: lang === "ar" ? "إرشادات البحث واستخدام موارد المكتبة." : "Guidance for using the library and researching its materials." },
            { href: "/research-platforms", title: lang === "ar" ? "منصات البحث" : "Research platforms", body: lang === "ar" ? "قواعد بيانات مجانية للسوابق والأحكام الدولية." : "Free databases for international cases and judgments." },
            { href: "/references", title: lang === "ar" ? "المراجع" : "References", body: lang === "ar" ? "مراجع متخصصة في التحكيم والقانون الدولي الخاص." : "Specialist references on arbitration and private international law." },
            { href: "/memoranda", title: lang === "ar" ? "أفضل المذكرات" : "Best memoranda", body: lang === "ar" ? "مذكرات ومرافعات منشورة للمراجعة والبحث." : "Published memoranda and written submissions for research." },
            { href: "/previous-editions", title: lang === "ar" ? "أرشيف الإصدارات السابقة" : "Previous editions", body: lang === "ar" ? "نسخ وإصدارات سابقة من مواد المكتبة." : "Earlier editions and versions of library materials." },
          ].map((item) => (
            <Link key={item.href} href={item.href} className="card card-hover block p-5">
              <h3 className="text-[15px] font-bold text-[var(--primary)]">{item.title}</h3>
              <p className="mt-2 text-[12.5px] leading-relaxed text-[var(--muted)]">{item.body}</p>
              <span className="mt-4 inline-flex text-[12px] font-semibold text-[var(--secondary)]">{lang === "ar" ? "استكشف ←" : "Explore →"}</span>
            </Link>
          ))}
        </div>
      </section>


    </>
  );
}
