import fs from "fs";
import path from "path";
import zlib from "zlib";

function measureMotionChunks() {
  console.log("================================================================================");
  console.log("📦 MEASURING LAZY MOTION (GSAP / SCROLLTRIGGER) CHUNK SIZE");
  console.log("================================================================================\n");

  const chunksDir = path.join(process.cwd(), ".next", "static", "chunks");
  if (!fs.existsSync(chunksDir)) {
    throw new Error(`.next/static/chunks does not exist. Run npm run build first.`);
  }

  const allFiles = fs.readdirSync(chunksDir);
  const motionChunks: { file: string; rawBytes: number; gzipBytes: number; rawKB: string; gzipKB: string }[] = [];

  for (const f of allFiles) {
    if (!f.endsWith(".js")) continue;
    const filePath = path.join(chunksDir, f);
    const content = fs.readFileSync(filePath, "utf-8");
    if (content.includes("ScrollTrigger") || content.includes("gsap") || content.includes("GreenSock")) {
      const rawBytes = fs.statSync(filePath).size;
      const gzipped = zlib.gzipSync(content);
      const gzipBytes = gzipped.length;
      motionChunks.push({
        file: f,
        rawBytes,
        gzipBytes,
        rawKB: (rawBytes / 1024).toFixed(2) + " KB",
        gzipKB: (gzipBytes / 1024).toFixed(2) + " KB",
      });
    }
  }

  console.table(motionChunks);

  const totalRaw = motionChunks.reduce((acc, c) => acc + c.rawBytes, 0);
  const totalGzip = motionChunks.reduce((acc, c) => acc + c.gzipBytes, 0);
  const totalGzipKB = totalGzip / 1024;

  console.log(`\nTotal Raw Size: ${(totalRaw / 1024).toFixed(2)} KB`);
  console.log(`Total Gzipped Size: ${totalGzipKB.toFixed(2)} KB`);
  console.log(`Budget Limit: 70.00 KB`);

  if (totalGzipKB <= 70) {
    console.log(`✅ PASS: Total gzipped lazy motion size (${totalGzipKB.toFixed(2)} KB) is within the 70 KB budget (Margin: ${(70 - totalGzipKB).toFixed(2)} KB remaining).`);
  } else {
    console.error(`❌ FAIL: Total gzipped lazy motion size (${totalGzipKB.toFixed(2)} KB) exceeds 70 KB budget!`);
    process.exit(1);
  }
}

measureMotionChunks();
