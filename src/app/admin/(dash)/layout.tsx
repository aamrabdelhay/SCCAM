import { redirect } from "next/navigation";
import { adminExists, getSession } from "@/lib/auth";
import { getLang } from "@/lib/server-lang";
import { one } from "@/lib/db";
import { AdminShell } from "@/components/admin/AdminShell";

export const dynamic = "force-dynamic";

export default async function AdminDashLayout({ children }: { children: React.ReactNode }) {
  if (!(await adminExists())) redirect("/admin/setup");
  const session = await getSession();
  if (!session) redirect("/admin/login");
  const lang = await getLang();
  const me = await one<{ username: string }>("SELECT username FROM admin_users WHERE id = ?", [session.sub]);

  return (
    <AdminShell lang={lang} username={me?.username ?? "admin"}>
      {children}
    </AdminShell>
  );
}
