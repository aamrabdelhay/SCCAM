import Link from "next/link";
import { BookA, Search } from "lucide-react";
import { getLang } from "@/lib/server-lang";
import { getGlossary } from "@/lib/queries";
import { t } from "@/lib/i18n";
import { normalizeArabic } from "@/lib/search";

export const dynamic = "force-dynamic";
export const metadata = { title: "Glossary" };

export default async function GlossaryPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const lang = await getLang();
  const sp = await searchParams;
  const q = (typeof sp.q === "string" ? sp.q : "").trim();
  const all = await getGlossary();
  const needle = normalizeArabic(q);
  const rows = needle
    ? all.filter(
        (g) =>
          normalizeArabic(g.term_ar).includes(needle) ||
          normalizeArabic(g.term_en).includes(needle) ||
          normalizeArabic(g.def_ar).includes(needle) ||
          normalizeArabic(g.def_en).includes(needle),
      )
    : all;

  const groups = new Map<string, typeof rows>();
  for (const r of rows) {
    const letter = (lang === "ar" ? r.term_ar : r.term_en).trim().charAt(0).toUpperCase() || "#";
    groups.set(letter, [...(groups.get(letter) ?? []), r]);
  }
  const letters = Array.from(groups.keys()).sort();

  return (
    <div className="container-x py-8">
      <header className="max-w-3xl">
        <p className="eyebrow">{t(lang, "navArchive")}</p>
        <h1 className="font-display mt-2 flex items-center gap-2 text-[26px] font-extrabold sm:text-[32px]">
          <BookA className="h-7 w-7 text-[var(--accent)]" aria-hidden="true" />
          {t(lang, "glossaryTitle")}
        </h1>
        <p className="mt-2 text-[13.5px] leading-relaxed text-[var(--muted)]">{t(lang, "glossaryDesc")}</p>
      </header>

      <form action="/glossary" method="get" className="relative mt-5 max-w-md" role="search">
        <label htmlFor="glossary-q" className="sr-only">
          {t(lang, "glossarySearch")}
        </label>
        <Search className="pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)] start-3" aria-hidden="true" />
        <input
          id="glossary-q"
          name="q"
          defaultValue={q}
          placeholder={t(lang, "glossarySearch")}
          className="field ps-9"
        />
        <button type="submit" className="btn btn-primary btn-sm absolute top-1/2 -translate-y-1/2 end-1">
          {t(lang, "searchAction")}
        </button>
      </form>

      {letters.length > 1 && (
        <nav aria-label="alphabet" className="mt-4 flex flex-wrap gap-1">
          {letters.map((l) => (
            <a key={l} href={`#letter-${encodeURIComponent(l)}`} className="chip !px-2.5 !py-1 !text-[11.5px]">
              {l}
            </a>
          ))}
        </nav>
      )}

      <div className="mt-6 space-y-8">
        {letters.map((letter) => (
          <section key={letter} id={`letter-${encodeURIComponent(letter)}`} className="scroll-mt-24">
            <h2 className="mb-2 flex items-center gap-2 text-[16px] font-extrabold">
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-[var(--surface)] text-[12px] text-[var(--accent)]">{letter}</span>
              <span className="h-px flex-1 bg-[var(--line)]" />
            </h2>
            <div className="grid gap-2.5 md:grid-cols-2">
              {(groups.get(letter) ?? []).map((g) => (
                <article key={g.id} className="card p-4">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h3 className="font-display text-[15px] font-extrabold" dir="auto">
                      {g.term_ar}
                    </h3>
                    <span className="text-[11.5px] font-semibold uppercase tracking-wide text-[var(--muted)]" dir="ltr">
                      {g.term_en}
                    </span>
                  </div>
                  <p className="mt-1.5 text-[12.5px] leading-relaxed text-[var(--muted)]" dir="auto">
                    {lang === "ar" ? g.def_ar || g.def_en : g.def_en || g.def_ar}
                  </p>
                  <Link href={`/search?q=${encodeURIComponent(g.term_en || g.term_ar)}`} className="mt-2 inline-block text-[11px] font-semibold link">
                    {t(lang, "searchGlobal")}
                  </Link>
                </article>
              ))}
            </div>
          </section>
        ))}
        {rows.length === 0 && <div className="card p-10 text-center text-[13px] text-[var(--muted)]">{t(lang, "noGlossary")}</div>}
      </div>
    </div>
  );
}
