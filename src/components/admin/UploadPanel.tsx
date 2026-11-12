"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { UploadCloud, FileUp, CheckCircle2, AlertTriangle, Loader2, X } from "lucide-react";
import { t } from "@/lib/i18n";
import type { Lang } from "@/lib/types";
import { csrfToken } from "@/lib/admin-client";
import { cn } from "@/lib/format";
import { AdminSelect } from "./AdminSelect";

type SectionOpt = { id: string; name: string; categories: { id: string; name: string }[] };

type Job = {
  id: string;
  name: string;
  size: number;
  progress: number;
  status: "queued" | "uploading" | "processing" | "done" | "error";
  message?: string;
  fileId?: string;
};

export function UploadPanel({
  lang,
  sections,
  defaultSectionId,
  defaultCategoryId,
}: {
  lang: Lang;
  sections: SectionOpt[];
  defaultSectionId?: string;
  defaultCategoryId?: string;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [sectionId, setSectionId] = useState(defaultSectionId ?? sections[0]?.id ?? "");
  const [categoryId, setCategoryId] = useState(defaultCategoryId ?? "");
  const [importance, setImportance] = useState("reference");
  const [editionYear, setEditionYear] = useState("");
  const [visibility, setVisibility] = useState("published");

  const activeSection = sections.find((s) => s.id === sectionId);

  function updateJob(id: string, patch: Partial<Job>) {
    setJobs((prev) => prev.map((j) => (j.id === id ? { ...j, ...patch } : j)));
  }

  async function uploadOne(file: File, jobId: string) {
    const title = file.name.replace(/\.[^.]+$/, "");
    const form = new FormData();
    form.append("titleAr", title);
    form.append("titleEn", title);
    form.append("sectionId", sectionId);
    if (categoryId) form.append("categoryId", categoryId);
    if (editionYear) form.append("editionYear", editionYear);
    form.append("importance", importance);
    form.append("visibility", visibility);
    form.append("downloadAllowed", "1");
    form.append("printAllowed", "1");
    form.append("file", file);

    updateJob(jobId, { status: "uploading", progress: 0 });

    await new Promise<void>((resolve) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", "/api/admin/files");
      xhr.setRequestHeader("x-csrf-token", csrfToken());
      xhr.upload.onprogress = (e) => {
        if (!e.lengthComputable) return;
        const pct = Math.round((e.loaded / e.total) * 100);
        updateJob(jobId, { progress: Math.min(99, pct), status: pct >= 100 ? "processing" : "uploading" });
      };
      xhr.onload = () => {
        try {
          const data = JSON.parse(xhr.responseText) as { id?: string; ok?: boolean; error?: string };
          if (xhr.status === 200 && data.ok !== false) {
            updateJob(jobId, { status: "done", progress: 100, fileId: data.id });
          } else {
            updateJob(jobId, { status: "error", message: data.error ?? `HTTP ${xhr.status}`, fileId: data.id });
          }
        } catch {
          updateJob(jobId, { status: "error", message: `HTTP ${xhr.status}` });
        }
        resolve();
      };
      xhr.onerror = () => {
        updateJob(jobId, { status: "error", message: "network" });
        resolve();
      };
      xhr.send(form);
    });
  }

  async function start(files: FileList | File[]) {
    const list = Array.from(files);
    if (!list.length || !sectionId) return;
    const created: Job[] = list.map((f, i) => ({
      id: `${Date.now()}-${i}-${Math.random().toString(36).slice(2, 6)}`,
      name: f.name,
      size: f.size,
      progress: 0,
      status: "queued",
    }));
    setJobs((prev) => [...created, ...prev]);
    for (let i = 0; i < list.length; i++) {
      await uploadOne(list[i], created[i].id);
    }
    router.refresh();
  }

  return (
    <section className="card p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-[14px] font-bold">
          <FileUp className="h-4 w-4 text-[var(--accent)]" aria-hidden="true" />
          {t(lang, "adminUpload")}
        </h2>
        {jobs.some((j) => j.status === "done") && (
          <button type="button" onClick={() => setJobs((prev) => prev.filter((j) => j.status !== "done"))} className="text-[11px] font-semibold text-[var(--muted)] hover:underline">
            {t(lang, "close")}
          </button>
        )}
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className="label" htmlFor="upload-section">{t(lang, "section")}</label>
          <AdminSelect id="upload-section" value={sectionId} options={sections.map((section) => ({ value: section.id, label: section.name }))} placeholder="اختر القسم" onChange={(value) => { setSectionId(value); setCategoryId(""); }} />
        </div>
        <div>
          <label className="label" htmlFor="upload-category">{t(lang, "subCategory")}</label>
          <AdminSelect id="upload-category" value={categoryId} options={(activeSection?.categories ?? []).map((category) => ({ value: category.id, label: category.name }))} placeholder="بدون تصنيف" onChange={setCategoryId} />
        </div>
        <div>
          <label className="label" htmlFor="upload-importance">{t(lang, "importance")}</label>
          <select id="upload-importance" value={importance} onChange={(e) => setImportance(e.target.value)} className="field">
            <option value="essential">{t(lang, "essential")}</option>
            <option value="important">{t(lang, "important")}</option>
            <option value="reference">{t(lang, "reference")}</option>
          </select>
        </div>
        <div>
          <label className="label" htmlFor="upload-year">{t(lang, "edition")}</label>
          <input id="upload-year" value={editionYear} onChange={(e) => setEditionYear(e.target.value)} placeholder="2026" className="field" dir="ltr" />
        </div>
      </div>
      <p className="hint mt-1.5">
        {t(lang, "adminVisibility")}: {visibility === "published" ? t(lang, "published") : visibility === "hidden" ? t(lang, "hidden") : t(lang, "scheduled")} —{" "}
        <select value={visibility} onChange={(e) => setVisibility(e.target.value)} className="rounded border border-[var(--line)] bg-[var(--bg)] px-1 text-[11px]">
          <option value="published">{t(lang, "published")}</option>
          <option value="hidden">{t(lang, "hidden")}</option>
          <option value="scheduled">{t(lang, "scheduled")}</option>
        </select>

      </p>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (e.dataTransfer.files?.length) void start(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
        }}
        role="button"
        tabIndex={0}
        aria-label={t(lang, "adminDropzone")}
        className={cn(
          "mt-3 flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed p-6 text-center transition-colors",
          dragOver ? "border-[var(--accent)] bg-[color-mix(in_srgb,var(--accent)_10%,var(--bg))]" : "border-[var(--line)] hover:border-[color-mix(in_srgb,var(--primary)_40%,var(--line))] hover:bg-[var(--surface)]",
        )}
      >
        <UploadCloud className="h-7 w-7 text-[var(--muted)]" aria-hidden="true" />
        <p className="text-[13px] font-bold">{t(lang, "adminDropzone")}</p>
        <p className="text-[11px] text-[var(--muted)]">{t(lang, "adminDropHint")}</p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".pdf,.docx,.txt,.md,image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={(e) => {
            if (e.target.files) void start(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {jobs.length > 0 && (
        <ul className="mt-3 space-y-2">
          {jobs.map((job) => (
            <li key={job.id} className="rounded-xl border border-[var(--line)] bg-[var(--bg)] p-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="min-w-0 flex-1 truncate text-[12px] font-semibold" dir="auto">{job.name}</span>
                <span className="shrink-0 text-[10.5px] font-bold text-[var(--muted)]">
                  {job.status === "done" ? <CheckCircle2 className="h-4 w-4 text-[#1a7f37]" /> : job.status === "error" ? <AlertTriangle className="h-4 w-4 text-[var(--danger)]" /> : job.status === "processing" ? <Loader2 className="h-4 w-4 animate-spin text-[var(--accent)]" /> : `${job.progress}%`}
                </span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[var(--surface)]">
                <div
                  className={cn("h-full rounded-full transition-all", job.status === "error" ? "bg-[var(--danger)]" : job.status === "done" ? "bg-[#1a7f37]" : "bg-[var(--accent)]")}
                  style={{ width: `${job.status === "processing" ? 100 : job.progress}%` }}
                />
              </div>
              <div className="mt-1 flex items-center justify-between gap-2 text-[10.5px]">
                <span className="text-[var(--muted)]">
                  {job.status === "uploading" && t(lang, "adminUploading")}
                  {job.status === "processing" && t(lang, "adminProcessing")}
                  {job.status === "done" && t(lang, "adminUploadDone")}
                  {job.status === "error" && `${t(lang, "adminUploadFailed")}: ${job.message ?? ""}`}
                </span>
                {job.status === "done" && job.fileId && (
                  <a href={`/admin/files/${job.fileId}`} className="font-semibold link">
                    {t(lang, "edit")} →
                  </a>
                )}
                {job.status === "error" && (
                  <span className="flex items-center gap-2">
                    {job.fileId && (
                      <a href={`/admin/files/${job.fileId}`} className="font-semibold link">
                        {t(lang, "adminRetry")} →
                      </a>
                    )}
                    <button type="button" onClick={() => setJobs((prev) => prev.filter((j) => j.id !== job.id))} className="inline-flex items-center gap-1 font-semibold text-[var(--muted)]">
                      <X className="h-3 w-3" /> {t(lang, "close")}
                    </button>
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
