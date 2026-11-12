"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Files,
  FolderTree,
  Newspaper,
  MessageCircleQuestion,
  CalendarClock,
  BarChart3,
  Inbox,
  Settings,
  ExternalLink,
  LogOut,
  Menu,
  X,
  ShieldCheck,
} from "lucide-react";
import { t } from "@/lib/i18n";
import type { Lang } from "@/lib/types";
import { cn } from "@/lib/format";
import { adminFetch } from "@/lib/admin-client";

export function AdminShell({ lang, children, username }: { lang: Lang; children: React.ReactNode; username: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const nav = [
    { href: "/admin", label: t(lang, "adminDashboard"), icon: LayoutDashboard },
    { href: "/admin/files", label: t(lang, "adminFiles"), icon: Files },
    { href: "/admin/taxonomy", label: t(lang, "adminTaxonomy"), icon: FolderTree },
    { href: "/admin/content", label: t(lang, "adminNews"), icon: Newspaper },
    { href: "/admin/analytics", label: t(lang, "adminAnalytics"), icon: BarChart3 },
    { href: "/admin/inbox", label: t(lang, "adminInbox"), icon: Inbox },
    { href: "/admin/settings", label: t(lang, "adminSettings"), icon: Settings },
  ];

  async function logout() {
    await adminFetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  const isActive = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));

  return (
    <div className="min-h-[80vh] bg-[var(--surface)]">
      <div className="container-x py-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="eyebrow flex items-center gap-1.5">
              <ShieldCheck className="h-3 w-3" /> {t(lang, "adminTitle")}
            </p>
            <h1 className="font-display mt-1 text-[21px] font-extrabold">{t(lang, "adminTitle")}</h1>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/" className="btn btn-outline btn-sm gap-1.5" target="_blank">
              <ExternalLink className="h-3.5 w-3.5" /> {t(lang, "adminViewSite")}
            </Link>
            <span className="hidden text-[11.5px] font-semibold text-[var(--muted)] sm:inline">@{username}</span>
            <button type="button" onClick={logout} className="btn btn-ghost btn-sm gap-1.5">
              <LogOut className="h-3.5 w-3.5" /> {t(lang, "adminLogout")}
            </button>
            <button type="button" onClick={() => setOpen((v) => !v)} className="btn btn-ghost btn-sm lg:hidden" aria-label={t(lang, "menu")}>
              {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
          <nav className={cn("card h-fit overflow-hidden p-1.5", !open && "hidden lg:block")} aria-label={t(lang, "adminTitle")}>
            {nav.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-2 rounded-xl px-3 py-2.5 text-[13px] font-semibold transition-colors",
                  isActive(n.href) ? "bg-[var(--primary)] text-white" : "text-[var(--muted)] hover:bg-[var(--surface)] hover:text-[var(--text)]",
                )}
              >
                <n.icon className="h-4 w-4" aria-hidden="true" />
                {n.label}
              </Link>
            ))}
            <div className="my-1 h-px bg-[var(--line)]" />
            <Link href="/admin/content#news" className="flex items-center gap-2 rounded-xl px-3 py-2 text-[12px] text-[var(--muted)] hover:bg-[var(--surface)]">
              <Newspaper className="h-3.5 w-3.5" /> {t(lang, "adminNews")}
            </Link>
            <Link href="/admin/content#faq" className="flex items-center gap-2 rounded-xl px-3 py-2 text-[12px] text-[var(--muted)] hover:bg-[var(--surface)]">
              <MessageCircleQuestion className="h-3.5 w-3.5" /> {t(lang, "adminFaq")}
            </Link>
            <Link href="/admin/content#deadlines" className="flex items-center gap-2 rounded-xl px-3 py-2 text-[12px] text-[var(--muted)] hover:bg-[var(--surface)]">
              <CalendarClock className="h-3.5 w-3.5" /> {t(lang, "adminDeadlines")}
            </Link>
          </nav>
          <div className="min-w-0">{children}</div>
        </div>
      </div>
    </div>
  );
}
