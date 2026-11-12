import { batch, newId, nowIso, one, run } from "./db";
import { buildStorageKey, getObjectBuffer, putObject } from "./storage";
import { extractDocx, extractPdf, extractPlainText, ocrPdfPages, type ExtractResult } from "./extract";
import { normalizeArabic, tokenize } from "./search";

export type UploadInput = {
  fileId: string;
  buffer: Buffer;
  mime: string;
  filename: string;
  version?: number;
  changelog?: string;
  existingVersionId?: string;
};

export function detectKind(mime: string, filename: string): ExtractResult["kind"] {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  if (mime === "application/pdf" || ext === "pdf") return "pdf";
  if (mime.includes("wordprocessingml") || ext === "docx") return "docx";
  if (mime.startsWith("text/") || ext === "txt" || ext === "md") return "txt";
  if (mime.startsWith("image/") || ["png", "jpg", "jpeg", "webp"].includes(ext)) return "image";
  return "unknown";
}

export function extForMime(mime: string, filename: string): string {
  const fromName = filename.includes(".") ? filename.split(".").pop()! : "";
  if (fromName && fromName.length <= 5) return fromName.toLowerCase();
  if (mime === "application/pdf") return "pdf";
  if (mime.includes("wordprocessingml")) return "docx";
  if (mime.startsWith("image/")) return mime.split("/")[1];
  return "bin";
}

/** Extracts text, stores it per page, and rebuilds the inverted index for the file. */
export async function processDocument(
  fileId: string,
  buffer: Buffer,
  mime: string,
  filename: string,
  versionId?: string,
): Promise<{ pageCount: number; status: string; needsOcr: boolean }> {
  const kind = detectKind(mime, filename);
  let result: ExtractResult;
  if (kind === "pdf") result = await extractPdf(buffer);
  else if (kind === "docx") result = await extractDocx(buffer);
  else if (kind === "txt") result = extractPlainText(buffer);
  else if (kind === "image") {
    result = { pages: [{ pageNo: 1, text: "", source: "empty" }], pageCount: 1, needsOcr: true, kind };
  } else {
    result = { pages: [{ pageNo: 1, text: "", source: "empty" }], pageCount: 1, needsOcr: false, kind };
  }

  let needsOcr = result.needsOcr;
  if (needsOcr && kind === "pdf" && process.env.OCR_ENABLED !== "false") {
    const ocr = await ocrPdfPages(buffer);
    if (ocr && ocr.some((p) => p.text.length > 12)) {
      result.pages = ocr;
      needsOcr = false;
      result.pageCount = Math.max(result.pageCount, ocr.length);
    }
  }

  const file = await one<{ current_version: number; title_ar: string; title_en: string; description_ar: string; description_en: string; tags: string }>(
    "SELECT current_version, title_ar, title_en, description_ar, description_en, tags FROM files WHERE id = ?",
    [fileId],
  );
  const resolvedVersionId = versionId ?? `v_${fileId}_${file?.current_version ?? 1}`;

  const ocrCount = result.pages.filter((p) => p.source === "ocr").length;
  const status = needsOcr ? "needs_ocr" : ocrCount > 0 ? "ocr" : "extracted";

  await savePages(fileId, resolvedVersionId, result.pages, status, ocrCount);
  await indexFileTerms(
    fileId,
    [file?.title_ar ?? "", file?.title_en ?? "", file?.description_ar ?? "", file?.description_en ?? ""],
    file?.tags ?? "",
  );

  return { pageCount: result.pageCount, status, needsOcr };
}

export async function savePages(
  fileId: string,
  versionId: string,
  pages: { pageNo: number; text: string; source: string }[],
  status = "extracted",
  ocrCount = 0,
) {
  const stmts: { sql: string; args: (string | number)[] }[] = [
    { sql: "DELETE FROM pages_text WHERE file_id = ?", args: [fileId] },
    { sql: "DELETE FROM page_terms WHERE file_id = ?", args: [fileId] },
  ];
  for (const p of pages) {
    const norm = normalizeArabic(p.text);
    stmts.push({
      sql: "INSERT INTO pages_text (file_id, version_id, page_no, text, text_norm, source, edited) VALUES (?,?,?,?,?,?,0)",
      args: [fileId, versionId, p.pageNo, p.text, norm, p.source],
    });
    const counts = new Map<string, number>();
    for (const t of tokenize(norm)) {
      if (t.length < 2) continue;
      counts.set(t, (counts.get(t) ?? 0) + 1);
    }
    for (const [term, tf] of counts) {
      stmts.push({
        sql: "INSERT OR REPLACE INTO page_terms (file_id, page_no, term, tf) VALUES (?,?,?,?)",
        args: [fileId, p.pageNo, term, tf],
      });
    }
  }
  stmts.push({
    sql: "UPDATE files SET page_count = ?, text_status = ?, ocr_pages = ?, updated_at = ? WHERE id = ?",
    args: [pages.length, status, ocrCount, nowIso(), fileId],
  });
  await batch(stmts);
}

