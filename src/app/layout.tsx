import type { Metadata, Viewport } from "next";
import "./globals.css";
import { getLang } from "@/lib/server-lang";
import { getSiteSettings, getSections } from "@/lib/queries";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { TopBanner } from "@/components/TopBanner";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
// Self-hosted variable fonts (no external CDN — required for offline/PWA).
import "@fontsource-variable/cairo";
import "@fontsource-variable/inter";
import { t } from "@/lib/i18n";
import { siteBase } from "@/lib/format";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  const lang = await getLang();
  const title = lang === "ar" ? `${settings.site_name_ar} — مصادر منافسة التحكيم` : `${settings.site_name_en} — Moot resources`;
  const description = lang === "ar" ? settings.tagline_ar : settings.tagline_en;
  return {
    metadataBase: new URL(siteBase()),
    title: { default: title, template: `%s · ${lang === "ar" ? settings.site_name_ar : settings.site_name_en}` },
    description,
    applicationName: settings.site_name_en,
    robots: { index: true, follow: true },
    openGraph: {
      type: "website",
      siteName: lang === "ar" ? settings.site_name_ar : settings.site_name_en,
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
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#0B3D2E" },
    { media: "(prefers-color-scheme: dark)", color: "#0B1210" },
  ],
  width: "device-width",
  initialScale: 1,
};

const themeScript = `(function(){try{var t=localStorage.getItem('sccam:theme');var d=window.matchMedia('(prefers-color-scheme: dark)').matches;if(t==='dark'||(t!=='light'&&d)){document.documentElement.classList.add('dark')}}catch(e){}})();`;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [settings, sections, lang] = await Promise.all([getSiteSettings(), getSections(), getLang()]);
  const dir = lang === "ar" ? "rtl" : "ltr";
  const colors = {
    "--primary": settings.color_primary,
    "--accent": settings.color_accent,
    "--bg": settings.color_bg,
    "--surface": settings.color_surface,
    "--text": settings.color_text,
  } as React.CSSProperties;

  return (
    <html lang={lang} dir={dir} suppressHydrationWarning style={colors}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-dvh antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:z-[100] focus:rounded-lg focus:bg-[var(--primary)] focus:px-4 focus:py-2 focus:text-white"
        >
          {t(lang, "skipToContent")}
        </a>
        <TopBanner lang={lang} settings={settings} />
        <SiteHeader lang={lang} settings={settings} sections={sections} />
        <main id="main" className="min-h-[60vh]">
          {children}
        </main>
        <SiteFooter lang={lang} settings={settings} sections={sections} />
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
