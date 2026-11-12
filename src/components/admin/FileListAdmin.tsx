"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Trash2, Eye, EyeOff, Pin, ExternalLink, FileText, Loader2 } from "lucide-react";
import { t } from "@/lib/i18n";
import type { Lang } from "@/lib/types";
import { formatDate, formatNumber, pagesLabel } from "@/lib/format";
import { adminJson } from "@/lib/admin-client";
import { SortableList } from "./SortableList";
import { cn } from "@/lib/format";

export type AdminFileRow = {
  id: string;
  title_ar: string;
  title_en: string;
  section_id: string;
  section_slug: string;
  category_id: string | null;
  category_name_ar: string | null;
  category_name_en: string | null;
  importance: string;
  pinned: number;
  visibility: string;
  sort_order: number;
  text_status: string;
  page_count: number;
  views: number;
  updated_at: string;
};

export function FileListAdmin({
  lang,
  files,
  sections,
}: {
  lang: Lang;
  files: AdminFileRow[];
  sections: { id: string; name: string; categories: { id: string; name: string }[] }[];
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [sectionId, setSectionId] = useState(sections[0]?.id ?? "");
  const [categoryId, setCategoryId] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [bulkSection, setBulkSection] = useState(sections[0]?.id ?? "");
  const activeSection = sections.find((s) => s.id === sectionId);

  const visible = useMemo(() => {
    return files
      .filter((f) => f.section_id === sectionId)
      .filter((f) => (categoryId ? f.category_id === categoryId : true))
      .filter((f) =>
        query.trim()
          ? `${f.title_ar} ${f.title_en}`.toLowerCase().includes(query.trim().toLowerCase())
          : true,
      )
      .sort((a, b) => a.sort_order - b.sort_order || a.title_ar.localeCompare(b.title_ar));
  }, [files, sectionId, categoryId, query]);

  async function persistOrder(ordered: AdminFileRow[]) {
    await adminJson(
      "/api/admin/files/order",
      "POST",
      { items: ordered.map((f, i) => ({ id: f.id, sortOrder: (i + 1) * 10 })) },
    );
    router.refresh();
  }

  async function bulk(action: "section" | "importance" | "publish" | "hide" | "delete", value?: string) {
    if (!selected.length) return;
    if (action === "delete" && !window.confirm(t(lang, "confirmDelete"))) return;
    setBusy(true);
    try {
      const res = await adminJson("/api/admin/files/bulk", "POST", {
        ids: selected,
        action,
        value: value ?? (action === "section" ? bulkSection : undefined),
      });
      if (res.ok) setSelected([]);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function quickPatch(id: string, patch: Record<string, unknown>) {
    await adminJson("/api/admin/files/quick", "POST", { id, ...patch });
    router.refresh();
  }

  async function toggleVisibility(file: AdminFileRow) {
    await quickPatch(file.id, { visibility: file.visibility === "published" ? "hidden" : "published" });
  }

  async function togglePin(file: AdminFileRow) {
    await quickPatch(file.id, { pinned: file.pinned ? 0 : 1 });
  }

  const allSelected = visible.length > 0 && selected.length === visible.length;

  return (
    <div className="space-y-3">
      <div className="card flex flex-wrap items-end gap-2 p-3">
        <div className="min-w-[140px] flex-1">
          <label className="label" htmlFor="admin-filter-section">{t(lang, "section")}</label>
          <select
            id="admin-filter-section"
            value={sectionId}
            onChange={(e) => {
              setSectionId(e.target.value);
              setCategoryId("");
              setSelected([]);
            }}
            className="field"
          >
            {sections.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
        <div className="min-w-[140px] flex-1">
          <label className="label" htmlFor="admin-filter-category">{t(lang, "subCategory")}</label>
          <select id="admin-filter-category" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="field">
            <option value="">{t(lang, "categoryAll")}</option>
            {(activeSection?.categories ?? []).map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div className="min-w-[160px] flex-1">
          <label className="label" htmlFor="admin-filter-q">{t(lang, "searchAction")}</label>
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--muted)] start-2.5" aria-hidden="true" />
            <input id="admin-filter-q" value={query} onChange={(e) => setQuery(e.target.value)} className="field ps-8" placeholder={t(lang, "searchPlaceholder")} />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <label className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold text-[var(--muted)]">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={(e) => setSelected(e.target.checked ? visible.map((f) => f.id) : [])}
            className="h-3.5 w-3.5 accent-[var(--primary)]"
          />
          {t(lang, "adminSelected", { n: selected.length })}
        </label>
        {selected.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <select value={bulkSection} onChange={(e) => setBulkSection(e.target.value)} className="field h-8 w-auto py-0 text-[11.5px]">
              {sections.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            <button type="button" onClick={() => bulk("section")} disabled={busy} className="btn btn-outline btn-sm">
              {t(lang, "adminMoveTo")}
            </button>
            <button type="button" onClick={() => bulk("importance", "essential")} disabled={busy} className="btn btn-outline btn-sm">
              {t(lang, "essential")}
            </button>
            <button type="button" onClick={() => bulk("importance", "important")} disabled={busy} className="btn btn-outline btn-sm">
              {t(lang, "important")}
            </button>
            <button type="button" onClick={() => bulk("publish")} disabled={busy} className="btn btn-outline btn-sm">
              {t(lang, "adminPublish")}
            </button>
            <button type="button" onClick={() => bulk("hide")} disabled={busy} className="btn btn-outline btn-sm">
              {t(lang, "adminHide")}
            </button>
            <button type="button" onClick={() => bulk("delete")} disabled={busy} className="btn btn-ghost btn-sm text-[var(--danger)]">
              <Trash2 className="h-3.5 w-3.5" /> {t(lang, "delete")}
            </button>
            {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          </div>
        )}
      </div>

      {visible.length === 0 ? (
        <div className="card p-8 text-center text-[12.5px] text-[var(--muted)]">{t(lang, "adminNoFiles")}</div>
      ) : (
        <SortableList
          items={visible}
          onReorder={persistOrder}
          hint={t(lang, "adminReorderHint")}
          render={(file) => (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={selected.includes(file.id)}
                onChange={(e) =>
                  setSelected((prev) => (e.target.checked ? [...prev, file.id] : prev.filter((x) => x !== file.id)))
                }
                className="h-3.5 w-3.5 shrink-0 accent-[var(--primary)]"
                aria-label={file.title_ar}
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <Link href={`/admin/files/${file.id}`} className="truncate text-[12.5px] font-bold hover:underline" dir="auto">
                    {lang === "ar" ? file.title_ar : file.title_en || file.title_ar}
                  </Link>
                  <span className={cn("badge", file.importance === "essential" ? "badge-essential" : file.importance === "important" ? "badge-important" : "badge-reference")}>
                    {t(lang, file.importance === "essential" ? "essential" : file.importance === "important" ? "important" : "reference")}
                  </span>
                  {file.pinned === 1 && <Pin className="h-3 w-3 text-[var(--accent)]" aria-label={t(lang, "pinned")} />}
                  {file.visibility !== "published" && (
                    <span className="badge badge-updated">{t(lang, file.visibility === "hidden" ? "hidden" : "scheduled")}</span>
                  )}
                  {file.text_status === "needs_ocr" && <span className="badge badge-essential">OCR</span>}
                  {file.text_status === "failed" && <span className="badge badge-essential">!</span>}
                </div>
                <p className="mt-0.5 text-[10.5px] text-[var(--muted)]">
                  {(lang === "ar" ? file.category_name_ar : file.category_name_en) ?? "—"} · {pagesLabel(file.page_count, lang)} ·{" "}
                  {formatNumber(file.views, lang)} {t(lang, "views")} · {formatDate(file.updated_at, lang)}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-0.5">
                <button type="button" onClick={() => togglePin(file)} className={cn("btn btn-ghost btn-sm", file.pinned === 1 && "text-[var(--accent)]")} aria-label={t(lang, "pinned")}>
                  <Pin className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => toggleVisibility(file)}
                  className="btn btn-ghost btn-sm"
                  aria-label={t(lang, "adminHide")}
                  title={t(lang, "adminHide")}
                >
                  {file.visibility === "published" ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                </button>
                <Link href={`/file/${file.id}`} target="_blank" className="btn btn-ghost btn-sm" aria-label={t(lang, "openFile")}>
                  <ExternalLink className="h-3.5 w-3.5" />
                </Link>
                <Link href={`/admin/files/${file.id}`} className="btn btn-ghost btn-sm" aria-label={t(lang, "edit")}>
                  <FileText className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          )}
        />
      )}
    </div>
  );
}
