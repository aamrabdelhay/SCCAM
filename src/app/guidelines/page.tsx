import Link from "next/link";
import { Compass, FileText } from "lucide-react";
import { getLang } from "@/lib/server-lang";
import { listFiles } from "@/lib/queries";
import { FileCard } from "@/components/FileCard";

export const dynamic = "force-dynamic";
export const metadata = { title: "Guidelines" };

export default async function GuidelinesPage() {
  const lang = await getLang();
  const ar = lang === "ar";
  const allFiles = await listFiles({ limit: 1000 });
  const guides = allFiles.filter((file) =>
    /إرشاد|ارشاد|guideline|guidance|research guide/i.test(
      [file.title_ar, file.title_en, file.description_ar, file.description_en, file.tags].join(" "),
    ),
  );

  return (
    <div className="container-x py-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-3xl">
          <p className="eyebrow">{ar ? "محتوى يضاف من الإدارة" : "Admin-managed content"}</p>
          <h1 className="font-display mt-2 flex items-center gap-2 text-[28px] font-extrabold sm:text-[36px]">
            <Compass className="h-7 w-7 text-[var(--sky)]" aria-hidden="true" />
            {ar ? "الإرشادات" : "Guidelines"}
          </h1>
          <p className="mt-3 text-[13.5px] leading-8 text-[var(--muted)]">
            {ar
              ? "هذا القسم مخصص للملفات التي ترفعها وتحددها كإرشادات من لوحة الإدارة. لن تُضاف إليه مواد تلقائيًا."
              : "This section is reserved for files you upload and identify as guidelines in the admin panel. No material is added automatically."}
          </p>
        </div>
        <Link href="/admin" className="btn btn-primary btn-sm">{ar ? "إضافة ملفات من الإدارة" : "Add files in admin"}</Link>
      </header>

      {guides.length > 0 ? (
        <div className="mt-7 grid gap-3 sm:grid-cols-2">
          {guides.map((file) => <FileCard key={file.id} file={file} lang={lang} showSection />)}
        </div>
      ) : (
        <div className="card mt-7 p-8 text-center">
          <FileText className="mx-auto h-9 w-9 text-[var(--sky)]" aria-hidden="true" />
          <h2 className="mt-3 text-[16px] font-extrabold">{ar ? "القسم جاهز لإضافاتك" : "Ready for your uploads"}</h2>
          <p className="mx-auto mt-2 max-w-xl text-[13px] leading-7 text-[var(--muted)]">
            {ar
              ? "ارفع ملفات الإرشادات من لوحة الإدارة، واجعل كلمة «إرشادات» في العنوان أو الوصف أو الوسوم حتى تظهر هنا."
              : "Upload guidelines through the admin panel and include “Guidelines” in the title, description or tags so they appear here."}
          </p>
          <Link href="/admin" className="btn btn-primary mt-5">{ar ? "فتح لوحة الإدارة" : "Open admin"}</Link>
        </div>
      )}
    </div>
  );
}
