/**
 * Arabic-aware search utilities.
 *
 * Text is normalised once at index time (pages_text.text_norm) and again at
 * query time with the same function, so diacritics / alef variants / ta marbuta
 * never cause false negatives. Per-page terms live in `page_terms` for fast
 * boolean matching; the normalised text itself is used for phrase verification
 * and for building highlighted snippets.
 */

const DIACRITICS = /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED\u08D3-\u08E1\u08E3-\u08FF]/g;
const TATWEEL = /\u0640/g;
const PUNCT = /[!-/:-@[-`{-~\u060C\u061B\u061F\u066A-\u066D\u06D4\u2000-\u206F\u2010-\u2027\u00AB\u00BB\uFDFC\uFD3E\uFD3F]/g;

const ARABIC_INDIC = /[\u0660-\u0669]/g;
const EXTENDED_ARABIC_INDIC = /[\u06F0-\u06F9]/g;

export function normalizeArabic(input: string): string {
  return normalizeWithMap(input).text;
}

/** Same normalisation, but keeps a map back to the original indices (for snippets). */
export function normalizeWithMap(input: string): { text: string; map: number[] } {
  const out: string[] = [];
  const map: number[] = [];
  let lastWasSpace = true;
  for (let i = 0; i < input.length; i++) {
    let ch = input[i];
    const code = ch.charCodeAt(0);
    if (code >= 0x0600 && code <= 0x06ff) {
      if (DIACRITICS.test(ch)) continue;
    }
    if (code >= 0x08d3 && code <= 0x08ff) continue;
    ch = ch.replace(DIACRITICS, "").replace(TATWEEL, "");
    if (!ch) continue;

    ch = ch
      .replace(ARABIC_INDIC, (d) => String(d.charCodeAt(0) - 0x0660))
      .replace(EXTENDED_ARABIC_INDIC, (d) => String(d.charCodeAt(0) - 0x06f0))
      .toLowerCase();

    // Unify Arabic letter variants
    ch = ch
      .replace(/[\u0622\u0623\u0625\u0671\u0672\u0673]/g, "\u0627") // آأإ -> ا
      .replace(/[\u0649]/g, "\u064a") // ى -> ي
      .replace(/[\u0626]/g, "\u064a") // ئ -> ي
      .replace(/[\u0624]/g, "\u0648") // ؤ -> و
      .replace(/[\u0629]/g, "\u0647") // ة -> ه
      .replace(/[\u06a9]/g, "\u0643") // ک -> ك
      .replace(/[\u06cc]/g, "\u064a"); // ی -> ي

    const isWord = /[\p{L}\p{N}]/u.test(ch);
    if (!isWord) {
      if (!lastWasSpace) {
        out.push(" ");
        map.push(i);
        lastWasSpace = true;
      }
      continue;
    }
    out.push(ch);
    map.push(i);
    lastWasSpace = false;
  }
  // trim trailing space
  while (out.length && out[out.length - 1] === " ") {
    out.pop();
    map.pop();
  }
  return { text: out.join(""), map };
}

export const STOPWORDS = new Set(
  (
    "the a an of to in on for and or with by is are was were be been from that this these those as at it its " +
    "من في على إلى الى عن أن ان إن ال التي الذي الذين ما لا لم لن هو هي هم قد كان كانت ثم أو او و أي اي " +
    "كل بعض بين عند بعد قبل حيث كما حتى إذا اذا لكن بل لكنه هذا هذه ذلك تلك هناك هنا بها به لها له"
  ).split(/\s+/),
);

export function tokenize(normalized: string): string[] {
  return normalized.split(/\s+/).filter(Boolean);
}

/** Conservative Arabic light stemmer — only used to *expand* a failed query. */
export function lightStem(term: string): string {
  let t = term;
  for (const p of ["وال", "بال", "كال", "فال", "لل", "ال"]) {
    if (t.startsWith(p) && t.length - p.length >= 3) {
      t = t.slice(p.length);
      break;
    }
  }
  for (const s of ["هما", "هذا", "ات", "ون", "ين", "ان", "ها", "هم", "كم", "نا", "يه", "ية", "ه"]) {
    if (t.endsWith(s) && t.length - s.length >= 3) {
      t = t.slice(0, -s.length);
      break;
    }
  }
  return t;
}

export type ParsedQuery = { phrases: string[]; terms: string[]; raw: string };

export function parseQuery(raw: string): ParsedQuery {
  const phrases: string[] = [];
  const rest = raw.replace(/["“”«»]([^"“”«»]+)["“”«»]/g, (_m, p: string) => {
    const n = normalizeArabic(p).replace(/\s+/g, " ").trim();
    if (n) phrases.push(n);
    return " ";
  });
  const terms = tokenize(normalizeArabic(rest));
  const withoutStops = terms.filter((t) => !STOPWORDS.has(t));
  const finalTerms = withoutStops.length ? withoutStops : terms;
  return { phrases, terms: Array.from(new Set(finalTerms)).slice(0, 12), raw };
}

export type SnippetRange = [number, number];
export type Snippet = { text: string; ranges: SnippetRange[] };

const SNIPPET_BEFORE = 70;
const SNIPPET_AFTER = 150;

/** Builds a snippet around the first match, with highlight ranges in original text space. */
export function makeSnippet(
  originalText: string,
  queryTerms: string[],
  phrases: string[] = [],
  maxLen = SNIPPET_BEFORE + SNIPPET_AFTER,
): Snippet {
  const flat = originalText.replace(/\s+/g, " ").trim();
  if (!flat) return { text: "", ranges: [] };
  const { text: norm, map } = normalizeWithMap(flat);
  const needles = [...phrases, ...queryTerms].filter(Boolean);
  let hit = -1;
  let hitLen = 0;
  for (const n of needles) {
    const idx = norm.indexOf(n);
    if (idx !== -1 && (hit === -1 || idx < hit)) {
      hit = idx;
      hitLen = n.length;
    }
  }
  if (hit === -1) {
    const start = 0;
    return { text: flat.slice(start, start + maxLen) + (flat.length > maxLen ? "…" : ""), ranges: [] };
  }
  const origStart = map[hit] ?? 0;
  const origEnd = map[Math.min(hit + hitLen, map.length - 1)] ?? origStart + hitLen;
  let start = Math.max(0, origStart - SNIPPET_BEFORE);
  // snap to word boundary
  const space = flat.lastIndexOf(" ", start);
  if (space > start - 25 && space !== -1) start = space + 1;
  let end = Math.min(flat.length, Math.max(origEnd + 40, start + maxLen));
  if (end < flat.length) {
    const sp = flat.indexOf(" ", end);
    if (sp !== -1) end = sp;
  }
  const snippetText = flat.slice(start, end);
  const prefix = start > 0 ? "…" : "";
  const suffix = end < flat.length ? "…" : "";
  const text = prefix + snippetText + suffix;

  // Highlight every needle occurrence inside the snippet (original coordinates).
  const localNorm = normalizeWithMap(snippetText);
  const ranges: SnippetRange[] = [];
  const pushRange = (ns: number, nl: number) => {
    const os = localNorm.map[ns];
    const oe = localNorm.map[Math.min(ns + nl - 1, localNorm.map.length - 1)];
    if (os === undefined || oe === undefined) return;
    const from = os + prefix.length;
    const to = oe + 1 + prefix.length;
    for (const [a, b] of ranges) if (from < b && to > a) return; // overlap
    ranges.push([from, to]);
  };
  for (const n of needles) {
    let from = 0;
    for (let i = 0; i < 40; i++) {
      const idx = localNorm.text.indexOf(n, from);
      if (idx === -1) break;
      pushRange(idx, n.length);
      from = idx + Math.max(1, n.length);
    }
  }
  ranges.sort((a, b) => a[0] - b[0]);
  return { text, ranges };
}

export function escapeLike(input: string): string {
  return input.replace(/[\\%_]/g, (m) => `\\${m}`);
}

export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  const m = a.length;
  const n = b.length;
  if (!m || !n) return m || n;
  let prev = new Array(n + 1).fill(0).map((_, i) => i);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return prev[n];
}
