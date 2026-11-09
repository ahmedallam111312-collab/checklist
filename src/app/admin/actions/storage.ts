"use server";

import { verifyAdmin } from "@/lib/auth/admin";
import { isDemoMode } from "@/lib/data";

const ALLOWED_MIME_TYPES = ["image/webp", "image/jpeg", "image/png"];
const MAX_UPLOAD_SIZE = 2 * 1024 * 1024; // 2 MB server limit

export interface StorageUploadResult {
  success?: boolean;
  error?: string;
  path?: string;
}

export async function uploadImageAction(
  formData: FormData
): Promise<StorageUploadResult> {
  const auth = await verifyAdmin();
  if (!auth.authorized) {
    return { error: "Unauthorized: admin session required." };
  }

  const file = formData.get("file") as File;
  const folder = (formData.get("folder") as string) || "covers/general";
  const oldPath = formData.get("oldPath") as string | null;

  if (!file) {
    return { error: "No file provided for upload." };
  }

  // Server-side MIME validation
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return {
      error: "Server validation failed: only JPEG, PNG, and WebP are permitted.",
    };
  }

  // Server-side size validation (2 MB limit)
  if (file.size > MAX_UPLOAD_SIZE) {
    return {
      error: "Server validation failed: file exceeds the 2 MB storage limit.",
    };
  }

  // Sanitize folder path to prevent path traversal
  const sanitizedFolder = folder.replace(/\.\./g, "").replace(/^\/+|\/+$/g, "");
  const fileExt = file.type === "image/webp" ? "webp" : "jpg";
  const randomId = crypto.randomUUID();
  const filePath = `${sanitizedFolder}/${randomId}.${fileExt}`;

  // Demo mode
  if (isDemoMode()) {
    return {
      success: true,
      path: `demo-storage/${filePath}`,
    };
  }

  // Supabase with RLS / user session
  try {
    const supabase = auth.supabase;
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Delete old file if replacing
    if (oldPath && !oldPath.startsWith("demo-")) {
      try {
        await supabase.storage.from("site-images").remove([oldPath]);
      } catch {}
    }

    const { error: uploadError } = await supabase.storage
      .from("site-images")
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      return { error: `Storage upload failed: ${uploadError.message}` };
    }

    return { success: true, path: filePath };
  } catch (err: any) {
    return { error: err.message || "Storage upload encountered an error." };
  }
}

export async function deleteImageAction(
  filePath: string
): Promise<{ success: boolean; error?: string }> {
  const auth = await verifyAdmin();
  if (!auth.authorized) {
    return { success: false, error: "Unauthorized" };
  }

  if (isDemoMode() || !filePath || filePath.startsWith("demo-")) {
    return { success: true };
  }

  try {
    const supabase = auth.supabase;
    await supabase.storage.from("site-images").remove([filePath]);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
