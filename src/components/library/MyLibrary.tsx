"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { BookMarked, Download, Highlighter, NotebookPen, Star, Trash2, Upload, BookOpen } from "lucide-react";
import { t } from "@/lib/i18n";
import type { Lang } from "@/lib/types";
import {
  KEYS,
  useLocalStore,
  writeStore,
  type Bookmark,
  type Highlight,
  type LastRead,
  type Note,
} from "@/lib/client-store";

type FileMeta = {
  id: string;
  title_ar: string;
  title_en: string;
  section_slug: string;
  section_name_ar: string;
  section_name_en: string;
  section_accent: string;
  page_count: number;
};

export function MyLibrary({ lang }: { lang: Lang }) {
  const bookmarks = useLocalStore<Bookmark[]>(KEYS.bookmarks, []);
  const highlights = useLocalStore<Highlight[]>(KEYS.highlights, []);
  const notes = useLocalStore<Note[]>(KEYS.notes, []);
  const lastRead = useLocalStore<Record<string, LastRead>>(KEYS.lastRead, {});
  const [meta, setMeta] = useState<Record<string, FileMeta>>({});
  const [tab, setTab] = useState<"bookmarks" | "highlights" | "notes">("bookmarks");
  const fileInput = useRef<HTMLInputElement>(null);

  const ids = useMemo(() => {
    const set = new Set<string>();
    bookmarks.value.forEach((b) => set.add(b.fileId));
    highlights.value.forEach((h) => set.add(h.fileId));
    notes.value.forEach((n) => set.add(n.fileId));
    Object.keys(lastRead.value).forEach((id) => set.add(id));
    return Array.from(set);
  }, [bookmarks.value, highlights.value, notes.value, lastRead.value]);

  useEffect(() => {
    if (!ids.length) return;
    fetch(`/api/files/lookup?ids=${ids.join(",")}`)
      .then((r) => (r.ok ? r.json() : { files: [] }))
      .then((d: { files: FileMeta[] }) => {
        const map: Record<string, FileMeta> = {};
        for (const f of d.files) map[f.id] = f;
        setMeta(map);
      })
      .catch(() => undefined);
  }, [ids]);

  const titleOf = (id: string, fallback?: string) => {
    const m = meta[id];
    if (!m) return fallback ?? id;
    return lang === "ar" ? m.title_ar || m.title_en : m.title_en || m.title_ar;
  };

  function exportAll() {
    const payload = {
      exportedAt: new Date().toISOString(),
      bookmarks: bookmarks.value,
      highlights: highlights.value,
      notes: notes.value,
      lastRead: lastRead.value,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `sccam-library-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  async function importAll(file: File) {
    try {
      const data = JSON.parse(await file.text()) as Record<string, unknown>;
      if (Array.isArray(data.bookmarks)) writeStore(KEYS.bookmarks, data.bookmarks as Bookmark[]);
      if (Array.isArray(data.highlights)) writeStore(KEYS.highlights, data.highlights as Highlight[]);
      if (Array.isArray(data.notes)) writeStore(KEYS.notes, data.notes as Note[]);
      if (data.lastRead && typeof data.lastRead === "object") writeStore(KEYS.lastRead, data.lastRead as Record<string, LastRead>);
    } catch {
      /* ignore malformed files */
    }
  }

  const continueRows = Object.entries(lastRead.value)
    .sort((a, b) => (b[1].at ?? 0) - (a[1].at ?? 0))
    .slice(0, 6);

  const tabs = [
    { key: "bookmarks" as const, label: t(lang, "bookmarksTitle"), count: bookmarks.value.length, icon: BookMarked },
    { key: "highlights" as const, label: t(lang, "highlightsTitle"), count: highlights.value.length, icon: Highlighter },
    { key: "notes" as const, label: t(lang, "notesTitle"), count: notes.value.length, icon: NotebookPen },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={exportAll} className="btn btn-outline btn-sm gap-1.5">
          <Download className="h-3.5 w-3.5" /> {t(lang, "exportData")}
        </button>
        <button type="button" onClick={() => fileInput.current?.click()} className="btn btn-outline btn-sm gap-1.5">
          <Upload className="h-3.5 w-3.5" /> {t(lang, "importData")}
        </button>
        <input
          ref={fileInput}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void importAll(f);
          }}
        />
        <button
          type="button"
          onClick={() => {
            if (!window.confirm(t(lang, "confirmDelete"))) return;
            bookmarks.reset();
            highlights.reset();
            notes.reset();
            lastRead.reset();
          }}
          className="btn btn-ghost btn-sm gap-1.5 text-[var(--danger)]"
        >
          <Trash2 className="h-3.5 w-3.5" /> {t(lang, "clearAll")}
        </button>
      </div>

      {continueRows.length > 0 && (
        <section className="mt-6">
          <h2 className="text-[14px] font-bold">{t(lang, "continueTitle")}</h2>
          <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {continueRows.map(([id, e]) => (
              <Link key={id} href={`/file/${id}?page=${e.page}`} className="card card-hover flex items-center gap-2.5 p-3">
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-[var(--surface)] text-[var(--accent)]">
                  <BookOpen className="h-4 w-4" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[12.5px] font-bold">{titleOf(id, e.title)}</span>
                  <span className="block text-[10.5px] text-[var(--muted)]">{t(lang, "lastPage", { n: e.page })}</span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <div className="mt-6 flex gap-1 overflow-x-auto border-b border-[var(--line)]">
        {tabs.map((tb) => (
          <button
            key={tb.key}
            type="button"
            onClick={() => setTab(tb.key)}
            className={`-mb-px flex items-center gap-1.5 border-b-2 px-3 py-2 text-[12.5px] font-bold transition-colors ${
              tab === tb.key ? "border-[var(--accent)] text-[var(--text)]" : "border-transparent text-[var(--muted)]"
            }`}
          >
            <tb.icon className="h-3.5 w-3.5" />
            {tb.label}
            <span className="rounded-full bg-[var(--surface)] px-1.5 text-[10px]">{tb.count}</span>
          </button>
        ))}
      </div>

      <div className="mt-4 space-y-2">
        {tab === "bookmarks" &&
          (bookmarks.value.length === 0 ? (
            <Empty text={t(lang, "noBookmarks")} />
          ) : (
            bookmarks.value
              .slice()
              .reverse()
              .map((b) => (
                <div key={`${b.fileId}-${b.page}-${b.createdAt}`} className="card flex items-center gap-3 p-3">
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-[color-mix(in_srgb,var(--accent)_18%,var(--bg))] text-[var(--accent)]">
                    <Star className="h-4 w-4 fill-current" />
                  </span>
                  <Link href={`/file/${b.fileId}?page=${b.page}`} className="min-w-0 flex-1">
                    <span className="block truncate text-[12.5px] font-bold">{titleOf(b.fileId, b.title)}</span>
                    <span className="block text-[10.5px] text-[var(--muted)]">
                      {b.section} · {t(lang, "page")} {b.page}
                    </span>
                  </Link>
                  <button
                    type="button"
                    aria-label={t(lang, "delete")}
                    onClick={() => bookmarks.set(bookmarks.value.filter((x) => !(x.fileId === b.fileId && x.page === b.page)))}
                    className="btn btn-ghost btn-sm"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))
          ))}

        {tab === "highlights" &&
          (highlights.value.length === 0 ? (
            <Empty text={t(lang, "noNotes")} />
          ) : (
            highlights.value
              .slice()
              .reverse()
              .map((h) => (
                <div key={h.id} className="card p-3">
                  <div className="flex items-start justify-between gap-2">
                    <Link href={`/file/${h.fileId}?page=${h.page}`} className="min-w-0 flex-1">
                      <span className="block truncate text-[11px] font-bold text-[var(--accent)]">
                        {titleOf(h.fileId)} · {t(lang, "page")} {h.page}
                      </span>
                      <blockquote className="mt-1 border-s-2 border-[var(--accent)] ps-2 text-[12px] leading-relaxed text-[var(--muted)]">
                        {h.text}
                      </blockquote>
                    </Link>
                    <button
                      type="button"
                      aria-label={t(lang, "delete")}
                      onClick={() => highlights.set(highlights.value.filter((x) => x.id !== h.id))}
                      className="btn btn-ghost btn-sm"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))
          ))}

        {tab === "notes" &&
          (notes.value.length === 0 ? (
            <Empty text={t(lang, "noNotes")} />
          ) : (
            notes.value
              .slice()
              .reverse()
              .map((n) => (
                <div key={`${n.fileId}-${n.page}`} className="card p-3">
                  <div className="flex items-start justify-between gap-2">
                    <Link href={`/file/${n.fileId}?page=${n.page}`} className="min-w-0 flex-1">
                      <span className="block truncate text-[11px] font-bold text-[var(--accent)]">
                        {titleOf(n.fileId)} · {t(lang, "page")} {n.page}
                      </span>
                      <p className="mt-1 whitespace-pre-wrap text-[12px] leading-relaxed">{n.text}</p>
                    </Link>
                    <button
                      type="button"
                      aria-label={t(lang, "delete")}
                      onClick={() => notes.set(notes.value.filter((x) => !(x.fileId === n.fileId && x.page === n.page)))}
                      className="btn btn-ghost btn-sm"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))
          ))}
      </div>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <div className="card p-10 text-center text-[13px] text-[var(--muted)]">{text}</div>;
}
