import Link from "next/link";
import { getLang } from "@/lib/server-lang";
import { t } from "@/lib/i18n";
import { UploadPanel } from "@/components/admin/UploadPanel";

export const dynamic = "force-dynamic";

export default async function NewFilePage() {
  const lang = await getLang();
  return (
    <div className="space-y-3">
      <Link href="/admin/files" className="text-[11.5px] font-semibold text-[var(--muted)] hover:underline">
        ← {t(lang, "adminFiles")}
      </Link>
      <UploadPanel lang={lang} />
    </div>
  );
}
