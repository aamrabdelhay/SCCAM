import { z } from "zod";
import { batch, run } from "@/lib/db";
import { adminGuard } from "@/lib/admin-api";
import { deleteObject } from "@/lib/storage";
import { addChangelog } from "@/lib/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  ids: z.array(z.string().max(40)).min(1).max(200),
  action: z.enum(["section", "importance", "publish", "hide", "delete"]),
  value: z.string().max(40).optional(),
});

export async function POST(req: Request) {
  const denied = await adminGuard();
  if (denied) return denied;
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "invalid" }, { status: 400 });
  const { ids, action, value } = parsed.data;

  if (action === "delete") {
    const { all } = await import("@/lib/db");
    const keys = await all<{ storage_key: string }>(
      `SELECT storage_key FROM file_versions WHERE file_id IN (${ids.map(() => "?").join(",")})
       UNION SELECT storage_key FROM files WHERE id IN (${ids.map(() => "?").join(",")})`,
      [...ids, ...ids],
    );
    for (const k of keys) if (k.storage_key) await deleteObject(k.storage_key).catch(() => undefined);
    await run(`DELETE FROM files WHERE id IN (${ids.map(() => "?").join(",")})`, ids);
    await addChangelog({
      kind: "remove",
      titleAr: `حذف ${ids.length} ملف/ملفات`,
      titleEn: `${ids.length} file(s) removed`,
    });
    return Response.json({ ok: true, deleted: ids.length });
  }

  const placeholders = ids.map(() => "?").join(",");
  if (action === "section" && value) {
    await run(`UPDATE files SET section_id = ?, category_id = NULL WHERE id IN (${placeholders})`, [value, ...ids]);
  } else if (action === "importance" && value) {
    await run(`UPDATE files SET importance = ? WHERE id IN (${placeholders})`, [value, ...ids]);
  } else if (action === "publish") {
    await run(`UPDATE files SET visibility = 'published', publish_at = NULL WHERE id IN (${placeholders})`, ids);
  } else if (action === "hide") {
    await run(`UPDATE files SET visibility = 'hidden' WHERE id IN (${placeholders})`, ids);
  }
  await batch([]);
  return Response.json({ ok: true });
}
