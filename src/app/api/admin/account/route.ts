import { z } from "zod";
import { adminGuard } from "@/lib/admin-api";
import { getAdminByUsername, updateAdminPassword, verifyPassword } from "@/lib/auth";
import { one } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({ current: z.string().max(200), next: z.string().min(10).max(200) });

export async function POST(req: Request) {
  const denied = await adminGuard();
  if (denied) return denied;
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "invalid" }, { status: 400 });

  const me = await one<{ id: string; username: string }>("SELECT id, username FROM admin_users LIMIT 1");
  if (!me) return Response.json({ error: "no-admin" }, { status: 400 });
  const rec = await getAdminByUsername(me.username);
  if (!rec || !(await verifyPassword(parsed.data.current, rec.password_hash))) {
    return Response.json({ error: "wrong-password" }, { status: 401 });
  }
  await updateAdminPassword(me.id, parsed.data.next);
  return Response.json({ ok: true });
}
