import type { Lang, SettingsMap } from "@/lib/types";
import { t } from "@/lib/i18n";
import { Info, Megaphone } from "lucide-react";

export function TopBanner({ lang, settings }: { lang: Lang; settings: SettingsMap }) {
  const notice = (lang === "ar" ? settings.banner_ar : settings.banner_en) || t(lang, "unofficialBanner");
  const announcement = lang === "ar" ? settings.announcement_ar : settings.announcement_en;
  const showAnnouncement = settings.announcement_enabled === "1" && announcement.trim().length > 0;

  return (
    <div className="no-print">
      <div className="bg-[var(--primary)] text-white">
        <div className="container-x flex items-center justify-center gap-2 py-1.5 text-center">
          <Info className="h-3.5 w-3.5 shrink-0 text-[var(--accent)]" aria-hidden="true" />
          <p className="text-[11px] font-medium leading-snug sm:text-xs">{notice}</p>
        </div>
      </div>
      {showAnnouncement && (
        <div className="border-b border-[var(--line)] bg-[color-mix(in_srgb,var(--accent)_16%,var(--bg))]">
          <div className="container-x flex items-center gap-2 py-2">
            <Megaphone className="h-4 w-4 shrink-0 text-[var(--primary)] dark:text-[var(--accent)]" aria-hidden="true" />
            <p className="text-[12.5px] font-medium sm:text-sm">{announcement}</p>
          </div>
        </div>
      )}
    </div>
  );
}
