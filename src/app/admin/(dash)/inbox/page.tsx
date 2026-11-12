import { getLang } from "@/lib/server-lang";
import { all } from "@/lib/db";
import { t } from "@/lib/i18n";
import { InboxList } from "@/components/admin/InboxList";

export const dynamic = "force-dynamic";

export default async function AdminInboxPage() {
  const lang = await getLang();
  const messages = await all<{
    id: string;
    kind: string;
    file_id: string | null;
    page_no: number | null;
    name: string;
    email: string;
    message: string;
    status: string;
    created_at: string;
  }>("SELECT * FROM inbox_messages ORDER BY CASE WHEN status = 'open' THEN 0 ELSE 1 END, created_at DESC LIMIT 200");

  return (
    <div className="space-y-3">
      <h2 className="text-[16px] font-extrabold">{t(lang, "adminInbox")}</h2>
      <InboxList lang={lang} messages={messages} />
    </div>
  );
}
