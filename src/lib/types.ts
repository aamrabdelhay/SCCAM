export type Lang = "ar" | "en";

export type SectionRow = {
  id: string;
  slug: string;
  name_ar: string;
  name_en: string;
  description_ar: string;
  description_en: string;
  accent: string;
  icon: string;
  sort_order: number;
  created_at: string;
};

export type CategoryRow = {
  id: string;
  section_id: string;
  slug: string;
  name_ar: string;
  name_en: string;
  sort_order: number;
  created_at: string;
};

export type FileRow = {
  id: string;
  title_ar: string;
  title_en: string;
  description_ar: string;
  description_en: string;
  section_id: string;
  category_id: string | null;
  tags: string;
  edition_year: string;
  doc_date: string | null;
  importance: Importance;
  pinned: number;
  sort_order: number;
  visibility: "published" | "hidden" | "scheduled";
  publish_at: string | null;
  download_allowed: number;
  print_allowed: number;
  source_note: string;
  file_password_hash: string | null;
  mime: string;
  size_bytes: number;
  page_count: number;
  storage_key: string;
  current_version: number;
  text_status: TextStatus;
  text_error: string;
  ocr_pages: number;
  views: number;
  downloads: number;
  created_at: string;
  updated_at: string;
};

export type FileWithMeta = FileRow & {
  section_slug: string;
  section_name_ar: string;
  section_name_en: string;
  section_accent: string;
  category_slug: string | null;
  category_name_ar: string | null;
  category_name_en: string | null;
};

export type Importance = "essential" | "important" | "reference";
export type TextStatus = "pending" | "processing" | "extracted" | "ocr" | "needs_ocr" | "edited" | "failed";

export type PageTextRow = {
  id: number;
  file_id: string;
  version_id: string;
  page_no: number;
  text: string;
  text_norm: string;
  source: string;
  edited: number;
};

export type NewsRow = {
  id: string;
  title_ar: string;
  title_en: string;
  body_ar: string;
  body_en: string;
  kind: string;
  link: string;
  published_at: string;
  is_pinned: number;
  created_at: string;
};

export type FaqRow = {
  id: string;
  question_ar: string;
  question_en: string;
  answer_ar: string;
  answer_en: string;
  sort_order: number;
};

export type DeadlineRow = {
  id: string;
  title_ar: string;
  title_en: string;
  note_ar: string;
  note_en: string;
  kind: string;
  due_at: string;
  sort_order: number;
};

export type ChangelogRow = {
  id: string;
  file_id: string | null;
  kind: string;
  title_ar: string;
  title_en: string;
  detail_ar: string;
  detail_en: string;
  version: number;
  created_at: string;
};

export type SettingsMap = Record<string, string>;

export type SortKey = "default" | "newest" | "updated" | "views" | "az";
