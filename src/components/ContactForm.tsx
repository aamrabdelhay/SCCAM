"use client";

import { useState } from "react";
import { Send, Loader2, CheckCircle2 } from "lucide-react";
import { t } from "@/lib/i18n";
import type { Lang } from "@/lib/types";
import { cn } from "@/lib/format";

export function ContactForm({
  lang,
  fileId,
  page,
  mode = "question",
  compact = false,
}: {
  lang: Lang;
  fileId?: string;
  page?: number;
  mode?: "question" | "report";
  compact?: boolean;
}) {
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [kind, setKind] = useState("issue");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setState("sending");
    try {
      const res = await fetch("/api/inbox", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: mode === "report" ? "report" : "question",
          reportKind: mode === "report" ? kind : undefined,
          fileId,
          pageNo: page,
          name: form.get("name"),
          email: form.get("email"),
          message: form.get("message"),
        }),
      });
      setState(res.ok ? "sent" : "error");
      if (res.ok) (e.target as HTMLFormElement).reset();
    } catch {
      setState("error");
    }
  }

  if (state === "sent") {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-[var(--line)] bg-[color-mix(in_srgb,var(--primary)_10%,var(--bg))] p-4 text-[13px] font-semibold">
        <CheckCircle2 className="h-4 w-4 text-[var(--primary)] dark:text-[var(--accent)]" aria-hidden="true" />
        {mode === "report" ? t(lang, "reportThanks") : t(lang, "contactSent")}
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className={cn("space-y-2.5", compact && "text-[13px]")}>
      {mode === "report" && (
        <div>
          <label className="label" htmlFor="report-kind">
            {t(lang, "reportKind")}
          </label>
          <select id="report-kind" value={kind} onChange={(e) => setKind(e.target.value)} className="field">
            <option value="issue">{t(lang, "reportKindIssue")}</option>
            <option value="outdated">{t(lang, "reportKindOutdated")}</option>
            <option value="copyright">{t(lang, "reportKindCopyright")}</option>
            <option value="other">{t(lang, "reportKindOther")}</option>
          </select>
        </div>
      )}
      <div className="grid gap-2.5 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="contact-name">
            {t(lang, "contactName")} <span className="hint">({t(lang, "optional")})</span>
          </label>
          <input id="contact-name" name="name" maxLength={80} className="field" autoComplete="name" />
        </div>
        <div>
          <label className="label" htmlFor="contact-email">
            {t(lang, "contactEmail")} <span className="hint">({t(lang, "optional")})</span>
          </label>
          <input id="contact-email" name="email" type="email" maxLength={120} className="field" autoComplete="email" dir="ltr" />
        </div>
      </div>
      <div>
        <label className="label" htmlFor="contact-message">
          {mode === "report" ? t(lang, "reportIssue") : t(lang, "contactMessage")}{" "}
          <span className="text-[var(--danger)]">*</span>
        </label>
        <textarea
          id="contact-message"
          name="message"
          required
          minLength={5}
          maxLength={2000}
          rows={compact ? 3 : 5}
          className="field resize-y"
          placeholder={mode === "report" ? t(lang, "reportOutdated") : t(lang, "contactMessage")}
        />
      </div>
      {fileId && (
        <p className="text-[11px] text-[var(--muted)]">
          {t(lang, "fileDetails")}: <code className="rounded bg-[var(--surface)] px-1 py-0.5">{fileId}</code>
          {page ? ` · ${t(lang, "page")} ${page}` : ""}
        </p>
      )}
      {state === "error" && <p className="text-[12px] font-semibold text-[var(--danger)]">{t(lang, "contactError")}</p>}
      <button type="submit" disabled={state === "sending"} className="btn btn-primary">
        {state === "sending" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        {t(lang, "contactSend")}
      </button>
    </form>
  );
}
