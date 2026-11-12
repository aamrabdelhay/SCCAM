import { adminGuard } from "@/lib/admin-api";
import { reprocessFile } from "@/lib/process";
import { one, run } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const denied = await adminGuard();
  if (denied) return denied;
  const { id } = await ctx.params;
  const file = await one<{ id: string }>("SELECT id FROM files WHERE id = ?", [id]);
  if (!file) return Response.json({ error: "not-found" }, { status: 404 });
  try {
    const result = await reprocessFile(id);
    return Response.json({ ok: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "failed";
    await run("UPDATE files SET text_status = 'failed', text_error = ? WHERE id = ?", [message.slice(0, 300), id]);
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}
