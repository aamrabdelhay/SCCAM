import { NextRequest } from "next/server";
import { headers } from "next/headers";
import { getFile } from "@/lib/queries";
import { issueFileAccess, verifyFilePassword } from "@/lib/file-access";
import { clientIpHash, rateLimit, recordLoginAttempt, sameOrigin } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const hdrs = await headers();
  if (!sameOrigin(hdrs)) return new Response("Bad origin", { status: 403 });

  const ip = clientIpHash(hdrs);
  const limit = await rateLimit(`file:${ip}`, 10, 15);
  if (!limit.allowed) {
    return Response.json({ error: "Too many attempts" }, { status: 429, headers: { "Retry-After": String(limit.retryIn) } });
  }

  const file = await getFile(id);
  if (!file) return new Response("Not found", { status: 404 });
  if (!file.file_password_hash) {
    await issueFileAccess(id);
    return Response.json({ ok: true });
  }

  let body: { password?: string };
  try {
    body = (await req.json()) as { password?: string };
  } catch {
    return Response.json({ error: "Invalid body" }, { status: 400 });
  }
  const password = (body.password ?? "").slice(0, 200);
  const ok = password.length > 0 && (await verifyFilePassword(id, password));
  await recordLoginAttempt(`file:${ip}`, ok);
  if (!ok) return Response.json({ error: "Wrong password" }, { status: 401 });

  await issueFileAccess(id);
  return Response.json({ ok: true });
}
