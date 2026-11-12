"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { UploadCloud, FileUp, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";
import { t } from "@/lib/i18n";
import type { Lang } from "@/lib/types";
import { csrfToken } from "@/lib/admin-client";
import { cn } from "@/lib/format";
import { AdminSelect } from "./AdminSelect";
import { UPLOAD_DESTINATIONS } from "@/lib/upload-destinations";

type UploadJob = {
  id: string;
  name: string;
  progress: number;
  status: "uploading" | "processing" | "done" | "error";
  message?: string;
  fileId?: string;
};

export function UploadPanel({ lang }: { lang: Lang }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [destination, setDestination] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [titleEdited, setTitleEdited] = useState(false);
  const [job, setJob] = useState<UploadJob | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const options = UPLOAD_DESTINATIONS.map((item) => ({
    value: item.value,
    label: lang === "ar" ? item.labelAr : item.labelEn,
  }));
  const busy = job?.status === "uploading" || job?.status === "processing";

  function chooseFile(nextFile?: File) {
    if (!nextFile) return;
    setFile(nextFile);
    if (!titleEdited) setTitle(nextFile.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim());
    setJob(null);
    setError(null);
  }

  async function uploadSelected() {
    if (!file || !destination || !title.trim() || busy) {
      setError(lang === "ar" ? "اختر الملف والقسم واكتب الاسم." : "Choose a file and section, then enter its title.");
      return;
    }

    const jobId = String(Date.now());
    setJob({ id: jobId, name: file.name, progress: 0, status: "uploading" });
    setError(null);

    const form = new FormData();
    form.append("titleAr", title.trim());
    form.append("titleEn", title.trim());
    form.append("destination", destination);
    form.append("downloadAllowed", "1");
    form.append("printAllowed", "1");
    form.append("file", file);

    await new Promise<void>((resolve) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", "/api/admin/files");
      xhr.setRequestHeader("x-csrf-token", csrfToken());
      xhr.upload.onprogress = (event) => {
        if (!event.lengthComputable) return;
        const progress = Math.round((event.loaded / event.total) * 100);
        setJob((current) => current?.id === jobId
          ? { ...current, progress: Math.min(99, progress), status: progress >= 100 ? "processing" : "uploading" }
          : current);
      };
      xhr.onload = () => {
        try {
          const data = JSON.parse(xhr.responseText) as { id?: string; ok?: boolean; error?: string };
          if (xhr.status >= 200 && xhr.status < 300 && data.id && data.ok !== false) {
            setJob({ id: jobId, name: file.name, progress: 100, status: "done", fileId: data.id });
            router.refresh();
          } else {
            setJob({ id: jobId, name: file.name, progress: 0, status: "error", message: data.error ?? "upload-failed", fileId: data.id });
          }
        } catch {
          setJob({ id: jobId, name: file.name, progress: 0, status: "error", message: "invalid-response" });
        }
        resolve();
      };
      xhr.onerror = () => {
        setJob({ id: jobId, name: file.name, progress: 0, status: "error", message: "network" });
        resolve();
      };
      xhr.send(form);
    });
  }

  return (
    <section className="card overflow-visible p-4 sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-[14px] font-bold">
          <FileUp className="h-4 w-4 text-[var(--brand-orange)]" aria-hidden="true" />
          {t(lang, "adminUpload")}
        </h2>
        {job && <button type="button" onClick={() => setJob(null)} className="text-[11px] font-semibold text-[var(--muted)] hover:underline">{t(lang, "close")}</button>}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="upload-title">{lang === "ar" ? "اسم الملف" : "File title"}</label>
          <input id="upload-title" value={title} onChange={(event) => { setTitle(event.target.value); setTitleEdited(true); }} className="field" placeholder={lang === "ar" ? "سيُقترح من اسم الملف" : "Suggested from filename"} />
        </div>
        <div>
          <label className="label" htmlFor="upload-destination">{lang === "ar" ? "القسم" : "Section"}</label>
          <AdminSelect id="upload-destination" value={destination} options={options} placeholder={lang === "ar" ? "اختر القسم" : "Choose a section"} onChange={setDestination} />
        </div>
      </div>

      <div
        onDragOver={(event) => { event.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragOver(false);
          chooseFile(event.dataTransfer.files?.[0]);
        }}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") inputRef.current?.click(); }}
        role="button"
        tabIndex={0}
        aria-label={t(lang, "adminDropzone")}
        className={cn(
          "mt-3 flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed p-5 text-center transition-all duration-200",
          dragOver ? "border-[var(--brand-green-deep)] bg-[var(--primary-soft)]" : "border-[var(--line)] bg-[var(--surface)]/55 hover:border-[var(--brand-orange)] hover:bg-[var(--sun)]/10",
        )}
      >
        <UploadCloud className="h-6 w-6 text-[var(--brand-blue)]" aria-hidden="true" />
        <p className="text-[13px] font-bold">{file ? file.name : t(lang, "adminDropzone")}</p>
        <p className="text-[11px] text-[var(--muted)]">{t(lang, "adminDropHint")}</p>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.docx,.txt,.md,image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={(event) => chooseFile(event.target.files?.[0])}
        />
      </div>

      {error && <p role="alert" className="mt-2 text-[12px] font-semibold text-[var(--danger)]">{error}</p>}

      {job && (
        <div className="mt-3 rounded-xl border border-[var(--line)] bg-[var(--bg)] p-2.5">
          <div className="flex items-center justify-between gap-2">
            <span className="min-w-0 flex-1 truncate text-[12px] font-semibold" dir="auto">{job.name}</span>
            <span className="shrink-0">
              {job.status === "done" ? <CheckCircle2 className="h-4 w-4 text-[#16803B]" /> : job.status === "error" ? <AlertTriangle className="h-4 w-4 text-[var(--danger)]" /> : <Loader2 className="h-4 w-4 animate-spin text-[var(--brand-orange)]" />}
            </span>
          </div>
          {job.status !== "done" && job.status !== "error" && (
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--line)]">
              <div className="h-full rounded-full bg-[linear-gradient(90deg,var(--brand-green),var(--brand-yellow),var(--brand-orange))] transition-all duration-200" style={{ width: job.progress + "%" }} />
            </div>
          )}
          {job.status === "error" && <p className="mt-1 text-[11px] text-[var(--danger)]">{job.message}</p>}
          {job.fileId && <a href={"/admin/files/" + job.fileId} className="mt-2 inline-flex text-[11px] font-semibold link">{t(lang, "edit")} →</a>}
        </div>
      )}

      <div className="mt-4 flex justify-end border-t border-[var(--line)] pt-3">
        <button type="button" onClick={() => void uploadSelected()} disabled={busy || !file || !destination || !title.trim()} className="btn btn-primary btn-sm gap-1.5">
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UploadCloud className="h-3.5 w-3.5" />}
          {lang === "ar" ? "رفع الملف" : "Upload file"}
        </button>
      </div>
    </section>
  );
}
