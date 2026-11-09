"use client";

import React, { useState, useTransition } from "react";
import { Save, Loader2, Check, AlertCircle } from "lucide-react";
import { SiteSettings } from "@/types/database";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { FormattedLabel } from "@/components/admin/FormattedLabel";
import { updateSiteSettings, removeLogoAction } from "@/app/admin/actions/settings";
import { siteSettingsSchema } from "@/lib/validation/procedure";
import { AR_STRINGS } from "@/messages/ar";

interface AdminSettingsClientProps {
  initialSettings: SiteSettings;
}

export function AdminSettingsClient({ initialSettings }: AdminSettingsClientProps) {
  const [settings, setSettings] = useState<SiteSettings>(initialSettings);
  const [isSaving, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleChange = (field: keyof SiteSettings, value: string) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    setFieldErrors({});

    const parsed = siteSettingsSchema.safeParse(settings);
    if (!parsed.success) {
      const errors: Record<string, string> = {};
      parsed.error.issues.forEach((issue) => {
        const fieldName = issue.path[0] as string;
        errors[fieldName] = issue.message;
      });
      setFieldErrors(errors);
      return;
    }

    startTransition(async () => {
      const res = await updateSiteSettings(parsed.data);
      if (res.error) {
        setFeedback({ type: "error", message: res.error });
      } else {
        setFeedback({ type: "success", message: AR_STRINGS.saveSuccess });
      }
    });
  };

  const handleLogoChanged = (newPath: string | null) => {
    setSettings((prev) => ({ ...prev, logo_path: newPath }));
    if (!newPath) {
      startTransition(async () => {
        await removeLogoAction();
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-start max-w-3xl">
      {/* Live Feedback Region */}
      <div aria-live="polite">
        {feedback && (
          <div
            className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-xs font-semibold text-start mb-2 animate-in fade-in ${
              feedback.type === "success"
                ? "bg-[var(--color-primary)]/15 text-[var(--color-primary)]"
                : "bg-[var(--color-danger-surface)] text-[var(--color-danger)]"
            }`}
          >
            {feedback.type === "success" ? (
              <Check className="h-4 w-4 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-5 sm:p-7 space-y-5 shadow-sm">
        <h2 className="text-base font-bold text-[var(--color-text)] border-b border-[var(--color-border-subtle)] pb-3">
          {AR_STRINGS.settingsTitle}
        </h2>

        {/* Site Name (English LTR) */}
        <div>
          <label
            htmlFor="setting_site_name"
            className="block text-sm font-semibold text-[var(--color-text)] mb-1"
          >
            <FormattedLabel text={AR_STRINGS.settingsSiteName} /> <span className="text-[var(--color-danger)]">*</span>
          </label>
          <input
            id="setting_site_name"
            type="text"
            required
            dir="ltr"
            lang="en"
            maxLength={300}
            value={settings.site_name}
            onChange={(e) => handleChange("site_name", e.target.value.slice(0, 300))}
            className="w-full min-h-[44px] rounded-md border border-[var(--color-border)] bg-[var(--color-surface-sunken)] px-3 text-sm text-[var(--color-text)] font-semibold focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
          />
          {fieldErrors.site_name && (
            <p className="mt-1 text-xs text-[var(--color-danger)]">{fieldErrors.site_name}</p>
          )}
        </div>

        {/* Tagline (English LTR) */}
        <div>
          <label
            htmlFor="setting_tagline"
            className="block text-sm font-semibold text-[var(--color-text)] mb-1"
          >
            <FormattedLabel text={AR_STRINGS.settingsTagline} />
          </label>
          <input
            id="setting_tagline"
            type="text"
            dir="ltr"
            lang="en"
            maxLength={300}
            value={settings.tagline}
            onChange={(e) => handleChange("tagline", e.target.value.slice(0, 300))}
            className="w-full min-h-[44px] rounded-md border border-[var(--color-border)] bg-[var(--color-surface-sunken)] px-3 text-sm text-[var(--color-text)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
          />
        </div>

        {/* Splash CTA (Arabic RTL) */}
        <div>
          <label
            htmlFor="setting_splash_cta"
            className="block text-sm font-semibold text-[var(--color-text)] mb-1"
          >
            <FormattedLabel text={AR_STRINGS.settingsSplashCta} />
          </label>
          <input
            id="setting_splash_cta"
            type="text"
            maxLength={300}
            value={settings.splash_cta}
            onChange={(e) => handleChange("splash_cta", e.target.value.slice(0, 300))}
            className="w-full min-h-[44px] rounded-md border border-[var(--color-border)] bg-[var(--color-surface-sunken)] px-3 text-sm text-[var(--color-text)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
          />
        </div>

        {/* Hero Eyebrow (Arabic RTL) */}
        <div>
          <label
            htmlFor="setting_hero_eyebrow"
            className="block text-sm font-semibold text-[var(--color-text)] mb-1"
          >
            <FormattedLabel text={AR_STRINGS.settingsHeroEyebrow} />
          </label>
          <input
            id="setting_hero_eyebrow"
            type="text"
            maxLength={300}
            value={settings.hero_eyebrow}
            onChange={(e) => handleChange("hero_eyebrow", e.target.value.slice(0, 300))}
            className="w-full min-h-[44px] rounded-md border border-[var(--color-border)] bg-[var(--color-surface-sunken)] px-3 text-sm text-[var(--color-text)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
          />
        </div>

        {/* Hero Title (Arabic RTL) */}
        <div>
          <label
            htmlFor="setting_hero_title"
            className="block text-sm font-semibold text-[var(--color-text)] mb-1"
          >
            <FormattedLabel text={AR_STRINGS.settingsHeroTitle} />
          </label>
          <input
            id="setting_hero_title"
            type="text"
            maxLength={300}
            value={settings.hero_title}
            onChange={(e) => handleChange("hero_title", e.target.value.slice(0, 300))}
            className="w-full min-h-[44px] rounded-md border border-[var(--color-border)] bg-[var(--color-surface-sunken)] px-3 text-sm text-[var(--color-text)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
          />
          <p className="mt-1 type-caption text-[var(--color-text-muted)] font-arabic leading-relaxed">
            العنوان الرئيسي المعروض في واجهة الصفحة الرئيسية (الافتراضي: &quot;مرحبًا بك في ProfNurse&quot;). عند احتواء العنوان على اسم المنصة، يتم عزله وتنسيقه بلوني الهوية البصرية تلقائيًا.
          </p>
        </div>

        {/* Hero Description (Arabic RTL) */}
        <div>
          <label
            htmlFor="setting_hero_desc"
            className="block text-sm font-semibold text-[var(--color-text)] mb-1"
          >
            <FormattedLabel text={AR_STRINGS.settingsHeroDesc} />
          </label>
          <textarea
            id="setting_hero_desc"
            rows={3}
            maxLength={1000}
            value={settings.hero_description}
            onChange={(e) => handleChange("hero_description", e.target.value.slice(0, 1000))}
            className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface-sunken)] p-3 text-sm text-[var(--color-text)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] leading-relaxed"
          />
        </div>

        {/* Hero CTA (Arabic RTL) */}
        <div>
          <label
            htmlFor="setting_hero_cta"
            className="block text-sm font-semibold text-[var(--color-text)] mb-1"
          >
            <FormattedLabel text={AR_STRINGS.settingsHeroCta} />
          </label>
          <input
            id="setting_hero_cta"
            type="text"
            maxLength={300}
            value={settings.hero_cta}
            onChange={(e) => handleChange("hero_cta", e.target.value.slice(0, 300))}
            className="w-full min-h-[44px] rounded-md border border-[var(--color-border)] bg-[var(--color-surface-sunken)] px-3 text-sm text-[var(--color-text)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
          />
        </div>

        {/* Footer Text (Arabic RTL) */}
        <div>
          <label
            htmlFor="setting_footer_text"
            className="block text-sm font-semibold text-[var(--color-text)] mb-1"
          >
            <FormattedLabel text={AR_STRINGS.settingsFooterText} />
          </label>
          <textarea
            id="setting_footer_text"
            rows={2}
            maxLength={300}
            value={settings.footer_text}
            onChange={(e) => {
              handleChange("footer_text", e.target.value.slice(0, 300));
              e.target.style.height = "auto";
              e.target.style.height = `${e.target.scrollHeight}px`;
            }}
            placeholder="قسم تمريض الحالات الحرجة والطوارئ — جميع الحقوق محفوظة."
            className="w-full min-h-[60px] rounded-md border border-[var(--color-border)] bg-[var(--color-surface-sunken)] p-3 text-sm text-[var(--color-text)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] resize-none"
          />
          {/* Live character counter aligned to end under field */}
          <div className="flex justify-end mt-1">
            <span className="text-xs text-[var(--color-text-muted)] font-mono">
              {settings.footer_text.length}/300
            </span>
          </div>
          <p className="mt-1 type-caption text-[var(--color-text-muted)] font-arabic leading-relaxed">
            إذا تم مسح هذا الحقل بالكامل، فلن يتم عرض أي تذييل على الموقع العام.
          </p>
        </div>

        {/* Site Logo Upload / Replacement */}
        <div className="border-t border-[var(--color-border-subtle)] pt-6">
          <ImageUploader
            label={AR_STRINGS.settingsLogo}
            currentPath={settings.logo_path}
            folder="logos"
            onImageChanged={handleLogoChanged}
          />
          <p className="mt-2 type-caption text-[var(--color-text-muted)] font-arabic leading-relaxed">
            عند رفع شعار، سيحل محل الشعار الافتراضي واسم المنصة. يمكن حذفه للعودة إلى الشعار الرمزي البرمجي.
          </p>
        </div>

        {/* Save Settings Button */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end pt-4 border-t border-[var(--color-border-subtle)]">
          <button
            type="submit"
            disabled={isSaving}
            className="w-full sm:w-auto inline-flex min-h-[44px] items-center justify-center gap-2 rounded-md bg-[var(--color-primary)] px-6 py-2.5 text-sm font-semibold text-[var(--color-on-primary)] transition-transform active:scale-95 disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-focus-ring)]"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>{AR_STRINGS.saving}</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>{AR_STRINGS.saveChanges}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
