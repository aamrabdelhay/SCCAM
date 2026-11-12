import Link from "next/link";
import { FileQuestion } from "lucide-react";
import { getLang } from "@/lib/server-lang";
import { t } from "@/lib/i18n";
import { SearchBox } from "@/components/SearchBox";

export default async function NotFound() {
  const lang = await getLang();
  return (
    <div className="container-x flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
      <span className="grid h-16 w-16 place-items-center rounded-2xl bg-[var(--surface)] text-[var(--muted)]">
        <FileQuestion className="h-7 w-7" aria-hidden="true" />
      </span>
      <h1 className="font-display mt-4 text-[22px] font-extrabold">{t(lang, "pageNotFound")}</h1>
      <p className="mt-2 max-w-md text-[13px] leading-relaxed text-[var(--muted)]">{t(lang, "notFoundDesc")}</p>
      <div className="mt-6 w-full max-w-lg">
        <SearchBox lang={lang} />
      </div>
      <div className="mt-5 flex gap-2">
        <Link href="/" className="btn btn-primary">
          {t(lang, "goHome")}
        </Link>
        <Link href="/case" className="btn btn-outline">
          {t(lang, "navCase")}
        </Link>
      </div>
    </div>
  );
}
