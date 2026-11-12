import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { newId, nowIso, one, run } from "@/lib/db";
import { adminGuard, bool, clean, int, validateFile } from "@/lib/admin-api";
import { storeAndProcess } from "@/lib/process";
import { addChangelog } from "@/lib/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const denied = await adminGuard();
  if (denied) return denied;

  const form = await req.formData().catch(() => null);
  if (!form) return Response.json({ error: "bad-form" }, { status: 400 });

  const titleAr = clean(form.get("titleAr"), 220);
  const titleEn = clean(form.get("titleEn"), 220);
  if (!titleAr && !titleEn) return Response.json({ error: "title-required" }, { status: 400 });

  const sectionId = clean(form.get("sectionId"), 40);
  const section = await one<{ id: string }>("SELECT id FROM sections WHERE id = ?", [sectionId]);
  if (!section) return Response.json({ error: "section-required" }, { status: 400 });

  const file = form.get("file");
  if (file instanceof File && file.size > 0) {
    const problem = validateFile(file);
    if (problem) return Response.json({ error: problem }, { status: 400 });
  }

  const id = newId("f");
  const password = clean(form.get("filePassword"), 200);
  const visibility = ["published", "hidden", "scheduled"].includes(clean(form.get("visibility"), 20))
    ? clean(form.get("visibility"), 20)
    : "published";
  const publishAt = clean(form.get("publishAt"), 40) || null;
  const now = nowIso();

  await run(
    `INSERT INTO files (id, title_ar, title_en, description_ar, description_en, section_id, category_id, tags,
      edition_year, doc_date, importance, pinned, sort_order, visibility, publish_at, download_allowed, print_allowed,
      source_note, file_password_hash, mime, size_bytes, page_count, storage_key, current_version, text_status,
      created_at, updated_at)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [
      id,
      titleAr || titleEn,
      titleEn || "",
      clean(form.get("descriptionAr"), 2000),
      clean(form.get("descriptionEn"), 2000),
      sectionId,
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
      password ? await bcrypt.hash(password, 11) : null,
      "application/pdf",
      0,
      0,
      "",
      1,
      "pending",
      now,
      now,
    ],
  );

  let result: { ok: boolean; error?: string } = { ok: true };
  if (file instanceof File && file.size > 0) {
    const buffer = Buffer.from(await file.arrayBuffer());
    const processed = await storeAndProcess({
      fileId: id,
      buffer,
      mime: file.type || "application/pdf",
      filename: file.name,
      version: 1,
      changelog: "Initial upload",
    });
    result = processed.ok ? { ok: true } : { ok: false, error: processed.error };
  }

  await addChangelog({
    fileId: id,
    kind: "add",
    titleAr: `إضافة ملف: ${titleAr || titleEn}`,
    titleEn: `Added file: ${titleEn || titleAr}`,
    detailAr: "رفع أول نسخة إلى المكتبة",
    detailEn: "First version uploaded to the library",
    version: 1,
  });

  return Response.json({ id, ok: result.ok, error: result.error });
}
