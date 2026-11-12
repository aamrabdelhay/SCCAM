"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, Loader2, Lock } from "lucide-react";
import { t } from "@/lib/i18n";
import type { Lang } from "@/lib/types";

export function UnlockForm({ fileId, lang }: { fileId: string; lang: Lang }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "error">("idle");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState("busy");
    try {
      const res = await fetch(`/api/files/${fileId}/unlock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        router.refresh();
      } else {
        setState("error");
      }
    } catch {
      setState("error");
    }
  }

  return (
    <div className="card flex flex-col items-center gap-4 p-10 text-center">
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-[var(--surface)] text-[var(--primary)] dark:text-[var(--accent)]">
        <Lock className="h-6 w-6" aria-hidden="true" />
      </span>
      <div>
        <h2 className="text-[15px] font-bold">{t(lang, "viewerPasswordTitle")}</h2>
        <p className="mx-auto mt-1 max-w-sm text-[12.5px] text-[var(--muted)]">{t(lang, "viewerPasswordHint")}</p>
      </div>
      <form onSubmit={submit} className="w-full max-w-xs space-y-2.5">
        <label className="sr-only" htmlFor="file-password">
          {t(lang, "viewerPasswordLabel")}
        </label>
        <input
          id="file-password"
          type="password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setState("idle");
          }}
          required
          autoComplete="off"
          placeholder={t(lang, "viewerPasswordLabel")}
          className="field text-center"
          aria-invalid={state === "error"}
        />
        {state === "error" && <p className="text-[12px] font-semibold text-[var(--danger)]">{t(lang, "wrongPassword")}</p>}
        <button type="submit" disabled={state === "busy"} className="btn btn-primary w-full">
          {state === "busy" ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
          {t(lang, "viewerUnlock")}
        </button>
      </form>
    </div>
  );
}
