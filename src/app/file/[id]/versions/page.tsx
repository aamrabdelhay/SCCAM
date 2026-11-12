import Link from "next/link";
import { notFound } from "next/navigation";
import { GitCompare, ArrowLeft, ArrowRight } from "lucide-react";
import { getLang } from "@/lib/server-lang";
import { getFile, getVersions, getVersionText } from "@/lib/queries";
import { t } from "@/lib/i18n";
import { formatDate, pickText } from "@/lib/format";
import { diffLines, diffStats } from "@/lib/diff";
import { FilterSelect } from "@/components/FilterSelect";

export const dynamic = "force-dynamic";

export default async function VersionsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const lang = await getLang();
  const file = await getFile(id, true);
  if (!file) notFound();
  const versions = await getVersions(id);
  if (!versions.length) notFound();

  const requested1 = Number(sp.v1);
  const requested2 = Number(sp.v2);
  const newer = versions.find((v) => v.version === requested1) ?? versions[0];
  const older =
    versions.find((v) => v.version === requested2) ??
    versions.find((v) => v.version !== newer.version) ??
    newer;

  const [newText, oldText] = await Promise.all([
    getVersionText(id, newer.version, file.current_version),
    getVersionText(id, older.version, file.current_version),
  ]);
  const ops = diffLines(oldText, newText);
  const stats = diffStats(ops);
  const title = pickText(lang, file.title_ar, file.title_en);
  const Back = lang === "ar" ? ArrowRight : ArrowLeft;

  const options = versions.map((v) => ({ value: String(v.version), label: `v${v.version} · ${formatDate(v.created_at, lang)}` }));
  const visible = ops.slice(0, 1200);

  return (
    <div className="container-x py-8">
      <nav className="text-[11.5px] text-[var(--muted)]">
        <Link href={`/file/${id}`} className="inline-flex items-center gap-1 hover:text-[var(--text)]">
          <Back className="h-3.5 w-3.5" /> {t(lang, "backToFile")}
        </Link>
      </nav>
      <header className="mt-3">
        <h1 className="font-display flex items-center gap-2 text-[24px] font-extrabold">
          <GitCompare className="h-6 w-6 text-[var(--accent)]" aria-hidden="true" />
          {t(lang, "compareVersions")}
        </h1>
        <p className="mt-1 text-[13px] text-[var(--muted)]">
          {title} — {t(lang, "compareVersionsDesc")}
        </p>
      </header>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="text-[11.5px] font-bold text-[var(--muted)]">{t(lang, "version")} A</span>
        <FilterSelect label="v1" param="v1" basePath={`/file/${id}/versions`} options={options} />
        <span className="text-[11.5px] font-bold text-[var(--muted)]">{t(lang, "version")} B</span>
        <FilterSelect label="v2" param="v2" basePath={`/file/${id}/versions`} options={options} />
        <div className="ms-auto flex gap-2 text-[11.5px] font-bold">
          <span className="rounded-md bg-[color-mix(in_srgb,#1a7f37_18%,var(--bg))] px-2 py-1 text-[#1a7f37] dark:text-[#7ee2a8]">
            +{stats.added} {t(lang, "addedLines")}
          </span>
          <span className="rounded-md bg-[color-mix(in_srgb,#b3261e_14%,var(--bg))] px-2 py-1 text-[#b3261e] dark:text-[#ff8a80]">
            −{stats.removed} {t(lang, "removedLines")}
          </span>
        </div>
      </div>

      {oldText === newText ? (
        <div className="card mt-5 p-6 text-center text-[13px] text-[var(--muted)]">
          {t(lang, "unchanged")} — v{older.version} ↔ v{newer.version}
        </div>
      ) : (
        <div className="mt-4 overflow-hidden rounded-2xl border border-[var(--line)]">
          <div className="grid grid-cols-2 border-b border-[var(--line)] bg-[var(--surface)] text-[10.5px] font-bold uppercase tracking-wide text-[var(--muted)]">
            <div className="px-3 py-2">v{older.version}</div>
            <div className="px-3 py-2">v{newer.version}</div>
          </div>
          <div className="max-h-[70vh] overflow-auto bg-[var(--card)] font-mono text-[11.5px] leading-relaxed" dir="auto">
            {visible.map((op, i) => (
              <div
                key={i}
                className={
                  op.type === "add"
                    ? "bg-[color-mix(in_srgb,#1a7f37_12%,transparent)] text-[#1a7f37] dark:text-[#8ff0b5]"
                    : op.type === "remove"
                      ? "bg-[color-mix(in_srgb,#b3261e_12%,transparent)] text-[#b3261e] dark:text-[#ffb4ad]"
                      : "text-[var(--muted)]"
                }
              >
                <span className="inline-block w-10 shrink-0 select-none px-2 text-end opacity-50">
                  {op.type === "add" ? op.bLine : op.aLine ?? ""}
                </span>
                <span className="whitespace-pre-wrap">
                  {op.type === "add" ? "+ " : op.type === "remove" ? "− " : "  "}
                  {op.text}
                </span>
              </div>
            ))}
            {ops.length > visible.length && (
              <p className="px-3 py-2 text-[11px] italic text-[var(--muted)]">… {ops.length - visible.length}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
