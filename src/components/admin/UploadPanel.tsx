"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { uploadPresigned } from "@vercel/blob/client";
import { UploadCloud, FileUp, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";
import { t } from "@/lib/i18n";
import type { Lang } from "@/lib/types";
import { adminFetch, csrfToken } from "@/lib/admin-client";
import { cn } from "@/lib/format";
import { AdminSelect } from "./AdminSelect";
import { UPLOAD_DESTINATIONS } from "@/lib/upload-destinations";

const MAX_UPLOAD_BYTES = 40 * 1024 * 1024;

type UploadJob = {
  id: string;
  name: string;
  progress: number;
  status: "uploading" | "processing" | "done" | "error";
  message?: string;
  fileId?: string;
  version?: number;
};

function uploadErrorText(code: string | undefined, status: number, lang: Lang): string {
  if (lang === "ar") {
    if (status === 413 || code === "file-too-large") return "حجم الملف أكبر من 40 ميجابايت.";
    if (code === "unsupported-file-type") return "نوع الملف غير مدعوم.";
    if (code === "section-required") return "تعذر تحديد القسم. حدّد القسم مرة أخرى.";
    if (code === "title-required") return "اكتب اسمًا للملف.";
    if (code === "upload-state-conflict") return "هناك محاولة رفع سابقة لم تكتمل. حدّث الصفحة ثم حاول مرة أخرى.";
    if (code === "uploaded-size-mismatch") return "لم يكتمل رفع الملف بالكامل. حاول مرة أخرى.";
    if (code === "uploaded-file-unavailable") return "لم يتم العثور على الملف بعد الرفع. حاول مرة أخرى.";
    if (code === "upload-finalize-failed") return "تم رفع الملف لكن تعذر تسجيله في المكتبة. حاول مرة أخرى.";
    return "تعذر بدء رفع الملف. راجع البيانات وحاول مرة أخرى.";
  }
  if (status === 413 || code === "file-too-large") return "The file exceeds the 40 MB limit.";
  if (code === "unsupported-file-type") return "This file type is not supported.";
  if (code === "section-required") return "The section could not be resolved. Select it again.";
  if (code === "title-required") return "Enter a file title.";
  if (code === "upload-state-conflict") return "A previous upload is still pending. Refresh and retry.";
  if (code === "uploaded-size-mismatch") return "The upload did not complete. Please try again.";
  if (code === "uploaded-file-unavailable") return "The uploaded file could not be found. Please try again.";
  if (code === "upload-finalize-failed") return "The file uploaded but could not be registered in the library.";
  return "The upload could not be started. Check the details and retry.";
}

function messageFromError(error: unknown, lang: Lang): string {
  const message = error instanceof Error ? error.message : "";
  if (message.includes("Failed to retrieve the presigned URL")) {
    return lang === "ar"
      ? "تعذر إصدار تصريح رفع الملف من مخزن الملفات. راجع صلاحية المخزن وحاول مرة أخرى."
      : "Could not issue an upload authorization from Blob storage. Check store permissions and retry.";
  }
  if (/network|fetch failed|load failed/i.test(message)) {
    return lang === "ar" ? "انقطع الاتصال أثناء الرفع. تحقق من الإنترنت وحاول مرة أخرى." : "The connection failed during upload. Check your internet and retry.";
  }
  return lang === "ar"
    ? "تعذر إكمال رفع الملف إلى التخزين. حاول مرة أخرى."
    : "The file could not be uploaded to storage. Please retry.";
}

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
      setError(lang === "ar" ? "اختر الملف والقسم واكتب الاسم." : "Choose the file, title and section.");
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      setError(uploadErrorText("file-too-large", 413, lang));
      return;
    }

    const jobId = String(Date.now());
    const retryFileId = job?.status === "error" ? job.fileId : undefined;
    let reservedFileId: string | undefined;
    let reservedVersion: number | undefined;
    let blobUploadCompleted = false;
    setJob({ id: jobId, name: file.name, progress: 0, status: "uploading" });
    setError(null);

    try {
      // Only metadata enters the Vercel Function. The file bytes go directly
      // from this browser to the private Blob store using a short-lived URL.
      const startResponse = await adminFetch("/api/admin/files/upload-start", {
        method: "POST",
        body: JSON.stringify({
          titleAr: title.trim(),
          titleEn: title.trim(),
          destination,
          fileId: retryFileId,
          filename: file.name,
          size: file.size,
          mime: file.type,
        }),
      });
      const startData = await startResponse.json().catch(() => ({})) as {
        id?: string;
        version?: number;
        pathname?: string;
        alreadyCompleted?: boolean;
        error?: string;
      };
      if (!startResponse.ok || !startData.id || !startData.version) {
        throw new Error(uploadErrorText(startData.error, startResponse.status, lang));
      }
      reservedFileId = startData.id;
      reservedVersion = startData.version;
      if (startData.alreadyCompleted) {
        setJob({ id: jobId, name: file.name, progress: 100, status: "done", fileId: startData.id, version: startData.version });
        router.refresh();
        return;
      }
      if (!startData.pathname) throw new Error("upload-start-failed");

      setJob((current) => current?.id === jobId
        ? { ...current, fileId: startData.id, version: startData.version, status: "uploading", progress: 2 }
        : current);
      const uploaded = await uploadPresigned(startData.pathname, file, {
        access: "private",
        handleUploadUrl: "/api/admin/files/upload-presigned",
        headers: { "x-csrf-token": csrfToken() },
        multipart: file.size > 20 * 1024 * 1024,
        onUploadProgress: (progress) => {
          const percentage = Math.max(2, Math.min(96, Math.round(progress.percentage)));
          setJob((current) => current?.id === jobId ? { ...current, progress: percentage } : current);
        },
      });
      if (uploaded.pathname !== startData.pathname) {
        throw new Error("The uploaded path does not match the reserved file.");
      }
      blobUploadCompleted = true;

      setJob((current) => current?.id === jobId ? { ...current, status: "processing", progress: 97 } : current);
      const completeResponse = await adminFetch("/api/admin/files/" + startData.id + "/complete", {
        method: "POST",
        body: JSON.stringify({ version: startData.version, filename: file.name }),
      });
      const completeData = await completeResponse.json().catch(() => ({})) as {
        ok?: boolean;
        error?: string;
        warning?: string;
      };
      if (!completeResponse.ok || completeData.ok !== true) {
        throw new Error(uploadErrorText(completeData.error, completeResponse.status, lang));
      }

      setJob({
        id: jobId,
        name: file.name,
        progress: 100,
        status: "done",
        fileId: startData.id,
        message: completeData.warning,
      });
      router.refresh();
    } catch (err) {
      // If the final response was lost after the server committed the version,
      // query the idempotent completion endpoint before showing a failure.
      if (blobUploadCompleted && reservedFileId && reservedVersion) {
        try {
          const retry = await adminFetch("/api/admin/files/" + reservedFileId + "/complete", {
            method: "POST",
            body: JSON.stringify({ version: reservedVersion, filename: file.name }),
          });
          const retryData = await retry.json().catch(() => ({})) as { ok?: boolean; warning?: string };
          if (retry.ok && retryData.ok === true) {
            setJob({
              id: jobId,
              name: file.name,
              progress: 100,
              status: "done",
              fileId: reservedFileId,
              version: reservedVersion,
              message: retryData.warning,
            });
            router.refresh();
            return;
          }
        } catch {
          // Preserve the original error and let the user retry with the same pending file id.
        }
      }
      const message = err instanceof Error ? err.message : "";
      setJob((current) => current?.id === jobId
        ? {
            ...current,
            fileId: reservedFileId,
            version: reservedVersion,
            progress: 0,
            status: "error",
            message: message.includes("تعذر") || message.includes("The file") ? message : messageFromError(err, lang),
          }
        : current);
    }
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
          {job.status === "error" && <p role="alert" className="mt-1 text-[11px] text-[var(--danger)]">{job.message}</p>}
          {job.status === "done" && job.message && <p className="mt-1 text-[11px] text-[var(--accent)]">{lang === "ar" ? "تم رفع الملف، لكن تعذر استخراج النص: " : "Uploaded, but text extraction failed: "}{job.message}</p>}
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
