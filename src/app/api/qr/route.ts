import { NextRequest } from "next/server";
import QRCode from "qrcode";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const data = (req.nextUrl.searchParams.get("data") ?? "").slice(0, 600);
  if (!data) return new Response("Missing data", { status: 400 });
  const svg = await QRCode.toString(data, {
    type: "svg",
    margin: 1,
    width: 288,
    color: { dark: "#0B3D2E", light: "#FFFFFF" },
    errorCorrectionLevel: "M",
  });
  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=86400, immutable",
    },
  });
}
