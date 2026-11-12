"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2, FileText, CornerDownLeft } from "lucide-react";
import { t } from "@/lib/i18n";
import type { Lang } from "@/lib/types";
import { pushRecentSearch } from "@/lib/client-store";
import { cn } from "@/lib/format";

type Suggestion = {
  terms: string[];
  files: { id: string; titleAr: string; titleEn: string; section: string }[];
};

export function SearchBox({
  lang,
  size = "md",
  autoFocus = false,
  onNavigate,
  initialQuery = "",
  placeholder,
}: {
  lang: Lang;
  size?: "md" | "lg" | "sm";
  autoFocus?: boolean;
  onNavigate?: () => void;
  initialQuery?: string;
  placeholder?: string;
}) {
  const router = useRouter();
  const [q, setQ] = useState(initialQuery);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sug, setSug] = useState<Suggestion | null>(null);
  const [active, setActive] = useState(-1);
  const boxRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();

  useEffect(() => {
    if (!q.trim() || q.trim().length < 2) {
      setSug(null);
      return;
    }
    const ctrl = new AbortController();
    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/search/suggest?q=${encodeURIComponent(q)}`, { signal: ctrl.signal });
        if (res.ok) setSug(await res.json());
      } catch {
        /* aborted */
      } finally {
        setLoading(false);
      }
    }, 180);
    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
  }, [q]);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const options: { label: string; href: string; icon: "term" | "file" }[] = [
    ...(sug?.files ?? []).map((f) => ({
      label: lang === "ar" ? f.titleAr || f.titleEn : f.titleEn || f.titleAr,
      href: `/file/${f.id}`,
      icon: "file" as const,
    })),
    ...(sug?.terms ?? []).map((term) => ({
      label: term,
      href: `/search?q=${encodeURIComponent(term)}`,
      icon: "term" as const,
    })),
  ];

  function submit(value = q) {
    const query = value.trim();
    if (!query) return;
    pushRecentSearch(query);
    setOpen(false);
    onNavigate?.();
    router.push(`/search?q=${encodeURIComponent(query)}`);
  }

  function go(href: string) {
    setOpen(false);
    onNavigate?.();
    router.push(href);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActive((a) => Math.min(a + 1, options.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, -1));
    } else if (e.key === "Enter") {
      if (active >= 0 && options[active]) {
        e.preventDefault();
        go(options[active].href);
      } else {
        submit();
      }
    } else if (e.key === "Escape") {
      setOpen(false);
      (e.target as HTMLInputElement).blur();
    }
  }

  return (
    <div ref={boxRef} className="relative w-full">
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="relative"
      >
        <label htmlFor={`${listId}-input`} className="sr-only">
          {t(lang, "searchGlobal")}
        </label>
        <Search
          className={cn(
            "pointer-events-none absolute top-1/2 -translate-y-1/2 text-[var(--muted)]",
            lang === "ar" ? "right-3.5" : "left-3.5",
            size === "lg" ? "h-5 w-5" : "h-4 w-4",
          )}
          aria-hidden="true"
        />
        <input
          id={`${listId}-input`}
          ref={inputRef}
          type="search"
          value={q}
          autoFocus={autoFocus}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
            setActive(-1);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={placeholder ?? t(lang, "searchPlaceholder")}
          autoComplete="off"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={active >= 0 ? `${listId}-opt-${active}` : undefined}
          className={cn(
            "w-full rounded-full border bg-[var(--card)] text-[var(--text)] shadow-sm outline-none transition-all placeholder:text-[var(--muted)]",
            lang === "ar" ? "pr-10 pl-24" : "pl-10 pr-24",
            size === "lg" ? "h-14 text-base" : size === "sm" ? "h-9 text-[13px]" : "h-11 text-sm",
            "border-[var(--line)] focus:border-[color-mix(in_srgb,var(--primary)_55%,var(--line))] focus:shadow-md",
          )}
        />
        <button
          type="submit"
          className={cn(
            "absolute top-1/2 -translate-y-1/2 rounded-full bg-[var(--primary)] font-semibold text-white transition-colors hover:bg-[color-mix(in_srgb,var(--primary)_88%,#000)]",
            lang === "ar" ? "left-1.5" : "right-1.5",
            size === "lg" ? "h-11 px-5 text-sm" : size === "sm" ? "h-7 px-3 text-[11px]" : "h-8 px-4 text-xs",
          )}
        >
          {t(lang, "searchAction")}
        </button>
      </form>

      {open && (q.trim().length >= 2) && (
        <div
          id={listId}
          role="listbox"
          className="absolute inset-x-0 top-[calc(100%+8px)] z-50 overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--card)] shadow-xl"
        >
          {loading && !sug && (
            <div className="flex items-center gap-2 px-4 py-3 text-xs text-[var(--muted)]">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> {t(lang, "searching")}
            </div>
          )}
          {options.length === 0 && !loading && (
            <div className="px-4 py-3 text-xs text-[var(--muted)]">{t(lang, "noResults")}</div>
          )}
          {options.map((opt, i) => (
            <button
              key={`${opt.href}-${i}`}
              id={`${listId}-opt-${i}`}
              role="option"
              aria-selected={active === i}
              type="button"
              onMouseEnter={() => setActive(i)}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => go(opt.href)}
              className={cn(
                "flex w-full items-center gap-2.5 px-4 py-2.5 text-start text-[13px] transition-colors",
                active === i ? "bg-[var(--surface)]" : "hover:bg-[var(--surface)]",
              )}
            >
              {opt.icon === "file" ? (
                <FileText className="h-3.5 w-3.5 shrink-0 text-[var(--accent)]" />
              ) : (
                <Search className="h-3.5 w-3.5 shrink-0 text-[var(--muted)]" />
              )}
              <span className="truncate">{opt.label}</span>
            </button>
          ))}
          <button
            type="button"
            onClick={() => submit()}
            className="flex w-full items-center justify-between border-t border-[var(--line)] bg-[var(--surface)] px-4 py-2.5 text-[12px] font-semibold text-[var(--primary)] dark:text-[var(--accent)]"
          >
            <span className="truncate">
              {t(lang, "searchAction")}: “{q}”
            </span>
            <CornerDownLeft className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
