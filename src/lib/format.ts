import type { Lang, FileWithMeta, Importance } from "./types";
import { t } from "./i18n";

export function localeFor(lang: Lang): string {
  return lang === "ar" ? "ar-EG-u-nu-latn" : "en-GB";
}

export function formatDate(iso: string | null | undefined, lang: Lang, opts: Intl.DateTimeFormatOptions = {}): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat(localeFor(lang), {
    year: "numeric",
    month: "short",
    day: "numeric",
    ...opts,
  }).format(d);
}

export function formatDateTime(iso: string | null | undefined, lang: Lang): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat(localeFor(lang), {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
}

export function formatNumber(n: number, lang: Lang): string {
  return new Intl.NumberFormat(localeFor(lang)).format(n);
}

export function dayBadge(iso: string, lang: Lang): { day: string; month: string } {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { day: "—", month: "" };
  return {
    day: new Intl.DateTimeFormat(localeFor(lang), { day: "2-digit" }).format(d),
    month: new Intl.DateTimeFormat(localeFor(lang), { month: "short" }).format(d),
  };
}

export function formatBytes(bytes: number): string {
  if (!bytes) return "—";
  const units = ["B", "KB", "MB", "GB"];
  let i = 0;
  let v = bytes;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v.toFixed(v >= 10 || i === 0 ? 0 : 1)} ${units[i]}`;
}

export function isNew(dateIso: string, days = 14): boolean {
  const d = new Date(dateIso).getTime();
  return Date.now() - d < days * 86400_000;
}

export function isUpdated(dateIso: string, createdIso: string, days = 30): boolean {
  if (!dateIso) return false;
  const u = new Date(dateIso).getTime();
  const c = new Date(createdIso).getTime();
  return u - c > 60_000 && Date.now() - u < days * 86400_000;
}

export function pickText(lang: Lang, ar: string | null | undefined, en: string | null | undefined): string {
  if (lang === "ar") return (ar && ar.trim()) || en || "";
  return (en && en.trim()) || ar || "";
}

export function importanceKey(i: Importance): "essential" | "important" | "reference" {
  return i === "essential" || i === "important" ? i : "reference";
}

/** "12-18, 3, 5" -> [3,5,12..18]; returns null when invalid. */
export function parsePageRange(input: string, maxPages: number): number[] | null {
  const cleaned = input.replace(/[–—]/g, "-").replace(/\s+/g, "");
  if (!cleaned) return null;
  const out = new Set<number>();
  for (const part of cleaned.split(",")) {
    if (!part) continue;
    if (part.includes("-")) {
      const [aRaw, bRaw] = part.split("-");
      const a = Number(aRaw);
      const b = Number(bRaw);
      if (! Number.isInteger(a) || !Number.isInteger(b) || a < 1 || b < 1) return null;
      const [from, to] = a <= b ? [a, b] : [b, a];
      if (to - from > 400) return null;
      for (let i = from; i <= to; i++) out.add(i);
    } else {
      const n = Number(part);
      if (!Number.isInteger(n) || n < 1) return null;
      out.add(n);
    }
  }
  const pages = Array.from(out).sort((a, b) => a - b);
  if (!pages.length) return null;
  if (maxPages && pages.some((p) => p > maxPages)) return null;
  return pages;
}

export function compressRange(pages: number[]): string {
  if (!pages.length) return "";
  const sorted = [...new Set(pages)].sort((a, b) => a - b);
  const parts: string[] = [];
  let start = sorted[0];
  let prev = sorted[0];
  for (let i = 1; i <= sorted.length; i++) {
    const cur = sorted[i];
    if (cur === prev + 1) {
      prev = cur;
      continue;
    }
    parts.push(start === prev ? String(start) : `${start}-${prev}`);
    start = cur;
    prev = cur;
  }
  return parts.join(", ");
}

export type CitationInput = {
  title: string;
  page?: number;
  pages?: number[];
  section?: string;
  edition?: string;
  date?: string;
};

export function citationText(input: CitationInput, baseUrl: string, id: string, lang: Lang): string {
  const pages = input.pages?.length ? compressRange(input.pages) : input.page ? String(input.page) : "";
  const pageLabel = pages ? (lang === "ar" ? `، ص ${pages}` : `, p. ${pages}`) : "";
  const edition = input.edition ? ` (${input.edition})` : "";
  const url = `${baseUrl}/file/${id}${input.page ? `?page=${input.page}` : ""}`;
  return `«${input.title}»${edition}${pageLabel} — ${url}`;
}

export function whatsappLink(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

/** Absolute base URL for metadata, falling back to localhost in development. */
export function siteBase(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "http://localhost:3000";
  return raw.replace(/\/$/, "") || "http://localhost:3000";
}

/** Arabic-aware plural helper: 1 → singular, 3–10 → plural, 11+ → singular accusative. */
function arPlural(n: number, one: string, few: string, many: string): string {
  if (n === 1) return one;
  if (n === 2) return few;
  if (n >= 3 && n <= 10) return few;
  return many;
}

export function filesLabel(n: number, lang: Lang): string {
  const value = formatNumber(n, lang);
  if (lang !== "ar") return `${value} ${n === 1 ? "file" : "files"}`;
  return `${value} ${arPlural(n, "ملف", "ملفات", "ملفًا")}`;
}

export function categoriesLabel(n: number, lang: Lang): string {
  const value = formatNumber(n, lang);
  if (lang !== "ar") return `${value} ${n === 1 ? "category" : "categories"}`;
  return `${value} ${arPlural(n, "تصنيف", "تصنيفات", "تصنيفًا")}`;
}

/** Localised "12 pages" / "١٢ صفحة" with correct Arabic plural forms. */
export function pagesLabel(n: number, lang: Lang): string {
  const value = formatNumber(n, lang);
  if (lang === "ar") {
    const unit = n === 1 ? "صفحة" : n >= 3 && n <= 10 ? "صفحات" : "صفحة";
    return `${value} ${unit}`;
  }
  return `${value} ${n === 1 ? "page" : "pages"}`;
}

const STATUS_KEY: Record<string, string> = {
  extracted: "statusExtracted",
  ocr: "statusOcr",
  edited: "statusEdited",
  manual: "statusEdited",
  needs_ocr: "statusNeedsOcr",
  needs_review: "statusNeedsOcr",
  processing: "statusProcessing",
  pending: "statusPending",
  failed: "statusFailed",
};

type MsgKey = Parameters<typeof t>[1];

export function textStatusLabel(lang: Lang, status: string | null | undefined): string {
  return t(lang, (STATUS_KEY[status ?? ""] ?? "statusPending") as MsgKey);
}

export function absoluteUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "";
  if (!base) return path;
  return `${base}${path.startsWith("/") ? "" : "/"}${path}`;
}

export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function splitForWhatsapp(text: string, limit = 3800): string[] {
  if (text.length <= limit) return [text];
  const parts: string[] = [];
  let current = "";
  for (const line of text.split("\n")) {
    if ((current + "\n" + line).length > limit) {
      if (current) parts.push(current.trim());
      current = line;
      while (current.length > limit) {
        parts.push(current.slice(0, limit));
        current = current.slice(limit);
      }
    } else {
      current = current ? `${current}\n${line}` : line;
    }
  }
  if (current.trim()) parts.push(current.trim());
  return parts;
}

export function fileHref(file: Pick<FileWithMeta, "id">, page?: number, q?: string, version?: number): string {
  const params = new URLSearchParams();
  if (page && page > 1) params.set("page", String(page));
  if (q) params.set("q", q);
  if (version) params.set("v", String(version));
  const qs = params.toString();
  return `/file/${file.id}${qs ? `?${qs}` : ""}`;
}

export function stripHtml(input: string): string {
  return input.replace(/<[^>]*>/g, "");
}

export function truncate(input: string, n: number): string {
  return input.length > n ? `${input.slice(0, n - 1)}…` : input;
}
