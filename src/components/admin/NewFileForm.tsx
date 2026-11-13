"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";
import { t } from "@/lib/i18n";
import type { Lang } from "@/lib/types";
import { csrfToken } from "@/lib/admin-client";
import { AdminSelect } from "./AdminSelect";
import { UPLOAD_DESTINATIONS } from "@/lib/upload-destinations";

export function NewFileForm({ lang }: { lang: Lang }) {
  const router = useRouter();
  const [destination, setDestination] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [titleEdited, setTitleEdited] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const options = UPLOAD_DESTINATIONS.map((item) => ({
    value: item.value,
    label: lang === "ar" ? item.labelAr : item.labelEn,
  }));

  function chooseFile(nextFile?: File) {
    if (!nextFile) return;
    setFile(nextFile);
    if (!titleEdited) setTitle(nextFile.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim());
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file || !destination || !title.trim()) {
      setError(lang === "ar" ? "اختر ملفًا واكتب اسمه وحدد القسم." : "Choose a file, enter its title and select a section.");
      return;
    }
    setBusy(true);
    setError(null);
    const form = new FormData();
    form.append("titleAr", title.trim());
    form.append("titleEn", title.trim());
    form.append("destination", destination);
    form.append("downloadAllowed", "1");
    form.append("printAllowed", "1");
    form.append("file", file);

    try {
      const response = await fetch("/api/admin/files", {
        method: "POST",
        body: form,
        headers: { "x-csrf-token": csrfToken() },
      });
      const data = (await response.json().catch(() => ({}))) as { id?: string; ok?: boolean; error?: string };
      if (response.ok && data.id && data.ok !== false) {
        router.push("/admin/files/" + data.id);
        router.refresh();
      } else {
        setError(data.error === "storage-failed"
          ? (lang === "ar" ? "تعذر حفظ الملف في التخزين الدائم. حاول مرة أخرى." : "The file could not be saved to persistent storage. Please try again.")
          : data.error === "file-required"
            ? (lang === "ar" ? "اختر ملفًا أولًا." : "Choose a file first.")
            : data.error === "section-required"
              ? (lang === "ar" ? "تعذر تحديد القسم. اختره مرة أخرى." : "The section could not be resolved. Select it again.")
              : (lang === "ar" ? "تعذر رفع الملف. حاول مرة أخرى." : "The file could not be uploaded. Please try again."));
      }
    } catch {
      setError(t(lang, "error"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="card mx-auto max-w-2xl space-y-4 p-4 sm:p-5">
      <h2 className="text-[15px] font-extrabold">{t(lang, "adminNewFile")}</h2>
      <div>
        <label className="label" htmlFor="n-title">{lang === "ar" ? "اسم الملف" : "File title"}</label>
        <input id="n-title" value={title} onChange={(event) => { setTitle(event.target.value); setTitleEdited(true); }} required className="field" />
        <p className="hint mt-1">{lang === "ar" ? "سيُقترح الاسم تلقائيًا من اسم الملف ويمكنك تعديله." : "The filename is suggested automatically; you can edit it."}</p>
      </div>
      <div>
        <label className="label" htmlFor="n-destination">{lang === "ar" ? "القسم" : "Section"}</label>
        <AdminSelect id="n-destination" value={destination} options={options} placeholder={lang === "ar" ? "اختر القسم" : "Choose a section"} onChange={setDestination} />
      </div>
      <div>
        <label className="label" htmlFor="n-file">{t(lang, "adminUpload")}</label>
        <input id="n-file" type="file" accept=".pdf,.docx,.txt,.md,image/png,image/jpeg,image/webp" className="field py-2 text-[12px]" onChange={(event) => chooseFile(event.target.files?.[0])} />
        {file && <p className="mt-1 truncate text-[11px] font-semibold text-[var(--secondary)]" dir="auto">{file.name}</p>}
      </div>
      {error && <p role="alert" className="text-[12px] font-semibold text-[var(--danger)]">{error}</p>}
      <div className="flex justify-end border-t border-[var(--line)] pt-3">
        <button type="submit" disabled={busy || !file || !destination || !title.trim()} className="btn btn-primary btn-sm gap-1.5">
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
          {lang === "ar" ? "رفع الملف" : "Upload file"}
        </button>
      </div>
    </form>
  );
}
