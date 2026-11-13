import fs from "fs";
import path from "path";
import sharp from "sharp";

async function generateWatermarkPng() {
  const brandDir = path.join(process.cwd(), "public", "brand");
  if (!fs.existsSync(brandDir)) {
    fs.mkdirSync(brandDir, { recursive: true });
  }

  const outputPath = path.join(brandDir, "watermark.png");

  // SVG: Width 260px (~20% of 1280px frame), No filled box, subtle stroke outline, 25% opacity
  const svg = `
<svg width="260" height="48" viewBox="0 0 260 48" xmlns="http://www.w3.org/2000/svg">
  <style>
    .ar-text {
      font-family: 'IBM Plex Sans Arabic', Arial, sans-serif;
      font-size: 13px;
      font-weight: 700;
      fill: #ffffff;
      stroke: #000000;
      stroke-width: 2px;
      stroke-linejoin: round;
      paint-order: stroke fill;
      text-anchor: end;
    }
    .en-text {
      font-family: 'IBM Plex Sans', Arial, sans-serif;
      font-size: 9.5px;
      font-weight: 600;
      fill: #00d2ff;
      stroke: #000000;
      stroke-width: 1.5px;
      stroke-linejoin: round;
      paint-order: stroke fill;
      text-anchor: end;
      letter-spacing: 0.5px;
    }
  </style>
  <g opacity="0.25">
    <text x="252" y="20" class="ar-text" direction="rtl">قسم تمريض الطوارئ والحالات الحرجة</text>
    <text x="252" y="38" class="en-text">Critical Care Nursing Dept</text>
  </g>
</svg>
`.trim();

  await sharp(Buffer.from(svg)).png().toFile(outputPath);
  console.log(`✅ Pre-rendered transparent watermark PNG (20% frame width, no filled box, 25% opacity) created at: ${outputPath}`);
}

generateWatermarkPng().catch((err) => {
  console.error("Failed to generate watermark PNG:", err);
  process.exit(1);
});
