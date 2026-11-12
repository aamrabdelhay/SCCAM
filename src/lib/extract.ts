/**
 * Server-side text extraction (runs once at upload time, never on search).
 * PDF  -> pdf.js legacy build (no native deps)
 * DOCX -> mammoth
 * TXT  -> direct
 * IMG  -> OCR (optional, see ocrPage)
 */
import { join } from "node:path";
import { existsSync } from "node:fs";

export type ExtractedPage = { pageNo: number; text: string; source: "text" | "ocr" | "empty" };
export type ExtractResult = {
  pages: ExtractedPage[];
  pageCount: number;
  needsOcr: boolean;
  kind: "pdf" | "docx" | "txt" | "image" | "unknown";
};


/** Locates the installed pdfjs-dist package without bundler static analysis. */
function pdfjsPackageRoot(): string | null {
  const candidates = [
    join(process.cwd(), "node_modules", "pdfjs-dist"),
    join(process.cwd(), "..", "node_modules", "pdfjs-dist"),
    join(process.cwd(), "..", "..", "node_modules", "pdfjs-dist"),
  ];
  for (const dir of candidates) {
    if (existsSync(join(dir, "legacy", "build", "pdf.worker.mjs"))) return dir;
  }
  return null;
}

async function loadPdfjs() {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  // In Node pdf.js runs its "fake worker"; it still needs a resolvable worker
  // path (and standard font data) or text extraction fails.
  const root = pdfjsPackageRoot();
  if (root) {
    try {
      pdfjs.GlobalWorkerOptions.workerSrc = `file://${join(root, "legacy", "build", "pdf.worker.mjs")}`;
    } catch {
      /* ignore */
    }
  }
  return pdfjs;
}

function standardFontsUrl(): string | undefined {
  const root = pdfjsPackageRoot();
  if (!root) return undefined;
  const dir = join(root, "standard_fonts");
  if (!existsSync(dir)) return undefined;
  return `file://${dir.replace(/\\/g, "/")}/`;
}

export async function extractPdf(buffer: Buffer): Promise<ExtractResult> {
  const pdfjs = await loadPdfjs();
  const doc = await pdfjs.getDocument({
    data: new Uint8Array(buffer),
    useSystemFonts: true,
    disableFontFace: true,
    isEvalSupported: false,
    standardFontDataUrl: standardFontsUrl(),
    verbosity: 0,
  }).promise;

  const pages: ExtractedPage[] = [];
  let nonEmpty = 0;
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    let text = "";
    for (const item of content.items as Array<{ str?: string; hasEOL?: boolean }>) {
      if (typeof item.str !== "string") continue;
      text += item.str;
      text += item.hasEOL ? "\n" : " ";
    }
    text = text.replace(/[ \t]+\n/g, "\n").replace(/[ \t]{2,}/g, " ").trim();
    if (text.length > 12) nonEmpty++;
    pages.push({ pageNo: i, text, source: text.length ? "text" : "empty" });
    page.cleanup();
  }
  const pageCount = doc.numPages;
  await doc.destroy();
  return {
    pages,
    pageCount,
    needsOcr: nonEmpty < Math.max(1, Math.ceil(pageCount * 0.35)),
    kind: "pdf",
  };
}

export async function extractDocx(buffer: Buffer): Promise<ExtractResult> {
  const mammoth = await import("mammoth");
  const result = await mammoth.extractRawText({ buffer });
  const clean = result.value.replace(/\r\n/g, "\n").trim();
  const chunks = splitIntoPages(clean, 2200);
  return {
    pages: chunks.map((text, i) => ({ pageNo: i + 1, text, source: text ? "text" : "empty" })),
    pageCount: chunks.length,
    needsOcr: false,
    kind: "docx",
  };
}

export function extractPlainText(buffer: Buffer): ExtractResult {
  const clean = buffer.toString("utf8").replace(/\r\n/g, "\n").trim();
  const chunks = splitIntoPages(clean, 2200);
  return {
    pages: chunks.map((text, i) => ({ pageNo: i + 1, text, source: text ? "text" : "empty" })),
    pageCount: Math.max(1, chunks.length),
    needsOcr: false,
    kind: "txt",
  };
}

function splitIntoPages(text: string, size: number): string[] {
  if (!text) return [""];
  const paragraphs = text.split(/\n{2,}/);
  const pages: string[] = [];
  let buf = "";
  for (const p of paragraphs) {
    if (buf.length + p.length > size && buf.length > 0) {
      pages.push(buf.trim());
      buf = "";
    }
    if (p.length > size) {
      for (let i = 0; i < p.length; i += size) {
        const slice = p.slice(i, i + size);
        if (buf) {
          pages.push(buf.trim());
          buf = "";
        }
        pages.push(slice.trim());
      }
      continue;
    }
    buf += (buf ? "\n\n" : "") + p;
  }
  if (buf.trim()) pages.push(buf.trim());
  return pages.length ? pages : [text];
}

/**
 * Optional OCR. Requires the optional peer deps `tesseract.js` and
 * `@napi-rs/canvas` (see README). Returns null when unavailable so the
 * upload pipeline can mark the file as "needs review" instead of failing.
 */
export async function ocrPdfPages(
  buffer: Buffer,
  langs: string[] = ["ara", "eng"],
): Promise<ExtractedPage[] | null> {
  try {
    const tesseract = (await import(/* webpackIgnore: true */ "tesseract.js" as string)) as {
      createWorker: (l: string) => Promise<{
        recognize: (img: Buffer) => Promise<{ data: { text: string } }>;
        terminate: () => Promise<void>;
      }>;
    };
    const { createCanvas } = (await import(/* webpackIgnore: true */ "@napi-rs/canvas" as string)) as {
      createCanvas: (w: number, h: number) => {
        getContext: (t: "2d") => unknown;
        toBuffer: (m: "image/png") => Buffer;
      };
    };
    type RenderFn = (params: Record<string, unknown>) => { promise: Promise<void> };
    const pdfjs = await loadPdfjs();
    const doc = await pdfjs.getDocument({ data: new Uint8Array(buffer), isEvalSupported: false }).promise;
    const worker = await tesseract.createWorker(langs.join("+"));
    const out: ExtractedPage[] = [];
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const viewport = page.getViewport({ scale: 2 });
      const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
      await (page.render as unknown as RenderFn)({
        canvasContext: canvas.getContext("2d"),
        viewport,
      }).promise;
      const png = canvas.toBuffer("image/png");
      const { data } = await worker.recognize(png);
      out.push({ pageNo: i, text: data.text.trim(), source: "ocr" });
      page.cleanup();
    }
    await worker.terminate();
    await doc.destroy();
    return out;
  } catch {
    return null;
  }
}
