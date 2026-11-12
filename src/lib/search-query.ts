import { all, run } from "./db";
import { publishedPredicate } from "./queries";
import type { FileWithMeta } from "./types";
import {
  escapeLike,
  levenshtein,
  lightStem,
  makeSnippet,
  normalizeArabic,
  parseQuery,
  type Snippet,
} from "./search";

export type PageMatch = {
  pageNo: number;
  snippet: Snippet;
  kind: "text" | "metadata";
  score: number;
};

export type FileSearchResult = {
  file: FileWithMeta;
  matchCount: number;
  pages: PageMatch[];
  titleHit: boolean;
  score: number;
};

export type SearchFilters = {
  section?: string;
  category?: string;
  importance?: string;
  year?: string;
};

export type SearchResponse = {
  results: FileSearchResult[];
  totalFiles: number;
  totalPages: number;
  interpretation: string[];
  suggestion?: string;
  took: number;
};

const MAX_CANDIDATES = 260;

type Hit = { pageNo: number; tf: number };

async function termHits(term: string, fileIds: Set<string>): Promise<Map<string, Map<number, number>>> {
  const out = new Map<string, Map<number, number>>();
  const patterns: [string, string][] = [
    ["=", term],
    ["prefix", `${escapeLike(term)}%`],
  ];
  if (term.length >= 3) patterns.push(["contains", `%${escapeLike(term)}%`]);

  for (const [mode, pattern] of patterns) {
    const rows =
      mode === "="
        ? await all<{ file_id: string; page_no: number; tf: number }>(
            "SELECT file_id, page_no, tf FROM page_terms WHERE term = ? LIMIT 6000",
            [term],
          )
        : await all<{ file_id: string; page_no: number; tf: number }>(
            `SELECT file_id, page_no, tf FROM page_terms WHERE term LIKE ? ESCAPE '\\' LIMIT 6000`,
            [pattern],
          );
    for (const r of rows) {
      if (!fileIds.has(r.file_id)) continue;
      let m = out.get(r.file_id);
      if (!m) out.set(r.file_id, (m = new Map()));
      m.set(r.page_no, Math.max(m.get(r.page_no) ?? 0, Number(r.tf)));
    }
    if (out.size > 0) break; // stop at the most specific level that produced hits
  }
  return out;
}

async function metadataHits(term: string, fileIds: Set<string>) {
  const rows = await all<{ file_id: string; field: string }>(
    `SELECT DISTINCT file_id, field FROM file_terms WHERE term LIKE ? ESCAPE '\\' LIMIT 4000`,
    [`${escapeLike(term)}%`],
  );
  const map = new Map<string, Set<string>>();
  for (const r of rows) {
    if (!fileIds.has(r.file_id)) continue;
    let s = map.get(r.file_id);
    if (!s) map.set(r.file_id, (s = new Set()));
    s.add(r.field);
  }
  return map;
}

