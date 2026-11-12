import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { adminExists, getSession } from "@/lib/auth";
import { getLang } from "@/lib/server-lang";
import { t } from "@/lib/i18n";
import { SetupForm } from "@/components/admin/AuthForms";

export const dynamic = "force-dynamic";

export default async function AdminSetupPage() {
  const lang = await getLang();
  if (await adminExists()) redirect((await getSession()) ? "/admin" : "/admin/login");

  return (
    <div className="container-x flex min-h-[70vh] items-center justify-center py-10">
      <div className="card w-full max-w-md p-6">
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-[var(--primary-soft)] text-[var(--primary)] dark:text-[var(--accent)]">
          <ShieldCheck className="h-5 w-5" aria-hidden="true" />
        </span>
        <h1 className="font-display mt-3 text-[19px] font-extrabold">{t(lang, "adminSetup")}</h1>
        <p className="mt-1 text-[12.5px] leading-relaxed text-[var(--muted)]">{t(lang, "adminSetupIntro")}</p>
        <div className="mt-4">
          <SetupForm lang={lang} />
        </div>
      </div>
    </div>
  );
}
