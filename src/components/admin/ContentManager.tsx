"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { t } from "@/lib/i18n";
import type { Lang } from "@/lib/types";
import { adminJson } from "@/lib/admin-client";
import { formatDate } from "@/lib/format";

type News = { id: string; title_ar: string; title_en: string; body_ar: string; body_en: string; kind: string; link: string; published_at: string; is_pinned: number };
type Faq = { id: string; question_ar: string; question_en: string; answer_ar: string; answer_en: string; sort_order: number };
type Deadline = { id: string; title_ar: string; title_en: string; note_ar: string; note_en: string; kind: string; due_at: string };

export function ContentManager({
  lang,
  news,
  faqs,
  deadlines,
}: {
  lang: Lang;
  news: News[];
  faqs: Faq[];
  deadlines: Deadline[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  async function save(type: string, action: string, payload: Record<string, unknown>, id?: string) {
    setBusy(id ?? type);
    await adminJson("/api/admin/content", "POST", { type, action, id, payload });
    setBusy(null);
    router.refresh();
  }

  return (
    <div className="space-y-5">
      {/* NEWS */}
      <section id="news" className="card scroll-mt-24 p-4">
        <h2 className="text-[14px] font-bold">{t(lang, "adminNews")}</h2>
        <form
          className="mt-2 grid gap-2 sm:grid-cols-2"
          onSubmit={async (e) => {
            e.preventDefault();
            const form = new FormData(e.currentTarget);
            await save("news", "create", {
              titleAr: form.get("titleAr"),
              titleEn: form.get("titleEn"),
              bodyAr: form.get("bodyAr"),
              bodyEn: form.get("bodyEn"),
              link: form.get("link"),
              kind: form.get("kind"),
              publishedAt: form.get("publishedAt") ? new Date(String(form.get("publishedAt"))).toISOString() : new Date().toISOString(),
              isPinned: form.get("isPinned") === "1",
            });
            (e.target as HTMLFormElement).reset();
          }}
        >
          <input name="titleAr" required placeholder="العنوان" className="field text-[12px]" dir="rtl" />
          <input name="titleEn" placeholder="Title" className="field text-[12px]" dir="ltr" />
          <textarea name="bodyAr" rows={2} placeholder={t(lang, "adminBody")} className="field text-[12px]" dir="rtl" />
          <textarea name="bodyEn" rows={2} placeholder={t(lang, "adminBody")} className="field text-[12px]" dir="ltr" />
          <input name="link" placeholder={t(lang, "adminUrl")} className="field text-[12px]" dir="ltr" />
          <div className="flex gap-2">
            <select name="kind" className="field text-[12px]">
              <option value="news">{t(lang, "adminNews")}</option>
              <option value="announcement">{t(lang, "adminAnnouncement")}</option>
              <option value="deadline">{t(lang, "adminDeadlines")}</option>
            </select>
            <input name="publishedAt" type="datetime-local" className="field text-[12px]" aria-label={t(lang, "publishAt")} />
            <label className="inline-flex shrink-0 items-center gap-1 text-[11px] font-semibold">
              <input type="checkbox" name="isPinned" value="1" className="h-3.5 w-3.5 accent-[var(--primary)]" /> {t(lang, "pinned")}
            </label>
          </div>
          <button type="submit" className="btn btn-primary btn-sm gap-1 sm:col-span-2 sm:self-start">
            <Plus className="h-3.5 w-3.5" /> {t(lang, "adminAddNews")}
          </button>
        </form>

        <ul className="mt-3 space-y-1.5 border-t border-[var(--line)] pt-3">
          {news.map((n) => (
            <li key={n.id} className="flex items-start justify-between gap-2 rounded-lg bg-[var(--surface)] p-2">
              <div className="min-w-0">
                <p className="truncate text-[12px] font-bold">{n.title_ar} {n.title_en && <span className="text-[var(--muted)]">/ {n.title_en}</span>}</p>
                <p className="text-[10.5px] text-[var(--muted)]">{formatDate(n.published_at, lang)} · {n.kind} {n.is_pinned ? `· ${t(lang, "pinned")}` : ""}</p>
              </div>
              <button
                type="button"
                onClick={async () => {
                  if (!window.confirm(t(lang, "confirmDelete"))) return;
                  await save("news", "delete", {}, n.id);
                }}
                className="btn btn-ghost btn-sm text-[var(--danger)]"
                aria-label={t(lang, "delete")}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
          {news.length === 0 && <li className="text-[11.5px] text-[var(--muted)]">{t(lang, "adminNoData")}</li>}
        </ul>
      </section>

      {/* FAQ */}
      <section id="faq" className="card scroll-mt-24 p-4">
        <h2 className="text-[14px] font-bold">{t(lang, "adminFaq")}</h2>
        <form
          className="mt-2 grid gap-2 sm:grid-cols-2"
          onSubmit={async (e) => {
            e.preventDefault();
            const form = new FormData(e.currentTarget);
            await save("faq", "create", {
              questionAr: form.get("questionAr"),
              questionEn: form.get("questionEn"),
              answerAr: form.get("answerAr"),
              answerEn: form.get("answerEn"),
              sortOrder: Number(new FormData(e.currentTarget).get("sortOrder")) || 0,
            });
            (e.target as HTMLFormElement).reset();
          }}
        >
          <input name="questionAr" required placeholder={t(lang, "adminQuestion")} className="field text-[12px]" dir="rtl" />
          <input name="questionEn" placeholder={t(lang, "adminQuestion")} className="field text-[12px]" dir="ltr" />
          <textarea name="answerAr" rows={2} placeholder={t(lang, "adminAnswer")} className="field text-[12px]" dir="rtl" />
          <textarea name="answerEn" rows={2} placeholder={t(lang, "adminAnswer")} className="field text-[12px]" dir="ltr" />
          <input name="sortOrder" type="number" placeholder={t(lang, "adminSort")} className="field w-24 text-[12px]" />
          <button type="submit" className="btn btn-primary btn-sm gap-1">
            <Plus className="h-3.5 w-3.5" /> {t(lang, "adminAddFaq")}
          </button>
        </form>
        <ul className="mt-3 space-y-1.5 border-t border-[var(--line)] pt-3">
          {faqs.map((f) => (
            <li key={f.id} className="flex items-start justify-between gap-2 rounded-lg bg-[var(--surface)] p-2">
              <div className="min-w-0">
                <p className="truncate text-[12px] font-bold">{f.question_ar}</p>
                <p className="line-clamp-2 text-[10.5px] text-[var(--muted)]">{f.answer_ar}</p>
              </div>
              <button
                type="button"
                onClick={async () => {
                  if (!window.confirm(t(lang, "confirmDelete"))) return;
                  await save("faq", "delete", {}, f.id);
                }}
                className="btn btn-ghost btn-sm text-[var(--danger)]"
                aria-label={t(lang, "delete")}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
          {faqs.length === 0 && <li className="text-[11.5px] text-[var(--muted)]">{t(lang, "adminNoData")}</li>}
        </ul>
      </section>

      {/* DEADLINES */}
      <section id="deadlines" className="card scroll-mt-24 p-4">
        <h2 className="text-[14px] font-bold">{t(lang, "adminDeadlines")}</h2>
        <form
          className="mt-2 grid gap-2 sm:grid-cols-2"
          onSubmit={async (e) => {
            e.preventDefault();
            const form = new FormData(e.currentTarget);
            await save("deadline", "create", {
              titleAr: form.get("titleAr"),
              titleEn: form.get("titleEn"),
              noteAr: form.get("noteAr"),
              noteEn: form.get("noteEn"),
              kind: form.get("kind"),
              dueAt: form.get("dueAt") ? new Date(String(form.get("dueAt"))).toISOString() : new Date().toISOString(),
            });
            (e.target as HTMLFormElement).reset();
          }}
        >
          <input name="titleAr" required placeholder="العنوان" className="field text-[12px]" dir="rtl" />
          <input name="titleEn" placeholder="Title" className="field text-[12px]" dir="ltr" />
          <input name="noteAr" placeholder={t(lang, "adminNote")} className="field text-[12px]" dir="rtl" />
          <input name="noteEn" placeholder={t(lang, "adminNote")} className="field text-[12px]" dir="ltr" />
          <input name="dueAt" type="datetime-local" required className="field text-[12px]" aria-label={t(lang, "adminDueAt")} />
          <div className="flex gap-2">
            <select name="kind" className="field text-[12px]">
              <option value="registration">registration</option>
              <option value="memorial">memorial</option>
              <option value="oral">oral</option>
              <option value="other">other</option>
            </select>
            <button type="submit" className="btn btn-primary btn-sm gap-1">
              {busy === "deadline" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
              {t(lang, "adminAddDeadline")}
            </button>
          </div>
        </form>
        <ul className="mt-3 space-y-1.5 border-t border-[var(--line)] pt-3">
          {deadlines.map((d) => (
            <li key={d.id} className="flex items-start justify-between gap-2 rounded-lg bg-[var(--surface)] p-2">
              <div className="min-w-0">
                <p className="truncate text-[12px] font-bold">{d.title_ar}</p>
                <p className="text-[10.5px] text-[var(--muted)]">{formatDate(d.due_at, lang, { hour: "2-digit", minute: "2-digit" })} · {d.kind}</p>
              </div>
              <button
                type="button"
                onClick={async () => {
                  if (!window.confirm(t(lang, "confirmDelete"))) return;
                  await save("deadline", "delete", {}, d.id);
                }}
                className="btn btn-ghost btn-sm text-[var(--danger)]"
                aria-label={t(lang, "delete")}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
          {deadlines.length === 0 && <li className="text-[11.5px] text-[var(--muted)]">{t(lang, "adminNoData")}</li>}
        </ul>
      </section>
    </div>
  );
}