export async function searchAll(
  rawQuery: string,
  filters: SearchFilters = {},
  perFileMatches = 4,
  maxFiles = 40,
): Promise<SearchResponse> {
  const started = Date.now();
  const query = rawQuery.trim();

  // 1) allowed files (visibility + filters) with section metadata
  const p = publishedPredicate("f");
  const where: string[] = [p.sql];
  const args: (string | number)[] = [...p.args];
  if (filters.section) {
    where.push("s.slug = ?");
    args.push(filters.section);
  }
  if (filters.category) {
    where.push("c.slug = ?");
    args.push(filters.category);
  }
  if (filters.importance) {
    where.push("f.importance = ?");
    args.push(filters.importance);
  }
  if (filters.year) {
    where.push("f.edition_year = ?");
    args.push(filters.year);
  }
  const files = await all<FileWithMeta>(
    `SELECT f.*, s.slug AS section_slug, s.name_ar AS section_name_ar, s.name_en AS section_name_en,
            s.accent AS section_accent, c.slug AS category_slug,
            c.name_ar AS category_name_ar, c.name_en AS category_name_en
     FROM files f JOIN sections s ON s.id = f.section_id LEFT JOIN categories c ON c.id = f.category_id
     WHERE ${where.join(" AND ")}`,
    args,
  );
  const fileMap = new Map(files.map((f) => [f.id, f]));
  const empty: SearchResponse = {
    results: [],
    totalFiles: 0,
    totalPages: 0,
    interpretation: [],
    took: Date.now() - started,
  };
  if (!query) return empty;

  const parsed = parseQuery(query);
  const fileIds = new Set(files.map((f) => f.id));
  const interpretation: string[] = [...parsed.terms, ...parsed.phrases.map((ph) => `"${ph}"`)];

  // 2) page-level boolean match
  const pageScores = new Map<string, Map<number, number>>();
  const metaByFile = new Map<string, Set<string>>();

  if (parsed.terms.length) {
    const perTerm: Map<string, Map<number, number>>[] = [];
    for (const term of parsed.terms) {
      let hits = await termHits(term, fileIds);
      if (!hits.size) {
        const stem = lightStem(term);
        if (stem !== term && stem.length >= 3) hits = await termHits(stem, fileIds);
      }
      if (!hits.size) {
        // last resort: fuzzy neighbours in the vocabulary
        const near = await nearestTerms(term, 3);
        for (const n of near) {
          const h = await termHits(n, fileIds);
          for (const [fid, pages] of h) {
            let target = hits.get(fid);
            if (!target) hits.set(fid, (target = new Map()));
            for (const [pg, tf] of pages) target.set(pg, Math.max(target.get(pg) ?? 0, tf));
          }
        }
      }
      perTerm.push(hits);
      const meta = await metadataHits(term, fileIds);
      for (const [fid, fields] of meta) {
        let s = metaByFile.get(fid);
        if (!s) metaByFile.set(fid, (s = new Set()));
        for (const f of fields) s.add(f);
      }
    }
    // Merge all term hits with per-page term counts, so we can go from strict
    // (all terms on the same page) to file-level to a loose OR fallback.
    type Bucket = { terms: number; tf: number };
    const merged = new Map<string, Map<number, Bucket>>();
    for (const hits of perTerm) {
      for (const [fid, pages] of hits) {
        let fileBucket = merged.get(fid);
        if (!fileBucket) merged.set(fid, (fileBucket = new Map()));
        for (const [pageNo, tf] of pages) {
          const bucket = fileBucket.get(pageNo) ?? { terms: 0, tf: 0 };
          bucket.terms += 1;
          bucket.tf += tf;
          fileBucket.set(pageNo, bucket);
        }
      }
    }

    const totalTerms = perTerm.length;
    const push = (fid: string, pageNo: number, score: number) => {
      let target = pageScores.get(fid);
      if (!target) pageScores.set(fid, (target = new Map()));
      target.set(pageNo, Math.max(target.get(pageNo) ?? 0, score));
    };

    // 1) strict: every term on the same page
    for (const [fid, pages] of merged) {
      for (const [pageNo, bucket] of pages) {
        if (bucket.terms === totalTerms) push(fid, pageNo, bucket.tf + 2);
      }
    }
    // 2) file-level AND: every term appears somewhere in the file
    if (!pageScores.size) {
      for (const [fid, pages] of merged) {
        let maxTerms = 0;
        for (const bucket of pages.values()) maxTerms = Math.max(maxTerms, bucket.terms);
        if (maxTerms < totalTerms) continue;
        for (const [pageNo, bucket] of pages) push(fid, pageNo, bucket.tf + bucket.terms);
      }
    }
    // 3) loose OR so a partial match still helps the visitor
    if (!pageScores.size && totalTerms > 1) {
      for (const [fid, pages] of merged) {
        for (const [pageNo, bucket] of pages) push(fid, pageNo, bucket.tf);
      }
    }
  }

  // 3) phrases: verify against normalised page text, or locate if no terms
  let phraseFiltered = false;
  if (parsed.phrases.length) {
    const phrase = parsed.phrases[0];
    if (!pageScores.size) {
      const rows = await all<{ file_id: string; page_no: number }>(
        `SELECT file_id, page_no FROM pages_text WHERE text_norm LIKE ? ESCAPE '\\' LIMIT 400`,
        [`%${escapeLike(phrase)}%`],
      );
      for (const r of rows) {
        if (!fileIds.has(r.file_id)) continue;
        let target = pageScores.get(r.file_id);
        if (!target) pageScores.set(r.file_id, (target = new Map()));
        target.set(r.page_no, 1);
      }
    } else {
      phraseFiltered = true;
    }
  }

  // 4) rank candidates, fetch text, build snippets
  const candidates: { fileId: string; pageNo: number; score: number }[] = [];
  for (const [fileId, pages] of pageScores) {
    const meta = metaByFile.get(fileId);
    const boost = meta ? (meta.has("title") ? 6 : meta.has("tags") ? 3 : 1.5) : 0;
    for (const [pageNo, tf] of pages) {
      candidates.push({ fileId, pageNo, score: tf + boost });
    }
  }
  candidates.sort((a, b) => b.score - a.score);
  const top = candidates.slice(0, MAX_CANDIDATES);

  const pageRows = new Map<string, string>();
  if (top.length) {
    const byFile = new Map<string, number[]>();
    for (const c of top) {
      const arr = byFile.get(c.fileId) ?? [];
      arr.push(c.pageNo);
      byFile.set(c.fileId, arr);
    }
    for (const [fid, pages] of byFile) {
      const rows = await all<{ page_no: number; text: string }>(
        `SELECT page_no, text FROM pages_text WHERE file_id = ? AND page_no IN (${pages.map(() => "?").join(",")})`,
        [fid, ...pages],
      );
      for (const r of rows) pageRows.set(`${fid}:${r.page_no}`, r.text);
    }
  }

  const needles = parsed.terms.length ? parsed.terms : parsed.phrases;
  const groups = new Map<string, FileSearchResult>();

  for (const c of top) {
    const file = fileMap.get(c.fileId);
    if (!file) continue;
    const text = pageRows.get(`${c.fileId}:${c.pageNo}`) ?? "";
    if (phraseFiltered && !normalizeArabic(text).includes(parsed.phrases[0])) continue;
    const snippet = makeSnippet(text, needles, parsed.phrases);
    const meta = metaByFile.get(c.fileId);
    const group =
      groups.get(c.fileId) ??
      ({
        file,
        matchCount: 0,
        pages: [],
        titleHit: Boolean(meta?.has("title")),
        score: 0,
      } satisfies FileSearchResult);
    group.matchCount += 1;
    group.score += c.score + (group.titleHit ? 2 : 0);
    if (group.pages.length < perFileMatches) {
      group.pages.push({ pageNo: c.pageNo, snippet, kind: "text", score: c.score });
    }
    groups.set(c.fileId, group);
  }

  // 5) metadata-only matches (title/description/tag), so an empty text layer is still findable
  for (const [fid, fields] of metaByFile) {
    if (groups.has(fid)) {
      const g = groups.get(fid)!;
      if (fields.has("title")) g.titleHit = true;
      continue;
    }
    const file = fileMap.get(fid);
    if (!file) continue;
    const snippetText = file.description_ar || file.description_en || file.title_ar;
    groups.set(fid, {
      file,
      matchCount: 1,
      pages: [{ pageNo: 1, snippet: makeSnippet(snippetText, needles, parsed.phrases), kind: "metadata", score: 1 }],
      titleHit: fields.has("title"),
      score: fields.has("title") ? 8 : 3,
    });
  }

  const results = Array.from(groups.values())
    .sort((a, b) => b.score - a.score || b.file.updated_at.localeCompare(a.file.updated_at))
    .slice(0, maxFiles);

  const totalPages = Array.from(groups.values()).reduce((n, g) => n + g.matchCount, 0);

  let suggestion: string | undefined;
  if (!results.length) suggestion = await didYouMean(parsed.terms);

  return {
    results,
    totalFiles: results.length,
    totalPages,
    interpretation,
    suggestion,
    took: Date.now() - started,
  };
}

