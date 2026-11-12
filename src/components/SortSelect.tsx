"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ArrowUpDown } from "lucide-react";
import { t } from "@/lib/i18n";
import type { Lang } from "@/lib/types";

export function SortSelect({ lang, basePath }: { lang: Lang; basePath: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const value = params.get("sort") ?? "default";

  return (
    <label className="relative inline-flex items-center gap-2">
      <span className="sr-only">{t(lang, "sortBy")}</span>
      <ArrowUpDown className="pointer-events-none absolute start-3 h-3.5 w-3.5 text-[var(--muted)]" aria-hidden="true" />
      <select
        value={value}
        onChange={(e) => {
          const next = new URLSearchParams(params.toString());
          if (e.target.value === "default") next.delete("sort");
          else next.set("sort", e.target.value);
          router.push(`${basePath}${next.toString() ? `?${next}` : ""}`);
        }}
        className="field h-10 cursor-pointer appearance-none ps-9 pe-8 text-[12.5px] font-semibold"
      >
        <option value="default">{t(lang, "sortDefault")}</option>
        <option value="newest">{t(lang, "sortNewest")}</option>
        <option value="updated">{t(lang, "sortUpdated")}</option>
        <option value="views">{t(lang, "sortViews")}</option>
        <option value="az">{t(lang, "sortAz")}</option>
      </select>
    </label>
  );
}
