import { z } from "zod";
import { nowIso, run } from "@/lib/db";
import { adminGuard } from "@/lib/admin-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  id: z.string().max(40),
  pinned: z.union([z.boolean(), z.literal(0), z.literal(1)]).optional(),
  importance: z.enum(["essential", "important", "reference"]).optional(),
  visibility: z.enum(["published", "hidden", "scheduled"]).optional(),
  sectionId: z.string().max(40).optional(),
  categoryId: z.string().max(40).nullable().optional(),
});

export async function POST(req: Request) {
  const denied = await adminGuard();
  if (denied) return denied;
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "invalid" }, { status: 400 });
  const { id, ...patch } = parsed.data;

  if (patch.pinned !== undefined) {
    const pinned = patch.pinned === true || patch.pinned === 1 ? 1 : 0;
    await run("UPDATE files SET pinned = ?, updated_at = ? WHERE id = ?", [pinned, nowIso(), id]);
  }
  if (patch.importance !== undefined) await run("UPDATE files SET importance = ?, updated_at = ? WHERE id = ?", [patch.importance, nowIso(), id]);
  if (patch.visibility !== undefined) await run("UPDATE files SET visibility = ?, updated_at = ? WHERE id = ?", [patch.visibility, nowIso(), id]);
  if (patch.sectionId) await run("UPDATE files SET section_id = ?, category_id = NULL WHERE id = ?", [patch.sectionId, id]);
  if (patch.categoryId !== undefined) await run("UPDATE files SET category_id = ? WHERE id = ?", [patch.categoryId, id]);

  return Response.json({ ok: true });
}
