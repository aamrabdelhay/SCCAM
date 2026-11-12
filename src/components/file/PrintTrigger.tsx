"use client";

import { useEffect } from "react";
import { Printer } from "lucide-react";
import { t } from "@/lib/i18n";
import type { Lang } from "@/lib/types";

export function PrintTrigger({ lang, auto = false }: { lang: Lang; auto?: boolean }) {
  useEffect(() => {
    if (!auto) return;
    const timer = setTimeout(() => window.print(), 900);
    return () => clearTimeout(timer);
  }, [auto]);

  return (
    <button type="button" onClick={() => window.print()} className="btn btn-primary btn-sm no-print">
      <Printer className="h-3.5 w-3.5" /> {t(lang, "print")}
    </button>
  );
}
