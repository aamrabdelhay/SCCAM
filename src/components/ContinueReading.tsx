"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BookOpen, ArrowLeft, ArrowRight, Trash2 } from "lucide-react";
import { KEYS, useLocalStore, writeStore, type LastRead } from "@/lib/client-store";
import { t } from "@/lib/i18n";
import type { Lang } from "@/lib/types";

export function ContinueReading({ lang }: { lang: Lang }) {
  const { value, set } = useLocalStore<Record<string, LastRead>>(KEYS.lastRead, {});
  const [rows, setRows] = useState<{ id: string; entry: LastRead }[]>([]);

  useEffect(() => {
    setRows(
      Object.entries(value)
        .filter(([, e]) => e && typeof e.page === "number")
        .sort((a, b) => (b[1].at ?? 0) - (a[1].at ?? 0))
        .slice(0, 6)
        .map(([id, entry]) => ({ id, entry })),
    );
  }, [value]);

  if (!rows.length) return null;
  const Arrow = lang === "ar" ? ArrowLeft : ArrowRight;

  return (
    <section aria-labelledby="continue-title" className="container-x mt-14">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <h2 id="continue-title" className="section-title">
            {t(lang, "continueTitle")}
          </h2>
          <p className="mt-1 text-[13px] text-[var(--muted)]">{t(lang, "continueSubtitle")}</p>
        </div>
        <Link href="/library" className="text-[12.5px] font-semibold link">
          {t(lang, "myLibrary")}
        </Link>
      </div>
      <div className="no-scrollbar -mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
        {rows.map(({ id, entry }) => (
          <div key={id} className="card group relative w-[260px] shrink-0 snap-start p-4">
            <button
              type="button"
              aria-label={t(lang, "clearAll")}
              onClick={() => {
                const next = { ...value };
                delete next[id];
                set(next);
                writeStore(KEYS.lastRead, next);
              }}
              className="absolute end-2 top-2 rounded-full p-1.5 text-[var(--muted)] opacity-0 transition-opacity hover:bg-[var(--surface)] group-hover:opacity-100"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
            <Link href={`/file/${id}?page=${entry.page}`} className="block">
              <span className="flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-wide text-[var(--accent)]">
                <BookOpen className="h-3 w-3" /> {entry.section}
              </span>
              <p className="mt-1.5 line-clamp-2 pe-5 text-[13px] font-bold leading-snug">{entry.title}</p>
              <div className="mt-2 flex items-center justify-between text-[11px] text-[var(--muted)]">
                <span>{t(lang, "lastPage", { n: entry.page })}</span>
                <span>
                  {entry.page}/{entry.total}
                </span>
              </div>
              <div className="mt-2 h-1 overflow-hidden rounded-full bg-[var(--surface)]">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.min(100, Math.round((entry.page / Math.max(1, entry.total)) * 100))}%`,
                    background: "var(--accent)",
                  }}
                />
              </div>
              <span className="mt-2 flex items-center gap-1 text-[11.5px] font-semibold text-[var(--primary)] dark:text-[var(--accent)]">
                {t(lang, "continueReading")} <Arrow className="h-3 w-3" />
              </span>
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}
