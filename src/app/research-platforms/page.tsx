import { ExternalLink, Globe2, Landmark, Scale, Search } from "lucide-react";
import { getLang } from "@/lib/server-lang";

export const metadata = { title: "Research Platforms" };

const platforms = [
  {
    name: "International Arbitration Forum",
    region: "International arbitration",
    url: "https://arbitration.org/",
    ar: "قاعدة مستقلة غير ربحية للبحث في أحكام التحكيم والقرارات ومستندات القضايا. مفيدة كبداية للبحث عن اسم الأطراف أو الهيئة أو رقم القضية. راجع دائمًا المستند الأصلي وسياقه.",
    en: "An independent non-profit forum with searchable arbitral awards, decisions and case documents. Useful for starting research by party, tribunal or case number; always verify the underlying document and context.",
    tag: "Awards & decisions",
  },
  {
    name: "UNCITRAL CLOUT",
    region: "International commercial law",
    url: "https://uncitral.un.org/en/case_law",
    ar: "مصدر الأمم المتحدة لملخصات الأحكام التي تفسر أو تطبق نصوص الأونسيترال، ومنها اتفاقية نيويورك والقانون النموذجي. الملخصات متاحة باللغات الرسمية الست، ويرتبط بالنص الكامل للقرار عندما يكون متاحًا.",
    en: "The UN case-law system for decisions interpreting or applying UNCITRAL texts, including the New York Convention and Model Law. Abstracts are available in the six UN official languages, with links to full decisions where available.",
    tag: "UNCITRAL case law",
  },
  {
    name: "UNCITRAL Transparency Registry",
    region: "Investment arbitration / ISDS",
    url: "https://www.uncitral.org/transparency-registry/registry/",
    ar: "السجل الرسمي لوثائق قضايا التحكيم الاستثماري بين المستثمر والدولة التي تخضع لقواعد الشفافية أو تنطبق عليها الاتفاقية. يتيح مجانًا ملفات القضايا والقرارات والأحكام المنشورة، لكنه لا يشمل كل أنواع التحكيم.",
    en: "The official repository for treaty-based investor-State cases to which the Transparency Rules or Mauritius Convention apply. It provides free access to published case files, decisions and awards, but does not cover every form of arbitration.",
    tag: "ISDS documents",
  },
  {
    name: "ICSID Case Database",
    region: "Investment arbitration",
    url: "https://icsid.worldbank.org/resources/databases",
    ar: "قاعدة المركز الدولي لتسوية منازعات الاستثمار للبحث في القضايا بحسب المدعي أو الدولة أو بيانات أخرى، مع صفحات القضايا والمواد والقرارات المنشورة. بعض ملفات القضايا فقط تكون منشورة.",
    en: "The World Bank's ICSID case database supports searches by claimant, respondent and other filters, with case pages and published materials. Only materials designated for publication are available.",
    tag: "ICSID cases",
  },
  {
    name: "Permanent Court of Arbitration — Cases",
    region: "International arbitration",
    url: "https://pca-cpa.org/en/cases/",
    ar: "صفحات القضايا التي تديرها أو تقدم لها المحكمة الدائمة للتحكيم، وتتضمن بيانات الأطراف ورقم القضية والقواعد والوثائق المنشورة بحسب كل قضية. تختلف درجة الإتاحة من ملف لآخر.",
    en: "Case pages for proceedings administered or supported by the PCA, with party details, case numbers, applicable rules and documents published for each matter. Public availability varies by case.",
    tag: "PCA case records",
  },
  {
    name: "BAILII",
    region: "United Kingdom & Ireland",
    url: "https://www.bailii.org/",
    ar: "قاعدة مجانية للأحكام البريطانية والأيرلندية وبعض المواد التشريعية والقانونية. مفيدة لأحكام المحاكم العليا والاعتراف بأحكام التحكيم، لكن تغطيتها ليست شاملة لكل حكم بسبب قيود النشر وحقوق النشر.",
    en: "A free database of British and Irish judgments, legislation and legal materials. Useful for higher-court decisions and arbitration enforcement, but coverage is not exhaustive because of publication and copyright limits.",
    tag: "UK & Irish cases",
  },
  {
    name: "Find Case Law — The National Archives",
    region: "England & Wales",
    url: "https://caselaw.nationalarchives.gov.uk/",
    ar: "خدمة الأرشيف الوطني البريطاني للبحث مجانًا في الأحكام المنشورة للمحاكم والهيئات القضائية في إنجلترا وويلز، إضافة إلى المحكمة العليا ومجلس الملكة/الملك الخاص. لا تدّعي الخدمة أنها تضم كل الأحكام.",
    en: "The UK National Archives' free service for published judgments and tribunal decisions from England and Wales, plus UK Supreme Court and Privy Council decisions. The service does not claim to contain every judgment.",
    tag: "Official UK judgments",
  },
  {
    name: "CanLII",
    region: "Canada",
    url: "https://www.canlii.org/en/",
    ar: "مكتبة قانونية مجانية تضم أحكام المحاكم والهيئات الإدارية الكندية على المستوى الاتحادي والإقليمي، إلى جانب التشريعات. مفيدة للبحث في تنفيذ أحكام التحكيم ومراجعة السوابق والاستشهادات.",
    en: "A free legal information institute with Canadian federal, provincial and territorial court and tribunal decisions, alongside legislation. Useful for award enforcement, precedent research and citation trails.",
    tag: "Canadian case law",
  },
  {
    name: "AustLII & LawCite",
    region: "Australia and international citations",
    url: "https://www.austlii.edu.au/",
    ar: "مصدر مجاني للمواد القانونية الأسترالية، بما فيها أحكام المحاكم والهيئات والتشريعات. وتساعد أداة LawCite في تتبع الاستشهادات والأحكام التي ناقشت قرارًا سابقًا والروابط المتاحة للنصوص.",
    en: "A free source for Australian legal materials, including court and tribunal decisions and legislation. Its LawCite citator helps trace citations, later judicial consideration and available full-text copies.",
    tag: "Australasian cases",
  },
  {
    name: "CURIA — Court of Justice of the European Union",
    region: "European Union",
    url: "https://curia.europa.eu/en/content/juris/form.htm",
    ar: "محرك البحث الرسمي لأحكام وآراء وأوامر محكمة العدل ومحكمة الاتحاد الأوروبي العامة. مفيد خصوصًا للاختصاص القضائي الدولي، والاعتراف والتنفيذ، والنظام العام الأوروبي.",
    en: "The CJEU's official search for judgments, opinions and orders. Particularly useful for international jurisdiction, recognition and enforcement, and EU public-policy issues.",
    tag: "EU case law",
  },
  {
    name: "HUDOC — European Court of Human Rights",
    region: "European human-rights case law",
    url: "https://hudoc.echr.coe.int/eng",
    ar: "قاعدة المحكمة الأوروبية لحقوق الإنسان للأحكام والقرارات والآراء والملخصات القانونية. مصدر تكميلي عند بحث ضمانات المحاكمة العادلة أو المسائل الحقوقية ذات الصلة بالنظام العام، وليست قاعدة متخصصة في التحكيم التجاري.",
    en: "The European Court of Human Rights database of judgments, decisions, opinions and legal summaries. A supplementary source for fair-trial and human-rights questions relevant to public policy, not a commercial-arbitration database.",
    tag: "ECHR decisions",
  },
];

