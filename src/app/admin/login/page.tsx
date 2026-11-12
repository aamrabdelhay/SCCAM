import { redirect } from "next/navigation";
import { LockKeyhole } from "lucide-react";
import { adminExists, getSession } from "@/lib/auth";
import { getLang } from "@/lib/server-lang";
import { t } from "@/lib/i18n";
import { LoginForm } from "@/components/admin/AuthForms";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  const lang = await getLang();
  if (!(await adminExists())) redirect("/admin/setup");
  if (await getSession()) redirect("/admin");

  return (
    <div className="container-x flex min-h-[70vh] items-center justify-center py-10">
      <div className="card w-full max-w-sm p-6">
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-[var(--primary-soft)] text-[var(--primary)] dark:text-[var(--accent)]">
          <LockKeyhole className="h-5 w-5" aria-hidden="true" />
        </span>
        <h1 className="font-display mt-3 text-[19px] font-extrabold">{t(lang, "adminLogin")}</h1>
        <p className="mt-1 text-[12.5px] text-[var(--muted)]">{t(lang, "adminLoginIntro")}</p>
        <div className="mt-4">
          <LoginForm lang={lang} />
        </div>
      </div>
    </div>
  );
}
