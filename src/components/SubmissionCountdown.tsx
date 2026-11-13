"use client";

import { useEffect, useState } from "react";
import { Clock3 } from "lucide-react";
import type { Lang, SettingsMap } from "@/lib/types";
import { t } from "@/lib/i18n";

const DEFAULT_FIRST_DUE = "2026-12-06T21:59:59.999Z";
const DEFAULT_SECOND_DUE = "2027-01-03T21:59:59.999Z";

function countdownParts(target: number, now: number) {
  const remaining = Math.max(0, target - now);
  return {
    days: Math.floor(remaining / 86400000),
    hours: Math.floor((remaining % 86400000) / 3600000),
    minutes: Math.floor((remaining % 3600000) / 60000),
    seconds: Math.floor((remaining % 60000) / 1000),
  };
}

function dateLabel(value: string, lang: Lang) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(lang === "ar" ? "ar-EG" : "en-GB", {
    timeZone: "Africa/Cairo",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function SubmissionCountdown({ lang, settings }: { lang: Lang; settings: SettingsMap }) {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  const firstDue = settings.timer_claimant_due_at || DEFAULT_FIRST_DUE;
  const secondDue = settings.timer_respondent_due_at || DEFAULT_SECOND_DUE;
  const firstTime = new Date(firstDue).getTime();
  const secondTime = new Date(secondDue).getTime();
  const phase = now === null ? 0 : now < firstTime ? 0 : now < secondTime ? 1 : 2;

  const activeTitle = phase === 0
    ? (lang === "ar"
      ? settings.timer_claimant_title_ar || "آخر موعد لتسليم مذكرة المدعي"
      : settings.timer_claimant_title_en || "Claimant's Memorial Submission Deadline")
    : (lang === "ar"
      ? settings.timer_respondent_title_ar || "آخر موعد لتسليم مذكرة المدعى عليه"
      : settings.timer_respondent_title_en || "Respondent's Memorial Submission Deadline");
  const targetValue = phase === 0 ? firstDue : secondDue;
  const targetTime = phase === 0 ? firstTime : secondTime;
  const parts = now === null || phase === 2
    ? { days: 0, hours: 0, minutes: 0, seconds: 0 }
    : countdownParts(targetTime, now);

  const labels = [
    { value: parts.days, label: t(lang, "days") },
    { value: parts.hours, label: t(lang, "hours") },
    { value: parts.minutes, label: t(lang, "minutes") },
    { value: parts.seconds, label: t(lang, "seconds") },
  ];

  return (
    <section aria-label={lang === "ar" ? "العد التنازلي لمواعيد تسليم المذكرات" : "Memorial submission countdown"} className="container-x pt-2">
      <div className="overflow-hidden rounded-xl border border-[color-mix(in_srgb,var(--brand-green)_20%,var(--line))] bg-[linear-gradient(105deg,color-mix(in_srgb,var(--brand-green)_10%,var(--card)),color-mix(in_srgb,var(--brand-blue)_7%,var(--card))_55%,color-mix(in_srgb,var(--brand-yellow)_14%,var(--card)))] shadow-[0_8px_24px_-22px_rgba(12,72,113,.45)]">
        <div className="brand-spectrum h-[3px]" aria-hidden="true" />
        <div className="flex flex-col gap-2.5 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-4">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-[var(--brand-green-deep)] text-white shadow-sm">
              <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <h2 className="truncate text-[12px] font-extrabold leading-tight text-[var(--text)] sm:text-[13px]">
                {phase === 2
                  ? (lang === "ar" ? "انتهت مواعيد تسليم المذكرات" : "All memorial deadlines have passed")
                  : activeTitle}
              </h2>
              {phase < 2 && <p className="mt-0.5 text-[10px] font-semibold text-[var(--brand-navy)]">{dateLabel(targetValue, lang)}</p>}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2" dir="ltr" aria-live="off">
            {labels.map((item, index) => (
              <div key={item.label} className="flex min-w-[42px] items-baseline justify-center gap-1 rounded-lg border border-white/70 bg-white/65 px-1.5 py-1 sm:min-w-[48px]">
                <span className="font-display text-[15px] font-extrabold leading-none tabular-nums text-[var(--brand-navy)] sm:text-[16px]">
                  {now === null ? "--" : String(item.value).padStart(2, "0")}
                </span>
                <span className="text-[8px] font-semibold text-[var(--muted)] sm:text-[9px]">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