export async function nearestTerms(term: string, max = 3): Promise<string[]> {
  if (term.length < 4) return [];
  const rows = await all<{ term: string }>(
    "SELECT DISTINCT term FROM page_terms WHERE length(term) BETWEEN ? AND ? LIMIT 8000",
    [term.length - 1, term.length + 1],
  );
  const scored = rows
    .map((r) => ({ t: r.term, d: levenshtein(term, r.term) }))
    .filter((r) => r.d <= (term.length > 6 ? 2 : 1))
    .sort((a, b) => a.d - b.d)
    .slice(0, max);
  return scored.map((s) => s.t);
}

export async function didYouMean(terms: string[]): Promise<string | undefined> {
  for (const t of terms) {
    const near = await nearestTerms(t, 1);
    if (near.length) return near[0];
  }
  return undefined;
}

/** Autocomplete: terms from the index + file titles, prefix matched. */
export async function suggest(prefixRaw: string, limit = 8) {
  const prefix = normalizeArabic(prefixRaw).trim();
  if (prefix.length < 1) return { terms: [] as string[], files: [] as { id: string; titleAr: string; titleEn: string; section: string }[] };
  const p = `${escapeLike(prefix)}%`;
  const terms = await all<{ term: string; c: number }>(
    `SELECT term, COUNT(*) AS c FROM page_terms WHERE term LIKE ? ESCAPE '\\' GROUP BY term ORDER BY c DESC LIMIT ?`,
    [p, limit],
  );
  const files = await all<{ id: string; title_ar: string; title_en: string; slug: string }>(
    `SELECT DISTINCT f.id, f.title_ar, f.title_en, s.slug FROM files f JOIN sections s ON s.id = f.section_id
     WHERE (f.title_ar LIKE ? OR f.title_en LIKE ?) AND f.visibility = 'published' LIMIT ?`,
    [`%${prefixRaw}%`, `%${prefixRaw}%`, 5],
  );
  return {
    terms: terms.map((t) => t.term),
    files: files.map((f) => ({ id: f.id, titleAr: f.title_ar, titleEn: f.title_en, section: f.slug })),
  };
}

export async function logSearch(query: string, resultCount: number) {
  if (!query.trim()) return;
  try {
    await run(
      "INSERT INTO analytics_events (kind, query, result_count, created_at) VALUES ('search', ?, ?, ?)",
      [query.trim().slice(0, 200), resultCount, new Date().toISOString()],
    );
  } catch {
    /* ignore */
  }
}

export async function topQueries(limit = 10) {
  return all<{ query: string; searches: number; avg_results: number }>(
    `SELECT query, COUNT(*) AS searches, ROUND(AVG(COALESCE(result_count,0)),1) AS avg_results
     FROM analytics_events WHERE kind = 'search' AND query IS NOT NULL
     GROUP BY query ORDER BY searches DESC LIMIT ?`,
    [limit],
  );
}

export async function zeroResultQueries(limit = 10) {
  return all<{ query: string; searches: number }>(
    `SELECT query, COUNT(*) AS searches FROM analytics_events
     WHERE kind = 'search' AND query IS NOT NULL AND COALESCE(result_count,0) = 0
     GROUP BY query ORDER BY searches DESC LIMIT ?`,
    [limit],
  );
}
