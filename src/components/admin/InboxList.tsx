"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { Check, Trash2, Mail } from "lucide-react";
import { t } from "@/lib/i18n";
import type { Lang } from "@/lib/types";
import { adminJson } from "@/lib/admin-client";
import { formatDate } from "@/lib/format";

type Msg = {
  id: string;
  kind: string;
  file_id: string | null;
  page_no: number | null;
  name: string;
  email: string;
  message: string;
  status: string;
  created_at: string;
};

export function InboxList({ lang, messages }: { lang: Lang; messages: Msg[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  async function act(id: string, status: "open" | "resolved" | "deleted") {
    setBusy(id);
    await adminJson("/api/admin/inbox", "POST", { id, status });
    setBusy(null);
    router.refresh();
  }

  if (!messages.length) return <div className="card p-8 text-center text-[12.5px] text-[var(--muted)]">{t(lang, "adminInboxEmpty")}</div>;

  return (
    <ul className="space-y-2">
      {messages.map((m) => (
        <li key={m.id} className="card p-3.5">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className={`badge ${m.status === "open" ? "badge-important" : "badge-reference"}`}>
                {m.status === "open" ? t(lang, "adminOpen") : t(lang, "adminResolved")}
              </span>
              <span className="badge badge-new">{m.kind}</span>
              <span className="text-[10.5px] text-[var(--muted)]">{formatDate(m.created_at, lang, { hour: "2-digit", minute: "2-digit" })}</span>
            </div>
            <div className="flex items-center gap-1">
              {m.status === "open" && (
                <button type="button" onClick={() => act(m.id, "resolved")} disabled={busy === m.id} className="btn btn-outline btn-sm gap-1">
                  <Check className="h-3 w-3" /> {t(lang, "adminMarkResolved")}
                </button>
              )}
              <button type="button" onClick={() => act(m.id, "deleted")} disabled={busy === m.id} className="btn btn-ghost btn-sm text-[var(--danger)]" aria-label={t(lang, "delete")}>
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
          <p className="mt-2 whitespace-pre-wrap text-[12.5px] leading-relaxed" dir="auto">{m.message}</p>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-[var(--muted)]">
            {m.name && <span>{m.name}</span>}
            {m.email && (
              <a href={`mailto:${m.email}`} className="link inline-flex items-center gap-1" dir="ltr">
                <Mail className="h-3 w-3" /> {m.email}
              </a>
            )}
            {m.file_id && (
              <Link href={`/admin/files/${m.file_id}`} className="link">
                {m.file_id.slice(0, 10)}
                {m.page_no ? ` · p.${m.page_no}` : ""}
              </Link>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
