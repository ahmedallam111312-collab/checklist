"use client";

import React, { useState, useEffect } from "react";
import { Save, Loader2, AlertTriangle, ExternalLink } from "lucide-react";
import Link from "next/link";
import { Procedure } from "@/types/database";
import { generateSlug, procedureDetailsSchema } from "@/lib/validation/procedure";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { FormattedLabel } from "@/components/admin/FormattedLabel";
import { AR_STRINGS } from "@/messages/ar";
import { useUndoToast } from "@/components/admin/UndoToast";

interface DetailsTabProps {
  procedure?: Procedure | null;
  onSave: (data: {
    title: string;
    slug: string;
    short_description: string;
    cover_path?: string | null;
    cover_alt: string;
    blur_data_url?: string | null;
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
  const [blurDataUrl, setBlurDataUrl] = useState<string | null>(procedure?.blur_data_url || null);
  const [published, setPublished] = useState(procedure?.published || false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isMac, setIsMac] = useState(false);
  const { showUndoToast } = useUndoToast();

  useEffect(() => {
    if (typeof window !== "undefined" && navigator.platform) {
      setIsMac(/Mac|iPod|iPhone|iPad/.test(navigator.platform));
    }
  }, []);

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
      blur_data_url: blurDataUrl,
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
          className="squircle-pill w-full min-h-[44px] rounded-pill border border-border bg-search-bg px-3.5 text-sm text-navy focus:border-rose-dark focus:outline-none focus:ring-2 focus:ring-rose-dark/25 font-medium"
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
            Used in URL address
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
            className="squircle-pill w-full min-h-[44px] rounded-pill border border-border bg-search-bg px-3.5 text-sm text-navy focus:border-rose-dark focus:outline-none focus:ring-2 focus:ring-rose-dark/25 font-mono"
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
          className="w-full rounded-lg border border-border bg-search-bg p-3 text-sm text-navy focus:border-rose-dark focus:outline-none focus:ring-2 focus:ring-rose-dark/25 leading-relaxed"
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
          onImageChanged={(newPath, newAlt, newBlur) => {
            setCoverPath(newPath);
            setCoverAlt(newAlt);
            if (newBlur !== undefined) {
              setBlurDataUrl(newBlur);
            }
            setIsDirty(true);
          }}
        />
      </div>

      {/* Publish Toggle & Empty Warning */}
      <div className="border-t border-border-subtle pt-5">
        <div className="squircle-tile rounded-tile border border-border-subtle bg-light-1 p-4 space-y-3">
          {/* Label + Switch Row */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <label htmlFor="publish_toggle" className="text-sm font-bold text-navy cursor-pointer">
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
                  const nextVal = e.target.checked;
                  setPublished(nextVal);
                  setIsDirty(true);
                  if (!nextVal) {
                    showUndoToast({
                      message: "Procedure unpublished (set to draft)",
                      durationMs: 8000,
                      onUndo: () => {
                        setPublished(true);
                        setIsDirty(true);
                      },
                    });
                  }
                }}
                className="sr-only peer"
              />
              <div className="w-12 h-6 bg-white peer-focus-visible:ring-2 peer-focus-visible:ring-rose-dark rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all border border-border peer-checked:bg-rose"></div>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${
                  published
                    ? "border border-success/30 bg-success-surface text-success"
                    : "bg-white text-text-secondary border border-border-subtle"
                }`}
              >
                {published ? AR_STRINGS.adminStatusPublished : AR_STRINGS.adminStatusDraft}
              </span>
            </label>
          </div>

          {/* Full-width Description & Empty Warning */}
          <p className="text-xs text-text-secondary leading-relaxed">
            When enabled, this procedure will appear immediately in the public student library and search.
          </p>

          {published && hasEmptyContent && (
            <div className="flex items-center gap-2 rounded-lg border border-critical/30 bg-critical-surface p-2.5 text-xs font-semibold text-critical">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{AR_STRINGS.publishWarningEmpty}</span>
            </div>
          )}
        </div>
      </div>

      {/* Save Button */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-4 border-t border-border-subtle">
        <button
          type="submit"
          disabled={isSaving}
          className="squircle-pill btn-rose-cta inline-flex w-full sm:w-auto min-h-[44px] items-center justify-center gap-2 rounded-pill px-6 py-2.5 text-sm font-bold text-navy active:scale-[0.98] disabled:opacity-50"
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
              <kbd className="hidden sm:inline-flex items-center rounded border border-navy/25 bg-navy/10 px-1.5 py-0.5 text-[10px] font-mono font-semibold text-navy">
                {isMac ? "⌘S" : "Ctrl+S"}
              </kbd>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
