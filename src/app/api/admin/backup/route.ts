import { requireAdmin } from "@/lib/auth";
import { all } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TABLES = [
  "sections", "categories", "files", "file_versions", "pages_text", "pages_history",
  "page_terms", "file_terms", "clarification_links", "news", "faqs", "deadlines",
  "changelog_entries", "glossary", "analytics_events", "inbox_messages", "settings",
];

export async function GET() {
  const session = await requireAdmin();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const dump: Record<string, unknown> = { exportedAt: new Date().toISOString(), version: 1 };
  for (const table of TABLES) {
    dump[table] = await all(`SELECT * FROM ${table} LIMIT 20000`);
  }
  const body = JSON.stringify(dump, null, 2);
  return new Response(body, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="sccam-backup-${new Date().toISOString().slice(0, 10)}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
