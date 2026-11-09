/**
 * Arabic UI strings for ProfNurse.
 * Reviewed by department professors.
 * Precedence: DESIGN.md & SPEC.md section 7.
 */

export const AR_STRINGS = {
  // Navigation & Shell
  home: "الرئيسية",
  toggleTheme: "تغيير المظهر",
  start: "ابدأ",
  explore: "استكشف",
  backToProcedures: "العودة إلى الإجراءات",
  libraryTitle: "مكتبة الإجراءات",
  searchPlaceholder: "ابحث عن إجراء...",
  noResults: "لا توجد نتائج مطابقة",

  // Sections (7 canonical sections in exact order)
  sectionDefinition: "التعريف",
  sectionIndications: "دواعي الاستخدام",
  sectionContraindications: "موانع الاستخدام",
  sectionEquipment: "الأدوات",
  sectionChecklist: "قائمة الخطوات",
  sectionCommonMistakes: "الأخطاء الشائعة",
  sectionVideo: "الفيديو التوضيحي",

  // Checklist & Equipment
  arabicToggle: "عربي",
  criticalScreenReader: "خطوة حرجة",
  resetProgress: "إعادة ضبط",
  sectionEmpty: "لم تتم إضافة المحتوى بعد",
  videoBeingPrepared: "الفيديو التوضيحي قيد الإعداد",
  videoError: "تعذّر تشغيل الفيديو. حاول مرة أخرى.",

  // Stats
  statsProcedures: "إجراءات",
  statsSections: "أقسام لكل إجراء",
  statsLanguages: "ثنائي اللغة",

  // Banner
  demoDataBanner: "وضع المعاينة التجريبية — جميع البيانات المعروضة تجريبية واختبارية فقط وليست محتوى سريريًا حقيقيًا",
  demoDataBannerShort: "وضع المعاينة — بيانات تجريبية واختبارية فقط وليست محتوى حقيقيًا",
  demoDataBadge: "بيانات تجريبية",

  // Admin Navigation & Shell
  adminDashboard: "لوحة التحكم",
  adminSettings: "إعدادات الموقع",
  adminLogout: "تسجيل الخروج",
  adminBackToDashboard: "العودة إلى لوحة التحكم",
  adminViewPublicSite: "عرض الموقع العام",
  adminViewPublic: "عرض في الموقع",
  adminDraftBanner: "معاينة مسودة (خاص بالإدارة)",
  adminDraftPreview: "معاينة المسودة",

  // Admin Procedures & Dashboard
  adminProceduresList: "قائمة الإجراءات",
  adminAddProcedure: "إضافة إجراء جديد",
  adminStatusDraft: "مسودة",
  adminStatusPublished: "منشور",
  adminReorderBatchSave: "حفظ الترتيب",
  adminReorderSuccess: "تم حفظ ترتيب الإجراءات بنجاح",
  adminMoveUp: "تحريك لأعلى",
  adminMoveDown: "تحريك لأسفل",
  adminUpdatedAt: "آخر تحديث",
  adminNoProcedures: "لا توجد إجراءات مسجلة بعد.",
  adminVideosUsedWidget: "استهلاك الفيديو",
  adminVideosCount: "فيديوهات مستخدمة: {used} / {limit}",
  adminVideosWarning: "تنبيه: اقتربت من الحد الأقصى للمكتبة المجانية (10 فيديوهات)",

  // Procedure Editor Tabs
  tabDetails: "البيانات الأساسية",
  tabOverview: "نظرة عامة وملاحظات",
  tabEquipment: "الأدوات",
  tabChecklist: "قائمة الخطوات",
  tabVideo: "الفيديو التوضيحي",
  tabComingSoon: "قريبًا في المرحلة التالية",

  // Form Fields & Actions
  fieldTitle: "عنوان الإجراء (Title)",
  fieldSlug: "المعرّف اللطيف (Slug)",
  fieldShortDesc: "وصف موجز (Short Description)",
  fieldCoverImage: "صورة الغلاف (Cover Image)",
  fieldAltText: "النص البديل للصورة (Alt Text)",
  fieldPublish: "نشر الإجراء للعامة (Published)",
  fieldDefinition: "التعريف السريري (Definition)",
  fieldIndications: "دواعي الاستخدام (Indications)",
  fieldContraindications: "موانع الاستخدام (Contraindications)",
  fieldCommonMistakes: "الأخطاء الشائعة (Common Mistakes)",
  addItem: "إضافة عنصر جديد",
  removeItem: "إزالة",
  saveChanges: "حفظ التعديلات",
  saving: "جاري الحفظ...",
  saveSuccess: "تم حفظ التعديلات بنجاح",
  saveError: "حدث خطأ أثناء الحفظ. يرجى المحاولة مرة أخرى.",
  publishWarningEmpty: "تنبيه: هذا الإجراء لا يحتوي على تعريف أو خطوات مكتملة بعد.",
  unsavedWarning: "لديك تعديلات غير محفوظة. هل تريد المغادرة دون حفظ؟",

  // Delete Procedure Dialog
  deleteProcedure: "حذف الإجراء",
  deleteConfirmTitle: "تأكيد حذف الإجراء",
  deleteConfirmWarning: "تحذير: سيتم حذف الإجراء وكافة البيانات المرتبطة به نهائيًا. لتأكيد الحذف، اكتب عنوان الإجراء بدقة أدناه:",
  deleteConfirmPlaceholder: "اكتب عنوان الإجراء هنا...",
  deleteConfirmButton: "حذف نهائي للإجراء",
  cancel: "إلغاء",

  // Admin Login
  adminLoginTitle: "تسجيل الدخول للإدارة",
  adminLoginSubtitle: "قسم تمريض الحالات الحرجة والطوارئ",
  fieldEmail: "البريد الإلكتروني",
  fieldPassword: "كلمة المرور",
  loginButton: "دخول",
  loginGenericError: "بيانات الدخول غير صحيحة.",

  // Empty States
  emptyLibraryTitle: "لا توجد إجراءات متاحة حاليًا",
  emptyLibraryDesc: "لم يتم نشر أي إجراءات سريرية بعد. سيتم إضافتها وتحديثها من قبل القسم قريبًا.",
  emptySectionDesc: "لم تتم إضافة محتوى لهذا القسم بعد.",
  emptyListDesc: "لا توجد عناصر مضافة حتى الآن.",

  // Admin Settings
  settingsTitle: "إعدادات المنصة الأساسية",
  settingsSiteName: "اسم المنصة",
  settingsTagline: "الشعار النصي",
  settingsSplashCta: "زر صفحة البداية",
  settingsHeroEyebrow: "العنوان التمهيدي للرئيسية",
  settingsHeroTitle: "العنوان الرئيسي",
  settingsHeroDesc: "الوصف التعريفي",
  settingsHeroCta: "زر استكشاف الإجراءات",
  settingsFooterText: "نص التذييل وحقوق الملكية",
  settingsLogo: "شعار الموقع",
  settingsUploadLogo: "رفع شعار جديد",
  settingsRemoveLogo: "حذف الشعار واستخدام الشعار الافتراضي",
  // Equipment Tab
  equipmentTitle: "الأدوات والتجهيزات السريرية",
  equipmentItemName: "اسم الأداة (Name - EN)",
  addEquipmentItem: "إضافة أداة جديدة",
  equipmentPhotoLabel: "صورة توضيحية للأداة",
  equipmentMaxItemsWarning: "تم الوصول للحد الأقصى (100 أداة)",

  // Checklist Tab
  checklistTitle: "قائمة الخطوات السريرية",
  stepEnText: "نص الخطوة بالإنجليزية (English - EN)",
  stepArText: "الترجمة العربية للخطوة (Arabic - AR)",
  stepCriticalLabel: "درجة الخطورة",
  stepCriticalTrue: "حرجة",
  stepCriticalFalse: "عادية",
  stepPhaseLabel: "المرحلة السريرية (Phase)",
  addStep: "إضافة خطوة",
  addStepAfter: "إضافة خطوة تالية",
  duplicateStep: "نسخ الخطوة",
  deleteStep: "حذف الخطوة",
  checklistMaxStepsWarning: "تم الوصول للحد الأقصى (200 خطوة)",

  // Bulk Import
  bulkImportButton: "استيراد مجمّع",
  bulkImportTitle: "استيراد مجمّع للخطوات السريرية",
  bulkImportDesc: "الصق الخطوات سطرًا بسطر. استخدم '#' للمراحل، '!' للخطوات الحرجة، و '|' للفصل بين الإنجليزية والعربية.",
  bulkImportPreviewButton: "معاينة",
  bulkImportModeAppend: "إلحاق بالخطوات الحالية",
  bulkImportModeReplace: "استبدال كافة الخطوات الحالية",
  bulkImportConfirmReplaceWarning: "لاستبدال جميع الخطوات الحالية، يرجى كتابة عنوان الإجراء للتأكيد:",
  bulkImportConfirmButton: "تأكيد واستيراد",
  bulkImportErrorsFound: "يوجد أخطاء تمنع تأكيد الاستيراد. يرجى تصحيح الأسطر الموضحة أدناه.",
  bulkImportSuccess: "تم تحليل واستيراد الخطوات بنجاح كمسودة غير محفوظة.",

  // Backup
  backupExportButton: "تصدير نسخة احتياطية",
  backupExporting: "جاري التصدير...",
  backupNote: "تتضمن النسخة الاحتياطية كافة الجداول والنصوص والمسودات، ولا تشمل ملفات الصور المخزنة.",
} as const;

export type MessageKey = keyof typeof AR_STRINGS;

const arPluralRules = new Intl.PluralRules("ar");

/**
 * Format Arabic pluralized strings using CLDR plural rules (zero, one, two, few, many, other)
 */
export function formatArabicPlural(
  count: number,
  forms: {
    zero?: string;
    one?: string;
    two?: string;
    few?: string;
    many?: string;
    other: string;
  }
): string {
  const rule = arPluralRules.select(count);
  return forms[rule] || forms.other;
}

/**
 * Progress format helper: "تم {done} من {total}"
 */
export function formatProgress(done: number, total: number): string {
  return `تم ${done} من ${total}`;
}

/**
 * Equipment ready helper: "{done} / {total} جاهز"
 */
export function formatEquipmentReady(done: number, total: number): string {
  return `${done} / ${total} جاهز`;
}
