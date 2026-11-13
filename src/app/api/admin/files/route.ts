import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { newId, nowIso, one, run } from "@/lib/db";
import { adminGuard, bool, clean, int, validateFile } from "@/lib/admin-api";
import { storeAndProcess } from "@/lib/process";
import { addChangelog, ensureCoreSections, getSectionBySlug } from "@/lib/queries";
import { uploadDestination } from "@/lib/upload-destinations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function mimeForUpload(file: File): string {
  if (file.type) return file.type;
  const name = file.name.toLowerCase();
  if (name.endsWith(".pdf")) return "application/pdf";
  if (name.endsWith(".docx")) return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  if (name.endsWith(".txt")) return "text/plain";
  if (name.endsWith(".md")) return "text/markdown";
  if (name.endsWith(".png")) return "image/png";
  if (name.endsWith(".jpg") || name.endsWith(".jpeg")) return "image/jpeg";
  if (name.endsWith(".webp")) return "image/webp";
  return "application/octet-stream";
}

export async function POST(req: NextRequest) {
  const denied = await adminGuard();
  if (denied) return denied;

  let createdFileId: string | null = null;
  try {
    const form = await req.formData();
    const titleAr = clean(form.get("titleAr"), 220);
    const titleEn = clean(form.get("titleEn"), 220);
    if (!titleAr && !titleEn) return Response.json({ error: "title-required" }, { status: 400 });

    const file = form.get("file");
    if (!(file instanceof File) || file.size === 0) {
      return Response.json({ error: "file-required" }, { status: 400 });
    }
    const problem = validateFile(file);
    if (problem) return Response.json({ error: problem }, { status: 400 });

    await ensureCoreSections();
    const destination = uploadDestination(clean(form.get("destination"), 30));
    const legacySectionId = clean(form.get("sectionId"), 40);
    const section = destination
      ? await getSectionBySlug(destination.sectionSlug)
      : await one<{ id: string }>("SELECT id FROM sections WHERE id = ?", [legacySectionId]);
    if (!section) return Response.json({ error: "section-required" }, { status: 400 });

    const tags = [clean(form.get("tags"), 400), destination?.tags ?? ""].filter(Boolean).join(" ").trim();
    const id = newId("f");
    createdFileId = id;
    const password = clean(form.get("filePassword"), 200);
    const visibilityValue = clean(form.get("visibility"), 20);
    const visibility = ["published", "hidden", "scheduled"].includes(visibilityValue) ? visibilityValue : "published";
    const publishAt = clean(form.get("publishAt"), 40) || null;
    const mime = mimeForUpload(file);
    const now = nowIso();

    await run(
      "INSERT INTO files (id, title_ar, title_en, description_ar, description_en, section_id, category_id, tags, " +
        "edition_year, doc_date, importance, pinned, sort_order, visibility, publish_at, download_allowed, print_allowed, " +
        "source_note, file_password_hash, mime, size_bytes, page_count, storage_key, current_version, text_status, created_at, updated_at) " +
        "VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
      [
        id,
        titleAr || titleEn,
        titleEn || "",
        clean(form.get("descriptionAr"), 2000),
        clean(form.get("descriptionEn"), 2000),
        section.id,
        clean(form.get("categoryId"), 40) || null,
        tags,
        clean(form.get("editionYear"), 20),
        clean(form.get("docDate"), 40) || null,
        ["essential", "important", "reference"].includes(clean(form.get("importance"), 20))
          ? clean(form.get("importance"), 20)
          : "reference",
        bool(form.get("pinned")) ? 1 : 0,
        int(form.get("sortOrder"), 0),
        visibility,
        visibility === "scheduled" ? publishAt : null,
        bool(form.get("downloadAllowed")) ? 1 : 0,
        bool(form.get("printAllowed")) ? 1 : 0,
        clean(form.get("sourceNote"), 500),
        password ? await bcrypt.hash(password, 11) : null,
        mime,
        0,
        0,
        "",
        1,
        "pending",
        now,
        now,
      ],
    );

    const buffer = Buffer.from(await file.arrayBuffer());
    const processed = await storeAndProcess({
      fileId: id,
      buffer,
      mime,
      filename: file.name,
      version: 1,
      changelog: "Initial upload",
    });

    if (!processed.ok) {
      await run("DELETE FROM files WHERE id = ?", [id]).catch(() => undefined);
      createdFileId = null;
      console.error("[admin/files] storage failed", processed.stage, processed.error);
      return Response.json(
        { error: "storage-failed", stage: processed.stage },
        { status: processed.stage === "storage" ? 502 : 500 },
      );
    }

    try {
      await addChangelog({
        fileId: id,
        kind: "add",
        titleAr: "إضافة ملف: " + (titleAr || titleEn),
        titleEn: "Added file: " + (titleEn || titleAr),
        detailAr: "رفع أول نسخة إلى المكتبة",
        detailEn: "First version uploaded to the library",
        version: 1,
      });
    } catch (err) {
      console.error("[admin/files] changelog insert failed", err);
    }

    return Response.json({
      id,
      ok: true,
      warning: processed.ok && "warning" in processed ? processed.warning : undefined,
    });
  } catch (err) {
    console.error("[admin/files] request failed", err);
    if (createdFileId) {
      await run("DELETE FROM files WHERE id = ?", [createdFileId]).catch(() => undefined);
    }
    return Response.json({ error: "upload-failed" }, { status: 500 });
  }
}
