# SCCAM Moot Library · مكتبة المسابقة

An **unofficial** community library for the international commercial arbitration moot
([arabicmoot.org](https://arabicmoot.org)): the case file, rules and laws, books and
reference materials, full-text searchable, in Arabic and English.

> This project is not affiliated with, endorsed by, or connected to the organizers of the
> moot. No organizer logo or official imagery is used anywhere; the wordmark is original.
> The notice is rendered in the slim top banner and in the footer of every page.

---

## 1. Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 15 (App Router) + React 19 + TypeScript | Server components for all public pages, route handlers for the API, one-click Vercel deploy |
| Styling | Tailwind CSS 3.4 + CSS custom properties | Palette lives in `src/app/globals.css`; admin can override it at runtime |
| Database | libSQL / SQLite (`@libsql/client`) | Zero-config file DB locally, Turso free tier in production, FTS-friendly SQL |
| Storage | Local disk (dev) / Vercel Blob (prod) | Files are never public URLs — always streamed through an API route |
| PDF engine | `pdfjs-dist` (server extraction + client viewer) | No native binaries, works on serverless |
| Text extraction | pdf.js text layer, `mammoth` (DOCX), OCR hook (tesseract.js) | Extracted once at upload, never during a search |
| Auth | `bcryptjs` + HMAC-signed cookie | No third-party auth provider, no hardcoded password |
| Icons | `lucide-react` | Consistent, tree-shaken |
| Fonts | `@fontsource-variable/cairo`, `@fontsource-variable/inter` | Self-hosted woff2 (no CDN) so the PWA works offline and nothing is fetched from third parties |
| PWA | Hand-written service worker + manifest | Offline access to documents you already opened |

No paid APIs anywhere: search is a hand-rolled inverted index in SQLite.

---

## 2. Anatomy

```
src/
├─ app/
│  ├─ layout.tsx                  root layout: <html lang dir>, palette, header/footer, PWA
│  ├─ page.tsx                    home (hero, why-cards, sections, pinned, latest, news, FAQ)
│  ├─ globals.css                 design tokens + component classes (.btn .card .chip …)
│  ├─ case|laws|books/page.tsx     the three sections (thin wrappers around SectionPage)
│  ├─ file/[id]/page.tsx          PDF viewer page (+ /print, /versions)
│  ├─ search/page.tsx             global search results, filters, suggestions
│  ├─ archive|clarifications|changelog|glossary|contact|library|faq|offline/page.tsx
│  ├─ admin/
│  │  ├─ login/ setup/            password entry / first-run setup
│  │  └─ (dash)/                  dashboard, files, files/new, files/[id], taxonomy,
│  │                              content, analytics, inbox, settings
│  ├─ api/                        public + admin route handlers (see §5)
│  ├─ robots.ts  sitemap.ts  not-found.tsx
├─ components/                    shell, cards, viewer, search, library, admin/*
└─ lib/
   ├─ db.ts  schema.ts            client, helpers (all/one/run/batch), DDL
   ├─ queries.ts                  every read used by public pages (+ DEFAULT_SETTINGS)
   ├─ search.ts  search-query.ts  normalisation, inverted index, ranking, snippets
   ├─ extract.ts  process.ts      per-format text extraction → pages_text → page_terms
   ├─ storage.ts                  put/get/delete objects (disk or Vercel Blob)
   ├─ auth.ts  admin-api.ts       sessions, CSRF, admin guard
   ├─ i18n.ts                     **every** UI string, AR + EN
   ├─ format.ts  diff.ts  file-access.ts  client-store.ts  admin-client.ts
   └─ types.ts
scripts/
   ├─ db-setup.ts                 apply schema
   ├─ seed.ts                     demo content: 3 sections, 11 categories, 13 PDFs, news…
   ├─ copy-pdf-worker.mjs         copies the pdf.js worker into public/vendor
   └─ make-assets.mjs             regenerates the PWA icons + OG image
```

### Data model

| Table | Purpose |
|---|---|
| `sections` | The three top-level areas (`sort_order`, accent colour, icon, slug) |
| `categories` | Sub-categories per section (`sort_order`, bilingual names) |
| `files` | One row per document: bilingual titles, description, section/category, tags, edition year, importance, pinned, `sort_order`, visibility (`published`/`hidden`/`scheduled` + `publish_at`), `download_allowed`, `print_allowed`, `source_text`, `file_password_hash`, `current_version`, `page_count`, `text_status`, `views` |
| `file_versions` | Immutable history: version number, storage key, size, mime, changelog, uploader, timestamp |
| `pages_text` | Extracted text per page (`page_no`, `text`, `source` = text/ocr/manual, `edited`) |
| `page_terms` | Inverted index: `(term, page_id, tf)` — the only thing search reads |
| `pages_history` | Page text snapshots for older versions, used by the version diff |
| `view_events` | Per-file / per-page opens (analytics "most opened pages") |
| `search_queries` | Every query + result count (top and zero-result reports) |
| `news`, `faqs`, `deadlines`, `changelog`, `clarifications`, `glossary`, `inbox`, `settings`, `admin_users`, `analytics_events` | Content, contact form, settings key/value store, admin account, misc events |

### Key flows

**Upload → index.** Admin drops a PDF → `POST /api/admin/files` (multipart) → file row +
version row → bytes stored via `storage.ts` → `process.ts` extracts text with pdf.js
(falls back to OCR for image-only scans, or flags the file for manual transcription) →
`pages_text` rows are written → every page is tokenised (Arabic normalisation, stop words,
light stemming) into `page_terms`. Nothing is extracted at read time.

**Search.** `search-query.ts` normalises the query (diacritics, tatweel, alef/ya/ta-marbuta
unification, punctuation) and splits it into terms and quoted phrases. Terms are looked up in
`page_terms`; pages matching *all* terms win, then files where all terms appear on different
pages, then a loose OR fallback. Phrases are verified against the stored page text, snippets
are built around the earliest hit with highlight ranges, results are grouped per file with a
match count, and an empty result set triggers a "did you mean" suggestion from the term index.

**Serve.** `/api/files/[id]/stream` checks visibility, schedule and the per-file password
cookie, then honours `Range` headers (206) so the viewer paints page 1 from the first bytes.
`/api/files/[id]/pages.pdf` builds a PDF subset for the "download selection" feature.

**Viewer.** `components/file/FileViewer.tsx` lazy-renders pages with pdf.js (IntersectionObserver),
text layer for selection, in-file search with counter and next/prev, thumbnails, zoom/fit,
jump-to-page, fullscreen, night mode, remember-last-page, keyboard shortcuts, deep links
(`/file/{id}?page=14&q=term`), and the floating selection toolbar (copy, WhatsApp, copy with
citation). Everything else — share panel with QR, citation helper, page-range tool, notes —
lives in `components/file/*` and reads the current page from a `sccam:pagechange` event.

**Admin.** Footer-only entry → `/admin` → first run redirects to `/admin/setup` (creates the
single password with bcrypt, cost 11, only while `admin_users` is empty) → session cookie
(HttpOnly, SameSite=Lax, 8 h, signed with `AUTH_SECRET`). Every mutating admin call goes
through `adminGuard()`: session + double-submit CSRF token + same-origin check. Login and
setup are rate-limited per hashed IP.

---

## 3. Run locally

```bash
npm install          # also copies the pdf.js worker into public/vendor
cp .env.example .env.local     # optional: set AUTH_SECRET (otherwise generated + stored in DB)
npm run db:setup     # creates ./data/app.db from src/lib/schema.ts
npm run db:seed      # 3 sections, 11 categories, 13 sample PDFs (all text-extracted), news, FAQ…
npm run dev          # http://localhost:3000  (Arabic/RTL by default)
```

Then open `/admin` → you are sent to `/admin/setup` → choose a password (≥ 10 chars).
That password is stored only as a bcrypt hash; change it later in *Settings → Password*.

Useful scripts:

```bash
npm run build && npm start   # production build
npm run db:reset             # delete the local DB and re-seed from scratch
```

Seeded demo content includes a password-protected file (`f_locked`, password `sccam`) to
exercise the unlock flow. Sample PDFs are generated with `pdf-lib`, so their body text is
Latin (pdf-lib's built-in fonts cannot embed Arabic); all *interface*, titles and metadata are
bilingual, and Arabic search works on any real Arabic PDF you upload.

---

## 4. Deploy on Vercel

1. **Push the repo** and import it in Vercel (framework preset: Next.js, no build tweaks).
2. **Database** — create a free Turso database (the local file DB does not survive
   serverless deployments):
   ```bash
   turso db create sccam
   turso db show sccam --url          # -> DATABASE_URL
   turso db tokens create sccam       # -> DATABASE_AUTH_TOKEN
   ```
   Serverless functions cannot write to the local filesystem, so Turso (libSQL) is the
   production database. Apply the schema once with the same env vars:
   ```bash
   DATABASE_URL=… DATABASE_AUTH_TOKEN=… npm run db:setup
   ```
3. **Storage** — in Vercel create a Blob store and copy `BLOB_READ_WRITE_TOKEN`.
   With the token present, `storage.ts` stores new uploads in Blob and streams them back
   with the same range/password logic; without it, uploads go to `./data/uploads`.
4. **Environment variables** (Project → Settings → Environment Variables):

   | Variable | Required | Notes |
   |---|---|---|
   | `DATABASE_URL` | production | `libsql://…` (Turso). Omit locally → `./data/app.db` |
   | `DATABASE_AUTH_TOKEN` | production | Turso token |
   | `AUTH_SECRET` | yes | 32+ random chars (`openssl rand -hex 32`); signs session + file-access cookies |
   | `NEXT_PUBLIC_SITE_URL` | yes | `https://your-domain` — used in citations, QR codes, OG tags, sitemap |
   | `BLOB_READ_WRITE_TOKEN` | production | Vercel Blob token; omit to use local disk |
   | `LOCAL_UPLOAD_DIR` | no | default `./data/uploads` |
   | `OCR_ENABLED` | no | `true` to attempt OCR on scanned pages when tesseract is available |

5. Deploy, open `/admin` on the deployed URL, and complete the first-run setup immediately.
6. Optional: point a custom domain, then re-deploy so `NEXT_PUBLIC_SITE_URL` is baked into
   the OG tags and sitemap.

**Backups:** *Admin → Settings → Export JSON* returns every table (`/api/admin/backup`).
Documents themselves live in Blob/local storage; back that bucket up separately.

---

## 5. API surface (short)

```
GET  /api/files/[id]/stream?page=…        range-aware PDF bytes (visibility, schedule, password)
GET  /api/files/[id]/text?pages=1,3-4     extracted page text (for reading mode / search-in-text)
GET  /api/files/[id]/download             attachment, only if download_allowed
GET  /api/files/[id]/pages.pdf?pages=…    PDF subset of selected pages
POST /api/files/[id]/unlock               per-file password → fa_<id12> cookie (12 h)
POST /api/files/[id]/view                 view + page analytics
GET  /api/search?q=&section=&category=&importance=&year=
GET  /api/search/suggest?q=
GET  /api/qr?data=…                       SVG QR code (generated locally)
GET  /api/files/lookup?id=…               title/section/page for the citation helper
POST /api/inbox                           contact / report / Ask-admin (throttled)
GET  /api/deadlines/[id]/ics              calendar file
--- admin (session + CSRF) -------------------------------------------------
POST /api/admin/setup | login | logout | account
POST /api/admin/files                     create + upload (multipart)
POST /api/admin/files/[id]                new version (changelog) / edit metadata
DEL  /api/admin/files/[id]
POST /api/admin/files/order               drag-and-drop ordering (files, categories, sections)
POST /api/admin/files/bulk                bulk move / importance / publish / hide / delete
POST /api/admin/files/quick               single-toggle patch
POST /api/admin/files/[id]/reprocess      retry extraction
GET  /api/admin/files/[id]/pages          page text for the editor
GET  /api/admin/pages?fileId=&page=       single page text (editor)
POST /api/admin/taxonomy | content        sections, categories, news, FAQ, deadlines, changelog, clarifications
POST /api/admin/settings                  site name, palette, socials, banner, notice, password
GET  /api/admin/backup                    full JSON export
GET  /api/admin/inbox                     messages
```

---

## 6. Notes & deliberate choices

- **Unofficial by design** — the notice is inside `TopBanner` and `SiteFooter`, both rendered
  by the root layout, so it cannot be missed on any route.
- **Arabic first** — the language is a cookie (`lang`), Arabic is the default, and the root
  layout sets `dir="rtl"`. Every string is in `src/lib/i18n.ts`; there is no inline copy.
- **Ordering** — `sort_order` is the garden path: admin drag-and-drop writes integers, the
  public list defaults to that order with pinned files first, and visitors can re-sort.
- **DOCX/PPTX** — DOCX text is extracted (mammoth) and pages are chunked; PPTX and scanned
  images can be uploaded and their text entered/OCRed per page by the admin. Full
  DOCX→PDF conversion needs LibreOffice, which does not exist on serverless functions, so it
  is intentionally not faked.
- **OCR** is an optional hook: install `tesseract.js` (+ `@napi-rs/canvas`) and set
  `OCR_ENABLED=true`; otherwise scanned pages are marked `text_status = needs_review` and the
  admin can paste the transcription in *File editor → Page text*.
- **Rate limiting** is per-instance and stored in SQLite (login/setup attempts, inbox
  submissions). It is intentionally dependency-free; for multi-region deployments put
  Vercel's firewall or an Upstash limiter in front.
- **Service worker** caches the app shell and opened documents, never `/admin` or `/api`.
  Range requests bypass the cache so the viewer stays correct.
