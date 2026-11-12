import { z } from "zod";
import { newId, nowIso, run } from "@/lib/db";
import { adminGuard, clean } from "@/lib/admin-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  type: z.enum(["news", "faq", "deadline", "clarification-link", "changelog"]),
  action: z.enum(["create", "update", "delete"]),
  id: z.string().max(40).optional(),
  payload: z.record(z.string().max(4000)).default({}),
});

export async function POST(req: Request) {
  const denied = await adminGuard();
  if (denied) return denied;
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "invalid" }, { status: 400 });
  const { type, action, id, payload } = parsed.data;
  const p = (key: string, max = 1000) => clean(payload[key], max);

  if (type === "news") {
    if (action === "create") {
      await run(
        "INSERT INTO news (id, title_ar, title_en, body_ar, body_en, kind, link, published_at, is_pinned, created_at) VALUES (?,?,?,?,?,?,?,?,?,?)",
        [newId("n"), p("titleAr", 200), p("titleEn", 200), p("bodyAr", 2000), p("bodyEn", 2000), p("kind", 20) || "news", p("link", 300), p("publishedAt", 40) || nowIso(), payload.isPinned ? 1 : 0, nowIso()],
      );
    } else if (action === "update" && id) {
      await run(
        "UPDATE news SET title_ar=?, title_en=?, body_ar=?, body_en=?, kind=?, link=?, published_at=?, is_pinned=? WHERE id=?",
        [p("titleAr", 200), p("titleEn", 200), p("bodyAr", 2000), p("bodyEn", 2000), p("kind", 20) || "news", p("link", 300), p("publishedAt", 40) || nowIso(), payload.isPinned ? 1 : 0, id],
      );
    } else if (action === "delete" && id) {
      await run("DELETE FROM news WHERE id = ?", [id]);
    }
    return Response.json({ ok: true });
  }

  if (type === "faq") {
    if (action === "create") {
      await run("INSERT INTO faqs (id, question_ar, question_en, answer_ar, answer_en, sort_order) VALUES (?,?,?,?,?,?)", [
        newId("q"),
        p("questionAr", 300),
        p("questionEn", 300),
        p("answerAr", 2000),
        p("answerEn", 2000),
        Number(payload.sortOrder) || 0,
      ]);
    } else if (action === "update" && id) {
      await run("UPDATE faqs SET question_ar=?, question_en=?, answer_ar=?, answer_en=?, sort_order=? WHERE id=?", [
        p("questionAr", 300),
        p("questionEn", 300),
        p("answerAr", 2000),
        p("answerEn", 2000),
        Number(payload.sortOrder) || 0,
        id,
      ]);
    } else if (action === "delete" && id) {
      await run("DELETE FROM faqs WHERE id = ?", [id]);
    }
    return Response.json({ ok: true });
  }

  if (type === "deadline") {
    if (action === "create") {
      await run("INSERT INTO deadlines (id, title_ar, title_en, note_ar, note_en, kind, due_at, sort_order) VALUES (?,?,?,?,?,?,?,?)", [
        newId("d"),
        p("titleAr", 200),
        p("titleEn", 200),
        p("noteAr", 500),
        p("noteEn", 500),
        p("kind", 30) || "other",
        p("dueAt", 40),
        Number(payload.sortOrder) || 0,
      ]);
    } else if (action === "update" && id) {
      await run("UPDATE deadlines SET title_ar=?, title_en=?, note_ar=?, note_en=?, kind=?, due_at=?, sort_order=? WHERE id=?", [
        p("titleAr", 200),
        p("titleEn", 200),
        p("noteAr", 500),
        p("noteEn", 500),
        p("kind", 30) || "other",
        p("dueAt", 40),
        Number(payload.sortOrder) || 0,
        id,
      ]);
    } else if (action === "delete" && id) {
      await run("DELETE FROM deadlines WHERE id = ?", [id]);
    }
    return Response.json({ ok: true });
  }

  if (type === "clarification-link") {
    if (action === "create") {
      await run("INSERT INTO clarification_links (id, file_id, target_file_id, target_page, note) VALUES (?,?,?,?,?)", [
        newId("l"),
        p("fileId", 40),
        p("targetFileId", 40),
        Number(payload.targetPage) || 1,
        p("note", 300),
      ]);
    } else if (action === "delete" && id) {
      await run("DELETE FROM clarification_links WHERE id = ?", [id]);
    }
    return Response.json({ ok: true });
  }

  if (type === "changelog" && action === "create") {
    await run(
      "INSERT INTO changelog_entries (id, file_id, kind, title_ar, title_en, detail_ar, detail_en, version, created_at) VALUES (?,?,?,?,?,?,?,?,?)",
      [newId("cl"), p("fileId", 40) || null, p("kind", 20) || "note", p("titleAr", 300), p("titleEn", 300), p("detailAr", 1000), p("detailEn", 1000), Number(payload.version) || 1, nowIso()],
    );
    return Response.json({ ok: true });
  }

  return Response.json({ error: "unsupported" }, { status: 400 });
}
