import Link from "next/link";
import { getLang } from "@/lib/server-lang";
import { getCategories, getSections } from "@/lib/queries";
import { t } from "@/lib/i18n";
import { pickText } from "@/lib/format";
import { NewFileForm } from "@/components/admin/NewFileForm";

export const dynamic = "force-dynamic";

export default async function NewFilePage() {
  const lang = await getLang();
  const [sections, categories] = await Promise.all([getSections(), getCategories()]);
  const options = sections.map((s) => ({
    id: s.id,
    name: pickText(lang, s.name_ar, s.name_en),
    categories: categories.filter((c) => c.section_id === s.id).map((c) => ({ id: c.id, name: pickText(lang, c.name_ar, c.name_en) })),
  }));

  return (
    <div className="space-y-3">
      <Link href="/admin/files" className="text-[11.5px] font-semibold text-[var(--muted)] hover:underline">
        ← {t(lang, "adminFiles")}
      </Link>
      <NewFileForm lang={lang} sections={options} />
    </div>
  );
}
