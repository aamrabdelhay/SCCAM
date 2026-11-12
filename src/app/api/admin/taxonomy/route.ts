import { z } from "zod";
import { batch, newId, nowIso, run } from "@/lib/db";
import { adminGuard, clean } from "@/lib/admin-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("section-order"), items: z.array(z.object({ id: z.string(), sortOrder: z.number().int() })).max(50) }),
  z.object({
    action: z.literal("category-create"),
    sectionId: z.string().max(40),
    nameAr: z.string().max(120),
    nameEn: z.string().max(120),
  }),
  z.object({ action: z.literal("category-delete"), id: z.string().max(40) }),
  z.object({ action: z.literal("category-order"), items: z.array(z.object({ id: z.string(), sortOrder: z.number().int() })).max(200) }),
  z.object({
    action: z.literal("section-update"),
    id: z.string().max(40),
    nameAr: z.string().max(120),
    nameEn: z.string().max(120),
    descriptionAr: z.string().max(600).optional(),
    descriptionEn: z.string().max(600).optional(),
    accent: z.string().max(20).optional(),
  }),
]);

function slugify(input: string): string {
  const base = input
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
  return (base || "cat").slice(0, 40);
}

export async function POST(req: Request) {
  const denied = await adminGuard();
  if (denied) return denied;
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "invalid" }, { status: 400 });
  const data = parsed.data;

  if (data.action === "section-order") {
    await batch(data.items.map((i) => ({ sql: "UPDATE sections SET sort_order = ? WHERE id = ?", args: [i.sortOrder, i.id] })));
    return Response.json({ ok: true });
  }

  if (data.action === "section-update") {
    await run(
      "UPDATE sections SET name_ar = ?, name_en = ?, description_ar = COALESCE(?, description_ar), description_en = COALESCE(?, description_en), accent = COALESCE(?, accent) WHERE id = ?",
      [
        clean(data.nameAr, 120),
        clean(data.nameEn, 120),
        data.descriptionAr !== undefined ? clean(data.descriptionAr, 600) : null,
        data.descriptionEn !== undefined ? clean(data.descriptionEn, 600) : null,
        data.accent ? clean(data.accent, 20) : null,
        data.id,
      ],
    );
    return Response.json({ ok: true });
  }

  if (data.action === "category-create") {
    const nameAr = clean(data.nameAr, 120);
    const nameEn = clean(data.nameEn, 120) || nameAr;
    if (!nameAr && !nameEn) return Response.json({ error: "name-required" }, { status: 400 });
    const id = newId("c");
    const slug = `${slugify(nameEn || nameAr)}-${id.slice(-4)}`;
    await run(
      "INSERT INTO categories (id, section_id, slug, name_ar, name_en, sort_order, created_at) VALUES (?,?,?,?,?,?,?)",
      [id, data.sectionId, slug, nameAr || nameEn, nameEn, 999, nowIso()],
    );
    return Response.json({ ok: true, id });
  }

  if (data.action === "category-delete") {
    await run("DELETE FROM categories WHERE id = ?", [data.id]);
    return Response.json({ ok: true });
  }

  if (data.action === "category-order") {
    await batch(data.items.map((i) => ({ sql: "UPDATE categories SET sort_order = ? WHERE id = ?", args: [i.sortOrder, i.id] })));
    return Response.json({ ok: true });
  }

  return Response.json({ error: "unsupported" }, { status: 400 });
}
