import { z } from "zod";
import { adminGuard, clean } from "@/lib/admin-api";
import { setSettings } from "@/lib/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({ values: z.record(z.string().max(4000)) });

const COLOR = /^#[0-9a-fA-F]{6}$/;

export async function POST(req: Request) {
  const denied = await adminGuard();
  if (denied) return denied;
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "invalid" }, { status: 400 });

  const allowedKeys = [
    "site_name_ar", "site_name_en", "tagline_ar", "tagline_en", "banner_ar", "banner_en",
    "notice_ar", "notice_en", "announcement_ar", "announcement_en", "announcement_enabled",
    "social_x", "social_linkedin", "social_whatsapp", "social_facebook", "social_instagram",
    "contact_email", "footer_note_ar", "footer_note_en",
    "color_primary", "color_accent", "color_bg", "color_surface", "color_text",
    "accent_case", "accent_laws", "accent_books", "default_lang",
  ];
  const values: Record<string, string> = {};
  for (const [key, raw] of Object.entries(parsed.data.values)) {
    if (!allowedKeys.includes(key)) continue;
    if (key.startsWith("social_") || key === "contact_email") {
      const v = clean(raw, 300);
      if (v && !/^(https?:\/\/|mailto:)/i.test(v)) continue;
      values[key] = v;
      continue;
    }
    if (key.startsWith("color_") || key.startsWith("accent_")) {
      if (COLOR.test(raw)) values[key] = raw;
      continue;
    }
    if (key === "announcement_enabled") {
      values[key] = raw === "1" || raw === "true" ? "1" : "0";
      continue;
    }
    values[key] = clean(raw, 1200);
  }
  await setSettings(values);
  return Response.json({ ok: true });
}
