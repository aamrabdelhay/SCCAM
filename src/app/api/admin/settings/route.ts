import { z } from "zod";
import { adminGuard, clean } from "@/lib/admin-api";
import { setSettings } from "@/lib/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({ values: z.record(z.string().max(4000)) });
const COLOR = /^#[0-9a-fA-F]{6}$/;

function cairoLocalToIso(value: string): string | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!match) return null;
  const [, yearText, monthText, dayText, hourText, minuteText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const hour = Number(hourText);
  const minute = Number(minuteText);
  if (month < 1 || month > 12 || day < 1 || day > 31 || hour > 23 || minute > 59) return null;

  // The form represents the end of the displayed minute (23:59:59.999).
  const wallClockAsUtc = Date.UTC(year, month - 1, day, hour, minute, 59, 999);
  const zoneParts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Africa/Cairo",
    timeZoneName: "shortOffset",
  }).formatToParts(new Date(wallClockAsUtc));
  const zoneLabel = zoneParts.find((part) => part.type === "timeZoneName")?.value ?? "GMT+2";
  const offsetMatch = /GMT([+-])(\d{1,2})(?::(\d{2}))?/.exec(zoneLabel);
  const offsetMinutes = offsetMatch
    ? (offsetMatch[1] === "-" ? -1 : 1) * (Number(offsetMatch[2]) * 60 + Number(offsetMatch[3] ?? 0))
    : 120;
  return new Date(wallClockAsUtc - offsetMinutes * 60_000).toISOString();
}

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
    "timer_claimant_title_ar", "timer_claimant_title_en", "timer_claimant_due_at",
    "timer_respondent_title_ar", "timer_respondent_title_en", "timer_respondent_due_at",
  ];
  const values: Record<string, string> = {};
  for (const [key, raw] of Object.entries(parsed.data.values)) {
    if (!allowedKeys.includes(key)) continue;
    if (key.startsWith("social_") || key === "contact_email") {
      const value = clean(raw, 300);
      if (value && !/^(https?:\/\/|mailto:)/i.test(value)) continue;
      values[key] = value;
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
    if (key.endsWith("_due_at")) {
      if (!raw) {
        values[key] = "";
        continue;
      }
      const iso = cairoLocalToIso(raw);
      if (iso) values[key] = iso;
      continue;
    }
    values[key] = clean(raw, key.endsWith("_title_ar") || key.endsWith("_title_en") ? 200 : 1200);
  }
  await setSettings(values);
  return Response.json({ ok: true });
}
