import { z } from "zod";
import { headers } from "next/headers";
import {
  adminExists,
  clientIpHash,
  createSession,
  getAdminByUsername,
  rateLimit,
  recordLoginAttempt,
  sameOrigin,
  verifyPassword,
} from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({ username: z.string().min(1).max(64), password: z.string().min(1).max(200) });

export async function POST(req: Request) {
  const hdrs = await headers();
  if (!sameOrigin(hdrs)) return Response.json({ error: "origin" }, { status: 403 });
  if (!(await adminExists())) return Response.json({ error: "setup-required" }, { status: 409 });
  if (!process.env.AUTH_SECRET) {
    // Local/hobby deployments may rely on a generated DB secret; log a hint once.
    void 0;
  }

  const ip = clientIpHash(hdrs);
  const limit = await rateLimit(`login:${ip}`, 8, 15);
  if (!limit.allowed) {
    return Response.json({ error: "rate" }, { status: 429, headers: { "Retry-After": String(limit.retryIn) } });
  }

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return Response.json({ error: "bad-json" }, { status: 400 });
  }
  const parsed = schema.safeParse(payload);
  if (!parsed.success) return Response.json({ error: "invalid" }, { status: 400 });

  const admin = await getAdminByUsername(parsed.data.username);
  const ok = admin ? await verifyPassword(parsed.data.password, admin.password_hash) : false;
  await recordLoginAttempt(ip, ok);
  if (!admin || !ok) {
    await new Promise((r) => setTimeout(r, 350)); // constant-ish delay
    return Response.json({ error: "invalid-credentials" }, { status: 401 });
  }

  await createSession(admin.id);
  return Response.json({ ok: true });
}
