"use client";

import { useEffect, useState } from "react";
import { Copy, Link2, QrCode, Share2 } from "lucide-react";
import { t } from "@/lib/i18n";
import type { Lang } from "@/lib/types";
import { whatsappLink } from "@/lib/format";
import { WhatsAppIcon } from "@/components/BrandIcons";

export function SharePanel({
  lang,
  title,
  page,
  fileId,
}: {
  lang: Lang;
  title: string;
  page: number;
  fileId: string;
}) {
  const [url, setUrl] = useState("");
  const [showQr, setShowQr] = useState(false);
  const [copied, setCopied] = useState(false);

  const [current, setCurrent] = useState(page);

  useEffect(() => {
    setCurrent(page);
  }, [page]);

  useEffect(() => {
    const onPage = (e: Event) => {
      const detail = (e as CustomEvent<{ page: number }>).detail;
      if (detail?.page) setCurrent(detail.page);
    };
    window.addEventListener("sccam:pagechange", onPage);
    return () => window.removeEventListener("sccam:pagechange", onPage);
  }, []);

  useEffect(() => {
    const u = new URL(window.location.href);
    if (current > 1) u.searchParams.set("page", String(current));
    else u.searchParams.delete("page");
    setUrl(u.toString());
  }, [current]);

  const message = `📄 ${title}${current > 1 ? ` — ${t(lang, "page")} ${current}` : ""}\n\n🔗 ${url}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }

  return (
    <section className="card p-4">
      <h2 className="flex items-center gap-2 text-[13px] font-bold">
        <Share2 className="h-4 w-4 text-[var(--accent)]" aria-hidden="true" />
        {t(lang, "shareFile")}
      </h2>
      <div className="mt-3 flex flex-wrap gap-1.5">
        <button type="button" onClick={copy} className="btn btn-outline btn-sm gap-1.5">
          <Link2 className="h-3.5 w-3.5" />
          {copied ? t(lang, "copied") : t(lang, "copyLink")}
        </button>
        <a
          href={whatsappLink(message)}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-outline btn-sm gap-1.5 text-[#128C7E]"
        >
          <WhatsAppIcon className="h-3.5 w-3.5" />
          {t(lang, "shareWhatsapp")}
        </a>
        <button type="button" onClick={() => setShowQr((v) => !v)} className="btn btn-outline btn-sm gap-1.5" aria-expanded={showQr}>
          <QrCode className="h-3.5 w-3.5" />
          {t(lang, "qrTitle")}
        </button>
      </div>
      {showQr && (
        <div className="mt-3 flex flex-col items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--surface)] p-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/api/qr?data=${encodeURIComponent(url || `/file/${fileId}`)}`}
            alt={`QR ${title}`}
            className="h-36 w-36 rounded-lg bg-white p-1.5"
            width={144}
            height={144}
          />
          <p className="text-center text-[10.5px] text-[var(--muted)]">{t(lang, "qrHint")}</p>
          <button type="button" onClick={copy} className="btn btn-ghost btn-sm gap-1">
            <Copy className="h-3 w-3" /> {t(lang, "copyLink")}
          </button>
        </div>
      )}
    </section>
  );
}
