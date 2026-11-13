/**
 * Client-side image resizing and optimization utility.
 * Accepts JPEG, PNG, and WebP up to 5 MB.
 * Scales down to a maximum width of 1600px and converts to WebP.
 */

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB before resizing
const MAX_WIDTH_PX = 1600;
const WEBP_QUALITY = 0.85;

export interface ResizeResult {
  blob: Blob;
  previewUrl: string;
  width: number;
  height: number;
  blurDataUrl?: string;
}

export function validateRawImage(file: File): { valid: boolean; error?: string } {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: "نوع الملف غير مدعوم. يرجى اختيار صورة بصيغة JPEG أو PNG أو WebP فقط.",
    };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: "حجم الصورة كبير جدًا. الحد الأقصى المسموح به هو 5 ميجابايت قبل المعالجة.",
    };
  }

  return { valid: true };
}

export async function resizeImageToWebP(file: File): Promise<ResizeResult> {
  const validation = validateRawImage(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let width = img.width;
      let height = img.height;

      // Scale down if wider than 1600px
      if (width > MAX_WIDTH_PX) {
        height = Math.round((height * MAX_WIDTH_PX) / width);
        width = MAX_WIDTH_PX;
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Failed to get canvas 2d context for image resizing."));
        return;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, 0, 0, width, height);

      // Generate a tiny 16x10 blurDataURL placeholder for smooth Next.js blur placeholder
      let blurDataUrl: string | undefined = undefined;
      try {
        const blurCanvas = document.createElement("canvas");
        blurCanvas.width = 16;
        blurCanvas.height = 10;
        const blurCtx = blurCanvas.getContext("2d");
        if (blurCtx) {
          blurCtx.imageSmoothingEnabled = true;
          blurCtx.drawImage(img, 0, 0, 16, 10);
          blurDataUrl = blurCanvas.toDataURL("image/webp", 0.5);
        }
      } catch {
        // Fallback gracefully if canvas toDataURL fails
      }

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Failed to convert image to WebP format."));
            return;
          }
          const previewUrl = URL.createObjectURL(blob);
          resolve({ blob, previewUrl, width, height, blurDataUrl });
        },
        "image/webp",
        WEBP_QUALITY
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("تعذّر قراءة ملف الصورة."));
    };

    img.src = objectUrl;
  });
}