export async function indexFileTerms(fileId: string, fields: string[], tags: string) {
  const stmts: { sql: string; args: (string | number)[] }[] = [
    { sql: "DELETE FROM file_terms WHERE file_id = ?", args: [fileId] },
  ];
  const push = (text: string, field: string) => {
    const terms = new Set(tokenize(normalizeArabic(text)).filter((t) => t.length >= 2));
    for (const t of terms) {
      stmts.push({ sql: "INSERT OR IGNORE INTO file_terms (file_id, term, field) VALUES (?,?,?)", args: [fileId, t, field] });
    }
  };
  const [titleAr, titleEn, descAr, descEn] = fields;
  push(`${titleAr} ${titleEn}`, "title");
  push(`${descAr} ${descEn}`, "description");
  push(tags, "tags");
  await batch(stmts);
}

/** Admin edit of a single page's text — keeps the index in sync. */
export async function updatePageText(fileId: string, pageNo: number, text: string) {
  const norm = normalizeArabic(text);
  const page = await one<{ id: number }>("SELECT id FROM pages_text WHERE file_id = ? AND page_no = ?", [fileId, pageNo]);
  if (!page) {
    await run(
      "INSERT INTO pages_text (file_id, version_id, page_no, text, text_norm, source, edited) VALUES (?,?,?,?,?,?,1)",
      [fileId, "manual", pageNo, text, norm, "text"],
    );
  } else {
    await run("UPDATE pages_text SET text = ?, text_norm = ?, edited = 1 WHERE file_id = ? AND page_no = ?", [
      text,
      norm,
      fileId,
      pageNo,
    ]);
  }
  await run("DELETE FROM page_terms WHERE file_id = ? AND page_no = ?", [fileId, pageNo]);
  const counts = new Map<string, number>();
  for (const t of tokenize(norm)) {
    if (t.length < 2) continue;
    counts.set(t, (counts.get(t) ?? 0) + 1);
  }
  if (counts.size) {
    await batch(
      Array.from(counts, ([term, tf]) => ({
        sql: "INSERT OR REPLACE INTO page_terms (file_id, page_no, term, tf) VALUES (?,?,?,?)",
        args: [fileId, pageNo, term, tf],
      })),
    );
  }
  const remaining = await one<{ c: number }>(
    "SELECT COUNT(*) AS c FROM pages_text WHERE file_id = ? AND source = 'empty' AND edited = 0",
    [fileId],
  );
  await run("UPDATE files SET text_status = ? WHERE id = ?", [remaining && remaining.c > 0 ? "needs_ocr" : "edited", fileId]);
}

/** Upload → storage → version row → extraction → index. */
export async function storeAndProcess(input: UploadInput) {
  const version = input.version ?? 1;
  const ext = extForMime(input.mime, input.filename);
  const key = buildStorageKey(input.fileId, version, ext);
  await putObject(key, input.buffer, input.mime);

  // Snapshot the outgoing version's text before it is replaced (for version diffing).
  const previous = await one<{ current_version: number }>("SELECT current_version FROM files WHERE id = ?", [input.fileId]);
  if (previous) {
    await run(
      `INSERT OR REPLACE INTO pages_history (file_id, version, page_no, text, created_at)
       SELECT file_id, ?, page_no, text, ? FROM pages_text WHERE file_id = ?`,
      [previous.current_version, nowIso(), input.fileId],
    );
  }
  const versionId = input.existingVersionId ?? newId("ver");
  await run(
    `INSERT INTO file_versions (id, file_id, version, storage_key, mime, size_bytes, page_count, changelog, text_status, created_at)
     VALUES (?,?,?,?,?,?,?,?,?,?)`,
    [versionId, input.fileId, version, key, input.mime, input.buffer.byteLength, 0, input.changelog ?? "", "processing", nowIso()],
  );
  await run(
    `UPDATE files SET storage_key = ?, mime = ?, size_bytes = ?, current_version = ?, text_status = 'processing', updated_at = ? WHERE id = ?`,
    [key, input.mime, input.buffer.byteLength, version, nowIso(), input.fileId],
  );

  try {
    const res = await processDocument(input.fileId, input.buffer, input.mime, input.filename, versionId);
    await run("UPDATE file_versions SET page_count = ?, text_status = ? WHERE id = ?", [res.pageCount, res.status, versionId]);
    return { ok: true as const, ...res };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await run("UPDATE files SET text_status = 'failed', text_error = ? WHERE id = ?", [message.slice(0, 400), input.fileId]);
    await run("UPDATE file_versions SET text_status = 'failed' WHERE id = ?", [versionId]);
    return { ok: false as const, error: message };
  }
}

export async function reprocessFile(fileId: string) {
  const file = await one<{ storage_key: string; mime: string; current_version: number }>(
    "SELECT storage_key, mime, current_version FROM files WHERE id = ?",
    [fileId],
  );
  if (!file) throw new Error("File not found");
  const buf = await getObjectBuffer(file.storage_key);
  if (!buf) throw new Error("Stored file missing");
  return processDocument(fileId, buf, file.mime, file.storage_key.split("/").pop() ?? "document.pdf");
}
