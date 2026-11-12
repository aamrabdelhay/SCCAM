// Copies the pdf.js worker into /public so the viewer works fully offline (PWA)
// and never depends on a CDN. Runs before dev/build and after install.
import { copyFile, mkdir, access } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const candidates = [
  "node_modules/pdfjs-dist/build/pdf.worker.min.mjs",
  "node_modules/pdfjs-dist/build/pdf.worker.mjs",
];
const target = join(root, "public", "vendor", "pdf.worker.min.mjs");

try {
  await mkdir(dirname(target), { recursive: true });
  let done = false;
  for (const rel of candidates) {
    try {
      await access(join(root, rel));
      await copyFile(join(root, rel), target);
      done = true;
      break;
    } catch {
      /* try next candidate */
    }
  }
  if (done) console.log("[pdf-worker] copied to public/vendor/pdf.worker.min.mjs");
  else console.warn("[pdf-worker] pdfjs-dist worker not found (skipped)");
} catch (err) {
  console.warn("[pdf-worker] skipped:", err?.message ?? err);
}
