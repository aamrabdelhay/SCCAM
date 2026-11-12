import { BookMarked } from "lucide-react";
import { getLang } from "@/lib/server-lang";
import { t } from "@/lib/i18n";
import { MyLibrary } from "@/components/library/MyLibrary";

export const metadata = { title: "My library" };

export default async function LibraryPage() {
  const lang = await getLang();
  return (
    <div className="container-x py-8">
      <header className="max-w-3xl">
        <p className="eyebrow">{t(lang, "footerResources")}</p>
        <h1 className="font-display mt-2 flex items-center gap-2 text-[26px] font-extrabold sm:text-[32px]">
          <BookMarked className="h-7 w-7 text-[var(--accent)]" aria-hidden="true" />
          {t(lang, "myLibrary")}
        </h1>
        <p className="mt-2 text-[13.5px] leading-relaxed text-[var(--muted)]">{t(lang, "myLibraryDesc")}</p>
      </header>
      <div className="mt-6">
        <MyLibrary lang={lang} />
      </div>
    </div>
  );
}
