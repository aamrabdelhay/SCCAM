import { getLang } from "@/lib/server-lang";
import { getCategoriesWithCounts, getSections, listFiles } from "@/lib/queries";
import { t } from "@/lib/i18n";
import { pickText } from "@/lib/format";
import { TaxonomyManager } from "@/components/admin/TaxonomyManager";

export const dynamic = "force-dynamic";

export default async function AdminTaxonomyPage() {
  const lang = await getLang();
  const sections = await getSections();
  const withCats = await Promise.all(sections.map((s) => getCategoriesWithCounts(s.id)));
  const files = await listFiles({ includeHidden: true, limit: 1000 });

  return (
    <div className="space-y-4">
      <h2 className="text-[16px] font-extrabold">{t(lang, "adminTaxonomy")}</h2>
      <TaxonomyManager
        lang={lang}
        sections={sections.map((s, i) => ({
          id: s.id,
          slug: s.slug,
          nameAr: s.name_ar,
          nameEn: s.name_en,
          descriptionAr: s.description_ar,
          descriptionEn: s.description_en,
          accent: s.accent,
          count: files.filter((f) => f.section_id === s.id).length,
          categories: (withCats[i] ?? []).map((c) => ({
            id: c.id,
            name: pickText(lang, c.name_ar, c.name_en),
            slug: c.slug,
          })),
        }))}
      />
    </div>
  );
}
