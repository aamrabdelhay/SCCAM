"use client";

import { useEffect, useState } from "react";
import { BookMarked, Copy } from "lucide-react";
import { t } from "@/lib/i18n";
import type { Lang } from "@/lib/types";
import { compressRange } from "@/lib/format";

export function CitationBox({
  lang,
  fileId,
  title,
  pageCount,
}: {
  lang: Lang;
  fileId: string;
  title: string;
  pageCount: number;
}) {
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState("");
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const range = compressRange(
    pages
      .split(",")
      .flatMap((chunk) => {
        const m = /^\s*(\d+)\s*-\s*(\d+)\s*$/.exec(chunk);
        if (m) {
          const [a, b] = [Number(m[1]), Number(m[2])];
          return Array.from({ length: Math.max(0, b - a + 1) }, (_, i) => a + i);
        }
        const n = Number(chunk.trim());
        return Number.isInteger(n) && n > 0 ? [n] : [];
      })
      .filter((n) => n <= pageCount),
  );

  const citation = `«${title}»، ص ${range || page} — ${origin}/file/${fileId}${page > 1 ? `?page=${page}` : ""}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(citation);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* ignore */
    }
  }

  return (
    <section className="card p-4">
      <h2 className="flex items-center gap-2 text-[13px] font-bold">
        <BookMarked className="h-4 w-4 text-[var(--accent)]" aria-hidden="true" />
        {t(lang, "citeTheFile")}
      </h2>
      <div className="mt-2.5 flex items-center gap-1.5">
        <label className="sr-only" htmlFor="cite-page">
          {t(lang, "page")}
        </label>
        <input
          id="cite-page"
          type="number"
          min={1}
          max={pageCount}
          value={page}
          onChange={(e) => setPage(Math.max(1, Math.min(pageCount, Number(e.target.value) || 1)))}
          className="field h-8 w-16 text-center text-[12px] font-bold"
        />
        <input
          value={pages}
          onChange={(e) => setPages(e.target.value)}
          placeholder="3,5,8-10"
          dir="ltr"
          className="field h-8 flex-1 text-[12px]"
          aria-label={t(lang, "copyPageRange")}
        />
      </div>
      <p dir="auto" className="mt-2 rounded-lg bg-[var(--surface)] p-2.5 text-[11.5px] leading-relaxed text-[var(--muted)]">
        {citation}
      </p>
      <button type="button" onClick={copy} className="btn btn-outline btn-sm mt-2 w-full gap-1.5">
        <Copy className="h-3.5 w-3.5" />
        {copied ? t(lang, "copied") : t(lang, "copyStandardCitation")}
      </button>
    </section>
  );
}
