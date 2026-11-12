import { getSiteSettings, getSections } from "@/lib/queries";
import type { Lang, SectionRow, SettingsMap } from "@/lib/types";
import { HeaderClient } from "./header/HeaderClient";

export async function SiteHeader({
  lang,
  settings,
  sections,
}: {
  lang: Lang;
  settings: SettingsMap;
  sections: SectionRow[];
}) {
  const socials = [
    settings.social_x && { kind: "x" as const, href: settings.social_x },
    settings.social_linkedin && { kind: "linkedin" as const, href: settings.social_linkedin },
    settings.social_whatsapp && { kind: "whatsapp" as const, href: settings.social_whatsapp },
    settings.social_facebook && { kind: "facebook" as const, href: settings.social_facebook },
    settings.social_instagram && { kind: "instagram" as const, href: settings.social_instagram },
  ].filter(Boolean) as { kind: "x" | "linkedin" | "whatsapp" | "facebook" | "instagram"; href: string }[];

  return (
    <HeaderClient
      lang={lang}
      siteName="SCCAM"
      socials={socials}
      sections={sections.map((s) => ({ slug: s.slug, name: lang === "ar" ? s.name_ar : s.name_en }))}
    />
  );
}

export async function headerData() {
  const [settings, sections] = await Promise.all([getSiteSettings(), getSections()]);
  return { settings, sections };
}
