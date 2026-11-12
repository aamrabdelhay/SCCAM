"use client";

import { useState } from "react";
import { Flag, X } from "lucide-react";
import { ContactForm } from "@/components/ContactForm";
import { t } from "@/lib/i18n";
import type { Lang } from "@/lib/types";

export function ReportButton({ lang, fileId, page }: { lang: Lang; fileId: string; page: number }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="btn btn-outline btn-sm mt-2 w-full gap-1.5">
        <Flag className="h-3.5 w-3.5" /> {t(lang, "reportIssue")}
      </button>
      {open && (
        <div className="fixed inset-0 z-[90] flex items-end justify-center bg-black/45 p-3 sm:items-center" role="dialog" aria-modal="true" aria-label={t(lang, "reportIssue")}>
          <div className="w-full max-w-lg rounded-2xl border border-[var(--line)] bg-[var(--card)] p-5 shadow-2xl">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-[15px] font-bold">{t(lang, "reportIssue")}</h2>
              <button type="button" onClick={() => setOpen(false)} className="btn btn-ghost btn-sm" aria-label={t(lang, "close")}>
                <X className="h-4 w-4" />
              </button>
            </div>
            <ContactForm lang={lang} mode="report" fileId={fileId} page={page} compact />
          </div>
        </div>
      )}
    </>
  );
}
