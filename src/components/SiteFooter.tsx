import Link from "next/link";
import { ArrowUp, BookOpen, FileArchive, Globe2, LockKeyhole, Search } from "lucide-react";
import type { Lang, SectionRow, SettingsMap } from "@/lib/types";
import { t } from "@/lib/i18n";
import { LogoMark } from "./Logo";

export function SiteFooter({
  lang,
  settings,
  sections,
}: {
  lang: Lang;
  settings: SettingsMap;
  sections: SectionRow[];
}) {
  const ar = lang === "ar";
  const siteName = ar ? settings.site_name_ar : settings.site_name_en;
  const primaryLinks = [
    { href: "/case", label: t(lang, "navCase") },
    { href: "/laws", label: t(lang, "navLaws") },
    { href: "/books", label: t(lang, "navBooks") },
    { href: "/search", label: t(lang, "navSearch"), icon: Search },
    { href: "/archive", label: t(lang, "navArchive"), icon: FileArchive },
    ...sections.filter((section) => !["case", "laws", "books"].includes(section.slug)).map((section) => ({ href: "/" + section.slug, label: ar ? section.name_ar : section.name_en })),
  ];
  const resourceLinks = [
    { href: "/previous-editions", label: ar ? "أرشيف الإصدارات السابقة" : "Previous editions" },
    { href: "/memoranda", label: ar ? "أفضل المذكرات" : "Best memoranda" },
    { href: "/guidelines", label: ar ? "الإرشادات" : "Guidelines" },
    { href: "/references", label: ar ? "المراجع" : "References" },
    { href: "/research-platforms", label: ar ? "منصات البحث" : "Research platforms", icon: Globe2 },
    { href: "/library", label: ar ? "مكتبتي" : "My library" },
  ];

  return (
    <footer className="no-print mt-auto border-t-4 border-transparent text-white" style={{
      background: "linear-gradient(112deg, #0C4871 0%, #083B60 58%, #07334F 100%)",
      borderImage: "linear-gradient(90deg, #43A53C 0%, #0C873E 20%, #EE940F 42%, #F4B042 58%, #2975B2 78%, #0C4871 100%) 1",
    }}>
      <div className="container-x py-9 sm:py-11">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1.2fr]">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white/10 ring-1 ring-white/15">
                <LogoMark className="h-8 w-8" />
              </span>
              <div className="min-w-0">
                <p className="font-display truncate text-[15px] font-extrabold">{siteName}</p>
                <p className="mt-0.5 text-[10.5px] font-medium text-white/60">{ar ? "مكتبة البحث والتحكيم الدولي" : "International law and arbitration research library"}</p>
              </div>
            </div>
            <p className="mt-4 max-w-sm text-[12.5px] leading-7 text-white/70">
              {ar ? settings.tagline_ar : settings.tagline_en}
            </p>
            <Link href="/admin" className="mt-5 inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-extrabold shadow-sm transition-transform hover:-translate-y-0.5" style={{ background: "#F4B042", color: "#0C4871" }}>
              <LockKeyhole className="h-4 w-4" aria-hidden="true" />
              {ar ? "دخول لوحة الإدارة" : "Open admin panel"}
            </Link>
          </div>

          <FooterColumn title={ar ? "الأقسام" : "Sections"} links={primaryLinks} />
          <FooterColumn title={ar ? "أدوات ومراجع" : "Research resources"} links={resourceLinks} />
        </div>

        <div className="mt-8 flex flex-col gap-3 border-t border-white/15 pt-5 text-[11px] text-white/60 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} {siteName} · {ar ? "المصادر مرتبطة بجهاتها الأصلية." : "Sources are linked to their original publishers and institutions."}</p>
          <a href="#main" className="inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1.5 font-semibold text-white/80 transition-colors hover:bg-white/10 hover:text-white">
            <ArrowUp className="h-3.5 w-3.5" aria-hidden="true" />
            {ar ? "أعلى الصفحة" : "Back to top"}
          </a>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, links }: { title: string; links: { href: string; label: string; icon?: typeof BookOpen }[] }) {
  return (
    <nav aria-label={title}>
      <h2 className="mb-4 text-[12px] font-extrabold tracking-wide text-[#F4B042]">{title}</h2>
      <ul className="grid grid-cols-2 gap-x-4 gap-y-3">
        {links.map((item) => (
          <li key={item.href}>
            <Link href={item.href} className="inline-flex items-center gap-1.5 text-[12px] leading-6 text-white/75 transition-colors hover:text-white">
              {item.icon && <item.icon className="h-3.5 w-3.5 shrink-0 text-[#F4B042]" aria-hidden="true" />}
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
