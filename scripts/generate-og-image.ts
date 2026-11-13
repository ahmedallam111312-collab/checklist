import fs from "fs";
import path from "path";
import sharp from "sharp";

async function generateOgImage() {
  const width = 1200;
  const height = 630;

  // 1. Create base SVG background with gradients and typography
  const svgBackground = `
  <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#0B2146" />
        <stop offset="60%" stop-color="#0C2043" />
        <stop offset="100%" stop-color="#524056" />
      </linearGradient>
      <linearGradient id="roseGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#C87475" />
        <stop offset="100%" stop-color="#3B467A" />
      </linearGradient>
      <linearGradient id="cardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="rgba(255, 255, 255, 0.08)" />
        <stop offset="100%" stop-color="rgba(255, 255, 255, 0.02)" />
      </linearGradient>
    </defs>

    <!-- Background -->
    <rect width="${width}" height="${height}" fill="url(#bgGrad)" />

    <!-- Top Rose Accent Line -->
    <rect x="0" y="0" width="${width}" height="6" fill="#C87475" />

    <!-- Subtle Decorative Grid Lines -->
    <g opacity="0.07" stroke="#FFFFFF" stroke-width="1">
      <line x1="0" y1="126" x2="1200" y2="126" />
      <line x1="0" y1="252" x2="1200" y2="252" />
      <line x1="0" y1="378" x2="1200" y2="378" />
      <line x1="0" y1="504" x2="1200" y2="504" />
      <line x1="240" y1="0" x2="240" y2="630" />
      <line x1="480" y1="0" x2="480" y2="630" />
      <line x1="720" y1="0" x2="720" y2="630" />
      <line x1="960" y1="0" x2="960" y2="630" />
    </g>

    <!-- Subtle Card Backdrop -->
    <rect x="60" y="60" width="1080" height="510" rx="28" fill="url(#cardGrad)" stroke="rgba(200, 116, 117, 0.25)" stroke-width="1.5" />

    <!-- Category Pill -->
    <rect x="730" y="105" width="350" height="42" rx="21" fill="rgba(200, 116, 117, 0.2)" stroke="#C87475" stroke-width="1" />
    <text x="905" y="132" font-family="'IBM Plex Sans Arabic', sans-serif" font-size="16" font-weight="bold" fill="#FBF3F3" text-anchor="middle">
      تمريض الطوارئ والرعاية الحرجة
    </text>

    <!-- Main Arabic Description -->
    <text x="1080" y="445" font-family="'IBM Plex Sans Arabic', sans-serif" font-size="34" font-weight="bold" fill="#FFFFFF" text-anchor="end">
      منصة تعليمية سريرية للإجراءات التمريضية المتقدمة
    </text>
    <text x="1080" y="495" font-family="'IBM Plex Sans Arabic', sans-serif" font-size="22" font-weight="normal" fill="#EBD8DA" text-anchor="end">
      خطوات عملية واضحة • معايير السلامة السريرية • قوائم التجهيزات الطبية
    </text>

    <!-- Tagline Badge -->
    <rect x="100" y="465" width="220" height="38" rx="19" fill="#071D3C" stroke="#C87475" stroke-width="1.5" />
    <text x="210" y="489" font-family="'Roboto', sans-serif" font-size="14" font-weight="600" fill="#C87475" text-anchor="middle" letter-spacing="1.5">
      LEARN • PRACTICE • EXCEL
    </text>

    <!-- ECG Waveform Accent at Bottom -->
    <path d="M 100 535 L 500 535 L 520 520 L 535 550 L 555 495 L 575 565 L 590 530 L 605 535 L 1100 535" fill="none" stroke="#C87475" stroke-width="3" opacity="0.6" stroke-linecap="round" stroke-linejoin="round" />
  </svg>
  `;

  // 2. Resize the logo
  const logoPath = path.join(process.cwd(), "public", "brand", "critical-ease-logo-reversed.png");
  const logoBuffer = await sharp(logoPath)
    .resize(460, null, { fit: "inside" })
    .toBuffer();

  const logoMeta = await sharp(logoBuffer).metadata();
  const logoTop = 150;
  const logoLeft = 100;

  // 3. Composite everything together
  const ogImageBuffer = await sharp(Buffer.from(svgBackground))
    .composite([
      {
        input: logoBuffer,
        top: logoTop,
        left: logoLeft,
      },
    ])
    .png({ quality: 95 })
    .toBuffer();

  // 4. Save to public/brand/og-image.png and public/og-image.png
  const out1 = path.join(process.cwd(), "public", "brand", "og-image.png");
  const out2 = path.join(process.cwd(), "public", "og-image.png");

  fs.writeFileSync(out1, ogImageBuffer);
  fs.writeFileSync(out2, ogImageBuffer);

  const meta = await sharp(out1).metadata();
  console.log(`✅ Branded OG Image generated successfully: ${out1} (${meta.width}x${meta.height}, ${ogImageBuffer.length} bytes)`);
}

generateOgImage().catch((err) => {
  console.error("❌ Failed to generate OG image:", err);
  process.exit(1);
});
