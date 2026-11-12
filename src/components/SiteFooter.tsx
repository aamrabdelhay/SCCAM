import Link from "next/link";
import { ArrowUp, ArrowUpRight, BookOpen, FileText, Archive, ShieldCheck } from "lucide-react";
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
  const year = new Date().getFullYear();
  const siteName = lang === "ar" ? settings.site_name_ar : settings.site_name_en;
  const ar = lang === "ar";

  const libraryLinks = [
    { href: "/case", label: t(lang, "navCase") },
    { href: "/laws", label: t(lang, "navLaws") },
    { href: "/books", label: t(lang, "navBooks") },
    { href: "/search", label: t(lang, "navSearch") },
  ];
  const resourceLinks = [
    { href: "/archive", label: ar ? "أرشيف الإصدارات السابقة" : "Previous editions" },
    { href: "/memoranda", label: ar ? "أفضل المذكرات" : "Best memoranda" },
    { href: "/guidelines", label: ar ? "الإرشادات" : "Guidelines" },
    { href: "/research-platforms", label: ar ? "منصات البحث" : "Research platforms" },
    { href: "/references", label: ar ? "المراجع" : "References" },
  ];

  return (
    <footer className="site-footer no-print mt-16 border-t border-[var(--line)] bg-[var(--navy)] text-white">
      <div className="brand-spectrum h-1 w-full" aria-hidden="true" />
      <div className="container-x py-9 sm:py-11">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-[1.35fr_1fr_1.15fr_auto] lg:gap-10">
          <div>
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-white/10 ring-1 ring-white/15">
                <LogoMark className="h-8 w-8" />
              </span>
              <span className="font-display text-[15px] font-extrabold">{siteName}</span>
            </div>
            <p className="mt-4 max-w-sm text-[12.5px] leading-7 text-white/70">
              {ar ? settings.tagline_ar : settings.tagline_en}
            </p>
          </div>

          <FooterCol title={ar ? "أقسام المكتبة" : "Library"} links={libraryLinks} />
          <FooterCol title={ar ? "موارد الباحث" : "Research resources"} links={resourceLinks} />

          <div className="rounded-2xl border border-white/15 bg-white/[0.06] p-4 sm:max-w-[230px]">
            <div className="flex items-center gap-2 text-[13px] font-bold">
              <ShieldCheck className="h-4 w-4 text-[var(--accent)]" aria-hidden="true" />
              {ar ? "إدارة المكتبة" : "Library administration"}
            </div>
            <p className="mt-2 text-[11.5px] leading-6 text-white/65">
              {ar ? "إدارة الملفات والإصدارات ومحتوى المكتبة." : "Manage files, editions and library content."}
            </p>
            <Link
              href="/admin"
              className="mt-4 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-2 text-[12.5px] font-extrabold text-[var(--navy)] transition-transform hover:-translate-y-0.5 hover:brightness-105"
            >
              {ar ? "دخول الإدارة" : "Open admin"}
              <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-x flex flex-col items-center justify-between gap-3 py-4 text-[11px] text-white/60 sm:flex-row">
          <p>© {year} {siteName} · {t(lang, "footerRights")}</p>
          <div className="flex items-center gap-4">
            <span className="hidden text-white/35 sm:inline">SCCAM Library</span>
            <a href="#main" className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 transition-colors hover:bg-white/10 hover:text-white">
              <ArrowUp className="h-3.5 w-3.5" aria-hidden="true" />
              {t(lang, "backToTop")}
            </a>
            <Link href="/admin" className="rounded-lg px-2 py-1 font-bold text-[var(--accent)] transition-colors hover:bg-white/10">
              {ar ? "الإدارة" : "Admin"}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <nav aria-label={title}>
      <h2 className="mb-3 text-[11px] font-extrabold uppercase tracking-wider text-[var(--sky)]">{title}</h2>
      <ul className="space-y-2.5">
        {links.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className="text-[12.5px] text-white/75 transition-colors hover:text-[var(--accent)]">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
