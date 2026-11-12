import { z } from "zod";
import { run } from "@/lib/db";
import { adminGuard } from "@/lib/admin-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({ id: z.string().max(40), status: z.enum(["open", "resolved", "deleted"]) });

export async function POST(req: Request) {
  const denied = await adminGuard();
  if (denied) return denied;
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "invalid" }, { status: 400 });
  if (parsed.data.status === "deleted") {
    await run("DELETE FROM inbox_messages WHERE id = ?", [parsed.data.id]);
  } else {
    await run("UPDATE inbox_messages SET status = ? WHERE id = ?", [parsed.data.status, parsed.data.id]);
  }
  return Response.json({ ok: true });
}
