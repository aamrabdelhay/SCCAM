import { Mail, MessageSquare, ShieldAlert } from "lucide-react";
import { getLang } from "@/lib/server-lang";
import { getSiteSettings } from "@/lib/queries";
import { t } from "@/lib/i18n";
import { ContactForm } from "@/components/ContactForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Contact" };

export default async function ContactPage() {
  const [lang, settings] = await Promise.all([getLang(), getSiteSettings()]);
  return (
    <div className="container-x py-8">
      <div className="mx-auto max-w-3xl">
        <p className="eyebrow">{t(lang, "navContact")}</p>
        <h1 className="font-display mt-2 flex items-center gap-2 text-[26px] font-extrabold sm:text-[32px]">
          <MessageSquare className="h-7 w-7 text-[var(--accent)]" aria-hidden="true" />
          {t(lang, "contactTitle")}
        </h1>
        <p className="mt-2 text-[13.5px] leading-relaxed text-[var(--muted)]">{t(lang, "contactDesc")}</p>

        <div className="mt-6 grid gap-4 sm:grid-cols-[1.6fr_1fr]">
          <div className="card p-5">
            <ContactForm lang={lang} />
          </div>
          <div className="space-y-3">
            <div className="card p-4">
              <h2 className="flex items-center gap-2 text-[13px] font-bold">
                <Mail className="h-4 w-4 text-[var(--accent)]" aria-hidden="true" />
                {t(lang, "footerContact")}
              </h2>
              <a href={`mailto:${settings.contact_email}`} className="mt-1.5 block text-[12.5px] font-semibold link" dir="ltr">
                {settings.contact_email}
              </a>
            </div>
            <div className="card p-4">
              <h2 className="flex items-center gap-2 text-[13px] font-bold">
                <ShieldAlert className="h-4 w-4 text-[var(--accent)]" aria-hidden="true" />
                {t(lang, "unofficialShort")}
              </h2>
              <p className="mt-1.5 text-[11.5px] leading-relaxed text-[var(--muted)]">
                {lang === "ar" ? settings.notice_ar : settings.notice_en}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
