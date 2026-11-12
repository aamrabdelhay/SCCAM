import type { MetadataRoute } from "next";
import { listFiles, getSections } from "@/lib/queries";
import { siteBase } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteBase();
  const [sections, files] = await Promise.all([getSections(), listFiles({ limit: 500 })]);
  const staticPaths = ["", "/search", "/archive", "/clarifications", "/changelog", "/glossary", "/faq", "/contact", "/library"];
  return [
    ...staticPaths.map((path) => ({
      url: `${base}${path}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: path === "" ? 1 : 0.6,
    })),
    ...sections.map((s) => ({
      url: `${base}/${s.slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...files.map((f) => ({
      url: `${base}/file/${f.id}`,
      lastModified: new Date(f.updated_at),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
