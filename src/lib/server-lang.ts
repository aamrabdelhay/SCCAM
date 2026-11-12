import "server-only";
import { cookies } from "next/headers";
import { isValidLang, LANG_COOKIE } from "./i18n";
import type { Lang } from "./types";
import { getSiteSettings } from "./queries";
import type { SettingsMap } from "./types";

export async function getLang(): Promise<Lang> {
  const jar = await cookies();
  const value = jar.get(LANG_COOKIE)?.value;
  return isValidLang(value) ? value : "ar";
}

export async function getShell() {
  const [lang, settings] = await Promise.all([getLang(), getSiteSettings()]);
  return { lang, settings } as { lang: Lang; settings: SettingsMap };
}

export function brandColors(settings: SettingsMap): string {
  const map: Record<string, string> = {
    "--primary": settings.color_primary || "#0B3D2E",
    "--accent": settings.color_accent || "#C9A24B",
    "--bg": settings.color_bg || "#FFFFFF",
    "--surface": settings.color_surface || "#F5F7F6",
    "--text": settings.color_text || "#1A1A1A",
  };
  return Object.entries(map)
    .map(([k, v]) => `${k}:${v}`)
    .join(";");
}
