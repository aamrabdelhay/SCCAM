"use client";

import { useState } from "react";
import { Download, FileDown, Scissors, Share2, Copy, Loader2 } from "lucide-react";
import { t } from "@/lib/i18n";
import type { Lang } from "@/lib/types";
import { compressRange, pagesLabel, parsePageRange, splitForWhatsapp, whatsappLink } from "@/lib/format";
import { WhatsAppIcon } from "@/components/BrandIcons";

type Page = { pageNo: number; text: string };

export function PageRangeTool({
  fileId,
  fileTitle,
  pageCount,
  lang,
  hasTextLayer,
}: {
  fileId: string;
  fileTitle: string;
  pageCount: number;
  lang: Lang;
  hasTextLayer: boolean;
}) {
  const [range, setRange] = useState("");
  const [includeCitation, setIncludeCitation] = useState(true);
  const [pages, setPages] = useState<Page[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const parsed = parsePageRange(range, pageCount);

  async function gather() {
    if (!parsed) {
      setError(t(lang, "invalidRange"));
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/files/${fileId}/text?pages=${parsed.join(",")}`);
      if (!res.ok) throw new Error("failed");
      const data = (await res.json()) as { pages: Page[] };
      if (!data.pages.some((p) => p.text.trim())) {
        setError(t(lang, "noTextForRange"));
        setPages(null);
      } else {
        setPages(data.pages);
      }
    } catch {
      setError(t(lang, "error"));
    } finally {
      setLoading(false);
    }
  }

  function compose(): string {
    if (!pages) return "";
    const body = pages
      .map((p) => `— ${t(lang, "page")} ${p.pageNo} —\n${p.text.trim()}`)
      .join("\n\n");
    const cite = includeCitation
      ? `\n\n${t(lang, "citationLine", { title: fileTitle, pages: compressRange(pages.map((p) => p.pageNo)) })}`
      : "";
    return body + cite;
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(compose());
      setStatus(t(lang, "copied"));
      setTimeout(() => setStatus(null), 1800);
    } catch {
      setStatus(t(lang, "error"));
    }
  }

  function downloadTxt() {
    const blob = new Blob([compose()], { type: "text/plain;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${fileTitle.replace(/[^\p{L}\p{N} _-]/gu, "").slice(0, 50)}-${parsed ? compressRange(parsed).replace(/[ ,]/g, "_") : "pages"}.txt`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function shareWhatsapp() {
    const text = compose();
    if (text.length <= 3600) {
      window.open(whatsappLink(text), "_blank", "noopener");
      return;
    }
    const parts = splitForWhatsapp(text, 3400);
    setStatus(t(lang, "tooLongForWhatsapp"));
    parts.slice(0, 4).forEach((part, i) => {
      setTimeout(() => window.open(whatsappLink(`(${i + 1}/${parts.length})\n${part}`), "_blank", "noopener"), i * 700);
    });
    setTimeout(() => setStatus(null), 4000);
  }

  return (
    <section className="card p-4">
      <h2 className="flex items-center gap-2 text-[13px] font-bold">
        <Scissors className="h-4 w-4 text-[var(--accent)]" aria-hidden="true" />
        {t(lang, "pageRangeTitle")}
      </h2>
      <p className="mt-1 text-[11px] text-[var(--muted)]">
        {t(lang, "pageRangeHint")} · {pagesLabel(pageCount, lang)}
      </p>
      <div className="mt-2 flex gap-1.5">
        <input
          value={range}
          onChange={(e) => {
            setRange(e.target.value);
            setPages(null);
            setError(null);
          }}
          placeholder="12-18"
          dir="ltr"
          className="field h-9 flex-1 text-[13px]"
          aria-label={t(lang, "pageRangeInput")}
          aria-invalid={Boolean(error)}
        />
        <button type="button" onClick={gather} disabled={!hasTextLayer || loading} className="btn btn-primary btn-sm shrink-0">
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : t(lang, "openFile")}
        </button>
      </div>
      {error && <p className="mt-1.5 text-[11px] font-semibold text-[var(--danger)]">{error}</p>}
      {!hasTextLayer && <p className="mt-1.5 text-[11px] text-[var(--muted)]">{t(lang, "noTextLayer")}</p>}

      <label className="mt-2 flex cursor-pointer items-center gap-2 text-[11.5px] font-medium text-[var(--muted)]">
        <input
          type="checkbox"
          checked={includeCitation}
          onChange={(e) => setIncludeCitation(e.target.checked)}
          className="h-3.5 w-3.5 accent-[var(--primary)]"
        />
        {t(lang, "includeCitation")}
      </label>

      {pages && pages.length > 0 && (
        <div className="mt-3 space-y-2">
          <p className="text-[11px] font-semibold text-[var(--primary)] dark:text-[var(--accent)]">
            {compressRange(pages.map((p) => p.pageNo))} · {pages.reduce((n, p) => n + p.text.trim().split(/\s+/).length, 0)} {lang === "ar" ? "كلمة" : "words"}
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            <button type="button" onClick={copy} className="btn btn-outline btn-sm gap-1">
              <Copy className="h-3.5 w-3.5" /> {t(lang, "copyToClipboard")}
            </button>
            <button type="button" onClick={shareWhatsapp} className="btn btn-outline btn-sm gap-1 text-[#128C7E]">
              <WhatsAppIcon className="h-3.5 w-3.5" /> {t(lang, "shareWhatsapp")}
            </button>
            <button type="button" onClick={downloadTxt} className="btn btn-outline btn-sm gap-1">
              <Download className="h-3.5 w-3.5" /> {t(lang, "downloadTxt")}
            </button>
            <a
              href={`/api/files/${fileId}/pages.pdf?pages=${parsed?.join(",") ?? ""}`}
              className="btn btn-outline btn-sm gap-1"
              download
            >
              <FileDown className="h-3.5 w-3.5" /> {t(lang, "downloadPagesPdf")}
            </a>
          </div>
          {status && <p className="text-[11px] font-semibold text-[var(--muted)]">{status}</p>}
        </div>
      )}
      {status && !pages && (
        <p className="mt-2 flex items-center gap-1 text-[11px] font-semibold text-[var(--muted)]">
          <Share2 className="h-3 w-3" /> {status}
        </p>
      )}
    </section>
  );
}
