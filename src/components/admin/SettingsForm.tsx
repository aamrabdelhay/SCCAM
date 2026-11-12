"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, Loader2, KeyRound, Download, Palette, Globe, Megaphone, Share2, Clock3 } from "lucide-react";
import { t } from "@/lib/i18n";
import type { Lang, SettingsMap } from "@/lib/types";
import { adminJson, adminFetch } from "@/lib/admin-client";

export function SettingsForm({ lang, settings }: { lang: Lang; settings: SettingsMap }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const values: Record<string, string> = {};
    form.forEach((v, k) => {
      if (k.startsWith("settings.")) values[k.slice(9)] = String(v);
    });
    // unchecked checkboxes are absent from FormData — force them off
    ["announcement_enabled"].forEach((k) => {
      if (!(k in values)) values[k] = "0";
    });
    setBusy("settings");
    const res = await adminJson("/api/admin/settings", "POST", { values });
    setBusy(null);
    setMessage(res.ok ? t(lang, "adminSettingsSaved") : t(lang, "error"));
    router.refresh();
  }

  async function changePassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const next = String(form.get("next") ?? "");
    if (next.length < 10) return setMessage(t(lang, "adminPasswordShort"));
    setBusy("password");
    const res = await adminJson("/api/admin/account", "POST", { current: form.get("current"), next });
    setBusy(null);
    setMessage(res.ok ? t(lang, "adminPasswordChanged") : t(lang, "adminWrongCredentials"));
    if (res.ok) (e.target as HTMLFormElement).reset();
  }

  const field = (key: string, label: string, type = "text", placeholder = "") => (
    <div>
      <label className="label" htmlFor={`s-${key}`}>{label}</label>
      <input
        id={`s-${key}`}
        name={`settings.${key}`}
        defaultValue={settings[key] ?? ""}
        type={type}
        placeholder={placeholder}
        className="field text-[12.5px]"
        dir={type === "url" ? "ltr" : undefined}
      />
    </div>
  );


  const cairoDateTimeValue = (value: string | undefined) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Africa/Cairo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).formatToParts(date);
    const part = (type: string) => parts.find((item) => item.type === type)?.value ?? "";
    return part("year") + "-" + part("month") + "-" + part("day") + "T" + part("hour") + ":" + part("minute");
  };

  const timerDateField = (key: string, label: string) => (
    <div>
      <label className="label" htmlFor={"s-" + key}>{label}</label>
      <input
        id={"s-" + key}
        name={"settings." + key}
        type="datetime-local"
        defaultValue={cairoDateTimeValue(settings[key])}
        className="field text-[12.5px]"
        dir="ltr"
      />
    </div>
  );

  return (
    <div className="space-y-4">
      {message && <p className="rounded-lg bg-[var(--surface)] px-3 py-2 text-[12px] font-semibold text-[var(--muted)]">{message}</p>}

      <form onSubmit={save} className="space-y-4">
        <section className="card p-4">
          <h2 className="flex items-center gap-2 text-[14px] font-bold">
            <Globe className="h-4 w-4 text-[var(--accent)]" /> {t(lang, "adminSiteName")}
          </h2>
          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            {field("site_name_ar", t(lang, "adminSiteName"))}
            {field("site_name_en", t(lang, "adminSiteNameEn"))}
            {field("tagline_ar", `${t(lang, "adminTagline")} (AR)`)}
            {field("tagline_en", `${t(lang, "adminTagline")} (EN)`)}
            {field("banner_ar", `${t(lang, "adminBannerText")} (AR)`)}
            {field("banner_en", `${t(lang, "adminBannerText")} (EN)`)}
            {field("notice_ar", `${t(lang, "adminNoticeText")} (AR)`)}
            {field("notice_en", `${t(lang, "adminNoticeText")} (EN)`)}
            {field("contact_email", t(lang, "adminContactEmail"), "email")}
          </div>
        </section>

        <section className="card p-4">
          <h2 className="flex items-center gap-2 text-[14px] font-bold">
            <Clock3 className="h-4 w-4 text-[var(--accent)]" /> {lang === "ar" ? "عداد مواعيد تسليم المذكرات" : "Memorial submission countdown"}
          </h2>
          <p className="mt-1 text-[11.5px] leading-6 text-[var(--muted)]">
            {lang === "ar" ? "يظهر الموعد الأول حتى نهايته، ثم يبدأ عداد الموعد الثاني تلقائيًا. الوقت المعروض مضبوط على توقيت القاهرة." : "The first deadline is shown until it expires, then the second countdown starts automatically. Times use Cairo time."}
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {field("timer_claimant_title_ar", "عنوان موعد مذكرة المدعي (عربي)")}
            {field("timer_claimant_title_en", "Claimant deadline title (English)")}
            {timerDateField("timer_claimant_due_at", "نهاية موعد مذكرة المدعي (توقيت القاهرة)")}
            {field("timer_respondent_title_ar", "عنوان موعد مذكرة المدعى عليه (عربي)")}
            {field("timer_respondent_title_en", "Respondent deadline title (English)")}
            {timerDateField("timer_respondent_due_at", "نهاية موعد مذكرة المدعى عليه (توقيت القاهرة)")}
          </div>
        </section>

        <section className="card p-4">
          <h2 className="flex items-center gap-2 text-[14px] font-bold">
            <Megaphone className="h-4 w-4 text-[var(--accent)]" /> {t(lang, "adminAnnouncement")}
          </h2>
          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            {field("announcement_ar", `${t(lang, "adminAnnouncement")} (AR)`)}
            {field("announcement_en", `${t(lang, "adminAnnouncement")} (EN)`)}
            <label className="inline-flex items-center gap-2 text-[12.5px] font-semibold">
              <input type="checkbox" name="settings.announcement_enabled" value="1" defaultChecked={settings.announcement_enabled === "1"} className="h-3.5 w-3.5 accent-[var(--primary)]" />
              {t(lang, "adminAnnouncementEnabled")}
            </label>
          </div>
        </section>

        <section className="card p-4">
          <h2 className="flex items-center gap-2 text-[14px] font-bold">
            <Palette className="h-4 w-4 text-[var(--accent)]" /> {t(lang, "adminColors")}
          </h2>
          <div className="mt-2 grid gap-3 sm:grid-cols-3">
            {[
              ["color_primary", "primary"],
              ["color_accent", "accent"],
              ["color_bg", "bg"],
              ["color_surface", "surface"],
              ["color_text", "text"],
              ["accent_case", "case"],
              ["accent_laws", "laws"],
              ["accent_books", "books"],
            ].map(([key, label]) => (
              <div key={key}>
                <label className="label" htmlFor={`s-${key}`}>{label}</label>
                <div className="flex gap-1.5">
                  <input id={`s-${key}`} type="color" name={`settings.${key}`} defaultValue={settings[key]} className="h-9 w-12 rounded-lg border border-[var(--line)] bg-[var(--bg)] p-0.5" />
                  <input value={settings[key]} readOnly className="field flex-1 text-[11px] font-mono" dir="ltr" tabIndex={-1} aria-hidden="true" />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="card p-4">
          <h2 className="flex items-center gap-2 text-[14px] font-bold">
            <Share2 className="h-4 w-4 text-[var(--accent)]" /> {t(lang, "adminSocial")}
          </h2>
          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            {field("social_x", "X", "url")}
            {field("social_linkedin", "LinkedIn", "url")}
            {field("social_whatsapp", "WhatsApp", "url")}
            {field("social_facebook", "Facebook", "url")}
            {field("social_instagram", "Instagram", "url")}
          </div>
        </section>

        <button type="submit" disabled={busy === "settings"} className="btn btn-primary gap-1.5">
          {busy === "settings" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {t(lang, "save")}
        </button>
      </form>

      <section className="card p-4">
        <h2 className="flex items-center gap-2 text-[14px] font-bold">
          <KeyRound className="h-4 w-4 text-[var(--accent)]" /> {t(lang, "adminChangePassword")}
        </h2>
        <form onSubmit={changePassword} className="mt-2 grid gap-2 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <div>
            <label className="label" htmlFor="pw-current">{t(lang, "adminCurrentPassword")}</label>
            <input id="pw-current" name="current" type="password" required className="field" autoComplete="current-password" />
          </div>
          <div>
            <label className="label" htmlFor="pw-next">{t(lang, "adminNewPassword")}</label>
            <input id="pw-next" name="next" type="password" required minLength={10} className="field" autoComplete="new-password" />
          </div>
          <button type="submit" disabled={busy === "password"} className="btn btn-outline btn-sm">
            {t(lang, "adminChangePassword")}
          </button>
        </form>
      </section>

      <section className="card p-4">
        <h2 className="flex items-center gap-2 text-[14px] font-bold">
          <Download className="h-4 w-4 text-[var(--accent)]" /> {t(lang, "adminBackup")}
        </h2>
        <p className="mt-1 text-[11.5px] text-[var(--muted)]">{t(lang, "adminBackupHint")}</p>
        <button
          type="button"
          onClick={async () => {
            const res = await adminFetch("/api/admin/backup");
            if (!res.ok) return;
            const blob = await res.blob();
            const a = document.createElement("a");
            a.href = URL.createObjectURL(blob);
            a.download = `sccam-backup-${new Date().toISOString().slice(0, 10)}.json`;
            a.click();
            URL.revokeObjectURL(a.href);
          }}
          className="btn btn-outline btn-sm mt-2 gap-1.5"
        >
          <Download className="h-3.5 w-3.5" /> {t(lang, "adminDownloadBackup")}
        </button>
      </section>
    </div>
  );
}
