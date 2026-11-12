"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, Loader2, ShieldCheck } from "lucide-react";
import { t } from "@/lib/i18n";
import type { Lang } from "@/lib/types";

export function SetupForm({ lang }: { lang: Lang }) {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "busy" | "error">("idle");
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const password = String(form.get("password") ?? "");
    const confirm = String(form.get("confirm") ?? "");
    if (password.length < 10) return setError(t(lang, "adminPasswordShort"));
    if (password !== confirm) return setError(t(lang, "adminPasswordMismatch"));
    setState("busy");
    setError("");
    try {
      const res = await fetch("/api/admin/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: form.get("username"), password }),
      });
      if (res.ok) {
        router.push("/admin");
        router.refresh();
      } else {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(data.error === "already-configured" ? t(lang, "adminSetupDone") : t(lang, "error"));
        setState("error");
      }
    } catch {
      setError(t(lang, "error"));
      setState("error");
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div>
        <label className="label" htmlFor="username">
          {t(lang, "adminUsername")}
        </label>
        <input id="username" name="username" required minLength={3} maxLength={40} defaultValue="admin" className="field" autoComplete="username" dir="ltr" />
      </div>
      <div>
        <label className="label" htmlFor="password">
          {t(lang, "adminPassword")}
        </label>
        <input id="password" name="password" type="password" required minLength={10} className="field" autoComplete="new-password" />
        <p className="hint mt-1">{t(lang, "adminPasswordRule")}</p>
      </div>
      <div>
        <label className="label" htmlFor="confirm">
          {t(lang, "adminPasswordConfirm")}
        </label>
        <input id="confirm" name="confirm" type="password" required minLength={10} className="field" autoComplete="new-password" />
      </div>
      {error && <p className="text-[12px] font-semibold text-[var(--danger)]">{error}</p>}
      <button type="submit" disabled={state === "busy"} className="btn btn-primary w-full">
        {state === "busy" ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
        {t(lang, "adminCreateAccount")}
      </button>
    </form>
  );
}

export function LoginForm({ lang }: { lang: Lang }) {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "busy">("idle");
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setState("busy");
    setError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: form.get("username"), password: form.get("password") }),
      });
      if (res.ok) {
        router.push("/admin");
        router.refresh();
      } else {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(data.error === "rate" ? t(lang, "adminTooMany") : t(lang, "adminWrongCredentials"));
        setState("idle");
      }
    } catch {
      setError(t(lang, "error"));
      setState("idle");
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div>
        <label className="label" htmlFor="login-username">
          {t(lang, "adminUsername")}
        </label>
        <input id="login-username" name="username" required className="field" autoComplete="username" dir="ltr" defaultValue="admin" />
      </div>
      <div>
        <label className="label" htmlFor="login-password">
          {t(lang, "adminPassword")}
        </label>
        <input id="login-password" name="password" type="password" required className="field" autoComplete="current-password" />
      </div>
      {error && <p className="text-[12px] font-semibold text-[var(--danger)]">{error}</p>}
      <button type="submit" disabled={state === "busy"} className="btn btn-primary w-full">
        {state === "busy" ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
        {t(lang, "adminLoginAction")}
      </button>
      <p className="hint text-center">{t(lang, "adminLoginRate")}</p>
    </form>
  );
}
