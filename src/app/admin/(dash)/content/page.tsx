import { getLang } from "@/lib/server-lang";
import { getDeadlines, getFaqs, getNews } from "@/lib/queries";
import { t } from "@/lib/i18n";
import { ContentManager } from "@/components/admin/ContentManager";

export const dynamic = "force-dynamic";

export default async function AdminContentPage() {
  const [lang, news, faqs, deadlines] = await Promise.all([getLang(), getNews(50), getFaqs(), getDeadlines()]);
  return (
    <div className="space-y-4">
      <h2 className="text-[16px] font-extrabold">{t(lang, "adminNews")} · {t(lang, "adminFaq")} · {t(lang, "adminDeadlines")}</h2>
      <ContentManager lang={lang} news={news} faqs={faqs} deadlines={deadlines} />
    </div>
  );
}
