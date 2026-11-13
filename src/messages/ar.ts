/**
 * UI strings for Critical Ease.
 * Department of Critical Care and Emergency Nursing, Faculty of Nursing, Cairo University.
 */

export const AR_STRINGS = {
  // Navigation & Shell
  home: "Home",
  navProcedures: "Procedures",
  navAbout: "About",
  navMenu: "Menu",
  start: "Get Started",
  explore: "Explore Procedure",
  backToProcedures: "Back to Procedures",
  libraryTitle: "Procedures Library",
  searchPlaceholder: "Search procedures, steps, equipment...",
  noResults: "No matching procedures found",

  // Sections (7 canonical sections in exact order)
  sectionDefinition: "1. Definition & Clinical Overview",
  sectionIndications: "2. Indications",
  sectionContraindications: "3. Contraindications",
  sectionEquipment: "4. Required Equipment",
  sectionChecklist: "5. Procedural Checklist",
  sectionCommonMistakes: "6. Common Errors & Complications",
  sectionVideo: "7. Demonstration Video",

  // Checklist & Equipment
  arabicToggle: "عربي",
  criticalScreenReader: "Critical Step",
  resetProgress: "Reset Checklist",
  sectionEmpty: "Content is being prepared for this section",
  videoBeingPrepared: "Demonstration video is being prepared",
  videoError: "Unable to play video. Please try again.",

  // Stats
  statsProcedures: "Procedures",
  statsSections: "Sections per Procedure",
  statsLanguages: "Bilingual Standard",

  // Banner
  demoDataBanner: "Demo Mode — All data displayed is for demonstration and testing purposes only.",
  demoDataBannerShort: "Demo Mode — Testing data only.",
  demoDataBadge: "DEMO DATA",

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
  emptyLibraryTitle: "No Procedures Available Yet",
  emptyLibraryDesc: "Standardized clinical nursing procedures will appear here once published by the department faculty.",
  emptySectionDesc: "Content is being prepared for this section.",
  emptyListDesc: "No items listed yet.",

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

  // Video Management & Mux
  videoMuxNotConfigured: "لم يتم إعداد Mux",
  videoMuxNotConfiguredDesc: "يرجى إضافة مفاتيح Mux إلى متغيرات البيئة لتفعيل إدارة الفيديو.",
  videoDemoModeDisabled: "إدارة الفيديو معطلة في وضع البيانات التجريبية (Demo Mode).",
  videoEmptyDropTitle: "اسحب ملف الفيديو وأفلته هنا أو اضغط للاختيار",
  videoEmptyFormats: "الصيغ المدعومة: MP4, MOV, WebM (الحد الأقصى: 500 ميجابايت)",
  videoSelectFile: "اختيار ملف فيديو",
  videoUploading: "جارٍ رفع الفيديو إلى Mux...",
  videoCancelUpload: "إلغاء الرفع",
  videoProcessing: "جارٍ معالجة الفيديو في Mux...",
  videoProcessingDesc: "قد تستغرق المعالجة بضع دقائق حسب حجم الفيديو. يتم التحديث تلقائيًا.",
  videoReadyTitle: "الفيديو جاهز للعرض",
  videoDurationLabel: "المدة:",
  videoReplaceButton: "استبدال الفيديو",
  videoDeleteButton: "حذف الفيديو",
  videoDeleteConfirmTitle: "تأكيد حذف الفيديو",
  videoDeleteConfirmDesc: "هل أنت متأكد من حذف هذا الفيديو؟ سيتم حذف الأصل نهائيًا من Mux ومسح بيانات الفيديو من هذا الإجراء.",
  videoDeleteConfirmButton: "نعم، احذف الفيديو نهائيًا",
  videoDeleteCancelButton: "إلغاء",
  videoQuotaBlocked: "تم الوصول إلى الحد الأقصى للمكتبة المجانية (10 / 10). لا يمكن رفع فيديو جديد إلا بعد حذف فيديو موجود (استبدال الفيديو الحالي متاح).",
  videoOrphansWarning: "تنبيه: يوجد فيديوهات في Mux غير مرتبطة بأي إجراء ({count}).",
  videoPublicEmpty: "No demonstration video available yet",
  videoPublicRetry: "Retry",
  videoRefreshStatus: "Refresh Status",
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
 * Progress format helper: "{done} of {total} completed"
 */
export function formatProgress(done: number, total: number): string {
  return `${done} of ${total} completed`;
}

/**
 * Equipment ready helper: "{done} / {total} Ready"
 */
export function formatEquipmentReady(done: number, total: number): string {
  return `${done} / ${total} Ready`;
}
