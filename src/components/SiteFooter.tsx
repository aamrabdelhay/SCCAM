import Link from "next/link";
import { Mail, Facebook, Instagram, Linkedin, ArrowUp, ShieldAlert } from "lucide-react";
import type { Lang, SectionRow, SettingsMap } from "@/lib/types";
import { t } from "@/lib/i18n";
import { LogoMark } from "./Logo";
import { WhatsAppIcon, XIcon } from "./BrandIcons";

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
  const notice = (lang === "ar" ? settings.notice_ar : settings.notice_en) || t(lang, "unofficialFooter");

  const quick = [
    { href: "/case", label: t(lang, "navCase") },
    { href: "/laws", label: t(lang, "navLaws") },
    { href: "/books", label: t(lang, "navBooks") },
    { href: "/search", label: t(lang, "navSearch") },
    { href: "/archive", label: t(lang, "navArchive") },
    { href: "/contact", label: t(lang, "navContact") },
  ];

  const resources = [
    { href: "/clarifications", label: t(lang, "clarificationsTitle") },
    { href: "/glossary", label: t(lang, "glossaryTitle") },
    { href: "/changelog", label: t(lang, "changelogTitle") },
    { href: "/library", label: t(lang, "navLibrary") },
    { href: "/faq", label: t(lang, "faqTitle") },
  ];

  const socials = [
    { kind: "x", href: settings.social_x },
    { kind: "linkedin", href: settings.social_linkedin },
    { kind: "whatsapp", href: settings.social_whatsapp },
    { kind: "facebook", href: settings.social_facebook },
    { kind: "instagram", href: settings.social_instagram },
  ].filter((s) => s.href);

  return (
    <footer className="no-print mt-20 border-t border-[var(--line)] bg-[var(--surface)]">
      <div className="container-x py-12">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-2.5">
              <LogoMark className="h-9 w-9" />
              <span className="font-display text-[15px] font-extrabold">{siteName}</span>
            </div>
            <p className="mt-4 max-w-sm text-[13px] leading-relaxed text-[var(--muted)]">
              {lang === "ar" ? settings.tagline_ar : settings.tagline_en}
            </p>
            <div className="mt-4 flex items-start gap-2 rounded-xl border border-[color-mix(in_srgb,var(--accent)_45%,var(--line))] bg-[color-mix(in_srgb,var(--accent)_10%,var(--bg))] p-3">
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent)]" aria-hidden="true" />
              <p className="text-[11.5px] leading-relaxed text-[var(--text)]">{notice}</p>
            </div>
            <div className="mt-4 flex items-center gap-1">
              {socials.map((s) => (
                <a
                  key={s.kind}
                  href={s.href}
                  target="_blank"
                  rel="noreferrer noopener"
                  aria-label={s.kind}
                  className="grid h-9 w-9 place-items-center rounded-full border border-[var(--line)] bg-[var(--card)] text-[var(--muted)] transition-colors hover:text-[var(--primary)] dark:hover:text-[var(--accent)]"
                >
                  {s.kind === "x" && <XIcon className="h-3.5 w-3.5" />}
                  {s.kind === "whatsapp" && <WhatsAppIcon className="h-4 w-4" />}
                  {s.kind === "linkedin" && <Linkedin className="h-4 w-4" />}
                  {s.kind === "facebook" && <Facebook className="h-4 w-4" />}
                  {s.kind === "instagram" && <Instagram className="h-4 w-4" />}
                </a>
              ))}
              {settings.contact_email && (
                <a
                  href={`mailto:${settings.contact_email}`}
                  aria-label={t(lang, "footerContact")}
                  className="grid h-9 w-9 place-items-center rounded-full border border-[var(--line)] bg-[var(--card)] text-[var(--muted)] hover:text-[var(--primary)] dark:hover:text-[var(--accent)]"
                >
                  <Mail className="h-4 w-4" />
                </a>
              )}
            </div>
          </div>

          <FooterCol title={t(lang, "footerQuickLinks")} links={quick} />
          <FooterCol title={t(lang, "footerSections")} links={sections.map((s) => ({ href: `/${s.slug}`, label: lang === "ar" ? s.name_ar : s.name_en }))} />
          <FooterCol title={t(lang, "footerResources")} links={resources} />
        </div>

        {settings.contact_email && (
          <div className="mt-10 flex flex-wrap items-center gap-2 text-[12.5px] text-[var(--muted)]">
            <Mail className="h-4 w-4" aria-hidden="true" />
            <a href={`mailto:${settings.contact_email}`} className="link" dir="ltr">
              {settings.contact_email}
            </a>
            <span className="mx-2 hidden h-3 w-px bg-[var(--line)] sm:block" />
            <Link href="/contact" className="link">
              {t(lang, "askAdmin")}
            </Link>
          </div>
        )}
      </div>

      <div className="border-t border-[var(--line)]">
        <div className="container-x flex flex-col items-center justify-between gap-3 py-5 text-[11.5px] text-[var(--muted)] sm:flex-row">
          <p>
            © {year} {siteName} · {t(lang, "footerRights")} {t(lang, "footerMadeBy")}
          </p>
          <div className="flex items-center gap-4">
            <Link href="/changelog" className="hover:text-[var(--text)]">
              {t(lang, "changelogTitle")}
            </Link>
            <a href="#main" className="inline-flex items-center gap-1 hover:text-[var(--text)]">
              <ArrowUp className="h-3 w-3" aria-hidden="true" />
              {t(lang, "backToTop")}
            </a>
            {/* Hidden in plain sight: the only admin entrance */}
            <Link
              href="/admin"
              className="rounded px-1 text-[11px] tracking-wide text-[var(--muted)] opacity-60 transition-opacity hover:opacity-100"
              aria-label={t(lang, "adminLink")}
              title={t(lang, "adminLink")}
            >
              {t(lang, "adminLink")}
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
      <h2 className="mb-3 text-[12px] font-bold uppercase tracking-wider text-[var(--text)]">{title}</h2>
      <ul className="space-y-2">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="text-[13px] text-[var(--muted)] transition-colors hover:text-[var(--primary)] dark:hover:text-[var(--accent)]">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
