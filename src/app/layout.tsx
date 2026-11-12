import type { Metadata, Viewport } from "next";
import "./globals.css";
import { getLang } from "@/lib/server-lang";
import { getSiteSettings, getSections } from "@/lib/queries";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
// Self-hosted variable fonts (no external CDN — required for offline/PWA).
import "@fontsource-variable/cairo";
import "@fontsource-variable/inter";
import { t } from "@/lib/i18n";
import { siteBase } from "@/lib/format";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getLang();
  const title = "SCCAM";
  const description = lang === "ar" ? "مكتبة للبحث القانوني والوثائق والمراجع." : "A library for legal research, documents and references.";
  return {
    metadataBase: new URL(siteBase()),
    title: { default: title, template: `%s · SCCAM` },
    description,
    applicationName: "SCCAM",
    robots: { index: true, follow: true },
    openGraph: {
      type: "website",
      siteName: "SCCAM",
      title,
      description,
      images: [{ url: "/og.png", width: 1200, height: 630, alt: title }],
      locale: lang === "ar" ? "ar_EG" : "en_GB",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/og.png"],
    },
    manifest: "/manifest.webmanifest",
    icons: { icon: "/icon.svg", apple: "/icon.svg" },
  };
}

export const viewport: Viewport = {
  themeColor: "#0C4871",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [settings, sections, lang] = await Promise.all([getSiteSettings(), getSections(), getLang()]);
  const dir = lang === "ar" ? "rtl" : "ltr";
  return (
    <html lang={lang} dir={dir}>
      <body className="flex min-h-dvh flex-col antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:z-[100] focus:rounded-lg focus:bg-[var(--primary)] focus:px-4 focus:py-2 focus:text-white"
        >
          {t(lang, "skipToContent")}
        </a>
        <SiteHeader lang={lang} settings={settings} sections={sections} />
        <main id="main" className="min-h-[60vh] min-w-0 flex-1 w-full">
          {children}
        </main>
        <SiteFooter lang={lang} />
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
