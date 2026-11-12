import Link from "next/link";
import { HelpCircle } from "lucide-react";
import { getLang } from "@/lib/server-lang";
import { getFaqs } from "@/lib/queries";
import { t } from "@/lib/i18n";
import { FaqAccordion } from "@/components/FaqAccordion";

export const dynamic = "force-dynamic";
export const metadata = { title: "FAQ" };

export default async function FaqPage() {
  const [lang, faqs] = await Promise.all([getLang(), getFaqs()]);
  return (
    <div className="container-x py-8">
      <div className="mx-auto max-w-3xl">
        <p className="eyebrow">{t(lang, "footerResources")}</p>
        <h1 className="font-display mt-2 flex items-center gap-2 text-[26px] font-extrabold sm:text-[32px]">
          <HelpCircle className="h-7 w-7 text-[var(--accent)]" aria-hidden="true" />
          {t(lang, "faqTitle")}
        </h1>
        <p className="mt-2 text-[13.5px] text-[var(--muted)]">{t(lang, "faqSubtitle")}</p>
        <div className="mt-6">
          <FaqAccordion items={faqs} lang={lang} />
        </div>
        <div className="mt-5 flex gap-2">
          <Link href="/contact" className="btn btn-primary">
            {t(lang, "askAdmin")}
          </Link>
          <Link href="/search" className="btn btn-outline">
            {t(lang, "searchGlobal")}
          </Link>
        </div>
      </div>
    </div>
  );
}
