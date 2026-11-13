import fs from "fs";
import path from "path";
import { execSync } from "child_process";

export interface MediaProbeInfo {
  durationSeconds: number;
  sizeBytes: number;
  width?: number;
  height?: number;
}

export function probeMedia(filePath: string): MediaProbeInfo {
  const cmd = `ffprobe -v error -select_streams v:0 -show_entries stream=width,height:format=duration,size -of json "${filePath}"`;
  const output = execSync(cmd, { encoding: "utf-8" });
  const data = JSON.parse(output);

  const durationSeconds = parseFloat(data.format?.duration || "0");
  const sizeBytes = parseInt(data.format?.size || "0", 10);
  const width = data.streams?.[0]?.width;
  const height = data.streams?.[0]?.height;

  return { durationSeconds, sizeBytes, width, height };
}

export function applyWatermark(
  inputVideoPath: string,
  outputVideoPath?: string,
  watermarkPngPath?: string
): { inputInfo: MediaProbeInfo; outputInfo: MediaProbeInfo; outputPath: string; frameProofPath: string } {
  if (!fs.existsSync(inputVideoPath)) {
    throw new Error(`Input video not found: ${inputVideoPath}`);
  }

  const defaultWatermark = path.join(process.cwd(), "public", "brand", "watermark.png");
  const watermarkPath = watermarkPngPath || defaultWatermark;

  if (!fs.existsSync(watermarkPath)) {
    throw new Error(`Watermark image not found at ${watermarkPath}. Run scripts/generate-watermark.ts first.`);
  }

  const parsed = path.parse(inputVideoPath);
  const outputPath =
    outputVideoPath ||
    path.join(parsed.dir, `${parsed.name}-watermarked.mp4`);

  console.log("================================================================================");
  console.log("🎥 Department Video Watermark & 720p H.264 Encoder");
  console.log("================================================================================\n");

  console.log(`[1/5] Probing input media: ${inputVideoPath}`);
  const inputInfo = probeMedia(inputVideoPath);
  console.log(`   Dimensions: ${inputInfo.width}x${inputInfo.height}`);
  console.log(`   Duration  : ${inputInfo.durationSeconds.toFixed(2)} seconds`);
  console.log(`   File size : ${(inputInfo.sizeBytes / (1024 * 1024)).toFixed(2)} MB (${inputInfo.sizeBytes.toLocaleString()} bytes)\n`);

  console.log(`[2/5] Applying top-corner watermark: ${watermarkPath}`);
  console.log("   Filter: scale=-2:720, overlay=W-w-24:24 (top right, safe from subtitles)");
  console.log("   Audio : -c:a aac -b:a 128k");
  console.log("   Video : libx264 -preset veryfast -crf 22 -movflags +faststart\n");

  // Filter scales input video height to 720p with even width (scale=-2:720 / trunc(oh*a/2)*2:720)
  // and overlays the transparent watermark at top right with 24px margin
  let scaleExpr = "scale=-2:720";
  try {
    execSync(`ffmpeg -y -f lavfi -i color=c=black:s=640x360:d=0.1 -vf "${scaleExpr}" test-scale-probe.mp4`, { stdio: "pipe" });
    if (fs.existsSync("test-scale-probe.mp4")) fs.unlinkSync("test-scale-probe.mp4");
  } catch {
    // Older ffmpeg builds (<4.0) reject values < -1; trunc(oh*a/2)*2:720 is the exact mathematical equivalent
    scaleExpr = "scale=trunc(oh*a/2)*2:720";
    if (fs.existsSync("test-scale-probe.mp4")) fs.unlinkSync("test-scale-probe.mp4");
  }

  const filterComplex = `[0:v]${scaleExpr}[scaled];[scaled][1:v]overlay=W-w-24:24[outv]`;
  const ffmpegCmd = `ffmpeg -y -i "${inputVideoPath}" -i "${watermarkPath}" -filter_complex "${filterComplex}" -map "[outv]" -map 0:a? -c:v libx264 -preset veryfast -crf 22 -threads 2 -strict -2 -c:a aac -b:a 128k -movflags +faststart "${outputPath}"`;

  console.log(`[3/5] Encoding output to ${outputPath}...`);
  execSync(ffmpegCmd, { stdio: "inherit" });

  console.log("\n[4/5] Probing encoded output...");
  const outputInfo = probeMedia(outputPath);
  console.log(`   Dimensions: ${outputInfo.width}x${outputInfo.height}`);
  console.log(`   Duration  : ${outputInfo.durationSeconds.toFixed(2)} seconds`);
  console.log(`   File size : ${(outputInfo.sizeBytes / (1024 * 1024)).toFixed(2)} MB (${outputInfo.sizeBytes.toLocaleString()} bytes)`);

  const compressionRatio = ((1 - outputInfo.sizeBytes / inputInfo.sizeBytes) * 100).toFixed(1);
  console.log(`   Size delta: ${compressionRatio}% reduction relative to input source\n`);

  console.log("[5/5] Extracting verification frame at 5 seconds (-ss 5 -vframes 1)...");
  const docsDir = path.join(process.cwd(), "docs", "screenshots");
  if (!fs.existsSync(docsDir)) fs.mkdirSync(docsDir, { recursive: true });
  const frameProofPath = path.join(docsDir, "watermarked-frame.png");
  const extractCmd = `ffmpeg -y -ss 5 -i "${outputPath}" -vframes 1 "${frameProofPath}"`;
  execSync(extractCmd, { stdio: "inherit" });
  console.log(`   ✅ Extracted proof frame saved to: ${frameProofPath}`);

  const artifactDir = "C:\\Users\\IT\\.gemini\\antigravity\\brain\\499e886a-e714-40e4-b31f-59ce097479d6";
  if (fs.existsSync(artifactDir)) {
    fs.copyFileSync(frameProofPath, path.join(artifactDir, "watermarked-frame.png"));
  }

  console.log("\n================================================================================");
  console.log(`✅ Watermarked video ready for Mux upload: ${outputPath}`);
  console.log("================================================================================\n");

  return { inputInfo, outputInfo, outputPath, frameProofPath };
}

if (require.main === module || process.argv[1]?.includes("watermark")) {
  const inputArg = process.argv[2] || path.join("test-assets", "ecg-12-lead-test.mp4");
  const outputArg = process.argv[3];
  try {
    applyWatermark(inputArg, outputArg);
  } catch (err: any) {
    console.error("❌ Watermark execution failed:", err.message);
    process.exit(1);
  }
}
