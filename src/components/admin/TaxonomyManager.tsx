"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Save, Loader2 } from "lucide-react";
import { t } from "@/lib/i18n";
import type { Lang } from "@/lib/types";
import { adminJson } from "@/lib/admin-client";
import { SortableList } from "./SortableList";

type Cat = { id: string; name: string; slug: string };
type Section = { id: string; slug: string; nameAr: string; nameEn: string; descriptionAr: string; descriptionEn: string; accent: string; count: number; categories: Cat[] };

export function TaxonomyManager({ lang, sections }: { lang: Lang; sections: Section[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  async function post(payload: Record<string, unknown>) {
    await adminJson("/api/admin/taxonomy", "POST", payload);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <section className="card p-4">
        <h2 className="text-[14px] font-bold">{t(lang, "adminSectionOrder")}</h2>
        <p className="hint mt-0.5">{t(lang, "adminReorderHint")}</p>
        <div className="mt-2">
          <SortableList
            items={sections}
            onReorder={async (ordered) => {
              setBusy("sections");
              await post({ action: "section-order", items: ordered.map((s, i) => ({ id: s.id, sortOrder: (i + 1) * 10 })) });
              setBusy(null);
            }}
            render={(s) => (
              <div className="flex items-center gap-2">
                <span className="h-4 w-1 rounded-full" style={{ background: s.accent }} />
                <span className="text-[12.5px] font-bold">{s.nameAr} / {s.nameEn}</span>
                <span className="text-[10.5px] text-[var(--muted)]">/{s.slug}</span>
              </div>
            )}
          />
        </div>
      </section>

      {sections.map((section) => (
        <section key={section.id} className="card p-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-[14px] font-bold">
              {section.nameAr} <span className="text-[var(--muted)]">/ {section.nameEn}</span>
            </h2>
            <span className="text-[10.5px] font-semibold text-[var(--muted)]">{section.count} files</span>
          </div>

          <form
            className="mt-3 grid gap-2 sm:grid-cols-2"
            onSubmit={async (e) => {
              e.preventDefault();
              const form = new FormData(e.currentTarget);
              setBusy(section.id);
              await post({
                action: "section-update",
                id: section.id,
                nameAr: form.get("nameAr"),
                nameEn: form.get("nameEn"),
                descriptionAr: form.get("descriptionAr"),
                descriptionEn: form.get("descriptionEn"),
                accent: form.get("accent"),
              });
              setBusy(null);
            }}
          >
            <input name="nameAr" defaultValue={section.nameAr} className="field text-[12px]" aria-label={t(lang, "titleAr")} dir="rtl" />
            <input name="nameEn" defaultValue={section.nameEn} className="field text-[12px]" aria-label={t(lang, "titleEn")} dir="ltr" />
            <textarea name="descriptionAr" defaultValue={section.descriptionAr} rows={2} className="field text-[12px]" aria-label="description ar" dir="rtl" />
            <textarea name="descriptionEn" defaultValue={section.descriptionEn} rows={2} className="field text-[12px]" aria-label="description en" dir="ltr" />
            <div className="flex items-center gap-2">
              <input type="color" name="accent" defaultValue={section.accent} className="h-9 w-14 rounded-lg border border-[var(--line)] bg-[var(--bg)] p-0.5" aria-label="accent" />
              <button type="submit" className="btn btn-outline btn-sm gap-1">
                {busy === section.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                {t(lang, "save")}
              </button>
            </div>
          </form>

          <div className="mt-4 border-t border-[var(--line)] pt-3">
            <h3 className="text-[12.5px] font-bold">{t(lang, "adminTaxonomy")}</h3>
            {section.categories.length > 0 && (
              <div className="mt-2">
                <SortableList
                  items={section.categories}
                  onReorder={async (ordered) => {
                    await post({ action: "category-order", items: ordered.map((c, i) => ({ id: c.id, sortOrder: (i + 1) * 10 })) });
                  }}
                  render={(c) => (
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[12px] font-semibold">{c.name}</span>
                      <button
                        type="button"
                        onClick={async () => {
                          if (!window.confirm(t(lang, "confirmDelete"))) return;
                          await post({ action: "category-delete", id: c.id });
                        }}
                        className="btn btn-ghost btn-sm text-[var(--danger)]"
                        aria-label={t(lang, "delete")}
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                />
              </div>
            )}
            <form
              className="mt-2 flex flex-wrap items-end gap-2"
              onSubmit={async (e) => {
                e.preventDefault();
                const form = new FormData(e.currentTarget);
                await post({ action: "category-create", sectionId: section.id, nameAr: form.get("nameAr"), nameEn: form.get("nameEn") });
                (e.target as HTMLFormElement).reset();
              }}
            >
              <div className="min-w-[140px] flex-1">
                <label className="label" htmlFor={`cat-ar-${section.id}`}>{t(lang, "adminCategoryNameAr")}</label>
                <input id={`cat-ar-${section.id}`} name="nameAr" required className="field text-[12px]" dir="rtl" />
              </div>
              <div className="min-w-[140px] flex-1">
                <label className="label" htmlFor={`cat-en-${section.id}`}>{t(lang, "adminCategoryNameEn")}</label>
                <input id={`cat-en-${section.id}`} name="nameEn" className="field text-[12px]" dir="ltr" />
              </div>
              <button type="submit" className="btn btn-primary btn-sm gap-1">
                <Plus className="h-3.5 w-3.5" /> {t(lang, "adminAddCategory")}
              </button>
            </form>
          </div>
        </section>
      ))}
    </div>
  );
}
