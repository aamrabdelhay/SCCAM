import Link from "next/link";
import type { Lang } from "@/lib/types";
import { cn } from "@/lib/format";

/** Original wordmark — deliberately not the organiser's logo. */
export function LogoMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" role="img" aria-hidden="true" className={cn("h-9 w-9", className)}>
      <rect x="1" y="1" width="46" height="46" rx="13" fill="var(--primary)" />
      <path d="M24 10v22" stroke="var(--accent)" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M13 16h22" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M13 16l-4.5 8.5a5 5 0 0 0 9 0L13 16Z" fill="none" stroke="#fff" strokeWidth="1.9" strokeLinejoin="round" />
      <path d="M35 16l-4.5 8.5a5 5 0 0 0 9 0L35 16Z" fill="none" stroke="#fff" strokeWidth="1.9" strokeLinejoin="round" />
      <path d="M17 35h14c1.7 0 3-1.3 3-3v-1H14v1c0 1.7 1.3 3 3 3Z" fill="var(--accent)" opacity=".92" />
    </svg>
  );
}

export function Logo({
  lang,
  siteName,
  subtitle,
  compact = false,
}: {
  lang: Lang;
  siteName: string;
  subtitle?: string;
  compact?: boolean;
}) {
  return (
    <Link
      href="/"
      className="group flex items-center gap-2.5 rounded-xl focus-visible:outline-offset-4"
      aria-label={siteName}
    >
      <LogoMark className="h-10 w-10 shrink-0 transition-transform duration-300 group-hover:-rotate-3" />
      <span className="flex min-w-0 flex-col leading-tight">
        <span className="font-display truncate text-[15px] font-extrabold tracking-tight text-[var(--text)]">
          {siteName}
        </span>
        {!compact && (
          <span className="truncate text-[10.5px] font-medium text-[var(--muted)]">
            {subtitle ?? (lang === "ar" ? "غير رسمي · من إعداد الطلاب" : "Unofficial · student-run")}
          </span>
        )}
      </span>
    </Link>
  );
}
