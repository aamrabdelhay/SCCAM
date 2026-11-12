import { z } from "zod";
import { batch } from "@/lib/db";
import { adminGuard } from "@/lib/admin-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  items: z.array(z.object({ id: z.string().max(40), sortOrder: z.number().int().min(0).max(100000) })).max(500),
});

export async function POST(req: Request) {
  const denied = await adminGuard();
  if (denied) return denied;
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "invalid" }, { status: 400 });

  await batch(
    parsed.data.items.map((item) => ({
      sql: "UPDATE files SET sort_order = ? WHERE id = ?",
      args: [item.sortOrder, item.id],
    })),
  );
  return Response.json({ ok: true });
}
