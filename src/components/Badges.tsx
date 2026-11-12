import { Pin, Sparkles, RefreshCw, Lock, FileText, FileImage, FileType2 } from "lucide-react";
import { t } from "@/lib/i18n";
import type { Importance, Lang } from "@/lib/types";
import { cn, importanceKey } from "@/lib/format";

export function ImportanceBadge({ importance, lang }: { importance: Importance | string; lang: Lang }) {
  const key = importanceKey(importance as Importance);
  const label = t(lang, key === "essential" ? "essential" : key === "important" ? "important" : "reference");
  return <span className={cn("badge", `badge-${key}`)}>{label}</span>;
}

export function PinnedBadge({ lang }: { lang: Lang }) {
  return (
    <span className="badge badge-new">
      <Pin className="h-3 w-3" aria-hidden="true" />
      {t(lang, "pinned")}
    </span>
  );
}

export function NewBadge({ lang }: { lang: Lang }) {
  return (
    <span className="badge badge-new">
      <Sparkles className="h-3 w-3" aria-hidden="true" />
      {t(lang, "newBadge")}
    </span>
  );
}

export function UpdatedBadge({ lang }: { lang: Lang }) {
  return (
    <span className="badge badge-updated">
      <RefreshCw className="h-3 w-3" aria-hidden="true" />
      {t(lang, "updated")}
    </span>
  );
}

export function LockBadge({ lang }: { lang: Lang }) {
  return (
    <span className="badge badge-reference" title={t(lang, "viewerPasswordTitle")}>
      <Lock className="h-3 w-3" aria-hidden="true" />
    </span>
  );
}

export function FormatIcon({ mime, className = "h-4 w-4" }: { mime: string; className?: string }) {
  if (mime.startsWith("image/")) return <FileImage className={className} aria-hidden="true" />;
  if (mime.includes("word") || mime.startsWith("text/")) return <FileType2 className={className} aria-hidden="true" />;
  return <FileText className={className} aria-hidden="true" />;
}

export function SectionPill({
  name,
  accent,
  lang,
}: {
  name: string;
  accent: string;
  lang: Lang;
}) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10.5px] font-bold"
      style={{ background: `color-mix(in srgb, ${accent} 14%, transparent)`, color: accent }}
    >
      {name}
      <span className="sr-only">— {lang === "ar" ? "القسم" : "section"}</span>
    </span>
  );
}
