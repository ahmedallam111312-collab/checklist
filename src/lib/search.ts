/**
 * Normalize Arabic and English search text:
 * - Strips Arabic diacritics (tashkeel) and tatweel
 * - Normalizes Alef variants (أ/إ/آ/ٱ -> ا), Alef Maqsura (ى -> ي), Teh Marbuta (ة -> ه)
 * - Normalizes Hamza carriers (ؤ -> و, ئ -> ي)
 * - Lowercases and collapses whitespace for English matching
 */
export function normalizeSearchText(input: string): string {
  return input
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/\s+/g, " ")
    .trim();
}
