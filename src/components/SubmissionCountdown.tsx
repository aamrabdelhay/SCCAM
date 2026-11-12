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
  const currentTime = now ?? 0;
  const phase = now === null ? 0 : currentTime < firstTime ? 0 : currentTime < secondTime ? 1 : 2;

  const claimantTitleAr = settings.timer_claimant_title_ar || "آخر موعد لتسليم مذكرة المدعي";
  const claimantTitleEn = settings.timer_claimant_title_en || "Claimant's Memorial Submission Deadline";
  const respondentTitleAr = settings.timer_respondent_title_ar || "آخر موعد لتسليم مذكرة المدعى عليه";
  const respondentTitleEn = settings.timer_respondent_title_en || "Respondent's Memorial Submission Deadline";
  const activeTitle = phase === 0
    ? (lang === "ar" ? claimantTitleAr : claimantTitleEn)
    : (lang === "ar" ? respondentTitleAr : respondentTitleEn);
  const targetValue = phase === 0 ? firstDue : secondDue;
  const targetTime = phase === 0 ? firstTime : secondTime;
  const parts = now === null || phase === 2
    ? { days: 0, hours: 0, minutes: 0, seconds: 0 }
    : countdownParts(targetTime, currentTime);
  const labels = [
    { value: parts.days, label: t(lang, "days") },
    { value: parts.hours, label: t(lang, "hours") },
    { value: parts.minutes, label: t(lang, "minutes") },
    { value: parts.seconds, label: t(lang, "seconds") },
  ];

  return (
    <section aria-label={lang === "ar" ? "العد التنازلي لمواعيد تسليم المذكرات" : "Memorial submission countdown"} className="container-x pt-4">
      <div className="overflow-hidden rounded-2xl border border-[color-mix(in_srgb,var(--brand-yellow)_55%,var(--line))] bg-[var(--brand-navy)] text-white shadow-[0_16px_36px_-25px_rgba(12,72,113,.7)]">
        <div className="brand-spectrum h-1" aria-hidden="true" />
        <div className="flex flex-col gap-4 px-4 py-4 sm:px-6 sm:py-5 md:flex-row md:items-center md:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/10 text-[#F4B042]">
              <Clock3 className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-[10px] font-bold tracking-[0.14em] text-white/60">{lang === "ar" ? "الوقت المتبقي" : "TIME REMAINING"}</p>
              <h2 className="mt-1 text-[15px] font-extrabold leading-relaxed sm:text-[17px]">{phase === 2 ? (lang === "ar" ? "انتهت مواعيد تسليم المذكرات" : "All memorial submission deadlines have passed") : activeTitle}</h2>
              {phase < 2 && <p className="mt-1 text-[11px] font-medium text-[#F4B042]">{dateLabel(targetValue, lang)}</p>}
            </div>
          </div>
          <div className="grid grid-cols-4 gap-2 sm:gap-3" dir="ltr" aria-live="off">
            {labels.map((item) => (
              <div key={item.label} className="min-w-[58px] rounded-xl border border-white/10 bg-white/[0.07] px-2 py-2.5 text-center sm:min-w-[70px] sm:px-3">
                <div className="font-display text-[22px] font-extrabold leading-none tabular-nums text-white sm:text-[27px]">{now === null ? "--" : String(item.value).padStart(2, "0")}</div>
                <div className="mt-1.5 text-[9px] font-semibold text-white/60 sm:text-[10px]">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
