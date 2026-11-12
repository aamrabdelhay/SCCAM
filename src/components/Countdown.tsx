"use client";

import { useEffect, useState } from "react";
import { CalendarPlus, Clock } from "lucide-react";
import { t } from "@/lib/i18n";
import type { Lang } from "@/lib/types";

function diff(target: string) {
  const ms = new Date(target).getTime() - Date.now();
  const clamped = Math.max(0, ms);
  return {
    done: ms <= 0,
    days: Math.floor(clamped / 86400000),
    hours: Math.floor((clamped % 86400000) / 3600000),
    minutes: Math.floor((clamped % 3600000) / 60000),
    seconds: Math.floor((clamped % 60000) / 1000),
  };
}

export function Countdown({
  dueAt,
  title,
  note,
  kind,
  id,
  lang,
}: {
  dueAt: string;
  title: string;
  note?: string;
  kind?: string;
  id: string;
  lang: Lang;
}) {
  const [state, setState] = useState(() => diff(dueAt));

  useEffect(() => {
    setState(diff(dueAt));
    const timer = setInterval(() => setState(diff(dueAt)), 1000);
    return () => clearInterval(timer);
  }, [dueAt]);

  const cells: { v: number; l: string }[] = [
    { v: state.days, l: t(lang, "days") },
    { v: state.hours, l: t(lang, "hours") },
    { v: state.minutes, l: t(lang, "minutes") },
    { v: state.seconds, l: t(lang, "seconds") },
  ];

  return (
    <div className="card flex flex-col gap-3 p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[13.5px] font-bold leading-snug">{title}</p>
          {note && <p className="mt-0.5 line-clamp-2 text-[11.5px] text-[var(--muted)]">{note}</p>}
        </div>
        {kind && (
          <span className="badge badge-reference shrink-0 uppercase">{kind}</span>
        )}
      </div>

      {state.done ? (
        <p className="flex items-center gap-1.5 text-[12px] font-semibold text-[var(--danger)]">
          <Clock className="h-3.5 w-3.5" /> {t(lang, "deadlinePassed")}
        </p>
      ) : (
        <div className="flex items-center gap-1.5" dir="ltr" aria-live="off">
          {cells.map((c) => (
            <div key={c.l} className="flex-1 rounded-lg bg-[var(--surface)] px-1 py-1.5 text-center">
              <div className="font-display text-[17px] font-extrabold leading-none tabular-nums" style={{ color: "var(--primary)" }}>
                {String(c.v).padStart(2, "0")}
              </div>
              <div className="mt-1 text-[9px] font-semibold uppercase tracking-wide text-[var(--muted)]">{c.l}</div>
            </div>
          ))}
        </div>
      )}

      <a href={`/api/deadlines/${id}/ics`} className="btn btn-outline btn-sm self-start" download>
        <CalendarPlus className="h-3.5 w-3.5" aria-hidden="true" />
        {t(lang, "addToCalendar")}
      </a>
    </div>
  );
}
