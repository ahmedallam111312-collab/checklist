"use client";

import React, { useState, useEffect } from "react";
import { Save, Loader2, AlertTriangle, ExternalLink } from "lucide-react";
import Link from "next/link";
import { Procedure } from "@/types/database";
import { generateSlug, procedureDetailsSchema } from "@/lib/validation/procedure";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { FormattedLabel } from "@/components/admin/FormattedLabel";
import { AR_STRINGS } from "@/messages/ar";

interface DetailsTabProps {
  procedure?: Procedure | null;
  onSave: (data: {
    title: string;
    slug: string;
    short_description: string;
    cover_path?: string | null;
    cover_alt: string;
    published: boolean;
  }) => Promise<void>;
  setIsDirty: (dirty: boolean) => void;
  isSaving: boolean;
}

export function DetailsTab({
  procedure,
  onSave,
  setIsDirty,
  isSaving,
}: DetailsTabProps) {
  const [title, setTitle] = useState(procedure?.title || "");
  const [slug, setSlug] = useState(procedure?.slug || "");
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(Boolean(procedure?.slug));
  const [shortDesc, setShortDesc] = useState(procedure?.short_description || "");
  const [coverPath, setCoverPath] = useState<string | null>(procedure?.cover_path || null);
  const [coverAlt, setCoverAlt] = useState(procedure?.cover_alt || "");
  const [published, setPublished] = useState(procedure?.published || false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Auto-generate slug when title changes unless manually edited
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value.slice(0, 80);
    setTitle(newTitle);
    setIsDirty(true);
    if (!isSlugManuallyEdited) {
      setSlug(generateSlug(newTitle));
    }
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsSlugManuallyEdited(true);
    setIsDirty(true);
    setSlug(e.target.value.toLowerCase().slice(0, 60));
  };

  const hasEmptyContent =
    !procedure?.definition ||
    !procedure?.checklist_steps ||
    procedure?.checklist_steps.length === 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});

    const formData = {
      title,
      slug,
      short_description: shortDesc,
      cover_path: coverPath,
      cover_alt: coverAlt,
      published,
    };

    const parsed = procedureDetailsSchema.safeParse(formData);
    if (!parsed.success) {
      const errors: Record<string, string> = {};
      parsed.error.issues.forEach((issue) => {
        const fieldName = issue.path[0] as string;
        errors[fieldName] = issue.message;
      });
      setFieldErrors(errors);
      return;
    }

    await onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 text-start">
      {/* Procedure Title (English LTR) */}
      <div>
        <label
          htmlFor="procedure_title"
          className="block text-sm font-semibold text-[var(--color-text)] mb-1"
        >
          <FormattedLabel text={AR_STRINGS.fieldTitle} /> <span className="text-[var(--color-danger)]">*</span>
        </label>
        <input
          id="procedure_title"
          type="text"
          required
          dir="ltr"
          lang="en"
          maxLength={80}
          value={title}
          onChange={handleTitleChange}
          placeholder="e.g. Arterial Blood Gas Sampling"
          className="w-full min-h-[44px] rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] font-medium"
        />
        <div className="flex justify-between text-[11px] text-[var(--color-text-muted)] mt-1">
          <span>{fieldErrors.title && <span className="text-[var(--color-danger)]">{fieldErrors.title}</span>}</span>
          <span>{title.length}/80</span>
        </div>
      </div>

      {/* Procedure Slug (English LTR) */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label
            htmlFor="procedure_slug"
            className="block text-sm font-semibold text-[var(--color-text)]"
          >
            <FormattedLabel text={AR_STRINGS.fieldSlug} /> <span className="text-[var(--color-danger)]">*</span>
          </label>
          <span className="text-xs text-[var(--color-text-muted)]">
            مستخدم في رابط URL
          </span>
        </div>
        <div className="relative">
          <input
            id="procedure_slug"
            type="text"
            required
            dir="ltr"
            lang="en"
            maxLength={60}
            value={slug}
            onChange={handleSlugChange}
            placeholder="abg-sampling"
            className="w-full min-h-[44px] rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] font-mono"
          />
        </div>
        <div className="flex justify-between text-[11px] text-[var(--color-text-muted)] mt-1">
          <span>{fieldErrors.slug && <span className="text-[var(--color-danger)]">{fieldErrors.slug}</span>}</span>
          <span>{slug.length}/60</span>
        </div>
      </div>

      {/* Short Description (English LTR) */}
      <div>
        <label
          htmlFor="short_desc"
          className="block text-sm font-semibold text-[var(--color-text)] mb-1"
        >
          <FormattedLabel text={AR_STRINGS.fieldShortDesc} />
        </label>
        <textarea
          id="short_desc"
          rows={3}
          dir="ltr"
          lang="en"
          maxLength={200}
          value={shortDesc}
          onChange={(e) => {
            setShortDesc(e.target.value.slice(0, 200));
            setIsDirty(true);
          }}
          placeholder="Brief clinical summary displayed in search and library cards..."
          className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-sm text-[var(--color-text)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] leading-relaxed"
        />
        <div className="flex justify-end text-[11px] text-[var(--color-text-muted)] mt-1">
          <span>{shortDesc.length}/200</span>
        </div>
      </div>

      {/* Cover Image Uploader */}
      <div className="border-t border-[var(--color-border-subtle)] pt-5">
        <ImageUploader
          currentPath={coverPath}
          currentAlt={coverAlt}
          folder={`covers/${procedure?.id || "drafts"}`}
          onImageChanged={(newPath, newAlt) => {
            setCoverPath(newPath);
            setCoverAlt(newAlt);
            setIsDirty(true);
          }}
        />
      </div>

      {/* Publish Toggle & Empty Warning */}
      <div className="border-t border-[var(--color-border-subtle)] pt-5">
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-sunken)] p-4 space-y-3">
          {/* Label + Switch Row */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <label htmlFor="publish_toggle" className="text-sm font-bold text-[var(--color-text)] cursor-pointer">
              <FormattedLabel text={AR_STRINGS.fieldPublish} />
            </label>

            <label className="relative inline-flex items-center gap-2.5 cursor-pointer shrink-0 self-start sm:self-auto">
              <input
                id="publish_toggle"
                type="checkbox"
                role="switch"
                aria-checked={published}
                checked={published}
                onChange={(e) => {
                  setPublished(e.target.checked);
                  setIsDirty(true);
                }}
                className="sr-only peer"
              />
              <div className="w-12 h-6 bg-[var(--color-surface)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all border border-[var(--color-border)] peer-checked:bg-[var(--color-primary)]"></div>
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                  published
                    ? "bg-[var(--color-primary)]/20 text-[var(--color-primary)]"
                    : "bg-[var(--color-surface)] text-[var(--color-text-muted)] border border-[var(--color-border-subtle)]"
                }`}
              >
                {published ? AR_STRINGS.adminStatusPublished : AR_STRINGS.adminStatusDraft}
              </span>
            </label>
          </div>

          {/* Full-width Description & Empty Warning */}
          <p className="text-xs text-[var(--color-text-secondary)] font-arabic leading-relaxed">
            عند التفعيل، سيظهر الإجراء في مكتبة الطلاب العامة ومحرك البحث فورًا.
          </p>

          {published && hasEmptyContent && (
            <div className="flex items-center gap-2 rounded bg-[var(--color-critical-surface)] p-2 text-xs font-semibold text-[var(--color-critical)]">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{AR_STRINGS.publishWarningEmpty}</span>
            </div>
          )}
        </div>
      </div>

      {/* Save Button */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-4 border-t border-[var(--color-border-subtle)]">
        <button
          type="submit"
          disabled={isSaving}
          className="inline-flex w-full sm:w-auto min-h-[44px] items-center justify-center gap-2 rounded-md bg-[var(--color-primary)] px-6 py-2.5 text-sm font-semibold text-[var(--color-on-primary)] transition-transform active:scale-95 disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-focus-ring)]"
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
    </form>
  );
}
