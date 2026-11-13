import { NextRequest } from "next/server";
import { one, run, nowIso } from "@/lib/db";
import { adminGuard, clean } from "@/lib/admin-api";
import { getObjectBuffer, getObjectSize } from "@/lib/storage";
import { processDocument } from "@/lib/process";
import { addChangelog } from "@/lib/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

type PendingVersion = {
  version_id: string;
  version: number;
  storage_key: string;
  mime: string;
  size_bytes: number;
  changelog: string;
  text_status: string;
  current_version: number;
  current_storage_key: string;
  visibility: string;
  title_ar: string;
  title_en: string;
};

const MIME_BY_EXTENSION: Record<string, string> = {
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  txt: "text/plain",
  md: "text/markdown",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
};

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const denied = await adminGuard();
  if (denied) return denied;

  const { id } = await ctx.params;
  try {
    const body = await req.json() as { version?: unknown; filename?: unknown };
    const version = Number(body.version);
    const filename = clean(body.filename, 220);
    const extension = filename.includes(".") ? filename.split(".").pop()!.toLowerCase() : "";
    if (!Number.isSafeInteger(version) || version < 1 || !filename || !MIME_BY_EXTENSION[extension]) {
      return Response.json({ error: "invalid-upload-completion" }, { status: 400 });
    }

    const pending = await one<PendingVersion>(
      "SELECT fv.id AS version_id, fv.version, fv.storage_key, fv.mime, fv.size_bytes, fv.changelog, fv.text_status, " +
        "f.current_version, f.storage_key AS current_storage_key, f.visibility, f.title_ar, f.title_en " +
        "FROM file_versions fv JOIN files f ON f.id = fv.file_id WHERE fv.file_id = ? AND fv.version = ?",
      [id, version],
    );
    if (!pending) return Response.json({ error: "upload-not-found" }, { status: 404 });

    // A retry after finalization should not create a duplicate version.
    if (Number(pending.current_version) >= version && pending.current_storage_key === pending.storage_key) {
      return Response.json({ ok: true, id, version, alreadyCompleted: true });
    }
    if (version !== Number(pending.current_version) + 1 || pending.text_status !== "uploading") {
      return Response.json({ error: "upload-state-conflict" }, { status: 409 });
    }
    if (MIME_BY_EXTENSION[extension] !== pending.mime) {
      return Response.json({ error: "uploaded-file-type-mismatch" }, { status: 400 });
    }

    const size = await getObjectSize(pending.storage_key);
    if (size !== Number(pending.size_bytes)) {
      return Response.json({ error: "uploaded-size-mismatch" }, { status: 409 });
    }
    const buffer = await getObjectBuffer(pending.storage_key);
    if (!buffer || buffer.byteLength !== Number(pending.size_bytes)) {
      return Response.json({ error: "uploaded-file-unavailable" }, { status: 409 });
    }

    const initialUpload = Number(pending.current_version) === 0 && !pending.current_storage_key;
    const nextVisibility = initialUpload ? "published" : pending.visibility;
    await run(
      "UPDATE files SET storage_key = ?, mime = ?, size_bytes = ?, current_version = ?, text_status = 'processing', " +
        "visibility = ?, updated_at = ? WHERE id = ?",
      [pending.storage_key, pending.mime, size, version, nextVisibility, nowIso(), id],
    );

    let pageCount = 0;
    let status = "failed";
    let warning: string | undefined;
    try {
      const processed = await processDocument(id, buffer, pending.mime, filename, pending.version_id);
      pageCount = processed.pageCount;
      status = processed.status;
      await run(
        "UPDATE file_versions SET page_count = ?, text_status = ? WHERE id = ?",
        [pageCount, status, pending.version_id],
      );
    } catch (err) {
      warning = err instanceof Error ? err.message : String(err);
      await run(
        "UPDATE files SET text_status = 'failed', text_error = ? WHERE id = ?",
        [warning.slice(0, 400), id],
      ).catch(() => undefined);
      await run(
        "UPDATE file_versions SET text_status = 'failed' WHERE id = ?",
        [pending.version_id],
      ).catch(() => undefined);
    }

    try {
      await addChangelog({
        fileId: id,
        kind: initialUpload ? "add" : "update",
        titleAr: initialUpload ? "إضافة ملف: " + pending.title_ar : "نسخة جديدة (v" + version + "): " + pending.title_ar,
        titleEn: initialUpload ? "Added file: " + pending.title_en : "New version (v" + version + "): " + pending.title_en,
        detailAr: initialUpload ? "رفع أول نسخة إلى المكتبة" : pending.changelog || "استُبدل الملف بنسخة محدّثة",
        detailEn: initialUpload ? "First version uploaded to the library" : pending.changelog || "File replaced with an updated version",
        version,
      });
    } catch (err) {
      console.error("[admin/files/complete] changelog failed", err);
    }

    return Response.json({ ok: true, id, version, pageCount, status, warning });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[admin/files/complete] failed", { fileId: id, error: message });
    return Response.json({ error: "upload-finalize-failed" }, { status: 500 });
  }
}
