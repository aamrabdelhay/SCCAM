import { NextRequest } from "next/server";
import { newId, nowIso, one, run } from "@/lib/db";
import { adminGuard, clean, MAX_UPLOAD_BYTES, ALLOWED_MIME } from "@/lib/admin-api";
import { ensureCoreSections, getSectionBySlug } from "@/lib/queries";
import { uploadDestination } from "@/lib/upload-destinations";
import { buildStorageKey } from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

function extensionOf(filename: string): string {
  const dot = filename.lastIndexOf(".");
  return dot >= 0 ? filename.slice(dot + 1).toLowerCase() : "";
}

export async function POST(req: NextRequest) {
  const denied = await adminGuard();
  if (denied) return denied;

  let newFileId: string | null = null;
  try {
    const input = await req.json() as {
      filename?: unknown;
      size?: unknown;
      mime?: unknown;
      titleAr?: unknown;
      titleEn?: unknown;
      destination?: unknown;
      fileId?: unknown;
      changelog?: unknown;
    };

    const filename = clean(input.filename, 220);
    const extension = extensionOf(filename);
    const mime = MIME_BY_EXTENSION[extension];
    const size = Number(input.size);
    if (!filename || !mime || !ALLOWED_MIME.includes(mime)) {
      return Response.json({ error: "unsupported-file-type" }, { status: 400 });
    }
    if (!Number.isSafeInteger(size) || size < 1) {
      return Response.json({ error: "file-required" }, { status: 400 });
    }
    if (size > MAX_UPLOAD_BYTES) {
      return Response.json({ error: "file-too-large", maxBytes: MAX_UPLOAD_BYTES }, { status: 413 });
    }

    const requestedFileId = clean(input.fileId, 40);
    let fileId = requestedFileId;
    let version = 1;
    let titleAr = clean(input.titleAr, 220);
    let titleEn = clean(input.titleEn, 220);
    let changelog = clean(input.changelog, 400);
    let initialUpload = false;

    if (requestedFileId) {
      const existing = await one<{
        id: string;
        current_version: number;
        title_ar: string;
        title_en: string;
      }>(
        "SELECT id, current_version, title_ar, title_en FROM files WHERE id = ?",
        [requestedFileId],
      );
      if (!existing) return Response.json({ error: "not-found" }, { status: 404 });
      version = Number(existing.current_version) + 1;
      titleAr = existing.title_ar;
      titleEn = existing.title_en;
      changelog = changelog || ("Updated version " + version);
    } else {
      if (!titleAr && !titleEn) {
        return Response.json({ error: "title-required" }, { status: 400 });
      }
      await ensureCoreSections();
      const destination = uploadDestination(clean(input.destination, 30));
      if (!destination) return Response.json({ error: "section-required" }, { status: 400 });
      const section = await getSectionBySlug(destination.sectionSlug);
      if (!section) return Response.json({ error: "section-required" }, { status: 400 });

      fileId = newId("f");
      newFileId = fileId;
      initialUpload = true;
      titleAr = titleAr || titleEn;
      titleEn = titleEn || "";
      changelog = "Initial upload";
      const now = nowIso();
      await run(
        "INSERT INTO files (id, title_ar, title_en, section_id, tags, importance, visibility, download_allowed, print_allowed, mime, size_bytes, page_count, storage_key, current_version, text_status, created_at, updated_at) " +
          "VALUES (?,?,?,?,?,'reference','hidden',1,1,?,0,0,'',0,'uploading',?,?)",
        [fileId, titleAr, titleEn, section.id, destination.tags, mime, now, now],
      );
      version = 1;
    }

    const existingPending = await one<{
      id: string;
      storage_key: string;
      mime: string;
      size_bytes: number;
      text_status: string;
    }>(
      "SELECT id, storage_key, mime, size_bytes, text_status FROM file_versions WHERE file_id = ? AND version = ?",
      [fileId, version],
    );

    if (existingPending) {
      if (existingPending.mime !== mime || Number(existingPending.size_bytes) !== size) {
        return Response.json({ error: "upload-state-conflict" }, { status: 409 });
      }
      const fileState = await one<{ current_version: number; storage_key: string }>(
        "SELECT current_version, storage_key FROM files WHERE id = ?",
        [fileId],
      );
      if (fileState && Number(fileState.current_version) >= version && fileState.storage_key === existingPending.storage_key) {
        return Response.json({ id: fileId, version, alreadyCompleted: true });
      }
      if (existingPending.text_status !== "uploading") {
        return Response.json({ error: "upload-state-conflict" }, { status: 409 });
      }
      return Response.json({
        id: fileId,
        version,
        pathname: existingPending.storage_key,
        size,
        mime,
        initialUpload,
        retry: true,
      });
    }

    const pathname = buildStorageKey(fileId, version, extension);
    const versionId = newId("ver");
    await run(
      "INSERT INTO file_versions (id, file_id, version, storage_key, mime, size_bytes, page_count, changelog, text_status, created_at) " +
        "VALUES (?,?,?,?,?,?,0,?,'uploading',?)",
      [versionId, fileId, version, pathname, mime, size, changelog, nowIso()],
    );

    return Response.json({
      id: fileId,
      version,
      pathname,
      size,
      mime,
      initialUpload,
    });
  } catch (err) {
    console.error("[admin/files/upload-start] failed", err);
    if (newFileId) await run("DELETE FROM files WHERE id = ?", [newFileId]).catch(() => undefined);
    return Response.json({ error: "upload-start-failed" }, { status: 500 });
  }
}
