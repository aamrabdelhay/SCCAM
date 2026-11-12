import { NextRequest } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { newId, nowIso, one, run } from "@/lib/db";
import { clientIpHash, sameOrigin } from "@/lib/auth";
import { getFile } from "@/lib/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  kind: z.enum(["question", "report"]).default("question"),
  reportKind: z.string().max(40).optional(),
  fileId: z.string().max(64).optional(),
  pageNo: z.number().int().min(1).max(5000).optional(),
  name: z.string().max(80).optional(),
  email: z.string().max(160).optional(),
  message: z.string().min(5).max(2000),
});

export async function POST(req: NextRequest) {
  const hdrs = await headers();
  if (!sameOrigin(hdrs)) return new Response("Bad origin", { status: 403 });

  const ip = clientIpHash(hdrs);
  // 5 messages per hour per IP — cheap, DB-backed throttle
  const recent = await one<{ c: number }>(
    "SELECT COUNT(*) AS c FROM analytics_events WHERE kind = 'inbox' AND query = ? AND created_at >= ?",
    [ip, new Date(Date.now() - 3600_000).toISOString()],
  );
  if (Number(recent?.c ?? 0) >= 5) {
    return Response.json({ error: "Too many messages, try later" }, { status: 429 });
  }

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = schema.safeParse(payload);
  if (!parsed.success) return Response.json({ error: "Invalid input" }, { status: 400 });
  const data = parsed.data;

  if (data.fileId) {
    const file = await getFile(data.fileId);
    if (!file) return Response.json({ error: "Unknown file" }, { status: 400 });
  }

  const message = [data.reportKind ? `[${data.reportKind}] ` : "", data.message].join("").slice(0, 2200);
  await run(
    `INSERT INTO inbox_messages (id, kind, file_id, page_no, name, email, message, status, created_at)
     VALUES (?,?,?,?,?,?,?, 'open', ?)`,
    [newId("msg"), data.kind, data.fileId ?? null, data.pageNo ?? null, (data.name ?? "").slice(0, 80), (data.email ?? "").slice(0, 160), message, nowIso()],
  );
  await run(
    "INSERT INTO analytics_events (kind, query, created_at) VALUES ('inbox', ?, ?)",
    [ip, nowIso()],
  );
  return Response.json({ ok: true });
}
