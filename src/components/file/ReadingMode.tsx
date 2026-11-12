"use client";

import { useMemo, useState } from "react";
import { ALargeSmall, BookOpen, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { t } from "@/lib/i18n";
import type { Lang } from "@/lib/types";
import type { Note } from "@/lib/client-store";
import { cn } from "@/lib/format";

type GlossaryTerm = { termAr: string; termEn: string; defAr: string; defEn: string };

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Wraps glossary terms in <abbr> so they show a tooltip on hover/focus. */
function annotate(text: string, terms: GlossaryTerm[], lang: Lang) {
  const usable = terms
    .map((g) => ({
      needle: lang === "ar" ? g.termAr : g.termEn,
      title: lang === "ar" ? `${g.termEn} — ${g.defAr || g.defEn}` : `${g.termAr} — ${g.defEn || g.defAr}`,
    }))
    .filter((g) => g.needle && g.needle.length >= 3)
    .sort((a, b) => b.needle.length - a.needle.length)
    .slice(0, 400);
  if (!usable.length) return text;

  const matcher = new RegExp(`(${usable.map((g) => escapeRegExp(g.needle)).join("|")})`, "gi");
  const parts = text.split(matcher);
  if (parts.length === 1) return text;
  const map = new Map(usable.map((g) => [g.needle.toLowerCase(), g.title]));
  let budget = 40;
  return parts.map((part, i) => {
    const title = map.get(part.toLowerCase());
    if (!title || budget <= 0) return part;
    budget -= 1;
    return (
      <abbr
        key={i}
        title={title}
        className="cursor-help border-b border-dotted border-[var(--accent)] no-underline"
      >
        {part}
      </abbr>
    );
  });
}

export function ReadingMode({
  lang,
  fileTitle,
  texts,
  glossary,
  initialPage,
  onPageChange,
  notes,
  onSaveNote,
}: {
  lang: Lang;
  fileTitle: string;
  texts: { pageNo: number; text: string }[];
  glossary: GlossaryTerm[];
  initialPage: number;
  onPageChange: (page: number) => void;
  notes: Note[];
  onSaveNote: (page: number, text: string) => void;
}) {
  const [size, setSize] = useState(17);
  const [activePage, setActivePage] = useState(texts.some((p) => p.pageNo === initialPage) ? initialPage : texts[0]?.pageNo ?? 1);
  const [filter, setFilter] = useState("");
  const [draftNote, setDraftNote] = useState("");

  const pages = useMemo(
    () => (filter.trim() ? texts.filter((p) => p.text.toLowerCase().includes(filter.trim().toLowerCase())) : texts),
    [texts, filter],
  );

  const current = pages.find((p) => p.pageNo === activePage) ?? pages[0];
  const note = notes.find((n) => n.page === current?.pageNo);

  if (!texts.length || texts.every((p) => !p.text.trim())) {
    return (
      <div className="flex flex-col items-center gap-3 p-12 text-center">
        <BookOpen className="h-9 w-9 text-[var(--muted)]" aria-hidden="true" />
        <p className="text-[13px] text-[var(--muted)]">{t(lang, "noTextLayer")}</p>
      </div>
    );
  }

  return (
    <div className="bg-[var(--card)]">
      <div className="flex flex-wrap items-center gap-2 border-b border-[var(--line)] bg-[var(--surface)] px-3 py-2">
        <div className="flex items-center gap-1">
          <ALargeSmall className="h-4 w-4 text-[var(--muted)]" aria-hidden="true" />
          <button type="button" onClick={() => setSize((s) => Math.max(14, s - 1))} className="btn btn-outline btn-sm px-2" aria-label="smaller">
            A−
          </button>
          <button type="button" onClick={() => setSize((s) => Math.min(28, s + 1))} className="btn btn-outline btn-sm px-2" aria-label="larger">
            A+
          </button>
        </div>
        <div className="relative ms-auto w-full max-w-[220px]">
          <Search className="pointer-events-none absolute top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--muted)] start-2.5" aria-hidden="true" />
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder={t(lang, "viewerSearchPlaceholder")}
            className="field h-8 ps-8 text-[12px]"
            aria-label={t(lang, "viewerSearch")}
          />
        </div>
        <span className="rounded-full bg-[var(--card)] px-2 py-1 text-[10.5px] font-bold text-[var(--muted)]">
          {t(lang, "pageOf", { page: current?.pageNo ?? 1, total: texts.length })}
        </span>
      </div>

      <div className="p-4 sm:p-7">
        <p className="mb-3 text-[10.5px] font-semibold uppercase tracking-wider text-[var(--muted)]">
          {fileTitle} · {t(lang, "extractedNote")}
        </p>
        <article
          dir="auto"
          data-page={current?.pageNo ?? 1}
          className="mx-auto max-w-[75ch] whitespace-pre-wrap break-words leading-[1.95] text-[var(--text)]"
          style={{ fontSize: `${size}px` }}
        >
          {current?.text
            ? annotate(current.text, glossary, lang)
            : t(lang, "noTextLayer")}
        </article>

        <div className="mx-auto mt-8 max-w-[75ch] rounded-xl border border-[var(--line)] bg-[var(--surface)] p-3">
          <label htmlFor="reader-note" className="label">
            {t(lang, "notesTitle")} · {t(lang, "pageLabel", { n: current?.pageNo ?? 1 })}
          </label>
          <div className="flex items-start gap-2">
            <textarea
              id="reader-note"
              key={`${current?.pageNo}-${note?.updatedAt ?? ""}`}
              defaultValue={note?.text ?? ""}
              onChange={(e) => setDraftNote(e.target.value)}
              rows={2}
              placeholder={t(lang, "notePlaceholder")}
              className="field text-[13px]"
            />
            <button
              type="button"
              className="btn btn-primary btn-sm shrink-0"
              onClick={() => {
                onSaveNote(current?.pageNo ?? 1, draftNote);
                setDraftNote("");
              }}
            >
              {t(lang, "saveNote")}
            </button>
          </div>
        </div>
      </div>

      <div className="sticky bottom-0 flex items-center justify-between gap-2 border-t border-[var(--line)] bg-[var(--card)]/95 px-3 py-2 backdrop-blur">
        <button
          type="button"
          className="btn btn-outline btn-sm gap-1"
          onClick={() => {
            const idx = Math.max(0, (current ? pages.findIndex((p) => p.pageNo === current.pageNo) : 0) - 1);
            setActivePage(pages[idx].pageNo);
            onPageChange(pages[idx].pageNo);
          }}
          disabled={!current || pages.findIndex((p) => p.pageNo === current.pageNo) <= 0}
        >
          <ChevronLeft className="h-3.5 w-3.5 rtl:rotate-180" /> {t(lang, "viewerPrev")}
        </button>
        <select
          value={current?.pageNo ?? 1}
          onChange={(e) => {
            setActivePage(Number(e.target.value));
            onPageChange(Number(e.target.value));
          }}
          className={cn("field h-8 w-auto py-0 text-[12px] font-semibold")}
          aria-label={t(lang, "viewerGoToPage")}
        >
          {pages.map((p) => (
            <option key={p.pageNo} value={p.pageNo}>
              {t(lang, "pageLabel", { n: p.pageNo })}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="btn btn-outline btn-sm gap-1"
          onClick={() => {
            const idx = Math.min(pages.length - 1, (current ? pages.findIndex((p) => p.pageNo === current.pageNo) : 0) + 1);
            setActivePage(pages[idx].pageNo);
            onPageChange(pages[idx].pageNo);
          }}
          disabled={!current || pages.findIndex((p) => p.pageNo === current.pageNo) >= pages.length - 1}
        >
          {t(lang, "viewerNext")} <ChevronRight className="h-3.5 w-3.5 rtl:rotate-180" />
        </button>
      </div>
    </div>
  );
}
