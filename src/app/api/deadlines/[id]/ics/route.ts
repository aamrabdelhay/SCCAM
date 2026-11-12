import { one } from "@/lib/db";

export const runtime = "nodejs";

function icsDate(d: Date): string {
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function escapeIcs(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const row = await one<{ id: string; title_ar: string; title_en: string; note_ar: string; note_en: string; due_at: string }>(
    "SELECT id, title_ar, title_en, note_ar, note_en, due_at FROM deadlines WHERE id = ?",
    [id],
  );
  if (!row) return new Response("Not found", { status: 404 });

  const start = new Date(row.due_at);
  const end = new Date(start.getTime() + 60 * 60 * 1000);
  const now = new Date();
  const title = row.title_en || row.title_ar;
  const description = row.note_en || row.note_ar;
  const body = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//SCCAM unofficial library//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${row.id}@sccam-library`,
    `DTSTAMP:${icsDate(now)}`,
    `DTSTART:${icsDate(start)}`,
    `DTEND:${icsDate(end)}`,
    `SUMMARY:${escapeIcs(title)}`,
    `DESCRIPTION:${escapeIcs(description)}`,
    "BEGIN:VALARM",
    "TRIGGER:-P1D",
    "ACTION:DISPLAY",
    "DESCRIPTION:Reminder",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  return new Response(body, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="deadline-${row.id}.ics"`,
      "Cache-Control": "public, max-age=3600",
    },
  });
}
