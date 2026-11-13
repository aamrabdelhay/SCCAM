"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Save,
  Upload,
  Trash2,
  RefreshCw,
  ExternalLink,
  FileText,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Plus,
} from "lucide-react";
import { t } from "@/lib/i18n";
import type { Lang } from "@/lib/types";
import { adminFetch, adminJson, csrfToken } from "@/lib/admin-client";
import { uploadPresigned } from "@vercel/blob/client";
import { formatDate, formatNumber, pagesLabel, textStatusLabel } from "@/lib/format";

type SectionOpt = { id: string; name: string; categories: { id: string; name: string }[] };

export type EditableFile = {
  id: string;
  title_ar: string;
  title_en: string;
  description_ar: string;
  description_en: string;
  section_id: string;
  category_id: string | null;
  tags: string;
  edition_year: string;
  doc_date: string | null;
  importance: string;
  pinned: number;
  sort_order: number;
  visibility: string;
  publish_at: string | null;
  download_allowed: number;
  print_allowed: number;
  source_note: string;
  current_version: number;
  text_status: string;
  text_error: string;
  page_count: number;
  mime: string;
  hasPassword: boolean;
};

export function FileEditor({
  lang,
  file,
  sections,
  versions,
  clarificationLinks,
  allFiles,
}: {
  lang: Lang;
  file: EditableFile;
  sections: SectionOpt[];
  versions: { version: number; created_at: string; changelog: string; page_count: number }[];
  clarificationLinks: { id: string; target_file_id: string; target_page: number; note: string; target_title: string }[];
  allFiles: { id: string; title_ar: string; title_en: string }[];
}) {
  const router = useRouter();
  const [sectionId, setSectionId] = useState(file.section_id);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [pages, setPages] = useState<{ pageNo: number; text: string; source: string; edited: number }[]>([]);
  const [activePage, setActivePage] = useState(1);
  const [pageDraft, setPageDraft] = useState("");
  const [pagesLoaded, setPagesLoaded] = useState(false);

  const activeSection = sections.find((s) => s.id === sectionId);

  useEffect(() => {
    fetch(`/api/admin/files/${file.id}/pages`)
      .then((r) => (r.ok ? r.json() : { pages: [] }))
      .then((d: { pages: { pageNo: number; text: string; source: string; edited: number }[] }) => {
        setPages(d.pages);
        setPagesLoaded(true);
        const first = d.pages[0];
        if (first) {
          setActivePage(first.pageNo);
          setPageDraft(first.text);
        }
      })
      .catch(() => setPagesLoaded(true));
  }, [file.id]);

  async function saveMetadata(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy("meta");
    setStatus(null);
    const form = new FormData(e.currentTarget);
    const res = await adminFetch(`/api/admin/files/${file.id}`, { method: "PATCH", body: form });
    setBusy(null);
    setStatus(res.ok ? t(lang, "saved") : t(lang, "error"));
    router.refresh();
  }

  async function replaceVersion(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formEl = e.currentTarget;
    const form = new FormData(formEl);
    const upload = form.get("file");
    if (!(upload instanceof File) || !upload.size) return setStatus(t(lang, "adminUploadFailed"));
    setBusy("replace");
    setStatus(t(lang, "adminProcessing"));

    try {
      const startResponse = await adminJson("/api/admin/files/upload-start", "POST", {
        fileId: file.id,
        filename: upload.name,
        size: upload.size,
        mime: upload.type,
        changelog: form.get("changelog"),
      });
      const startData = await startResponse.json().catch(() => ({})) as {
        pathname?: string;
        version?: number;
        alreadyCompleted?: boolean;
        error?: string;
      };
      if (!startResponse.ok || !startData.version) {
        throw new Error(startData.error ?? "upload-start-failed");
      }
      if (startData.alreadyCompleted) {
        setBusy(null);
        setStatus(t(lang, "adminUploadDone"));
        formEl.reset();
        router.refresh();
        return;
      }
      if (!startData.pathname) throw new Error("upload-start-failed");

      const blob = await uploadPresigned(startData.pathname, upload, {
        access: "private",
        handleUploadUrl: "/api/admin/files/upload-presigned",
        headers: { "x-csrf-token": csrfToken() },
        multipart: upload.size > 20 * 1024 * 1024,
      });
      if (blob.pathname !== startData.pathname) throw new Error("upload-path-mismatch");

      const completeResponse = await adminJson("/api/admin/files/" + file.id + "/complete", "POST", {
        version: startData.version,
        filename: upload.name,
      });
      const completeData = await completeResponse.json().catch(() => ({})) as {
        ok?: boolean;
        error?: string;
      };
      if (!completeResponse.ok || completeData.ok !== true) {
        throw new Error(completeData.error ?? "upload-finalize-failed");
      }

      setBusy(null);
      setStatus(t(lang, "adminUploadDone"));
      formEl.reset();
      router.refresh();
    } catch (err) {
      setBusy(null);
      const message = err instanceof Error ? err.message : "";
      setStatus(lang === "ar"
        ? "تعذر رفع النسخة الجديدة. " + message
        : "Could not upload the new version. " + message);
    }
  }
  async function reprocess() {
    setBusy("reprocess");
    setStatus(t(lang, "adminProcessing"));
    const res = await adminFetch(`/api/admin/files/${file.id}/reprocess`, { method: "POST" });
    setBusy(null);
    setStatus(res.ok ? t(lang, "saved") : t(lang, "error"));
    router.refresh();
  }

  async function removeFile() {
    if (!window.confirm(t(lang, "confirmDelete"))) return;
    setBusy("delete");
    const res = await adminFetch(`/api/admin/files/${file.id}`, { method: "DELETE" });
    setBusy(null);
    if (res.ok) router.push("/admin/files");
  }

  async function savePageText() {
    setBusy("page");
    await adminJson("/api/admin/pages", "POST", { fileId: file.id, pageNo: activePage, text: pageDraft });
    setBusy(null);
    setStatus(t(lang, "saved"));
    setPages((prev) => prev.map((p) => (p.pageNo === activePage ? { ...p, text: pageDraft, edited: 1 } : p)));
  }

  async function addClarificationLink(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    await adminJson("/api/admin/content", "POST", {
      type: "clarification-link",
      action: "create",
      payload: {
        fileId: file.id,
        targetFileId: form.get("targetFileId"),
        targetPage: Number(form.get("targetPage")) || 1,
        note: form.get("note"),
      },
    });
    (e.target as HTMLFormElement).reset();
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="badge badge-reference">v{file.current_version}</span>
          <span className={`badge ${file.text_status === "failed" ? "badge-essential" : file.text_status === "needs_ocr" ? "badge-important" : "badge-new"}`}>
            {textStatusLabel(lang, file.text_status)}
          </span>
          <span className="text-[11px] text-[var(--muted)]">
            {pagesLabel(file.page_count, lang)} · {file.mime.split("/").pop()}
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Link href={`/file/${file.id}`} target="_blank" className="btn btn-outline btn-sm gap-1">
            <ExternalLink className="h-3.5 w-3.5" /> {t(lang, "openFile")}
          </Link>
          <button type="button" onClick={reprocess} disabled={busy === "reprocess"} className="btn btn-outline btn-sm gap-1">
            {busy === "reprocess" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            {t(lang, "adminReprocess")}
          </button>
          <button type="button" onClick={removeFile} disabled={busy === "delete"} className="btn btn-ghost btn-sm gap-1 text-[var(--danger)]">
            <Trash2 className="h-3.5 w-3.5" /> {t(lang, "adminDeleteFile")}
          </button>
        </div>
      </div>

      {status && (
        <p className="flex items-center gap-1.5 rounded-lg bg-[var(--surface)] px-3 py-2 text-[12px] font-semibold text-[var(--muted)]">
          <CheckCircle2 className="h-3.5 w-3.5 text-[var(--accent)]" /> {status}
        </p>
      )}
      {file.text_error && (
        <p className="flex items-center gap-1.5 rounded-lg bg-[color-mix(in_srgb,var(--danger)_10%,var(--bg))] px-3 py-2 text-[11.5px] text-[var(--danger)]">
          <AlertTriangle className="h-3.5 w-3.5" /> {file.text_error}
        </p>
      )}

      <form onSubmit={saveMetadata} className="card space-y-3 p-4">
        <h2 className="text-[14px] font-bold">{t(lang, "fileDetails")}</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="f-title-ar">{t(lang, "titleAr")}</label>
            <input id="f-title-ar" name="titleAr" defaultValue={file.title_ar} required className="field" dir="rtl" />
          </div>
          <div>
            <label className="label" htmlFor="f-title-en">{t(lang, "titleEn")}</label>
            <input id="f-title-en" name="titleEn" defaultValue={file.title_en} className="field" dir="ltr" />
          </div>
          <div>
            <label className="label" htmlFor="f-desc-ar">{t(lang, "description")} (AR)</label>
            <textarea id="f-desc-ar" name="descriptionAr" defaultValue={file.description_ar} rows={2} className="field" dir="rtl" />
          </div>
          <div>
            <label className="label" htmlFor="f-desc-en">{t(lang, "description")} (EN)</label>
            <textarea id="f-desc-en" name="descriptionEn" defaultValue={file.description_en} rows={2} className="field" dir="ltr" />
          </div>
          <div>
            <label className="label" htmlFor="f-section">{t(lang, "section")}</label>
            <select id="f-section" name="sectionId" value={sectionId} onChange={(e) => setSectionId(e.target.value)} className="field">
              {sections.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="f-category">{t(lang, "subCategory")}</label>
            <select id="f-category" name="categoryId" defaultValue={file.category_id ?? ""} className="field">
              <option value="">—</option>
              {(activeSection?.categories ?? []).map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="f-tags">{t(lang, "tags")}</label>
            <input id="f-tags" name="tags" defaultValue={file.tags} className="field" placeholder="New York Convention, enforcement" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="label" htmlFor="f-year">{t(lang, "edition")}</label>
              <input id="f-year" name="editionYear" defaultValue={file.edition_year} className="field" dir="ltr" />
            </div>
            <div>
              <label className="label" htmlFor="f-date">{t(lang, "docDate")}</label>
              <input id="f-date" type="date" name="docDate" defaultValue={file.doc_date?.slice(0, 10) ?? ""} className="field" />
            </div>
          </div>
          <div>
            <label className="label" htmlFor="f-importance">{t(lang, "importance")}</label>
            <select id="f-importance" name="importance" defaultValue={file.importance} className="field">
              <option value="essential">{t(lang, "essential")}</option>
              <option value="important">{t(lang, "important")}</option>
              <option value="reference">{t(lang, "reference")}</option>
            </select>
          </div>
          <div>
            <label className="label" htmlFor="f-sort">{t(lang, "adminSort")}</label>
            <input id="f-sort" type="number" name="sortOrder" defaultValue={file.sort_order} className="field" dir="ltr" />
          </div>
          <div>
            <label className="label" htmlFor="f-visibility">{t(lang, "adminVisibility")}</label>
            <select id="f-visibility" name="visibility" defaultValue={file.visibility} className="field">
              <option value="published">{t(lang, "published")}</option>
              <option value="hidden">{t(lang, "hidden")}</option>
              <option value="scheduled">{t(lang, "scheduled")}</option>
            </select>
          </div>
          <div>
            <label className="label" htmlFor="f-publish-at">{t(lang, "adminScheduledAt")}</label>
            <input id="f-publish-at" type="datetime-local" name="publishAt" defaultValue={file.publish_at?.slice(0, 16) ?? ""} className="field" />
          </div>
          <div>
            <label className="label" htmlFor="f-source">{t(lang, "sourceCredit")}</label>
            <input id="f-source" name="sourceNote" defaultValue={file.source_note} className="field" />
          </div>
          <div>
            <label className="label" htmlFor="f-password">{t(lang, "filePassword")}</label>
            <input id="f-password" name="filePassword" type="text" placeholder={file.hasPassword ? "••••••" : "—"} className="field" autoComplete="off" />
            <p className="hint mt-0.5">{t(lang, "adminFilePasswordHint")}</p>
          </div>
      </div>
        <div className="flex flex-wrap items-center gap-4 border-t border-[var(--line)] pt-3">
          <label className="inline-flex items-center gap-1.5 text-[12px] font-semibold">
            <input type="checkbox" name="pinned" defaultChecked={file.pinned === 1} value="1" className="h-3.5 w-3.5 accent-[var(--primary)]" />
            {t(lang, "pinned")}
          </label>
          <label className="inline-flex items-center gap-1.5 text-[12px] font-semibold">
            <input type="checkbox" name="downloadAllowed" defaultChecked={file.download_allowed === 1} value="1" className="h-3.5 w-3.5 accent-[var(--primary)]" />
            {t(lang, "allowDownload")}
          </label>
          <label className="inline-flex items-center gap-1.5 text-[12px] font-semibold">
            <input type="checkbox" name="printAllowed" defaultChecked={file.print_allowed === 1} value="1" className="h-3.5 w-3.5 accent-[var(--primary)]" />
            {t(lang, "allowPrint")}
          </label>
          <button type="submit" disabled={busy === "meta"} className="btn btn-primary btn-sm ms-auto gap-1.5">
            {busy === "meta" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            {t(lang, "adminSaveFile")}
          </button>
        </div>
      </form>

      <div className="grid gap-4 lg:grid-cols-2">
        <form onSubmit={replaceVersion} className="card space-y-2.5 p-4">
          <h2 className="text-[14px] font-bold">{t(lang, "adminReplaceFile")}</h2>
          <p className="text-[11px] text-[var(--muted)]">
            v{file.current_version} → v{file.current_version + 1}
          </p>
          <input type="file" name="file" required accept=".pdf,.docx,.txt,.md,image/png,image/jpeg,image/webp" className="field py-2 text-[12px]" />
          <input name="changelog" placeholder={t(lang, "adminChangelogPlaceholder")} className="field text-[12px]" />
          <button type="submit" disabled={busy === "replace"} className="btn btn-outline btn-sm gap-1.5">
            {busy === "replace" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
            {t(lang, "adminReplaceFile")}
          </button>
          <ul className="mt-2 space-y-1 border-t border-[var(--line)] pt-2">
            {versions.map((v) => (
              <li key={v.version} className="flex items-center justify-between gap-2 text-[11px] text-[var(--muted)]">
                <span className="font-semibold">v{v.version}</span>
                <span className="truncate">{v.changelog || "—"}</span>
                <span className="shrink-0">{formatDate(v.created_at, lang)}</span>
              </li>
            ))}
          </ul>
        </form>

        <div className="card space-y-2.5 p-4">
          <h2 className="flex items-center gap-1.5 text-[14px] font-bold">
            <FileText className="h-4 w-4 text-[var(--accent)]" /> {t(lang, "adminPageText")}
          </h2>
          <p className="text-[11px] text-[var(--muted)]">{t(lang, "adminPageTextHint")}</p>
          {!pagesLoaded ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : pages.length === 0 ? (
            <p className="text-[12px] text-[var(--muted)]">{t(lang, "noTextLayer")}</p>
          ) : (
            <>
              <div className="no-scrollbar flex gap-1 overflow-x-auto">
                {pages.map((p) => (
                  <button
                    key={p.pageNo}
                    type="button"
                    onClick={() => {
                      setActivePage(p.pageNo);
                      setPageDraft(p.text);
                    }}
                    className={`shrink-0 rounded-md border px-2 py-1 text-[11px] font-bold ${
                      activePage === p.pageNo ? "border-[var(--accent)] bg-[color-mix(in_srgb,var(--accent)_15%,var(--bg))]" : "border-[var(--line)]"
                    }`}
                  >
                    {p.pageNo}
                  </button>
                ))}
              </div>
              <textarea
                value={pageDraft}
                onChange={(e) => setPageDraft(e.target.value)}
                rows={8}
                dir="auto"
                className="field font-mono text-[11.5px]"
                aria-label={t(lang, "adminPageText")}
              />
              <div className="flex items-center gap-2">
                <button type="button" onClick={savePageText} disabled={busy === "page"} className="btn btn-primary btn-sm gap-1">
                  {busy === "page" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                  {t(lang, "adminSaveText")}
                </button>
                <span className="text-[10.5px] text-[var(--muted)]">
                  {t(lang, "page")} {activePage} / {pages.length} · {activePage > 0 ? pages.find((p) => p.pageNo === activePage)?.source : ""}
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="card space-y-2.5 p-4">
        <h2 className="text-[14px] font-bold">{t(lang, "adminClarificationLinks")}</h2>
        <ul className="space-y-1">
          {clarificationLinks.map((l) => (
            <li key={l.id} className="flex items-center justify-between gap-2 rounded-lg bg-[var(--surface)] px-2.5 py-1.5 text-[11.5px]">
              <span className="truncate">
                {l.target_title} — {t(lang, "page")} {l.target_page} {l.note ? `· ${l.note}` : ""}
              </span>
              <button
                type="button"
                onClick={async () => {
                  await adminJson("/api/admin/content", "POST", { type: "clarification-link", action: "delete", id: l.id });
                  router.refresh();
                }}
                className="text-[var(--danger)]"
                aria-label={t(lang, "delete")}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
          {clarificationLinks.length === 0 && <li className="text-[11.5px] text-[var(--muted)]">—</li>}
        </ul>
        <form onSubmit={addClarificationLink} className="flex flex-wrap items-end gap-2 border-t border-[var(--line)] pt-2">
          <div className="min-w-[180px] flex-1">
            <label className="label" htmlFor="cl-target">{t(lang, "adminTargetFile")}</label>
            <select id="cl-target" name="targetFileId" required className="field text-[12px]">
              {allFiles.map((f) => (
                <option key={f.id} value={f.id}>
                  {lang === "ar" ? f.title_ar : f.title_en || f.title_ar}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="cl-page">{t(lang, "adminTargetPage")}</label>
            <input id="cl-page" name="targetPage" type="number" min={1} defaultValue={1} className="field w-20 text-[12px]" />
          </div>
          <div className="min-w-[140px] flex-1">
            <label className="label" htmlFor="cl-note">{t(lang, "adminNote")}</label>
            <input id="cl-note" name="note" className="field text-[12px]" />
          </div>
          <button type="submit" className="btn btn-outline btn-sm gap-1">
            <Plus className="h-3.5 w-3.5" /> {t(lang, "adminAdd")}
          </button>
        </form>
      </div>
    </div>
  );
}
