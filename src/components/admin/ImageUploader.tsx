"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import { Upload, X, Loader2, Image as ImageIcon } from "lucide-react";
import { resizeImageToWebP } from "@/lib/images/resizer";
import { uploadImageAction, deleteImageAction } from "@/app/admin/actions/storage";
import { AR_STRINGS } from "@/messages/ar";

interface ImageUploaderProps {
  currentPath?: string | null;
  currentAlt?: string;
  folder: string;
  onImageChanged: (path: string | null, alt: string, blurDataUrl?: string | null) => void;
  label?: string;
}

export function ImageUploader({
  currentPath = null,
  currentAlt = "",
  folder,
  onImageChanged,
  label = AR_STRINGS.fieldCoverImage,
}: ImageUploaderProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    currentPath ? `/api/image-proxy?path=${encodeURIComponent(currentPath)}` : null
  );
  const [altText, setAltText] = useState(currentAlt || "");
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper to format public image URL
  const getDisplayUrl = (path: string | null) => {
    if (!path) return null;
    if (path.startsWith("blob:") || path.startsWith("data:") || path.startsWith("http")) {
      return path;
    }
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    return `${supabaseUrl}/storage/v1/object/public/site-images/${path}`;
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMessage(null);
    setIsProcessing(true);

    try {
      // 1. Client-side resize to max 1600px WebP + generate blurDataUrl
      const { blob, previewUrl: localPreview, blurDataUrl } = await resizeImageToWebP(file);
      setPreviewUrl(localPreview);

      // 2. Prepare FormData for server action
      const formData = new FormData();
      formData.append("file", blob, "image.webp");
      formData.append("folder", folder);
      if (currentPath) {
        formData.append("oldPath", currentPath);
      }

      // 3. Upload via server action (enforcing admin auth & RLS)
      const result = await uploadImageAction(formData);

      if (result.error || !result.path) {
        setErrorMessage(result.error || "فشل رفع الصورة إلى الخادم.");
        setPreviewUrl(getDisplayUrl(currentPath));
      } else {
        onImageChanged(result.path, altText, blurDataUrl);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "حدث خطأ أثناء معالجة الصورة.");
      setPreviewUrl(getDisplayUrl(currentPath));
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemove = async () => {
    if (currentPath) {
      setIsProcessing(true);
      await deleteImageAction(currentPath);
      setIsProcessing(false);
    }
    setPreviewUrl(null);
    onImageChanged(null, altText);
  };

  const handleAltChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.slice(0, 200);
    setAltText(val);
    onImageChanged(currentPath, val);
  };

  const activeDisplayUrl = previewUrl || getDisplayUrl(currentPath);

  return (
    <div className="space-y-3 text-start">
      <label className="block text-sm font-bold text-navy">
        {label}
      </label>

      {/* Upload Drop Zone / Preview Box */}
      <div className="squircle-tile rounded-tile border-2 border-dashed border-border bg-light-1 p-4 text-center transition-colors hover:border-rose-dark">
        {activeDisplayUrl ? (
          <div className="space-y-3">
            <div className="relative mx-auto h-48 w-full max-w-md overflow-hidden rounded-lg border border-border-subtle bg-white">
              <Image
                src={activeDisplayUrl}
                alt={altText || "معاينة الصورة المرفوعة"}
                fill
                unoptimized
                className="object-contain"
              />
              {isProcessing && (
                <div className="absolute inset-0 flex items-center justify-center bg-navy/65 text-white">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              )}
            </div>

            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
                className="squircle-pill inline-flex min-h-[44px] items-center gap-2 rounded-pill border border-border bg-white px-4 py-2 text-xs font-bold text-navy transition-colors hover:border-rose-dark hover:text-rose-dark"
              >
                <Upload className="h-4 w-4" aria-hidden="true" />
                <span>تغيير الصورة</span>
              </button>

              <button
                type="button"
                onClick={handleRemove}
                disabled={isProcessing}
                className="squircle-pill inline-flex min-h-[44px] items-center gap-2 rounded-pill border border-danger/30 bg-danger-surface px-4 py-2 text-xs font-bold text-danger transition-colors hover:bg-danger hover:text-white"
              >
                <X className="h-4 w-4" aria-hidden="true" />
                <span>إزالة الصورة</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="py-6">
            <ImageIcon className="mx-auto h-10 w-10 text-text-secondary" />
            <p className="mt-2 text-sm font-semibold text-navy">
              اسحب الصورة وأفلتها هنا، أو اضغط للاختيار
            </p>
            <p className="mt-1 text-xs text-text-secondary">
              يدعم JPEG أو PNG أو WebP بحد أقصى 5 ميجابايت (يتم ضغطها إلى WebP بحجم أقل من 2 ميجابايت تلقائيًا)
            </p>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
              className="squircle-pill btn-rose-cta mt-4 inline-flex min-h-[44px] items-center gap-2 rounded-pill px-5 py-2 text-xs font-bold text-navy active:scale-95"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>جاري المعالجة والرفع...</span>
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  <span>اختيار ملف</span>
                </>
              )}
            </button>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileSelected}
          className="hidden"
          aria-label={label}
        />
      </div>

      {errorMessage && (
        <p className="text-xs text-danger font-medium" role="alert">
          {errorMessage}
        </p>
      )}

      {/* Alt Text Input */}
      <div>
        <label
          htmlFor="cover_alt_input"
          className="block text-xs font-semibold text-text-secondary mb-1.5"
        >
          النص البديل (200 حرف كحد أقصى)
        </label>
        <input
          id="cover_alt_input"
          type="text"
          value={altText}
          onChange={handleAltChange}
          placeholder="وصف الصورة لقارئ الشاشة..."
          maxLength={200}
          className="squircle-pill w-full min-h-[44px] rounded-pill border border-border bg-search-bg px-3.5 text-sm text-navy focus:border-rose-dark focus:outline-none focus:ring-2 focus:ring-rose-dark/25"
        />
      </div>
    </div>
  );
}
