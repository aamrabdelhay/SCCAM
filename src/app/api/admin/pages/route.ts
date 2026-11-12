import { z } from "zod";
import { adminGuard } from "@/lib/admin-api";
import { updatePageText } from "@/lib/process";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  fileId: z.string().max(40),
  pageNo: z.number().int().min(1).max(5000),
  text: z.string().max(20000),
});

export async function POST(req: Request) {
  const denied = await adminGuard();
  if (denied) return denied;
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "invalid" }, { status: 400 });
  await updatePageText(parsed.data.fileId, parsed.data.pageNo, parsed.data.text);
  return Response.json({ ok: true });
}
