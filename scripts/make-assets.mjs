// Generates the PWA icons and the social preview image from an original
// vector wordmark (no organiser assets are used). Run: node scripts/make-assets.mjs
import sharp from "sharp";
import { mkdir } from "node:fs/promises";

const out = "public";

const iconSvg = (size = 512) => `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="112" fill="#0B3D2E"/>
  <circle cx="256" cy="256" r="176" fill="none" stroke="#C9A24B" stroke-width="6" opacity=".45"/>
  <path d="M256 116v236" stroke="#C9A24B" stroke-width="18" stroke-linecap="round"/>
  <path d="M140 172h232" stroke="#FFFFFF" stroke-width="16" stroke-linecap="round"/>
  <path d="M140 172l-40 78a44 44 0 0 0 80 0l-40-78Z" fill="none" stroke="#FFFFFF" stroke-width="13" stroke-linejoin="round"/>
  <path d="M372 172l-40 78a44 44 0 0 0 80 0l-40-78Z" fill="none" stroke="#FFFFFF" stroke-width="13" stroke-linejoin="round"/>
  <path d="M186 390h140c18 0 32-14 32-32v-8H154v8c0 18 14 32 32 32Z" fill="#C9A24B"/>
  <path d="M206 330h100" stroke="#C9A24B" stroke-width="14" stroke-linecap="round"/>
</svg>`;

const ogSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#0B3D2E"/>
      <stop offset="1" stop-color="#082E22"/>
    </linearGradient>
    <pattern id="grid" width="56" height="56" patternUnits="userSpaceOnUse">
      <path d="M56 0H0v56" fill="none" stroke="#ffffff" stroke-opacity=".05" stroke-width="1"/>
    </pattern>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect width="1200" height="630" fill="url(#grid)"/>
  <circle cx="1090" cy="90" r="240" fill="#C9A24B" opacity=".12"/>
  <g transform="translate(88 96) scale(.42)">
    <rect width="512" height="512" rx="112" fill="#FFFFFF" opacity=".08"/>
    <path d="M256 116v236" stroke="#C9A24B" stroke-width="18" stroke-linecap="round"/>
    <path d="M140 172h232" stroke="#FFFFFF" stroke-width="16" stroke-linecap="round"/>
    <path d="M140 172l-40 78a44 44 0 0 0 80 0l-40-78Z" fill="none" stroke="#FFFFFF" stroke-width="13" stroke-linejoin="round"/>
    <path d="M372 172l-40 78a44 44 0 0 0 80 0l-40-78Z" fill="none" stroke="#FFFFFF" stroke-width="13" stroke-linejoin="round"/>
    <path d="M186 390h140c18 0 32-14 32-32v-8H154v8c0 18 14 32 32 32Z" fill="#C9A24B"/>
  </g>
  <text x="330" y="230" fill="#FFFFFF" font-family="Helvetica, Arial, sans-serif" font-size="58" font-weight="bold">Arbitration Moot</text>
  <text x="330" y="300" fill="#C9A24B" font-family="Helvetica, Arial, sans-serif" font-size="52" font-weight="bold">Library</text>
  <text x="330" y="360" fill="#CFE0D8" font-family="Helvetica, Arial, sans-serif" font-size="26">Case file · Laws &amp; rules · Books</text>
  <rect x="88" y="490" width="1024" height="76" rx="20" fill="#ffffff" fill-opacity=".07"/>
  <text x="120" y="537" fill="#E9F1EE" font-family="Helvetica, Arial, sans-serif" font-size="24">Unofficial community resource — not affiliated with the organisers</text>
  <circle cx="1060" cy="528" r="16" fill="#C9A24B"/>
</svg>`;

await mkdir(out, { recursive: true });
for (const size of [192, 512]) {
  await sharp(Buffer.from(iconSvg(size))).png().toFile(`${out}/icon-${size}.png`);
}
await sharp(Buffer.from(iconSvg(180))).png().toFile(`${out}/apple-touch-icon.png`);
await sharp(Buffer.from(iconSvg(32))).png().toFile(`${out}/favicon-32.png`);
await sharp(Buffer.from(ogSvg)).png().toFile(`${out}/og.png`);
console.log("assets written to public/");
