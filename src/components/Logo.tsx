import Link from "next/link";
import type { Lang } from "@/lib/types";
import { cn } from "@/lib/format";

/** SCCAM justice emblem: a balance, feather and heart carved into a temple wall. */
export function LogoMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 128 128" role="img" aria-hidden="true" className={cn("h-9 w-9", className)} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="sccam-stone" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#E8D8BD" /><stop offset="1" stopColor="#BFA783" /></linearGradient>
        <linearGradient id="sccam-gold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#E6B65E" /><stop offset="1" stopColor="#A97128" /></linearGradient>
      </defs>
      <rect x="3" y="3" width="122" height="122" rx="19" fill="url(#sccam-stone)" stroke="#0C4871" strokeWidth="4" />
      <rect x="10" y="10" width="108" height="108" rx="13" fill="none" stroke="#F4B042" strokeWidth="1.5" />
      <path d="M15 27h98M15 101h98M28 15v98M100 15v98" stroke="#8D6B48" strokeOpacity=".28" strokeWidth="1.2" />
      <g fill="none" stroke="#8C6948" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" opacity=".72">
        <path d="M17 42h12l-6-7-6 7Zm4 5h9m-13 4h13" /><path d="M98 39c5-6 9-5 12 0-3 5-7 6-12 0Zm1 8h11m-9 4h8" />
        <path d="M17 78h12m-6-7v14m-6-3 6 3 6-3" /><path d="M100 75v11m-5-6h10m-8-5 6 10" />
      </g>
      <g stroke="url(#sccam-gold)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none">
        <path d="M64 23v69M34 36h60" /><path d="M64 21l-6 8h12Z" fill="#C28B3C" />
        <path d="M34 36c7 0 10-4 10-9m50 9c-7 0-10-4-10-9" strokeWidth="2.5" />
        <path d="M34 38 26 67m8-29 8 29M94 38 86 67m8-29 8 29" strokeWidth="2" />
        <path d="M21 68q13 14 26 0M81 68q13 14 26 0" strokeWidth="3" />
        <path d="M51 94h26l7 8H44Z" fill="#0C4871" stroke="#0C4871" /><path d="M38 106h52" strokeWidth="5" />
      </g>
      <path d="M34 65c-8-9-20 2-9 12l9 8 9-8c11-10-1-21-9-12Z" fill="#EE940F" stroke="#8D4D21" strokeWidth="1.5" />
      <path d="M94 56c-5 6-9 12-10 20 6-5 11-12 14-20 3 7 3 16-1 24 9-8 10-21 4-31-2 4-4 7-7 9Z" fill="#FFFFFF" stroke="#0C4871" strokeWidth="1.4" />
      <path d="M96 53 91 90" stroke="#0C4871" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M84 115h24" stroke="#0C873E" strokeWidth="3" strokeLinecap="round" /><path d="M20 115h24" stroke="#2975B2" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
export function Logo({ lang, siteName, subtitle, compact = false }: { lang: Lang; siteName: string; subtitle?: string; compact?: boolean }) {
  return (
    <Link href="/" className="group flex items-center gap-2.5 rounded-xl focus-visible:outline-offset-4" aria-label={siteName}>
      <LogoMark className="h-10 w-10 shrink-0 transition-transform duration-300 group-hover:-rotate-2" />
      <span className="flex min-w-0 flex-col leading-tight">
        <span className="font-display truncate text-[15px] font-extrabold tracking-tight text-[var(--text)]">{siteName}</span>
        {!compact && subtitle && <span className="truncate text-[10.5px] font-medium text-[var(--muted)]">{subtitle}</span>}
      </span>
    </Link>
  );
}
