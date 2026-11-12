"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { History, X } from "lucide-react";
import { KEYS, useLocalStore } from "@/lib/client-store";
import { t } from "@/lib/i18n";
import type { Lang } from "@/lib/types";

export function RecentSearches({ lang }: { lang: Lang }) {
  const { value, reset } = useLocalStore<string[]>(KEYS.recent, []);
  const [items, setItems] = useState<string[]>([]);

  useEffect(() => setItems(value.slice(0, 8)), [value]);

  if (!items.length) return null;
  return (
    <div className="mt-3 flex flex-wrap items-center gap-1.5">
      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[var(--muted)]">
        <History className="h-3 w-3" aria-hidden="true" />
        {t(lang, "recentSearches")}:
      </span>
      {items.map((q) => (
        <Link key={q} href={`/search?q=${encodeURIComponent(q)}`} className="chip !py-1 !text-[11.5px]">
          {q}
        </Link>
      ))}
      <button type="button" onClick={reset} className="chip !py-1 !text-[11px] !text-[var(--muted)]" aria-label={t(lang, "clearHistory")}>
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}
