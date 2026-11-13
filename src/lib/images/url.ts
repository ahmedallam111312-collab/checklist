/**
 * Resolves an image path to a fully qualified URL for Next.js <Image /> components.
 * Supports:
 * - Fully qualified URLs (https://, http://, blob:, data:)
 * - Static root assets (/brand/..., /icons/...)
 * - Supabase Storage relative paths (covers/..., equipment/..., logos/...)
 */
export function getPublicImageUrl(path?: string | null): string | null {
  if (!path) return null;
  const trimmed = path.trim();
  if (!trimmed) return null;

  // If already absolute URL, data URI, blob, or static root path
  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("blob:") ||
    trimmed.startsWith("data:") ||
    trimmed.startsWith("/")
  ) {
    return trimmed;
  }

  // Resolve against Supabase Storage bucket 'site-images'
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  if (!supabaseUrl) {
    return `/${trimmed}`;
  }

  const cleanBase = supabaseUrl.replace(/\/+$/, "");
  const cleanPath = trimmed.replace(/^\/+/, "");
  return `${cleanBase}/storage/v1/object/public/site-images/${cleanPath}`;
}
