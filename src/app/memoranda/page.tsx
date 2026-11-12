import Link from "next/link";
import { FileText, SearchCheck } from "lucide-react";
import { getLang } from "@/lib/server-lang";
import { listFiles } from "@/lib/queries";
import { FileCard } from "@/components/FileCard";

export const dynamic = "force-dynamic";
export const metadata = { title: "Best Memoranda" };

export default async function MemorandaPage() {
  const lang = await getLang();
  const ar = lang === "ar";
  const files = await listFiles({ limit: 500 });
  const memoranda = files
    .filter((file) => /(?:مذكر(?:ة|ات)|memorials?|memorand(?:um|a)|skeleton\s+argument)/i.test(
      [file.title_ar, file.title_en, file.description_ar, file.description_en, file.tags].join(" "),
    ))
    .sort((a, b) => Number(b.pinned) - Number(a.pinned) || Number(b.views) - Number(a.views) || a.sort_order - b.sort_order);

  return (
    <div className="container-x py-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-3xl">
          <p className="eyebrow">{ar ? "مواد المنافسة" : "Competition materials"}</p>
          <h1 className="font-display mt-2 flex items-center gap-2 text-[28px] font-extrabold sm:text-[36px]">
            <FileText className="h-7 w-7 text-[var(--accent)]" aria-hidden="true" />
            {ar ? "أفضل المذكرات" : "Best memoranda"}
          </h1>
          <p className="mt-3 text-[13.5px] leading-8 text-[var(--muted)]">
            {ar
              ? "تجميع تلقائي للمذكرات والمرافعات المنشورة داخل المكتبة. يظهر المحتوى حسب بيانات الملفات الحالية دون تغيير ترتيبها الأصلي."
              : "Automatically collected memoranda and written submissions published in the library. The original file order and records are not modified."}
          </p>
        </div>
        <span className="rounded-full border border-[var(--line)] bg-[var(--card)] px-3 py-1.5 text-[12px] font-bold text-[var(--muted)]">
          {memoranda.length} {ar ? "ملف" : "files"}
        </span>
      </header>

      <div className="mt-7 grid gap-3 sm:grid-cols-2">
        {memoranda.map((file) => <FileCard key={file.id} file={file} lang={lang} showSection />)}
      </div>

      {memoranda.length === 0 && (
        <div className="card mt-7 p-8 text-center">
          <SearchCheck className="mx-auto h-9 w-9 text-[var(--primary)]" aria-hidden="true" />
          <h2 className="mt-3 text-[16px] font-extrabold">{ar ? "لا توجد مذكرات مطابقة حتى الآن" : "No matching memoranda yet"}</h2>
          <p className="mx-auto mt-2 max-w-xl text-[13px] leading-7 text-[var(--muted)]">
            {ar
              ? "سيظهر أي ملف منشور يحمل في عنوانه أو وصفه كلمات مثل «مذكرة» أو Memorial أو Memorandum هنا تلقائيًا. يمكن الوصول إلى بقية المستندات من أقسام المكتبة."
              : "Published files whose title or description identifies them as a memorial or memorandum will appear here automatically. Other documents remain available in the library sections."}
          </p>
          <Link href="/case" className="btn btn-primary mt-5">{ar ? "تصفح ملف القضية" : "Browse case materials"}</Link>
        </div>
      )}
    </div>
  );
}
