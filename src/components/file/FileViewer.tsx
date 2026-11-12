"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PDFDocumentProxy } from "pdfjs-dist";
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  PanelLeft,
  Moon,
  Search,
  ChevronUp,
  ChevronDown,
  X,
  Download,
  Printer,
  Loader2,
  AlertTriangle,
  BookOpen,
  ScanText,
  Highlighter,
  Copy,
  Star,
  SkipBack,
  SkipForward,
} from "lucide-react";
import { t } from "@/lib/i18n";
import type { Lang } from "@/lib/types";
import { cn, citationText, whatsappLink } from "@/lib/format";
import { normalizeArabic, makeSnippet } from "@/lib/search";
import { KEYS, useLocalStore, recordLastRead, uid, type Bookmark, type Highlight, type Note } from "@/lib/client-store";
import { ReadingMode } from "./ReadingMode";

type Match = { page: number; snippet: string };

export function FileViewer({
  fileId,
  fileTitle,
  mime,
  pageCount,
  lang,
  initialPage,
  initialQuery,
  texts: initialTexts,
  downloadAllowed,
  printAllowed,
  glossary,
  sectionSlug,
  sectionName,
}: {
  fileId: string;
  fileTitle: string;
  mime: string;
  pageCount: number;
  lang: Lang;
  initialPage: number;
  initialQuery?: string;
  texts?: { pageNo: number; text: string }[];
  downloadAllowed: boolean;
  printAllowed: boolean;
  glossary: { termAr: string; termEn: string; defAr: string; defEn: string }[];
  sectionSlug: string;
  sectionName: string;
}) {
  const isPdf = mime.includes("pdf");
  const isImage = mime.startsWith("image/");
  const [mode, setMode] = useState<"doc" | "text">(isPdf || isImage ? "doc" : "text");
  const [doc, setDoc] = useState<PDFDocumentProxy | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">(isPdf ? "loading" : "ready");
  const [error, setError] = useState<string | null>(null);
  const [numPages, setNumPages] = useState(pageCount || 1);
  const [currentPage, setCurrentPage] = useState(Math.max(1, initialPage));
  const [pageInput, setPageInput] = useState(String(Math.max(1, initialPage)));
  const [zoom, setZoom] = useState(1);
  const [fitWidth, setFitWidth] = useState(true);
  const [containerWidth, setContainerWidth] = useState(0);
  const [night, setNight] = useState(false);
  const [thumbsOpen, setThumbsOpen] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(Boolean(initialQuery));
  const [query, setQuery] = useState(initialQuery ?? "");
  const [matches, setMatches] = useState<Match[]>([]);
  const [searching, setSearching] = useState(false);
  const [matchIndex, setMatchIndex] = useState(0);
  const [searched, setSearched] = useState(false);
  const [selection, setSelection] = useState<{ text: string; page: number; x: number; y: number } | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [allTexts, setAllTexts] = useState<{ pageNo: number; text: string }[]>(initialTexts ?? []);
  const textsRef = useRef<{ pageNo: number; text: string }[]>(initialTexts ?? []);
  const textsPromise = useRef<Promise<void> | null>(null);

  const viewerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const pageRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const textCache = useRef<Map<number, string>>(new Map());
  const suppressAutoFit = useRef(false);

  const bookmarks = useLocalStore<Bookmark[]>(KEYS.bookmarks, []);
  const highlights = useLocalStore<Highlight[]>(KEYS.highlights, []);
  const notes = useLocalStore<Note[]>(KEYS.notes, []);

  const loadTexts = useCallback(async () => {
    if (textsRef.current.length) return;
    if (!textsPromise.current) {
      textsPromise.current = (async () => {
        try {
          const res = await fetch(`/api/files/${fileId}/text`);
          if (res.ok) {
            const data = (await res.json()) as { pages: { pageNo: number; text: string }[] };
            textsRef.current = data.pages;
            setAllTexts(data.pages);
          }
        } catch {
          /* ignore */
        }
      })();
    }
    await textsPromise.current;
  }, [fileId]);

  useEffect(() => {
    if (mode === "text") void loadTexts();
  }, [mode, loadTexts]);

  const notify = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  }, []);

  /* ----------------------------- load document ----------------------------- */
  useEffect(() => {
    if (!isPdf || mode !== "doc") return;
    let cancelled = false;
    let loaded: PDFDocumentProxy | null = null;
    (async () => {
      try {
        setStatus("loading");
        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = "/vendor/pdf.worker.min.mjs";
        const task = pdfjs.getDocument({
          url: `/api/files/${fileId}/stream`,
          rangeChunkSize: 65536,
          withCredentials: true,
          disableAutoFetch: false,
          disableStream: false,
        });
        loaded = await task.promise;
        if (cancelled) {
          loaded.destroy();
          return;
        }
        setDoc(loaded);
        setNumPages(loaded.numPages);
        setStatus("ready");
      } catch (err) {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg);
        setStatus("error");
      }
    })();
    return () => {
      cancelled = true;
      loaded?.destroy().catch(() => undefined);
    };
  }, [fileId, isPdf, mode]);

  /* ----------------------------- measure width ----------------------------- */
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setContainerWidth(el.clientWidth));
    ro.observe(el);
    setContainerWidth(el.clientWidth);
    return () => ro.disconnect();
  }, [mode, thumbsOpen]);

  /* ----------------------------- shortcuts ----------------------------- */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      const typing = el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable);
      if (typing) return;
      if (e.key === "/") {
        e.preventDefault();
        setSearchOpen(true);
        setTimeout(() => searchInputRef.current?.focus(), 30);
      } else if (e.key === "ArrowRight" && mode === "doc") {
        goToPage(Math.min(numPages, currentPage + (lang === "ar" ? -1 : 1)));
      } else if (e.key === "ArrowLeft" && mode === "doc") {
        goToPage(Math.max(1, currentPage + (lang === "ar" ? 1 : -1)));
      } else if (e.key === "+" || e.key === "=") {
        setFitWidth(false);
        setZoom((z) => Math.min(3, z + 0.15));
      } else if (e.key === "-") {
        setFitWidth(false);
        setZoom((z) => Math.max(0.5, z - 0.15));
      } else if (e.key === "Escape") {
        setSelection(null);
        setThumbsOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, numPages, mode, lang]);

  /* ----------------------------- current page tracking ----------------------------- */
  useEffect(() => {
    if (mode !== "doc" || !doc) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!visible) return;
        const page = Number((visible.target as HTMLElement).dataset.page);
        if (page && page !== currentPage) setCurrentPage(page);
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: [0, 0.2, 0.6] },
    );
    pageRefs.current.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [doc, mode, numPages, currentPage]);

  /* ----------------------------- persist last read ----------------------------- */
  useEffect(() => {
    if (!numPages) return;
    const timer = setTimeout(() => {
      recordLastRead(fileId, {
        page: currentPage,
        total: numPages,
        at: Date.now(),
        title: fileTitle,
        section: sectionName,
      });
    }, 900);
    return () => clearTimeout(timer);
  }, [fileId, currentPage, numPages, fileTitle, sectionName]);

  useEffect(() => {
    setPageInput(String(currentPage));
    if (mode !== "doc") return;
    const url = new URL(window.location.href);
    if (currentPage > 1) url.searchParams.set("page", String(currentPage));
    else url.searchParams.delete("page");
    window.history.replaceState(null, "", url.toString());
    window.dispatchEvent(new CustomEvent("sccam:pagechange", { detail: { page: currentPage } }));
  }, [currentPage, mode]);

  /* ----------------------------- views ----------------------------- */
  useEffect(() => {
    const timer = setTimeout(() => {
      fetch(`/api/files/${fileId}/view`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ page: currentPage }),
        keepalive: true,
      }).catch(() => undefined);
    }, 1500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileId]);

  /* ----------------------------- page navigation ----------------------------- */
  const goToPage = useCallback(
    (page: number) => {
      const clamped = Math.max(1, Math.min(numPages, page));
      setCurrentPage(clamped);
      const el = pageRefs.current.get(clamped);
      if (el) {
        const top = el.getBoundingClientRect().top + window.scrollY - 90;
        window.scrollTo({ top, behavior: "smooth" });
      }
    },
    [numPages],
  );

  /* ----------------------------- search ----------------------------- */
  const pageText = useCallback(
    async (pageNo: number): Promise<string> => {
      const cached = textCache.current.get(pageNo);
      if (cached !== undefined) return cached;
      const fromServer = textsRef.current.find((x) => x.pageNo === pageNo)?.text;
      if (fromServer) {
        textCache.current.set(pageNo, fromServer);
        return fromServer;
      }
      if (!doc) return "";
      const page = await doc.getPage(pageNo);
      const content = await page.getTextContent();
      const text = content.items
        .map((i) => ("str" in i ? i.str + (i.hasEOL ? "\n" : " ") : ""))
        .join("")
        .replace(/\s+/g, " ")
        .trim();
      textCache.current.set(pageNo, text);
      return text;
    },
    [doc],
  );

  const runSearch = useCallback(
    async (raw: string) => {
      const term = normalizeArabic(raw).trim();
      if (!term) {
        setMatches([]);
        setSearched(false);
        return;
      }
      setSearching(true);
      setSearched(true);
      await loadTexts(); // server-side extracted text: one request instead of N page fetches
      const found: Match[] = [];
      const total = numPages;
      for (let p = 1; p <= total; p++) {
        const text = await pageText(p);
        if (!text) continue;
        const hay = normalizeArabic(text);
        let from = 0;
        let hits = 0;
        while (hits < 12) {
          const idx = hay.indexOf(term, from);
          if (idx === -1) break;
          const snippet = makeSnippet(text, [term], [], 120).text;
          found.push({ page: p, snippet });
          hits++;
          from = idx + term.length;
        }
        if (found.length > 400) break;
      }
      setMatches(found);
      setSearching(false);
      if (found.length) {
        setMatchIndex(0);
        goToPage(found[0].page);
      }
    },
    [numPages, pageText, goToPage, doc, loadTexts],
  );

  useEffect(() => {
    if (initialQuery && doc) {
      setSearchOpen(true);
      void runSearch(initialQuery);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doc]);

  useEffect(() => {
    if (!query.trim()) {
      setMatches([]);
      setSearched(false);
    }
  }, [query]);

  const stepMatch = (dir: 1 | -1) => {
    if (!matches.length) return;
    const next = (matchIndex + dir + matches.length) % matches.length;
    setMatchIndex(next);
    goToPage(matches[next].page);
  };

  /* ----------------------------- selection toolbar ----------------------------- */
  useEffect(() => {
    if (mode !== "doc") return;
    const onSelection = () => {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed) return;
      const text = sel.toString().trim();
      if (text.length < 3) return;
      const range = sel.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      const node = range.startContainer.parentElement?.closest("[data-page]") as HTMLElement | null;
      const page = node ? Number(node.dataset.page) : currentPage;
      if (!viewerRef.current?.contains(range.commonAncestorContainer)) return;
      setSelection({
        text: text.slice(0, 4000),
        page,
        x: rect.left + rect.width / 2,
        y: rect.top,
      });
    };
    document.addEventListener("mouseup", onSelection);
    document.addEventListener("touchend", onSelection);
    return () => {
      document.removeEventListener("mouseup", onSelection);
      document.removeEventListener("touchend", onSelection);
    };
  }, [mode, currentPage]);

  useEffect(() => {
    const hide = () => setSelection(null);
    window.addEventListener("scroll", hide, { passive: true });
    return () => window.removeEventListener("scroll", hide);
  }, []);

  const deepLink = useMemo(() => {
    const url = new URL(typeof window === "undefined" ? `http://localhost/file/${fileId}` : window.location.href);
    url.searchParams.set("page", String(selection?.page ?? currentPage));
    return url.toString();
  }, [fileId, currentPage, selection?.page]);

  async function copyText(text: string, label?: string) {
    try {
      await navigator.clipboard.writeText(text);
      notify(label ?? t(lang, "copied"));
    } catch {
      notify(t(lang, "error"));
    }
  }

  function citationFor(page: number) {
    return citationText({ title: fileTitle, page }, window.location.origin, fileId, lang);
  }

  function waShare(text: string, page: number) {
    const payload = `«${text}»\n\n📄 ${fileTitle} — ${t(lang, "page")} ${page}\n\n🔗 ${citationFor(page).split(" — ").pop()}`;
    window.open(whatsappLink(payload), "_blank", "noopener");
  }

  const isBookmarked = bookmarks.value.some((b) => b.fileId === fileId && b.page === currentPage);
  const currentNote = notes.value.find((n) => n.fileId === fileId && n.page === currentPage);
  const [noteDraft, setNoteDraft] = useState("");
  useEffect(() => {
    setNoteDraft(currentNote?.text ?? "");
  }, [currentPage, currentNote?.text]);

  /* ----------------------------- zoom helpers ----------------------------- */
  const handleZoom = (dir: 1 | -1) => {
    setFitWidth(false);
    setZoom((z) => Math.min(3, Math.max(0.5, z + dir * 0.15)));
  };

  function toggleFullscreen() {
    const el = viewerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen?.().then(() => setFullscreen(true)).catch(() => setFullscreen(false));
    } else {
      document.exitFullscreen?.().then(() => setFullscreen(false)).catch(() => undefined);
    }
  }

  useEffect(() => {
    const onFs = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  const highlightTerms = matches.length ? [query] : [];
  const pageWidth = fitWidth ? Math.max(240, containerWidth - (thumbsOpen ? 96 : 16)) : 720 * zoom;

  return (
    <div data-viewer ref={viewerRef} className="card overflow-hidden">
      {/* toolbar */}
      <div className="sticky top-16 z-20 flex flex-wrap items-center gap-1 border-b border-[var(--line)] bg-[var(--card)]/95 px-2 py-2 backdrop-blur">
        <div className="flex items-center gap-0.5 rounded-lg bg-[var(--surface)] p-0.5">
          <button type="button" onClick={() => setMode("doc")} disabled={!isPdf && !isImage} className={cn("rounded-md px-2.5 py-1.5 text-[11.5px] font-bold transition-colors", mode === "doc" ? "bg-[var(--card)] shadow-sm" : "text-[var(--muted)]")}>
            {t(lang, "viewerPdfMode")}
          </button>
          <button type="button" onClick={() => setMode("text")} className={cn("rounded-md px-2.5 py-1.5 text-[11.5px] font-bold transition-colors", mode === "text" ? "bg-[var(--card)] shadow-sm" : "text-[var(--muted)]")}>
            {t(lang, "viewerReadMode")}
          </button>
        </div>

        {mode === "doc" && (isPdf || isImage) && (
          <>
            <span className="mx-1 hidden h-6 w-px bg-[var(--line)] sm:block" />
            <button type="button" onClick={() => setThumbsOpen((v) => !v)} aria-pressed={thumbsOpen} className="btn btn-ghost btn-sm gap-1" aria-label={t(lang, "viewerThumbnails")} title={t(lang, "viewerThumbnails")}>
              <PanelLeft className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-0.5">
              <button type="button" onClick={() => handleZoom(-1)} className="btn btn-ghost btn-sm" aria-label={t(lang, "viewerZoomOut")} title={t(lang, "viewerZoomOut")}>
                <ZoomOut className="h-4 w-4" />
              </button>
              <span className="min-w-[38px] text-center text-[11px] font-bold tabular-nums text-[var(--muted)]">{Math.round((fitWidth ? 1 : zoom) * 100)}%</span>
              <button type="button" onClick={() => handleZoom(1)} className="btn btn-ghost btn-sm" aria-label={t(lang, "viewerZoomIn")} title={t(lang, "viewerZoomIn")}>
                <ZoomIn className="h-4 w-4" />
              </button>
            </div>
            <button type="button" onClick={() => setFitWidth((v) => !v)} className={cn("btn btn-ghost btn-sm", fitWidth && "text-[var(--primary)] dark:text-[var(--accent)]")} title={t(lang, "viewerFitWidth")}>
              <ScanText className="h-4 w-4" />
            </button>
            <button type="button" onClick={() => setNight((v) => !v)} aria-pressed={night} className={cn("btn btn-ghost btn-sm", night && "text-[var(--accent)]")} aria-label={t(lang, "viewerNight")} title={t(lang, "viewerNight")}>
              <Moon className="h-4 w-4" />
            </button>
            <button type="button" onClick={toggleFullscreen} className="btn btn-ghost btn-sm" aria-label={t(lang, "viewerFullscreen")} title={t(lang, "viewerFullscreen")}>
              {fullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </button>
            <span className="mx-1 hidden h-6 w-px bg-[var(--line)] sm:block" />
            <button type="button" onClick={() => goToPage(currentPage - 1)} className="btn btn-ghost btn-sm" aria-label={t(lang, "viewerPrev")}>
              <ChevronUp className="h-4 w-4 rtl:rotate-180" />
            </button>
            <form
              className="flex items-center gap-1"
              onSubmit={(e) => {
                e.preventDefault();
                goToPage(Number(pageInput) || 1);
              }}
            >
              <label className="sr-only" htmlFor="page-input">
                {t(lang, "viewerGoToPage")}
              </label>
              <input
                id="page-input"
                value={pageInput}
                onChange={(e) => setPageInput(e.target.value.replace(/[^\d]/g, ""))}
                inputMode="numeric"
                className="h-8 w-11 rounded-md border border-[var(--line)] bg-[var(--bg)] text-center text-[12px] font-bold tabular-nums outline-none focus:border-[var(--primary)]"
              />
              <span className="text-[11px] font-semibold text-[var(--muted)]">/ {numPages}</span>
            </form>
            <button type="button" onClick={() => goToPage(currentPage + 1)} className="btn btn-ghost btn-sm" aria-label={t(lang, "viewerNext")}>
              <ChevronDown className="h-4 w-4 rtl:rotate-180" />
            </button>
          </>
        )}

        <div className="ms-auto flex items-center gap-0.5">
          <button
            type="button"
            onClick={() => {
              const next = isBookmarked
                ? bookmarks.value.filter((b) => !(b.fileId === fileId && b.page === currentPage))
                : [...bookmarks.value, { fileId, page: currentPage, title: fileTitle, section: sectionName, createdAt: new Date().toISOString() }];
              bookmarks.set(next);
              notify(t(lang, "saved"));
            }}
            className={cn("btn btn-ghost btn-sm", isBookmarked && "text-[var(--accent)]")}
            aria-label={isBookmarked ? t(lang, "bookmarkRemove") : t(lang, "bookmarkAdd")}
            title={isBookmarked ? t(lang, "bookmarkRemove") : t(lang, "bookmarkAdd")}
          >
            <Star className={cn("h-4 w-4", isBookmarked && "fill-current")} />
          </button>
          <button
            type="button"
            onClick={() => {
              setSearchOpen((v) => !v);
              setTimeout(() => searchInputRef.current?.focus(), 40);
            }}
            className="btn btn-ghost btn-sm"
            aria-label={t(lang, "viewerSearch")}
            title={t(lang, "viewerSearch")}
          >
            <Search className="h-4 w-4" />
          </button>
          {downloadAllowed && (
            <a href={`/api/files/${fileId}/download`} className="btn btn-ghost btn-sm" aria-label={t(lang, "download")} title={t(lang, "download")} download>
              <Download className="h-4 w-4" />
            </a>
          )}
          {printAllowed && (
            <a href={`/file/${fileId}/print`} target="_blank" rel="noopener" className="btn btn-ghost btn-sm" aria-label={t(lang, "print")} title={t(lang, "print")}>
              <Printer className="h-4 w-4" />
            </a>
          )}
        </div>
      </div>

      {/* in-file search */}
      {searchOpen && (
        <div className="border-b border-[var(--line)] bg-[var(--surface)] px-3 py-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[180px] flex-1">
              <Search className="pointer-events-none absolute top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--muted)] start-3" aria-hidden="true" />
              <input
                ref={searchInputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    if (matches.length) stepMatch(e.shiftKey ? -1 : 1);
                    else void runSearch(query);
                  }
                }}
                placeholder={t(lang, "viewerSearchPlaceholder")}
                className="field h-9 ps-9 pe-20 text-[13px]"
                aria-label={t(lang, "viewerSearch")}
              />
              <button type="button" onClick={() => void runSearch(query)} className="absolute top-1/2 -translate-y-1/2 rounded-md bg-[var(--primary)] px-2.5 py-1 text-[11px] font-bold text-white end-1">
                {t(lang, "searchAction")}
              </button>
            </div>
            <div className="flex items-center gap-1">
              <span className="min-w-[64px] text-center text-[11.5px] font-bold text-[var(--muted)]" aria-live="polite">
                {searching ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : matches.length ? t(lang, "viewerMatches", { i: matchIndex + 1, n: matches.length }) : searched ? t(lang, "viewerNoMatches") : ""}
              </span>
              <button type="button" onClick={() => stepMatch(-1)} disabled={!matches.length} className="btn btn-outline btn-sm" aria-label={t(lang, "viewerPrev")}>
                <ChevronUp className="h-3.5 w-3.5" />
              </button>
              <button type="button" onClick={() => stepMatch(1)} disabled={!matches.length} className="btn btn-outline btn-sm" aria-label={t(lang, "viewerNext")}>
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setSearchOpen(false);
                  setQuery("");
                  setMatches([]);
                }}
                className="btn btn-ghost btn-sm"
                aria-label={t(lang, "close")}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
          {matches.length > 0 && (
            <ul className="no-scrollbar mt-2 flex max-h-24 gap-1.5 overflow-y-auto">
              {matches.slice(0, 40).map((m, i) => (
                <li key={`${m.page}-${i}`}>
                  <button
                    type="button"
                    onClick={() => {
                      setMatchIndex(i);
                      goToPage(m.page);
                    }}
                    className={cn(
                      "max-w-[220px] truncate rounded-md border px-2 py-1 text-start text-[11px]",
                      i === matchIndex ? "border-[var(--accent)] bg-[color-mix(in_srgb,var(--accent)_18%,var(--bg))]" : "border-[var(--line)] bg-[var(--card)]",
                    )}
                    title={m.snippet}
                  >
                    <span className="font-bold">{m.page}</span> · {m.snippet}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* body */}
      {mode === "text" ? (
        <ReadingMode
          lang={lang}
          fileTitle={fileTitle}
          texts={allTexts}
          glossary={glossary}
          initialPage={currentPage}
          onPageChange={(p) => setCurrentPage(p)}
          notes={notes.value.filter((n) => n.fileId === fileId)}
          onSaveNote={(page, text) => {
            notes.set((prev) => {
              const others = prev.filter((n) => !(n.fileId === fileId && n.page === page));
              if (text.trim()) others.push({ fileId, page, text: text.trim(), updatedAt: new Date().toISOString() });
              return others;
            });
            notify(t(lang, "saved"));
          }}
        />
      ) : null}
      {mode === "doc" && isImage && (
        <div className="bg-[var(--surface)] p-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`/api/files/${fileId}/stream`} alt={fileTitle} className={cn("mx-auto h-auto max-w-full rounded-lg shadow", night && "opacity-90")} />
        </div>
      )}

      {mode === "doc" && isPdf && (
        <div className={cn("relative flex bg-[var(--surface)]", night && "pdf-night")} style={{ background: night ? "#151a18" : undefined }}>
          {thumbsOpen && doc && (
            <div className="no-scrollbar hidden w-[104px] shrink-0 overflow-y-auto border-e border-[var(--line)] bg-[var(--card)] p-2 sm:block" style={{ maxHeight: "78vh" }} aria-label={t(lang, "viewerThumbnails")}>
              {Array.from({ length: numPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => goToPage(p)}
                  className={cn("mb-2 block w-full rounded-lg border p-1 text-center", p === currentPage ? "border-[var(--accent)] bg-[color-mix(in_srgb,var(--accent)_12%,var(--bg))]" : "border-transparent hover:bg-[var(--surface)]")}
                  aria-label={`${t(lang, "viewerPageLabel")} ${p}`}
                >
                  <Thumbnail doc={doc} pageNo={p} />
                  <span className="mt-0.5 block text-[10px] font-bold text-[var(--muted)]">{p}</span>
                </button>
              ))}
            </div>
          )}

          <div ref={scrollRef} className="relative min-w-0 flex-1 p-2 sm:p-4">
            {status === "loading" && (
              <div className="flex h-[60vh] flex-col items-center justify-center gap-3 text-[var(--muted)]">
                <Loader2 className="h-7 w-7 animate-spin text-[var(--accent)]" />
                <p className="text-[12.5px] font-semibold">{t(lang, "viewerLoading")}</p>
              </div>
            )}
            {status === "error" && (
              <div className="flex h-[40vh] flex-col items-center justify-center gap-3 text-center">
                <AlertTriangle className="h-7 w-7 text-[var(--danger)]" />
                <p className="max-w-sm text-[12.5px] text-[var(--muted)]">{error}</p>
                <button type="button" onClick={() => { setMode("text"); setStatus("ready"); }} className="btn btn-outline btn-sm">
                  <BookOpen className="h-3.5 w-3.5" /> {t(lang, "viewerReadMode")}
                </button>
              </div>
            )}
            {status === "ready" && doc && (
              <div className="mx-auto flex flex-col items-center gap-3">
                {Array.from({ length: numPages }, (_, i) => i + 1).map((p) => (
                  <PdfPage
                    key={`${p}-${pageWidth > 700 ? "w" : "f"}`}
                    doc={doc}
                    pageNo={p}
                    width={pageWidth}
                    night={night}
                    query={highlightTerms[0] ?? ""}
                    selectedTerm={matches[matchIndex]?.page === p ? query : ""}
                    active={matches[matchIndex]?.page === p}
                    registerRef={(el) => {
                      if (el) pageRefs.current.set(p, el);
                      else pageRefs.current.delete(p);
                    }}
                    onVisible={(visible) => {
                      if (visible && p !== currentPage) {
                        /* currentPage is tracked by the observer above */
                      }
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* notes + highlights strip */}
      <div className="grid gap-3 border-t border-[var(--line)] p-3 sm:grid-cols-2">
        <div>
          <label htmlFor="page-note" className="label flex items-center gap-1.5">
            <Highlighter className="h-3.5 w-3.5 text-[var(--accent)]" aria-hidden="true" />
            {t(lang, "notesTitle")} · {t(lang, "pageLabel", { n: currentPage })}
          </label>
          <div className="flex items-start gap-2">
            <textarea
              id="page-note"
              value={noteDraft}
              onChange={(e) => setNoteDraft(e.target.value)}
              placeholder={t(lang, "notePlaceholder")}
              rows={3}
              className="field min-h-[70px] resize-y text-[13px]"
            />
            <button
              type="button"
              className="btn btn-primary btn-sm shrink-0"
              onClick={() => {
                notes.set((prev) => {
                  const others = prev.filter((n) => !(n.fileId === fileId && n.page === currentPage));
                  if (noteDraft.trim()) others.push({ fileId, page: currentPage, text: noteDraft.trim(), updatedAt: new Date().toISOString() });
                  return others;
                });
                notify(t(lang, "saved"));
              }}
            >
              {t(lang, "saveNote")}
            </button>
          </div>
          {highlights.value.filter((h) => h.fileId === fileId).length > 0 && (
            <ul className="mt-2 space-y-1">
              {highlights.value
                .filter((h) => h.fileId === fileId)
                .slice(-4)
                .reverse()
                .map((h) => (
                  <li key={h.id}>
                    <button type="button" onClick={() => goToPage(h.page)} className="w-full truncate rounded-md bg-[var(--surface)] px-2 py-1 text-start text-[11.5px]">
                      <span className="font-bold text-[var(--accent)]">p.{h.page}</span> {h.text}
                    </button>
                  </li>
                ))}
            </ul>
          )}
        </div>
        <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-3">
          <p className="text-[11.5px] leading-relaxed text-[var(--muted)]">{t(lang, "viewerShortcuts")}</p>
          <div className="mt-2 flex items-center justify-between text-[11px] font-semibold text-[var(--muted)]">
            <span>
              {t(lang, "pageOf", { page: currentPage, total: numPages })}
            </span>
            <div className="flex gap-1">
              <button type="button" onClick={() => goToPage(1)} className="btn btn-ghost btn-sm" aria-label="first">
                <SkipBack className="h-3.5 w-3.5" />
              </button>
              <button type="button" onClick={() => goToPage(numPages)} className="btn btn-ghost btn-sm" aria-label="last">
                <SkipForward className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* floating selection toolbar */}
      {selection && (
        <div
          className="fixed z-[60] flex -translate-x-1/2 -translate-y-[calc(100%+10px)] items-center gap-0.5 rounded-full border border-[var(--line)] bg-[var(--card)] p-1 shadow-xl"
          style={{ left: selection.x, top: Math.max(70, selection.y) }}
          role="toolbar"
          aria-label={t(lang, "share")}
        >
          <button type="button" onClick={() => copyText(selection.text)} className="btn btn-ghost btn-sm gap-1">
            <Copy className="h-3.5 w-3.5" /> {t(lang, "selectionCopy")}
          </button>
          <button type="button" onClick={() => waShare(selection.text, selection.page)} className="btn btn-ghost btn-sm gap-1 text-[#128C7E]">
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Z" /></svg>
            {t(lang, "selectionWhatsapp")}
          </button>
          <button type="button" onClick={() => copyText(`${selection.text}\n\n— ${citationFor(selection.page)}`, t(lang, "copied"))} className="btn btn-ghost btn-sm gap-1">
            {t(lang, "selectionCite")}
          </button>
          <button
            type="button"
            onClick={() => {
              const next = [...highlights.value, { id: uid(), fileId, page: selection.page, text: selection.text.slice(0, 500), createdAt: new Date().toISOString() }];
              highlights.set(next);
              copyText(selection.text, t(lang, "saved"));
              setSelection(null);
            }}
            className="btn btn-ghost btn-sm gap-1"
          >
            <Highlighter className="h-3.5 w-3.5" /> {t(lang, "highlightAction")}
          </button>
          <span className="mx-1 hidden text-[10px] text-[var(--muted)] sm:inline">p.{selection.page}</span>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-5 left-1/2 z-[70] -translate-x-1/2 rounded-full bg-[var(--primary)] px-4 py-2 text-[12px] font-semibold text-white shadow-lg" role="status">
          {toast}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* One lazily rendered PDF page with its own text layer                */
/* ------------------------------------------------------------------ */
function PdfPage({
  doc,
  pageNo,
  width,
  night,
  query,
  selectedTerm,
  active,
  registerRef,
  onVisible,
}: {
  doc: PDFDocumentProxy;
  pageNo: number;
  width: number;
  night: boolean;
  query: string;
  selectedTerm: string;
  active: boolean;
  registerRef: (el: HTMLDivElement | null) => void;
  onVisible: (visible: boolean) => void;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const [ratio, setRatio] = useState(1.294);
  const [shouldRender, setShouldRender] = useState(false);
  const renderedKey = useRef<string>("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries[0]?.isIntersecting ?? false;
        if (visible) setShouldRender(true);
        onVisible(visible);
      },
      { rootMargin: "800px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const page = await doc.getPage(pageNo);
      if (cancelled) return;
      const base = page.getViewport({ scale: 1 });
      setRatio(base.height / base.width);
      const key = `${pageNo}:${Math.round(width)}:${night}`;
      const needsRender = renderedKey.current !== key;
      if (!shouldRender) return;

      if (needsRender) {
        setReady(false);

        const cssScale = width / base.width;
        const outputScale = Math.min(2, typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1);
        const viewport = page.getViewport({ scale: cssScale });
        const canvas = canvasRef.current;
        const textDiv = textRef.current;
        if (!canvas || !textDiv) return;
        const ctx = canvas.getContext("2d", { alpha: false });
        if (!ctx) return;
        canvas.width = Math.floor(viewport.width * outputScale);
        canvas.height = Math.floor(viewport.height * outputScale);
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;

        await page.render({
          canvasContext: ctx,
          viewport: page.getViewport({ scale: cssScale * outputScale }),
          // @ts-expect-error v4 accepts canvas for high-dpi output
          canvas,
        }).promise;
        if (cancelled) return;

        // Text layer for selection + copy + search highlighting
        textDiv.innerHTML = "";
        textDiv.style.width = `${Math.floor(viewport.width)}px`;
        textDiv.style.height = `${Math.floor(viewport.height)}px`;
        textDiv.style.setProperty("--scale-factor", String(viewport.scale));
        try {
          const pdfjs = await import("pdfjs-dist");
          const TextLayerCtor = (pdfjs as unknown as { TextLayer?: new (o: unknown) => { render: () => Promise<void> } }).TextLayer;
          if (TextLayerCtor) {
            const tl = new TextLayerCtor({
              textContentSource: page.streamTextContent(),
              container: textDiv,
              viewport,
            });
            await tl.render();
          }
        } catch {
          /* text layer is a progressive enhancement */
        }
        if (cancelled) return;
        renderedKey.current = key;
        setReady(true);
      }

      // Highlighting is applied (and re-applied) independently of rendering,
      // so changing the search query never forces a canvas re-render.
      const textDiv = textRef.current;
      if (!textDiv) return;
      textDiv.querySelectorAll("span.highlight, span.highlight-selected").forEach((span) => {
        span.classList.remove("highlight", "highlight-selected");
      });
      const needle = normalizeArabic(query || "");
      const selected = normalizeArabic(selectedTerm || "");
      if (needle) {
        textDiv.querySelectorAll("span").forEach((span) => {
          const content = normalizeArabic(span.textContent ?? "");
          if (content && content.includes(needle)) span.classList.add("highlight");
          if (selected && content && content.includes(selected)) span.classList.add("highlight-selected");
        });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [doc, pageNo, width, shouldRender, night, query, selectedTerm]);

  return (
    <div
      ref={(el) => {
        wrapRef.current = el;
        registerRef(el);
      }}
      data-page={pageNo}
      id={`pdf-page-${pageNo}`}
      className={cn(
        "relative mx-auto w-full overflow-hidden rounded-sm bg-white shadow-[0_4px_24px_-12px_rgba(0,0,0,.35)]",
        active && "ring-2 ring-[var(--accent)]",
      )}
      style={{ maxWidth: width, height: Math.round(width * ratio) }}
      aria-label={`page ${pageNo}`}
    >
      <canvas ref={canvasRef} className="block h-full w-full" />
      <div ref={textRef} className="textLayer" />
      {!ready && <div className="absolute inset-0 skeleton opacity-60" aria-hidden="true" />}
      <span className="absolute bottom-1 end-2 z-10 rounded bg-black/55 px-1.5 py-0.5 text-[9px] font-bold text-white" aria-hidden="true">
        {pageNo}
      </span>
    </div>
  );
}

function Thumbnail({ doc, pageNo }: { doc: PDFDocumentProxy; pageNo: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [done, setDone] = useState(false);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const page = await doc.getPage(pageNo);
        if (cancelled) return;
        const viewport = page.getViewport({ scale: 0.18 });
        const canvas = canvasRef.current;
        if (!canvas) return;
        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        await page.render({ canvasContext: ctx, viewport }).promise;
        if (!cancelled) setDone(true);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [doc, pageNo]);
  return (
    <div className="relative w-full">
      <canvas ref={canvasRef} className={cn("mx-auto h-auto w-full rounded-sm bg-white shadow-sm", !done && "opacity-0")} />
      {!done && <div className="absolute inset-0 skeleton rounded-sm" aria-hidden="true" />}
    </div>
  );
}