export default async function ResearchPlatformsPage() {
  const lang = await getLang();
  const ar = lang === "ar";
  return (
    <div className="container-x py-10">
      <header className="max-w-3xl">
        <p className="eyebrow">{ar ? "أدوات الباحث" : "Research tools"}</p>
        <h1 className="font-display mt-2 flex items-center gap-2 text-[28px] font-extrabold sm:text-[36px]">
          <Globe2 className="h-7 w-7 text-[var(--accent)]" aria-hidden="true" />
          {ar ? "منصات البحث في السوابق القضائية" : "Case-law research platforms"}
        </h1>
        <p className="mt-3 text-[13.5px] leading-8 text-[var(--muted)]">
          {ar
            ? "مجموعة من قواعد البيانات المفتوحة والمصادر الرسمية للعثور على الأحكام والقرارات والوثائق ذات الصلة بالتحكيم والقانون الدولي الخاص."
            : "A collection of open databases and official sources for judgments, decisions and documents relevant to arbitration and private international law."}
        </p>
      </header>

      <div className="mt-5 flex flex-wrap gap-2">
        <span className="chip"><Scale className="h-3.5 w-3.5" />{ar ? "أحكام وقرارات" : "Judgments & decisions"}</span>
        <span className="chip"><Landmark className="h-3.5 w-3.5" />{ar ? "مصادر رسمية ومؤسسية" : "Official & institutional sources"}</span>
        <span className="chip"><Search className="h-3.5 w-3.5" />{ar ? "وصول مجاني" : "Free access"}</span>
      </div>

      <div className="mt-7 grid gap-4 md:grid-cols-2">
        {platforms.map((platform, index) => (
          <article key={platform.name} className="card card-hover flex flex-col p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold tracking-widest text-[var(--accent)]">{String(index + 1).padStart(2, "0")}</p>
                <h2 className="mt-1 text-[16px] font-extrabold">{platform.name}</h2>
                <p className="mt-1 text-[11px] font-semibold text-[var(--secondary)]">{platform.region}</p>
              </div>
              <span className="rounded-full bg-[var(--primary-soft)] px-2.5 py-1 text-[10px] font-bold text-[var(--primary)]">{platform.tag}</span>
            </div>
            <p className="mt-4 flex-1 text-[13px] leading-8 text-[var(--muted)]">{ar ? platform.ar : platform.en}</p>
            <a href={platform.url} target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-sm mt-5 inline-flex w-fit gap-2">
              {ar ? "افتح المنصة" : "Open platform"} <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            </a>
          </article>
        ))}
      </div>

      <aside className="mt-8 rounded-2xl border border-[var(--line)] p-5" style={{ background: "color-mix(in srgb, var(--accent) 10%, var(--bg))" }}>
        <h2 className="text-[14px] font-extrabold">{ar ? "تنبيه عند الاستشهاد" : "Before citing a case"}</h2>
        <p className="mt-2 text-[12.5px] leading-8 text-[var(--muted)]">
          {ar
            ? "المجانية لا تعني أن قاعدة البيانات شاملة أو أن كل وثيقة منشورة رسمية ونهائية. تحقّق من المحكمة أو المؤسسة المصدرة، والنص الأصلي، والتاريخ، والمرحلة الإجرائية، وأي طعن أو إلغاء لاحق."
            : "Free access does not mean a database is exhaustive or that every document is an official final version. Verify the issuing court or institution, original text, date, procedural stage, and any subsequent appeal or annulment."}
        </p>
      </aside>
    </div>
  );
}
