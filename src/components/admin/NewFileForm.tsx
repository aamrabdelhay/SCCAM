"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";
import { t } from "@/lib/i18n";
import type { Lang } from "@/lib/types";
import { csrfToken } from "@/lib/admin-client";
import { AdminSelect } from "./AdminSelect";

export function NewFileForm({
  lang,
  sections,
}: {
  lang: Lang;
  sections: { id: string; name: string; categories: { id: string; name: string }[] }[];
}) {
  const router = useRouter();
  const [sectionId, setSectionId] = useState(sections[0]?.id ?? "");
  const [categoryId, setCategoryId] = useState("");
  const [titleAr, setTitleAr] = useState("");
  const [titleEn, setTitleEn] = useState("");
  const [titleArEdited, setTitleArEdited] = useState(false);
  const [titleEnEdited, setTitleEnEdited] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const active = sections.find((s) => s.id === sectionId);
  const sectionOptions = sections.map((section) => ({ value: section.id, label: section.name }));
  const categoryOptions = (active?.categories ?? []).map((category) => ({ value: category.id, label: category.name }));

  function suggestTitle(file?: File) {
    if (!file) return;
    const suggested = file.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
    if (!titleArEdited) setTitleAr(suggested);
    if (!titleEnEdited) setTitleEn(suggested);
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/files", {
        method: "POST",
        body: form,
        headers: { "x-csrf-token": csrfToken() },
      });
      const data = (await res.json().catch(() => ({}))) as { id?: string; ok?: boolean; error?: string };
      if (res.ok && data.id) {
        router.push(`/admin/files/${data.id}`);
        router.refresh();
      } else {
        setError(data.error ?? t(lang, "error"));
      }
    } catch {
      setError(t(lang, "error"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="card space-y-3 p-4">
      <h2 className="text-[15px] font-extrabold">{t(lang, "adminNewFile")}</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="n-title-ar">{t(lang, "titleAr")}</label>
          <input id="n-title-ar" name="titleAr" required className="field" dir="rtl" value={titleAr} onChange={(e) => { setTitleAr(e.target.value); setTitleArEdited(true); }} />
        </div>
        <div>
          <label className="label" htmlFor="n-title-en">{t(lang, "titleEn")}</label>
          <input id="n-title-en" name="titleEn" className="field" dir="ltr" value={titleEn} onChange={(e) => { setTitleEn(e.target.value); setTitleEnEdited(true); }} />
        </div>
        <div>
          <label className="label" htmlFor="n-section">{t(lang, "section")}</label>
          <AdminSelect id="n-section" value={sectionId} options={sectionOptions} placeholder="اختر القسم" onChange={(value) => { setSectionId(value); setCategoryId(""); }} />
          <input type="hidden" name="sectionId" value={sectionId} />
        </div>
        <div>
          <label className="label" htmlFor="n-category">{t(lang, "subCategory")}</label>
          <AdminSelect id="n-category" value={categoryId} options={categoryOptions} placeholder="بدون تصنيف" onChange={setCategoryId} />
          <input type="hidden" name="categoryId" value={categoryId} />
        </div>
        <div>
          <label className="label" htmlFor="n-desc-ar">{t(lang, "description")} (AR)</label>
          <textarea id="n-desc-ar" name="descriptionAr" rows={2} className="field" dir="rtl" />
        </div>
        <div>
          <label className="label" htmlFor="n-desc-en">{t(lang, "description")} (EN)</label>
          <textarea id="n-desc-en" name="descriptionEn" rows={2} className="field" dir="ltr" />
        </div>
        <div>
          <label className="label" htmlFor="n-tags">{t(lang, "tags")}</label>
          <input id="n-tags" name="tags" className="field" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="label" htmlFor="n-year">{t(lang, "edition")}</label>
            <input id="n-year" name="editionYear" className="field" dir="ltr" />
          </div>
          <div>
            <label className="label" htmlFor="n-date">{t(lang, "docDate")}</label>
            <input id="n-date" name="docDate" type="date" className="field" />
          </div>
        </div>
        <div>
          <label className="label" htmlFor="n-importance">{t(lang, "importance")}</label>
          <select id="n-importance" name="importance" className="field">
            <option value="essential">{t(lang, "essential")}</option>
            <option value="important">{t(lang, "important")}</option>
            <option value="reference">{t(lang, "reference")}</option>
          </select>
        </div>
        <div>
          <label className="label" htmlFor="n-visibility">{t(lang, "adminVisibility")}</label>
          <select id="n-visibility" name="visibility" className="field">
            <option value="published">{t(lang, "published")}</option>
            <option value="hidden">{t(lang, "hidden")}</option>
            <option value="scheduled">{t(lang, "scheduled")}</option>
          </select>
        </div>
        <div>
          <label className="label" htmlFor="n-publish">{t(lang, "adminScheduledAt")}</label>
          <input id="n-publish" name="publishAt" type="datetime-local" className="field" />
        </div>
        <div>
          <label className="label" htmlFor="n-password">{t(lang, "filePassword")}</label>
          <input id="n-password" name="filePassword" className="field" autoComplete="off" />
        </div>
        <div>
          <label className="label" htmlFor="n-source">{t(lang, "sourceCredit")}</label>
          <input id="n-source" name="sourceNote" className="field" />
        </div>
      </div>

      <div>
        <label className="label" htmlFor="n-file">{t(lang, "adminUpload")}</label>
        <input id="n-file" name="file" type="file" accept=".pdf,.docx,.txt,.md,image/png,image/jpeg,image/webp" className="field py-2 text-[12px]" onChange={(e) => suggestTitle(e.target.files?.[0])} />
        <p className="hint mt-1">{lang === "ar" ? "سيُقترح اسم الملف تلقائيًا كعنوان ويمكنك تعديله قبل الحفظ." : "The filename is suggested as the title and can be edited before saving."}</p>
        <p className="hint mt-1">{t(lang, "adminDropHint")}</p>
      </div>

      <div className="flex flex-wrap items-center gap-4 border-t border-[var(--line)] pt-3">
        <label className="inline-flex items-center gap-1.5 text-[12px] font-semibold">
          <input type="checkbox" name="pinned" value="1" className="h-3.5 w-3.5 accent-[var(--primary)]" /> {t(lang, "pinned")}
        </label>
        <label className="inline-flex items-center gap-1.5 text-[12px] font-semibold">
          <input type="checkbox" name="downloadAllowed" value="1" defaultChecked className="h-3.5 w-3.5 accent-[var(--primary)]" /> {t(lang, "allowDownload")}
        </label>
        <label className="inline-flex items-center gap-1.5 text-[12px] font-semibold">
          <input type="checkbox" name="printAllowed" value="1" defaultChecked className="h-3.5 w-3.5 accent-[var(--primary)]" /> {t(lang, "allowPrint")}
        </label>
        {error && <p className="text-[12px] font-semibold text-[var(--danger)]">{error}</p>}
        <button type="submit" disabled={busy} className="btn btn-primary btn-sm ms-auto gap-1.5">
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
          {t(lang, "adminCreateFile")}
        </button>
      </div>
    </form>
  );
}
