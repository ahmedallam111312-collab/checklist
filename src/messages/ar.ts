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
  adminDashboard: "Dashboard",
  adminSettings: "Site Settings",
  adminLogout: "Sign Out",
  adminBackToDashboard: "Back to Dashboard",
  adminViewPublicSite: "View Public Site",
  adminViewPublic: "View Live",
  adminDraftBanner: "Draft Preview (Admin Only)",
  adminDraftPreview: "Preview Draft",

  // Admin Procedures & Dashboard
  adminProceduresList: "Procedures Management",
  adminAddProcedure: "Add New Procedure",
  adminStatusDraft: "Draft",
  adminStatusPublished: "Published",
  adminReorderBatchSave: "Save Order",
  adminReorderSuccess: "Procedure order saved successfully.",
  adminMoveUp: "Move Up",
  adminMoveDown: "Move Down",
  adminUpdatedAt: "Last updated",
  adminNoProcedures: "No procedures created yet.",
  adminVideosUsedWidget: "Video Quota",
  adminVideosCount: "Videos used: {used} / {limit}",
  adminVideosWarning: "Notice: Approaching free tier limit (10 videos)",

  // Procedure Editor Tabs
  tabDetails: "Basic Details",
  tabOverview: "Overview & Sections",
  tabEquipment: "Required Equipment",
  tabChecklist: "Checklist Steps",
  tabVideo: "Demonstration Video",
  tabComingSoon: "Coming Soon",

  // Form Fields & Actions
  fieldTitle: "Procedure Title",
  fieldSlug: "URL Slug",
  fieldShortDesc: "Short Description",
  fieldCoverImage: "Cover Image",
  fieldAltText: "Image Alt Text",
  fieldPublish: "Publish Procedure (Live to Public)",
  fieldDefinition: "Clinical Definition",
  fieldIndications: "Clinical Indications",
  fieldContraindications: "Contraindications",
  fieldCommonMistakes: "Common Errors & Complications",
  addItem: "Add Item",
  removeItem: "Remove",
  saveChanges: "Save Changes",
  saving: "Saving...",
  saveSuccess: "Changes saved successfully.",
  saveError: "An error occurred while saving. Please try again.",
  publishWarningEmpty: "Notice: This procedure does not have a definition or completed checklist steps yet.",
  unsavedWarning: "You have unsaved changes. Are you sure you want to leave without saving?",

  // Delete Procedure Dialog
  deleteProcedure: "Delete Procedure",
  deleteConfirmTitle: "Confirm Procedure Deletion",
  deleteConfirmWarning: "Warning: The procedure and all associated steps and equipment will be permanently deleted. Type the procedure title exactly to confirm:",
  deleteConfirmPlaceholder: "Type procedure title here...",
  deleteConfirmButton: "Permanently Delete Procedure",
  cancel: "Cancel",

  // Admin Login
  adminLoginTitle: "Admin Sign In",
  adminLoginSubtitle: "Department of Critical Care & Emergency Nursing",
  fieldEmail: "Email Address",
  fieldPassword: "Password",
  loginButton: "Sign In",
  loginGenericError: "بيانات الدخول غير صحيحة.",

  // Empty States
  emptyLibraryTitle: "No Procedures Available Yet",
  emptyLibraryDesc: "Standardized clinical nursing procedures will appear here once published by the department faculty.",
  emptySectionDesc: "Content is being prepared for this section.",
  emptyListDesc: "No items listed yet.",

  // Admin Settings
  settingsTitle: "Platform Settings",
  settingsSiteName: "Platform Name",
  settingsTagline: "Tagline",
  settingsSplashCta: "Splash Button Text",
  settingsHeroEyebrow: "Hero Eyebrow",
  settingsHeroTitle: "Hero Title",
  settingsHeroDesc: "Hero Description",
  settingsHeroCta: "Hero Button Text",
  settingsFooterText: "Footer & Copyright Notice",
  settingsLogo: "Platform Logo",
  settingsUploadLogo: "Upload New Logo",
  settingsRemoveLogo: "Remove Custom Logo (Use Default)",

  // Equipment Tab
  equipmentTitle: "Required Equipment & Medical Supplies",
  equipmentItemName: "Item Name",
  addEquipmentItem: "Add Equipment Item",
  equipmentPhotoLabel: "Equipment Photo",
  equipmentMaxItemsWarning: "Maximum limit reached (100 items)",

  // Checklist Tab
  checklistTitle: "Procedural Checklist Steps",
  stepEnText: "Step Text (English)",
  stepArText: "Arabic Translation (Optional)",
  stepCriticalLabel: "Critical Step Flag",
  stepCriticalTrue: "Critical",
  stepCriticalFalse: "Standard",
  stepPhaseLabel: "Clinical Phase (Optional)",
  addStep: "Add Step",
  addStepAfter: "Add Step After",
  duplicateStep: "Duplicate Step",
  deleteStep: "Delete Step",
  checklistMaxStepsWarning: "Maximum limit reached (200 steps)",

  // Bulk Import
  bulkImportButton: "Bulk Import",
  bulkImportTitle: "Bulk Import Checklist Steps",
  bulkImportDesc: "Paste steps line by line. Use '#' for phase headers, '!' for critical steps, and '|' to separate English and Arabic text.",
  bulkImportPreviewButton: "Preview Steps",
  bulkImportModeAppend: "Append to Existing Steps",
  bulkImportModeReplace: "Replace All Existing Steps",
  bulkImportConfirmReplaceWarning: "To replace all existing steps, please type the procedure title to confirm:",
  bulkImportConfirmButton: "Confirm & Import",
  bulkImportErrorsFound: "Errors detected in bulk text. Please fix the highlighted lines below.",
  bulkImportSuccess: "Steps parsed and loaded into editor as draft.",

  // Backup
  backupExportButton: "Export Backup (JSON)",
  backupExporting: "Exporting...",
  backupNote: "تتضمن النسخة الاحتياطية كافة الجداول والنصوص والمسودات، ولا تشمل ملفات الصور المخزنة.",

  // Video Management & Mux
  videoMuxNotConfigured: "Mux is not configured",
  videoMuxNotConfiguredDesc: "Please add Mux API credentials to environment variables to enable video uploads.",
  videoDemoModeDisabled: "Video management is disabled in Demo Mode.",
  videoEmptyDropTitle: "Drag and drop video file here or click to browse",
  videoEmptyFormats: "Supported formats: MP4, MOV, WebM (Max size: 500 MB)",
  videoSelectFile: "Choose Video File",
  videoUploading: "Uploading video to Mux...",
  videoCancelUpload: "Cancel Upload",
  videoProcessing: "Processing video on Mux...",
  videoProcessingDesc: "Video processing may take 1-3 minutes depending on length. Status updates automatically.",
  videoReadyTitle: "Video is Ready",
  videoDurationLabel: "Duration:",
  videoReplaceButton: "Replace Video",
  videoDeleteButton: "Delete Video",
  videoDeleteConfirmTitle: "Confirm Video Deletion",
  videoDeleteConfirmDesc: "Are you sure you want to delete this video? The asset will be permanently removed from Mux.",
  videoDeleteConfirmButton: "Yes, Delete Video",
  videoDeleteCancelButton: "Cancel",
  videoQuotaBlocked: "Free tier quota reached (10 / 10 videos). You must delete an existing video before uploading a new one.",
  videoOrphansWarning: "Notice: There are unlinked videos in Mux ({count}).",
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
