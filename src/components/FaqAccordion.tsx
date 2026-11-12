import { ChevronDown } from "lucide-react";
import type { FaqRow, Lang } from "@/lib/types";
import { pickText } from "@/lib/format";

export function FaqAccordion({ items, lang }: { items: FaqRow[]; lang: Lang }) {
  if (!items.length) return null;
  return (
    <div className="divide-y divide-[var(--line)] overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--card)]">
      {items.map((item, i) => (
        <details key={item.id} className="group" open={i === 0}>
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 text-[14px] font-semibold marker:hidden hover:bg-[var(--surface)]">
            <span>{pickText(lang, item.question_ar, item.question_en)}</span>
            <ChevronDown className="h-4 w-4 shrink-0 text-[var(--muted)] transition-transform group-open:rotate-180" aria-hidden="true" />
          </summary>
          <div className="px-5 pb-5 text-[13px] leading-relaxed text-[var(--muted)]">
            {pickText(lang, item.answer_ar, item.answer_en)}
          </div>
        </details>
      ))}
    </div>
  );
}
