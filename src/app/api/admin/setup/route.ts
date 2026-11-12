import { z } from "zod";
import { headers } from "next/headers";
import { adminExists, createAdmin, createSession, clientIpHash, rateLimit, recordLoginAttempt } from "@/lib/auth";
import { sameOrigin } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  username: z.string().min(3).max(40).regex(/^[a-zA-Z0-9._-]+$/),
  password: z.string().min(10).max(200),
});

export async function POST(req: Request) {
  const hdrs = await headers();
  if (!sameOrigin(hdrs)) return Response.json({ error: "origin" }, { status: 403 });
  if (await adminExists()) return Response.json({ error: "already-configured" }, { status: 409 });

  const ip = clientIpHash(hdrs);
  const limit = await rateLimit(`setup:${ip}`, 5, 30);
  if (!limit.allowed) return Response.json({ error: "rate" }, { status: 429, headers: { "Retry-After": String(limit.retryIn) } });

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return Response.json({ error: "bad-json" }, { status: 400 });
  }
  const parsed = schema.safeParse(payload);
  if (!parsed.success) return Response.json({ error: "invalid" }, { status: 400 });

  const id = await createAdmin(parsed.data.username, parsed.data.password);
  await createSession(id);
  await recordLoginAttempt(ip, true);
  return Response.json({ ok: true });
}
