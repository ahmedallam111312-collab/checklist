/**
 * Maps raw database, Supabase, network, or Mux errors to friendly Arabic messages with retry.
 * Technical details are logged on the server only and never leaked to the admin UI.
 */
export function mapActionError(context: string, rawError: any): string {
  // Log technical detail on server only
  console.error(`[Admin Video Action Error] [${context}]:`, rawError);

  const rawMessage = typeof rawError === "string" ? rawError : rawError?.message || "";
  const rawCode = rawError?.code || "";

  // Database schema, column, relation or permission errors (e.g. PGRST204, 42703)
  if (
    rawCode === "PGRST204" ||
    rawCode === "42703" ||
    rawCode === "42P01" ||
    rawMessage.includes("column") ||
    rawMessage.includes("relation") ||
    rawMessage.includes("schema") ||
    rawMessage.includes("syntax")
  ) {
    return "تعذر إكمال العملية بسبب خطأ في مزامنة قاعدة البيانات. يرجى إعادة المحاولة لاحقًا.";
  }

  // Network, connection, or timeout errors
  if (
    rawMessage.includes("fetch failed") ||
    rawMessage.includes("network") ||
    rawMessage.includes("timeout") ||
    rawMessage.includes("ECONNREFUSED") ||
    rawMessage.includes("ENOTFOUND")
  ) {
    return "تعذر الاتصال بالخادم. يرجى التحقق من اتصال الإنترنت وإعادة المحاولة.";
  }

  // Mux API errors
  if (
    rawMessage.includes("Mux") ||
    rawMessage.includes("mux") ||
    rawMessage.includes("asset") ||
    rawMessage.includes("playback") ||
    rawMessage.includes("upload")
  ) {
    return "حدث خطأ أثناء معالجة خدمة الفيديو. يرجى إعادة المحاولة.";
  }

  return "حدث خطأ غير متوقع أثناء معالجة الطلب. يرجى إعادة المحاولة.";
}
