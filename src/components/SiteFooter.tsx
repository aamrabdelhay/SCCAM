import Link from "next/link";
import { LockKeyhole } from "lucide-react";
import type { Lang } from "@/lib/types";
import { LogoMark } from "./Logo";

export function SiteFooter({ lang }: { lang: Lang }) {
  const ar = lang === "ar";
  return (
    <footer className="no-print mt-auto text-white" style={{ background: "linear-gradient(112deg, #0C4871 0%, #083B60 58%, #07334F 100%)" }}>
      <div className="brand-spectrum h-1.5" aria-hidden="true" />
      <div className="container-x flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <LogoMark className="h-7 w-7" />
          <span className="font-display text-[13px] font-bold tracking-wide">SCCAM</span>
        </div>
        <p className="text-[10.5px] text-white/65">© {new Date().getFullYear()} SCCAM</p>
        <Link href="/admin" className="inline-flex w-fit items-center gap-1.5 self-end rounded-full border border-white/25 px-2.5 py-1 text-[10px] font-semibold text-white/75 transition-colors hover:border-[#F4B042] hover:text-[#F4B042] sm:self-auto">
          <LockKeyhole className="h-3 w-3" aria-hidden="true" />
          {ar ? "الإدارة" : "Admin"}
        </Link>
      </div>
    </footer>
  );
}
