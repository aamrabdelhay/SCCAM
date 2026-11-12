import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: {
    // pdfjs-dist + libsql are used on the server for extraction/indexing
    serverActions: { bodySizeLimit: "32mb" },
  },
  serverExternalPackages: ["pdfjs-dist", "@libsql/client", "mammoth"],
  // pdf.js resolves its worker + standard fonts from node_modules at runtime.
  outputFileTracingIncludes: {
    "/api/admin/files/**": [
      "./node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs",
      "./node_modules/pdfjs-dist/standard_fonts/**",
    ],
  },
  async redirects() {
    return [
      { source: "/faq", destination: "/", permanent: true },
      { source: "/clarifications", destination: "/", permanent: true },
      { source: "/glossary", destination: "/", permanent: true },
      { source: "/contact", destination: "/", permanent: true },
    ];
  },
  async headers() {
    return [
      {
        source: "/vendor/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
        ],
      },
    ];
  },
};

export default nextConfig;
