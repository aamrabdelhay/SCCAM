import Link from "next/link";
import { Compass, FileText, LockKeyhole } from "lucide-react";
import { getLang } from "@/lib/server-lang";
import { listFiles } from "@/lib/queries";
import { FileCard } from "@/components/FileCard";

export const dynamic = "force-dynamic";
export const metadata = { title: "Guidelines" };

export default async function GuidelinesPage() {
  const lang = await getLang();
  const ar = lang === "ar";
  const allFiles = await listFiles({ limit: 1000 });
  const files = allFiles.filter((file) =>
    /(?:إرشادات|ارشادات|الإرشادات|guidelines?|instructions?)/i.test(
      [file.title_ar, file.title_en, file.description_ar, file.description_en, file.tags].join(" "),
    ),
  );

  return (
    <div className="container-x py-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-3xl">
          <p className="eyebrow">{ar ? "ملفات المكتبة" : "Library files"}</p>
          <h1 className="font-display mt-2 flex items-center gap-2 text-[28px] font-extrabold sm:text-[36px]">
            <Compass className="h-7 w-7 text-[var(--brand-blue)]" aria-hidden="true" />
            {ar ? "الإرشادات" : "Guidelines"}
          </h1>
          <p className="mt-3 text-[13.5px] leading-8 text-[var(--muted)]">
            {ar
              ? "هذا القسم مخصص للملفات التي تضيفها أنت من لوحة الإدارة. لا توجد مواد افتراضية أو ملفات تجريبية."
              : "This section is reserved for files you add through the admin panel. No sample or pre-filled documents are included."}
          </p>
        </div>
        <span className="rounded-full border border-[var(--line)] bg-[var(--card)] px-3 py-1.5 text-[12px] font-bold text-[var(--muted)]">
          {files.length} {ar ? "ملف" : "files"}
        </span>
      </header>

      {files.length > 0 ? (
        <div className="mt-7 grid gap-3 sm:grid-cols-2">
          {files.map((file) => <FileCard key={file.id} file={file} lang={lang} showSection />)}
        </div>
      ) : (
        <div className="card mt-7 flex flex-col items-center p-9 text-center">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-[var(--primary-soft)] text-[var(--primary)]">
            <FileText className="h-7 w-7" aria-hidden="true" />
          </span>
          <h2 className="mt-4 text-[16px] font-extrabold">{ar ? "القسم جاهز لاستقبال ملفاتك" : "This section is ready for your files"}</h2>
          <p className="mt-2 max-w-xl text-[13px] leading-8 text-[var(--muted)]">
            {ar
              ? "ارفع ملفات الإرشادات من لوحة الإدارة، وأضف كلمة «إرشادات» في العنوان أو الوسوم حتى تظهر هنا تلقائيًا."
              : "Upload your guidance documents through the admin panel and include “Guidelines” in the title or tags so they appear here automatically."}
          </p>
          <Link href="/admin" className="btn btn-primary mt-5">
            <LockKeyhole className="h-4 w-4" aria-hidden="true" />{ar ? "إضافة ملفات من لوحة الإدارة" : "Add files in admin"}
          </Link>
        </div>
      )}
    </div>
  );
}
