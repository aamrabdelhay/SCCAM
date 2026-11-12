"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";
import { KEYS, type LastRead } from "@/lib/client-store";
import { useLocalStore } from "@/lib/client-store";

export default function OfflinePage() {
  const { value } = useLocalStore<Record<string, LastRead>>(KEYS.lastRead, {});
  const [rows, setRows] = useState<{ id: string; entry: LastRead }[]>([]);

  useEffect(() => {
    setRows(
      Object.entries(value)
        .sort((a, b) => (b[1].at ?? 0) - (a[1].at ?? 0))
        .slice(0, 8)
        .map(([id, entry]) => ({ id, entry })),
    );
  }, [value]);

  return (
    <div className="container-x flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
      <span className="grid h-16 w-16 place-items-center rounded-2xl bg-[var(--surface)] text-[var(--muted)]">
        <WifiOff className="h-7 w-7" aria-hidden="true" />
      </span>
      <h1 className="font-display mt-4 text-[22px] font-extrabold">أنت غير متصل بالإنترنت / You are offline</h1>
      <p className="mt-2 max-w-md text-[13px] leading-relaxed text-[var(--muted)]">
        الصفحات والملفات التي فتحتها سابقًا متاحة دون اتصال. / Pages and files you already opened stay available offline.
      </p>
      {rows.length > 0 && (
        <ul className="mt-6 w-full max-w-md space-y-2 text-start">
          {rows.map(({ id, entry }) => (
            <li key={id}>
              <Link href={`/file/${id}?page=${entry.page}`} className="card flex items-center justify-between gap-3 p-3">
                <span className="min-w-0">
                  <span className="block truncate text-[12.5px] font-bold">{entry.title}</span>
                  <span className="block text-[10.5px] text-[var(--muted)]">
                    {entry.section} · page {entry.page}
                  </span>
                </span>
                <span className="text-[11px] font-bold text-[var(--accent)]">→</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <Link href="/" className="btn btn-primary mt-6">
        الرئيسية / Home
      </Link>
    </div>
  );
}
