import { getLang } from "@/lib/server-lang";
import { getSiteSettings } from "@/lib/queries";
import { t } from "@/lib/i18n";
import { SettingsForm } from "@/components/admin/SettingsForm";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const [lang, settings] = await Promise.all([getLang(), getSiteSettings()]);
  return (
    <div className="space-y-4">
      <h2 className="text-[16px] font-extrabold">{t(lang, "adminSettings")}</h2>
      <SettingsForm lang={lang} settings={settings} />
    </div>
  );
}
