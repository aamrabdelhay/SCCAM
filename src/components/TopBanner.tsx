import type { Lang, SettingsMap } from "@/lib/types";
import { Megaphone } from "lucide-react";

export function TopBanner({ lang, settings }: { lang: Lang; settings: SettingsMap }) {
  const announcement = lang === "ar" ? settings.announcement_ar : settings.announcement_en;
  const showAnnouncement = settings.announcement_enabled === "1" && announcement.trim().length > 0;
  if (!showAnnouncement) return null;

  return (
    <div className="no-print border-b border-[var(--line)] bg-[color-mix(in_srgb,var(--accent)_16%,var(--bg))]">
      <div className="container-x flex items-center gap-2 py-2">
        <Megaphone className="h-4 w-4 shrink-0 text-[var(--primary)]" aria-hidden="true" />
        <p className="text-[12.5px] font-medium sm:text-sm">{announcement}</p>
      </div>
    </div>
  );
}
