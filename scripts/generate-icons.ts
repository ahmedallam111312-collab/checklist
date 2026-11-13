import fs from "fs";
import path from "path";
import sharp from "sharp";

async function main() {
  const markPath = path.join(process.cwd(), "public", "brand", "critical-ease-mark.png");
  const imgBuffer = fs.readFileSync(markPath);

  const appleTouchIconPath = path.join(process.cwd(), "public", "apple-touch-icon.png");
  await sharp(imgBuffer)
    .resize(180, 180)
    .png()
    .toFile(appleTouchIconPath);

  console.log("Successfully generated apple-touch-icon.png (180x180)");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
