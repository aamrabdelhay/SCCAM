import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { all, nowIso, one, run } from "@/lib/db";
import { adminGuard, bool, clean, int, validateFile } from "@/lib/admin-api";
import { storeAndProcess } from "@/lib/process";
import { addChangelog } from "@/lib/queries";
import { deleteObject } from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const denied = await adminGuard();
  if (denied) return denied;
  const { id } = await ctx.params;
  const existing = await one<{ id: string; title_ar: string }>("SELECT id, title_ar FROM files WHERE id = ?", [id]);
  if (!existing) return Response.json({ error: "not-found" }, { status: 404 });

  const form = await req.formData().catch(() => null);
  if (!form) return Response.json({ error: "bad-form" }, { status: 400 });

  const password = clean(form.get("filePassword"), 200);
  let passwordChange: { value: string | null } | null = null;
  if (password === "-") passwordChange = { value: null };
  else if (password) passwordChange = { value: await bcrypt.hash(password, 11) };

  const visibility = ["published", "hidden", "scheduled"].includes(clean(form.get("visibility"), 20))
    ? clean(form.get("visibility"), 20)
    : "published";
  const publishAt = clean(form.get("publishAt"), 40) || null;

  await run(
    `UPDATE files SET title_ar = ?, title_en = ?, description_ar = ?, description_en = ?, section_id = ?,
      category_id = ?, tags = ?, edition_year = ?, doc_date = ?, importance = ?, pinned = ?, sort_order = ?,
      visibility = ?, publish_at = ?, download_allowed = ?, print_allowed = ?, source_note = ?,
      updated_at = ?
     WHERE id = ?`,
    [
      clean(form.get("titleAr"), 220) || existing.title_ar,
      clean(form.get("titleEn"), 220),
      clean(form.get("descriptionAr"), 2000),
      clean(form.get("descriptionEn"), 2000),
      clean(form.get("sectionId"), 40),
      clean(form.get("categoryId"), 40) || null,
      clean(form.get("tags"), 400),
      clean(form.get("editionYear"), 20),
      clean(form.get("docDate"), 40) || null,
      ["essential", "important", "reference"].includes(clean(form.get("importance"), 20)) ? clean(form.get("importance"), 20) : "reference",
      bool(form.get("pinned")) ? 1 : 0,
      int(form.get("sortOrder"), 0),
      visibility,
      visibility === "scheduled" ? publishAt : null,
      bool(form.get("downloadAllowed")) ? 1 : 0,
      bool(form.get("printAllowed")) ? 1 : 0,
      clean(form.get("sourceNote"), 500),
      nowIso(),
      id,
    ],
  );

  if (passwordChange) {
    await run("UPDATE files SET file_password_hash = ? WHERE id = ?", [passwordChange.value, id]);
  }

  // Re-index metadata terms after a title/description/tag change
  const { indexFileTerms } = await import("@/lib/process");
  await indexFileTerms(
    id,
    [clean(form.get("titleAr"), 220), clean(form.get("titleEn"), 220), clean(form.get("descriptionAr"), 2000), clean(form.get("descriptionEn"), 2000)],
    clean(form.get("tags"), 400),
  );

  await addChangelog({
    fileId: id,
    kind: "update",
    titleAr: `تحديث بيانات: ${clean(form.get("titleAr"), 220) || existing.title_ar}`,
    titleEn: `Metadata updated: ${clean(form.get("titleEn"), 220)}`,
    detailAr: "تعديل بيانات الملف من لوحة الإدارة",
    detailEn: "File metadata edited from the admin panel",
  });

  return Response.json({ ok: true });
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const denied = await adminGuard();
  if (denied) return denied;
  const { id } = await ctx.params;
  const rows = await all<{ storage_key: string }>(
    "SELECT storage_key FROM file_versions WHERE file_id = ?",
    [id],
  );
  const current = await one<{ storage_key: string }>("SELECT storage_key FROM files WHERE id = ?", [id]);
  for (const key of [...rows.map((r) => r.storage_key), current?.storage_key].filter(Boolean) as string[]) {
    await deleteObject(key).catch(() => undefined);
  }
  await run("DELETE FROM files WHERE id = ?", [id]);
  await addChangelog({
    fileId: null,
    kind: "remove",
    titleAr: "حذف ملف من المكتبة",
    titleEn: "File removed from the library",
    detailAr: `المعرف: ${id}`,
    detailEn: `ID: ${id}`,
  });
  return Response.json({ ok: true });
}

/** Replace with a new version (keeps history + changelog). */
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const denied = await adminGuard();
  if (denied) return denied;
  const { id } = await ctx.params;
  const file = await one<{ id: string; current_version: number; title_ar: string; title_en: string }>(
    "SELECT id, current_version, title_ar, title_en FROM files WHERE id = ?",
    [id],
  );
  if (!file) return Response.json({ error: "not-found" }, { status: 404 });

  const form = await req.formData().catch(() => null);
  if (!form) return Response.json({ error: "bad-form" }, { status: 400 });
  const upload = form.get("file");
  if (!(upload instanceof File) || upload.size === 0) return Response.json({ error: "file-required" }, { status: 400 });
  const problem = validateFile(upload);
  if (problem) return Response.json({ error: problem }, { status: 400 });

  const version = file.current_version + 1;
  const changelog = clean(form.get("changelog"), 400);
  const buffer = Buffer.from(await upload.arrayBuffer());
  const result = await storeAndProcess({
    fileId: id,
    buffer,
    mime: upload.type || "application/pdf",
    filename: upload.name,
    version,
    changelog,
  });

  if (!result.ok) {
    return Response.json({ ok: false, error: result.error, stage: result.stage, version }, { status: 502 });
  }

  try {
    await addChangelog({
      fileId: id,
      kind: "update",
      titleAr: `نسخة جديدة (v${version}): ${file.title_ar}`,
      titleEn: `New version (v${version}): ${file.title_en}`,
      detailAr: changelog || "استُبدل الملف بنسخة محدّثة",
      detailEn: changelog || "File replaced with an updated version",
      version,
    });
  } catch (err) {
    console.error("[admin/files] version changelog insert failed", err);
  }

  return Response.json({ ok: true, version, warning: result.warning });
}
