/**
 * Database schema (SQLite / libSQL).
 * Applied idempotently at boot (`ensureSchema`) and by `npm run db:setup`.
 *
 * Local dev  : file:./data/app.db   (no external service needed)
 * Production : Turso (libsql://...) — free tier friendly
 */
export const SCHEMA_SQL: string[] = [
  `PRAGMA foreign_keys = ON;`,

  `CREATE TABLE IF NOT EXISTS sections (
    id           TEXT PRIMARY KEY,
    slug         TEXT NOT NULL UNIQUE,
    name_ar      TEXT NOT NULL,
    name_en      TEXT NOT NULL,
    description_ar TEXT NOT NULL DEFAULT '',
    description_en TEXT NOT NULL DEFAULT '',
    accent       TEXT NOT NULL DEFAULT '#0B3D2E',
    icon         TEXT NOT NULL DEFAULT 'scale',
    sort_order   INTEGER NOT NULL DEFAULT 0,
    created_at   TEXT NOT NULL
  );`,

  `CREATE TABLE IF NOT EXISTS categories (
    id           TEXT PRIMARY KEY,
    section_id   TEXT NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
    slug         TEXT NOT NULL,
    name_ar      TEXT NOT NULL,
    name_en      TEXT NOT NULL,
    sort_order   INTEGER NOT NULL DEFAULT 0,
    created_at   TEXT NOT NULL,
    UNIQUE(section_id, slug)
  );`,

  `CREATE TABLE IF NOT EXISTS files (
    id            TEXT PRIMARY KEY,
    title_ar      TEXT NOT NULL,
    title_en      TEXT NOT NULL DEFAULT '',
    description_ar TEXT NOT NULL DEFAULT '',
    description_en TEXT NOT NULL DEFAULT '',
    section_id    TEXT NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
    category_id   TEXT REFERENCES categories(id) ON DELETE SET NULL,
    tags          TEXT NOT NULL DEFAULT '',
    edition_year  TEXT NOT NULL DEFAULT '',
    doc_date      TEXT,
    importance    TEXT NOT NULL DEFAULT 'reference',
    pinned        INTEGER NOT NULL DEFAULT 0,
    sort_order    INTEGER NOT NULL DEFAULT 0,
    visibility    TEXT NOT NULL DEFAULT 'published',
    publish_at    TEXT,
    download_allowed INTEGER NOT NULL DEFAULT 1,
    print_allowed INTEGER NOT NULL DEFAULT 1,
    source_note   TEXT NOT NULL DEFAULT '',
    file_password_hash TEXT,
    mime          TEXT NOT NULL DEFAULT 'application/pdf',
    size_bytes    INTEGER NOT NULL DEFAULT 0,
    page_count    INTEGER NOT NULL DEFAULT 0,
    storage_key   TEXT NOT NULL DEFAULT '',
    current_version INTEGER NOT NULL DEFAULT 1,
    text_status   TEXT NOT NULL DEFAULT 'pending',
    text_error    TEXT NOT NULL DEFAULT '',
    ocr_pages     INTEGER NOT NULL DEFAULT 0,
    views         INTEGER NOT NULL DEFAULT 0,
    downloads     INTEGER NOT NULL DEFAULT 0,
    created_at    TEXT NOT NULL,
    updated_at    TEXT NOT NULL
  );`,

  `CREATE INDEX IF NOT EXISTS idx_files_section ON files(section_id, sort_order);`,
  `CREATE INDEX IF NOT EXISTS idx_files_category ON files(category_id, sort_order);`,
  `CREATE INDEX IF NOT EXISTS idx_files_visibility ON files(visibility, publish_at);`,

  `CREATE TABLE IF NOT EXISTS file_versions (
    id          TEXT PRIMARY KEY,
    file_id     TEXT NOT NULL REFERENCES files(id) ON DELETE CASCADE,
    version     INTEGER NOT NULL,
    storage_key TEXT NOT NULL,
    mime        TEXT NOT NULL,
    size_bytes  INTEGER NOT NULL DEFAULT 0,
    page_count  INTEGER NOT NULL DEFAULT 0,
    changelog   TEXT NOT NULL DEFAULT '',
    text_status TEXT NOT NULL DEFAULT 'pending',
    created_at  TEXT NOT NULL,
    UNIQUE(file_id, version)
  );`,

  `CREATE TABLE IF NOT EXISTS pages_text (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    file_id    TEXT NOT NULL REFERENCES files(id) ON DELETE CASCADE,
    version_id TEXT NOT NULL,
    page_no    INTEGER NOT NULL,
    text       TEXT NOT NULL DEFAULT '',
    text_norm  TEXT NOT NULL DEFAULT '',
    source     TEXT NOT NULL DEFAULT 'text',
    edited     INTEGER NOT NULL DEFAULT 0,
    UNIQUE(file_id, page_no)
  );`,
  `CREATE INDEX IF NOT EXISTS idx_pages_file ON pages_text(file_id, page_no);`,

  `CREATE TABLE IF NOT EXISTS pages_history (
    id       INTEGER PRIMARY KEY AUTOINCREMENT,
    file_id  TEXT NOT NULL,
    version  INTEGER NOT NULL,
    page_no  INTEGER NOT NULL,
    text     TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL,
    UNIQUE(file_id, version, page_no)
  );`,

  `CREATE TABLE IF NOT EXISTS page_terms (
    file_id TEXT NOT NULL,
    page_no INTEGER NOT NULL,
    term    TEXT NOT NULL,
    tf      INTEGER NOT NULL DEFAULT 1,
    PRIMARY KEY (file_id, page_no, term)
  );`,
  `CREATE INDEX IF NOT EXISTS idx_terms_term ON page_terms(term);`,

  `CREATE TABLE IF NOT EXISTS file_terms (
    file_id TEXT NOT NULL,
    term    TEXT NOT NULL,
    field   TEXT NOT NULL DEFAULT 'title',
    PRIMARY KEY (file_id, term, field)
  );`,
  `CREATE INDEX IF NOT EXISTS idx_file_terms_term ON file_terms(term);`,

  `CREATE TABLE IF NOT EXISTS clarification_links (
    id          TEXT PRIMARY KEY,
    file_id     TEXT NOT NULL REFERENCES files(id) ON DELETE CASCADE,
    target_file_id TEXT NOT NULL,
    target_page INTEGER NOT NULL DEFAULT 1,
    note        TEXT NOT NULL DEFAULT ''
  );`,

  `CREATE TABLE IF NOT EXISTS news (
    id         TEXT PRIMARY KEY,
    title_ar   TEXT NOT NULL,
    title_en   TEXT NOT NULL DEFAULT '',
    body_ar    TEXT NOT NULL DEFAULT '',
    body_en    TEXT NOT NULL DEFAULT '',
    kind       TEXT NOT NULL DEFAULT 'news',
    link       TEXT NOT NULL DEFAULT '',
    published_at TEXT NOT NULL,
    is_pinned  INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
  );`,

  `CREATE TABLE IF NOT EXISTS faqs (
    id          TEXT PRIMARY KEY,
    question_ar TEXT NOT NULL,
    question_en TEXT NOT NULL DEFAULT '',
    answer_ar   TEXT NOT NULL DEFAULT '',
    answer_en   TEXT NOT NULL DEFAULT '',
    sort_order  INTEGER NOT NULL DEFAULT 0
  );`,

  `CREATE TABLE IF NOT EXISTS deadlines (
    id        TEXT PRIMARY KEY,
    title_ar  TEXT NOT NULL,
    title_en  TEXT NOT NULL DEFAULT '',
    note_ar   TEXT NOT NULL DEFAULT '',
    note_en   TEXT NOT NULL DEFAULT '',
    kind      TEXT NOT NULL DEFAULT 'other',
    due_at    TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0
  );`,

  `CREATE TABLE IF NOT EXISTS changelog_entries (
    id         TEXT PRIMARY KEY,
    file_id    TEXT,
    kind       TEXT NOT NULL DEFAULT 'update',
    title_ar   TEXT NOT NULL,
    title_en   TEXT NOT NULL DEFAULT '',
    detail_ar  TEXT NOT NULL DEFAULT '',
    detail_en  TEXT NOT NULL DEFAULT '',
    version    INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL
  );`,

  `CREATE TABLE IF NOT EXISTS analytics_events (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    kind      TEXT NOT NULL,
    file_id   TEXT,
    page_no   INTEGER,
    query     TEXT,
    result_count INTEGER,
    created_at TEXT NOT NULL
  );`,
  `CREATE INDEX IF NOT EXISTS idx_analytics_kind ON analytics_events(kind, created_at);`,

  `CREATE TABLE IF NOT EXISTS inbox_messages (
    id         TEXT PRIMARY KEY,
    kind       TEXT NOT NULL DEFAULT 'question',
    file_id    TEXT,
    page_no    INTEGER,
    name       TEXT NOT NULL DEFAULT '',
    email      TEXT NOT NULL DEFAULT '',
    message    TEXT NOT NULL,
    status     TEXT NOT NULL DEFAULT 'open',
    created_at TEXT NOT NULL
  );`,

  `CREATE TABLE IF NOT EXISTS glossary (
    id          TEXT PRIMARY KEY,
    term_ar     TEXT NOT NULL,
    term_en     TEXT NOT NULL,
    def_ar      TEXT NOT NULL DEFAULT '',
    def_en      TEXT NOT NULL DEFAULT '',
    sort_order  INTEGER NOT NULL DEFAULT 0
  );`,

  `CREATE TABLE IF NOT EXISTS settings (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );`,

  `CREATE TABLE IF NOT EXISTS admin_users (
    id            TEXT PRIMARY KEY,
    username      TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at    TEXT NOT NULL,
    updated_at    TEXT NOT NULL
  );`,

  `CREATE TABLE IF NOT EXISTS login_attempts (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    ip_hash   TEXT NOT NULL,
    ok        INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
  );`,
  `CREATE INDEX IF NOT EXISTS idx_login_ip ON login_attempts(ip_hash, created_at);`,
];
