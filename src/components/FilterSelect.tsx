"use client";

import { useRouter, useSearchParams } from "next/navigation";

/** Generic query-param select (replaces one search param, keeps the rest). */
export function FilterSelect({
  options,
  param,
  label,
  basePath,
}: {
  options: { value: string; label: string }[];
  param: string;
  label: string;
  basePath: string;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const value = params.get(param) ?? "";

  return (
    <label className="inline-flex items-center gap-1.5">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(e) => {
          const next = new URLSearchParams(params.toString());
          if (!e.target.value) next.delete(param);
          else next.set(param, e.target.value);
          router.push(`${basePath}${next.toString() ? `?${next}` : ""}`);
        }}
        className="field h-9 w-auto cursor-pointer py-0 text-[12px] font-semibold"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
