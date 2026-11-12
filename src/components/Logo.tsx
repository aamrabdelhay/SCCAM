import Link from "next/link";
import type { Lang } from "@/lib/types";
import { cn } from "@/lib/format";

/** Palm emblem based on the supplied SCCAM logo palette. */
export function LogoMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 188 182" role="img" aria-hidden="true" className={cn("h-9 w-9", className)} preserveAspectRatio="xMidYMid meet">
      <path d="M10 34 94 5 178 34V178L94 147 10 178Z" fill="#0C4871" />
      <path d="M10 34 94 5 178 34V82C151 65 123 58 94 62 63 58 36 65 10 82Z" fill="#43A53C" />
      <path d="M10 82C36 65 63 58 94 62V147L10 178Z" fill="#EE940F" />
      <path d="M12 84C31 69 53 64 77 65 62 82 55 105 56 164L12 178Z" fill="#F4B042" opacity=".58" />
      <path d="M94 62C124 58 151 65 178 82V178L94 147Z" fill="#0C4871" />
      <path d="M94 62C116 60 133 68 140 86V164L94 147Z" fill="#2975B2" />
      <path d="M92 55C93 82 91 119 91 151L99 151C99 119 97 82 98 55Z" fill="#FFFFFF" />
      <path d="M94 57C83 44 66 32 52 36 61 43 72 53 82 67 65 57 48 58 36 69 54 69 72 75 84 88 67 83 53 93 48 107 62 97 77 94 91 99 88 114 89 132 94 146 100 132 101 114 97 99 111 96 126 101 140 112 136 96 123 84 106 80 122 73 140 73 154 80 147 66 130 59 111 65 121 53 132 45 143 39 126 34 109 44 98 58 97 44 100 30 94 18 87 30 90 44 94 57Z" fill="#FFFFFF" />
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
        {!compact && subtitle && (
          <span className="truncate text-[10.5px] font-medium text-[var(--muted)]">{subtitle}</span>
        )}
      </span>
    </Link>
  );
}
