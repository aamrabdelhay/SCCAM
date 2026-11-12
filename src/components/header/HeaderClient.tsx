"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  Menu,
  X,
  Search,
  ChevronDown,
  Facebook,
  Instagram,
  Linkedin,
  Languages,
  Archive,
  BookOpen,
  FileText,
  Compass,
  Globe,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { SearchBox } from "@/components/SearchBox";
import { WhatsAppIcon, XIcon } from "@/components/BrandIcons";
import { t } from "@/lib/i18n";
import type { Lang } from "@/lib/types";
import { cn } from "@/lib/format";
import { LANG_COOKIE } from "@/lib/i18n";

type Social = { kind: "x" | "linkedin" | "whatsapp" | "facebook" | "instagram"; href: string };

export function HeaderClient({
  lang,
  siteName,
  socials,
  sections,
}: {
  lang: Lang;
  siteName: string;
  socials: Social[];
  sections: { slug: string; name: string }[];
}) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const archiveRef = useRef<HTMLDivElement>(null);
  const searchWrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 6);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setSearchOpen(false);
    setArchiveOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing = target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);
      if (e.key === "/" && !typing && !target?.closest("[data-viewer]")) {
        e.preventDefault();
        setSearchOpen(true);
        setTimeout(() => document.querySelector<HTMLInputElement>("#header-search-panel input")?.focus(), 60);
      }
      if (e.key === "Escape") {
        setSearchOpen(false);
        setArchiveOpen(false);
        setMobileOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (archiveRef.current && !archiveRef.current.contains(e.target as Node)) setArchiveOpen(false);
      if (searchWrapRef.current && !searchWrapRef.current.contains(e.target as Node) && !searchOpen) {
        /* noop */
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [searchOpen]);

  const nav: { href: string; label: string }[] = [
    { href: "/", label: t(lang, "navHome") },
    { href: "/case", label: t(lang, "navCase") },
    { href: "/laws", label: t(lang, "navLaws") },
    { href: "/books", label: t(lang, "navBooks") },
    { href: "/search", label: t(lang, "navSearch") },
  ];

  const archiveLinks = [
    { href: "/previous-editions", label: lang === "ar" ? "أرشيف الإصدارات السابقة" : "Previous editions", icon: Archive },
    { href: "/memoranda", label: lang === "ar" ? "أفضل المذكرات" : "Best memoranda", icon: FileText },
    { href: "/guidelines", label: lang === "ar" ? "الإرشادات" : "Guidelines", icon: Compass },
    { href: "/research-platforms", label: lang === "ar" ? "منصات البحث" : "Research platforms", icon: Globe },
    { href: "/references", label: lang === "ar" ? "المراجع" : "References", icon: BookOpen },
  ];

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <header
      className={cn(
        "no-print sticky top-0 z-40 border-b border-[var(--line)] backdrop-blur-xl transition-shadow duration-300",
        scrolled ? "shadow-[0_10px_30px_-24px_rgba(12,72,113,.25)]" : "",
      )}
      style={{ background: "var(--header)" }}
    >
      <div aria-hidden="true" className="h-[3px] w-full" style={{ background: "linear-gradient(90deg, #43A53C 0%, #0C873E 22%, #EE940F 42%, #F4B042 58%, #2975B2 78%, #0C4871 100%)" }} />
      <div className="container-x flex h-16 items-center gap-3">
        <button
          type="button"
          className="btn btn-ghost -ms-2 px-2 xl:hidden"
          aria-label={t(lang, "menu")}
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((v) => !v)}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>

        <Logo lang={lang} siteName={siteName} />

        <nav aria-label={lang === "ar" ? "التنقل الرئيسي" : "Main navigation"} className="hidden items-center gap-0.5 xl:flex">
          {nav.slice(0, 4).map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item.href) ? "page" : undefined}
              className={cn(
                "relative rounded-lg px-2 py-2 text-[13px] font-semibold transition-colors",
                isActive(item.href)
                  ? "text-[var(--primary)] dark:text-[var(--accent)]"
                  : "text-[var(--muted)] hover:text-[var(--text)]",
              )}
            >
              {item.label}
              {isActive(item.href) && (
                <span className="absolute inset-x-3 -bottom-[13px] h-[2px] rounded-full bg-[var(--accent)]" />
              )}
            </Link>
          ))}

          <div className="relative" ref={archiveRef}>
            <button
              type="button"
              onClick={() => setArchiveOpen((v) => !v)}
              aria-expanded={archiveOpen}
              aria-haspopup="true"
              className={cn(
                "flex items-center gap-1 rounded-lg px-3 py-2 text-[13.5px] font-semibold transition-colors",
                archiveOpen ? "text-[var(--primary)] dark:text-[var(--accent)]" : "text-[var(--muted)] hover:text-[var(--text)]",
              )}
            >
              {lang === "ar" ? "موارد الباحث" : "Research resources"}
              <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", archiveOpen && "rotate-180")} />
            </button>
            {archiveOpen && (
              <div className="absolute z-50 mt-2 w-60 overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--card)] p-1.5 shadow-xl">
                {archiveLinks.map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] font-medium text-[var(--text)] hover:bg-[var(--surface)]"
                  >
                    <l.icon className="h-4 w-4 text-[var(--muted)]" aria-hidden="true" />
                    {l.label}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {nav.slice(4).map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item.href) ? "page" : undefined}
              className={cn(
                "rounded-lg px-3 py-2 text-[13.5px] font-semibold transition-colors",
                isActive(item.href)
                  ? "text-[var(--primary)] dark:text-[var(--accent)]"
                  : "text-[var(--muted)] hover:text-[var(--text)]",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ms-auto flex items-center gap-1.5">
          <div className="hidden w-[220px] 2xl:block">
            <SearchBox lang={lang} size="sm" />
          </div>
          <button
            type="button"
            className="btn btn-ghost px-2 xl:hidden"
            aria-label={t(lang, "searchGlobal")}
            aria-expanded={searchOpen}
            onClick={() => setSearchOpen((v) => !v)}
          >
            {searchOpen ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
          </button>

          <div className="hidden items-center gap-0.5 xl:flex">
            {socials.map((s) => (
              <a
                key={s.kind}
                href={s.href}
                target="_blank"
                rel="noreferrer noopener"
                aria-label={s.kind}
                className="grid h-8 w-8 place-items-center rounded-full text-[var(--muted)] transition-colors hover:bg-[var(--surface)] hover:text-[var(--primary)] dark:hover:text-[var(--accent)]"
              >
                {s.kind === "x" && <XIcon className="h-3.5 w-3.5" />}
                {s.kind === "whatsapp" && <WhatsAppIcon className="h-4 w-4" />}
                {s.kind === "linkedin" && <Linkedin className="h-3.5 w-3.5" />}
                {s.kind === "facebook" && <Facebook className="h-3.5 w-3.5" />}
                {s.kind === "instagram" && <Instagram className="h-3.5 w-3.5" />}
              </a>
            ))}
          </div>

          <div className="mx-1 hidden h-6 w-px bg-[var(--line)] md:block" />

          <LangToggle lang={lang} />
        </div>
      </div>

      {searchOpen && (
        <div
          id="header-search-panel"
          ref={searchWrapRef}
          className="no-print border-t border-[var(--line)] bg-[var(--card)] px-4 py-3 xl:hidden"
        >
          <div className="mx-auto max-w-2xl">
            <SearchBox lang={lang} autoFocus onNavigate={() => setSearchOpen(false)} />
          </div>
        </div>
      )}

      {mobileOpen && (
        <div className="no-print border-t border-[var(--line)] bg-[var(--card)] xl:hidden">
          <nav aria-label={t(lang, "menu")} className="container-x flex flex-col py-2">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive(item.href) ? "page" : undefined}
                className={cn(
                  "flex items-center justify-between rounded-xl px-3 py-3 text-sm font-semibold",
                  isActive(item.href) ? "bg-[var(--surface)] text-[var(--primary)] dark:text-[var(--accent)]" : "text-[var(--text)]",
                )}
              >
                {item.label}
                {item.href === "/" && <BookOpen className="h-4 w-4 opacity-40" />}
                {item.href === "/case" && <FileText className="h-4 w-4 opacity-40" />}
              </Link>
            ))}
            <div className="my-2 h-px bg-[var(--line)]" />
            {sections.filter((s) => !["case", "laws", "books"].includes(s.slug)).map((s) => (
              <Link
                key={s.slug}
                href={`/${s.slug}`}
                className="rounded-xl px-3 py-2.5 text-[13px] font-medium text-[var(--muted)]"
              >
                → {s.name}
              </Link>
            ))}
            <div className="my-2 h-px bg-[var(--line)]" />
            <div className="grid grid-cols-2 gap-1">
              {archiveLinks.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-[13px] font-medium text-[var(--muted)]"
                >
                  <l.icon className="h-4 w-4" aria-hidden="true" />
                  {l.label}
                </Link>
              ))}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}

function LangToggle({ lang }: { lang: Lang }) {
  const [busy, setBusy] = useState(false);
  function toggle() {
    setBusy(true);
    const next = lang === "ar" ? "en" : "ar";
    document.cookie = `${LANG_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
    window.location.reload();
  }
  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      className="btn btn-outline btn-sm gap-1.5 px-3"
      aria-label={t(lang, "languageSwitch")}
      lang={lang === "ar" ? "en" : "ar"}
    >
      <Languages className="h-3.5 w-3.5" aria-hidden="true" />
      <span className="text-[12px] font-bold">{t(lang, "languageSwitch")}</span>
    </button>
  );
}
