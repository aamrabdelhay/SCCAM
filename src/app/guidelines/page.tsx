import Link from "next/link";
import { BookOpenCheck, Search, Scale, FileCheck2, Quote, ShieldCheck, Bookmark } from "lucide-react";
import { getLang } from "@/lib/server-lang";

export const metadata = { title: "Guidelines" };

const guides = [
  {
    icon: BookOpenCheck,
    arTitle: "ابدأ من ملف القضية",
    enTitle: "Start with the case file",
    arText: "اقرأ ملف القضية ومرفقاته أولًا لتحديد الوقائع والتواريخ والأطراف والمسائل القانونية. احتفظ برقم الصفحة أو الفقرة لكل واقعة تستند إليها.",
    enText: "Read the case file and its annexes first. Identify the facts, dates, parties and legal issues, and record the exact page or paragraph for every fact you rely on.",
  },
  {
    icon: Search,
    arTitle: "ابحث بأكثر من صياغة",
    enTitle: "Search with more than one formulation",
    arText: "جرّب المصطلح العربي والإنجليزي، والمرادفات، واسم الاتفاقية أو رقم المادة. استخدم عبارة قصيرة دقيقة ثم وسّع البحث عند الحاجة، ولا تعتمد على نتيجة واحدة.",
    enText: "Try Arabic and English terms, synonyms, treaty names and article numbers. Begin with a precise phrase, broaden the search when needed, and do not rely on a single result.",
  },
  {
    icon: Scale,
    arTitle: "تحقق من حجية السابقة",
    enTitle: "Check the weight of each precedent",
    arText: "حدّد المحكمة أو هيئة التحكيم، والاختصاص، وتاريخ القرار، ومرحلة الدعوى، وما إذا كان القرار قد أُلغي أو عُدّل أو طُعن عليه. لا تخلط بين ملخص القضية والنص الكامل للحكم.",
    enText: "Identify the court or tribunal, jurisdiction, decision date and procedural stage. Check whether the decision was set aside, amended or appealed. Do not confuse a case summary with the full judgment.",
  },
  {
    icon: FileCheck2,
    arTitle: "استخدم المذكرات كنقطة انطلاق",
    enTitle: "Use memoranda as a starting point",
    arText: "استفد من طريقة بناء الحجة وتقسيم المسائل، لكن ارجع دائمًا إلى الحكم أو التشريع أو الاتفاقية الأصلية للتحقق من كل اقتباس ومبدأ قانوني.",
    enText: "Learn from the structure and issue framing, but always return to the original judgment, statute or treaty to verify every quotation and legal proposition.",
  },
  {
    icon: Quote,
    arTitle: "وثّق المصدر بدقة",
    enTitle: "Cite sources precisely",
    arText: "دوّن اسم القضية، ورقمها، والمحكمة، والتاريخ، والفقرة أو الصفحة، والرابط الأصلي. عند الاقتباس الحرفي، راجع النص الأصلي ولا تنقل الاقتباس من ملخص ثانوي.",
    enText: "Record the case name, number, court, date, paragraph or page, and original URL. Verify quotations against the primary source rather than a secondary summary.",
  },
  {
    icon: ShieldCheck,
    arTitle: "راجع النسخة وحقوق الوصول",
    enTitle: "Check version and access rights",
    arText: "قد تختلف النسخ المنشورة أو الترجمات. فضّل المصدر الرسمي، وتحقق من تاريخ التحديث. لا تستخدم كتابًا أو مستندًا محميًا إلا من مصدر يتيح الوصول إليه بصورة مشروعة.",
    enText: "Published versions and translations may differ. Prefer the official source and check its update date. Use copyrighted books or documents only through a source that lawfully provides access.",
  },
];

export default async function GuidelinesPage() {
  const lang = await getLang();
  const ar = lang === "ar";
  return (
    <div className="container-x py-10">
      <header className="max-w-3xl">
        <p className="eyebrow">{ar ? "دليل الباحث" : "Researcher guide"}</p>
        <h1 className="font-display mt-2 text-[28px] font-extrabold sm:text-[36px]">{ar ? "الإرشادات" : "Guidelines"}</h1>
        <p className="mt-3 text-[14px] leading-8 text-[var(--muted)]">
          {ar
            ? "خطوات عملية للوصول إلى المستندات، والبحث عن السوابق القضائية، وبناء حجة قانونية قابلة للتحقق."
            : "Practical steps for finding documents, researching case law, and building verifiable legal arguments."}
        </p>
      </header>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {guides.map((item, index) => (
          <article key={item.arTitle} className="card p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-xl" style={{ background: "var(--primary-soft)", color: "var(--primary)" }}>
                <item.icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <p className="text-[10px] font-bold tracking-widest text-[var(--accent)]">{String(index + 1).padStart(2, "0")}</p>
                <h2 className="text-[16px] font-extrabold">{ar ? item.arTitle : item.enTitle}</h2>
              </div>
            </div>
            <p className="mt-4 text-[13px] leading-8 text-[var(--muted)]">{ar ? item.arText : item.enText}</p>
          </article>
        ))}
      </div>

      <section className="mt-8 rounded-2xl border border-[var(--line)] p-5 sm:p-6" style={{ background: "linear-gradient(120deg, color-mix(in srgb, var(--primary) 8%, var(--bg)), color-mix(in srgb, var(--accent) 12%, var(--bg)))" }}>
        <div className="flex items-start gap-3">
          <Bookmark className="mt-1 h-5 w-5 shrink-0 text-[var(--primary)]" />
          <div>
            <h2 className="text-[16px] font-extrabold">{ar ? "مسارات سريعة" : "Quick research paths"}</h2>
            <p className="mt-1 text-[12.5px] leading-7 text-[var(--muted)]">
              {ar ? "انتقل مباشرة إلى المذكرات أو قواعد السوابق أو قائمة المراجع المتخصصة." : "Go directly to memoranda, case-law databases or the specialist bibliography."}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link className="btn btn-primary btn-sm" href="/memoranda">{ar ? "أفضل المذكرات" : "Best memoranda"}</Link>
              <Link className="btn btn-outline btn-sm" href="/research-platforms">{ar ? "منصات البحث" : "Research platforms"}</Link>
              <Link className="btn btn-outline btn-sm" href="/references">{ar ? "المراجع" : "References"}</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
