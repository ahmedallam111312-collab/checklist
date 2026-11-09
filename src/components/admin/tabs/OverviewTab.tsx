"use client";

import React, { useState, useRef, useEffect } from "react";
import { Plus, Trash2, Save, Loader2, ListPlus } from "lucide-react";
import { Procedure, ListItem } from "@/types/database";
import { ReorderableList, ReorderableItem } from "@/components/admin/ReorderableList";
import { FormattedLabel } from "@/components/admin/FormattedLabel";
import { procedureOverviewSchema } from "@/lib/validation/procedure";
import { AR_STRINGS } from "@/messages/ar";

interface OverviewTabProps {
  procedure: Procedure;
  onSave: (data: {
    definition: string;
    indications: string[];
    contraindications: string[];
    common_mistakes: string[];
  }) => Promise<void>;
  setIsDirty: (dirty: boolean) => void;
  isSaving: boolean;
}

interface ItemEntry extends ReorderableItem {
  id: string;
  text: string;
}

function AutoGrowingTextarea({
  value,
  onChange,
  placeholder,
  maxLength = 500,
}: {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  maxLength?: number;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = () => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = `${Math.max(el.scrollHeight, 44)}px`;
    }
  };

  useEffect(() => {
    adjustHeight();
  }, [value]);

  return (
    <textarea
      ref={textareaRef}
      rows={2}
      dir="ltr"
      lang="en"
      maxLength={maxLength}
      value={value}
      onChange={(e) => {
        onChange(e.target.value.slice(0, maxLength));
        adjustHeight();
      }}
      placeholder={placeholder}
      className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface-sunken)] p-2.5 text-sm text-[var(--color-text)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] leading-relaxed resize-none font-sans"
    />
  );
}

export function OverviewTab({
  procedure,
  onSave,
  setIsDirty,
  isSaving,
}: OverviewTabProps) {
  const [definition, setDefinition] = useState(procedure.definition || "");

  // Initial list items partitioned by kind
  const initialItems = procedure.list_items || [];
  const [indications, setIndications] = useState<ItemEntry[]>(
    initialItems
      .filter((i) => i.kind === "indication")
      .map((i) => ({ id: i.id, text: i.text }))
  );
  const [contraindications, setContraindications] = useState<ItemEntry[]>(
    initialItems
      .filter((i) => i.kind === "contraindication")
      .map((i) => ({ id: i.id, text: i.text }))
  );
  const [commonMistakes, setCommonMistakes] = useState<ItemEntry[]>(
    initialItems
      .filter((i) => i.kind === "common_mistake")
      .map((i) => ({ id: i.id, text: i.text }))
  );

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Helper to add a new item
  const addItem = (
    setter: React.Dispatch<React.SetStateAction<ItemEntry[]>>,
    kindPrefix: string
  ) => {
    setter((prev) => [
      ...prev,
      { id: `${kindPrefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, text: "" },
    ]);
    setIsDirty(true);
  };

  // Helper to remove an item
  const removeItem = (
    setter: React.Dispatch<React.SetStateAction<ItemEntry[]>>,
    id: string
  ) => {
    setter((prev) => prev.filter((item) => item.id !== id));
    setIsDirty(true);
  };

  // Helper to update text of an item
  const updateItemText = (
    setter: React.Dispatch<React.SetStateAction<ItemEntry[]>>,
    id: string,
    text: string
  ) => {
    setter((prev) =>
      prev.map((item) => (item.id === id ? { ...item, text: text.slice(0, 500) } : item))
    );
    setIsDirty(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const data = {
      definition,
      indications: indications.map((i) => i.text.trim()).filter(Boolean),
      contraindications: contraindications.map((i) => i.text.trim()).filter(Boolean),
      common_mistakes: commonMistakes.map((i) => i.text.trim()).filter(Boolean),
    };

    const parsed = procedureOverviewSchema.safeParse(data);
    if (!parsed.success) {
      setErrorMessage(parsed.error.issues[0]?.message || "Validation error");
      return;
    }

    await onSave(data);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 text-start">
      {/* 1. Definition (Text Area, English LTR) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label
            htmlFor="procedure_definition"
            className="block text-sm font-semibold text-[var(--color-text)]"
          >
            <FormattedLabel text={AR_STRINGS.fieldDefinition} />
          </label>
          <span className="text-xs text-[var(--color-text-muted)]">
            {definition.length}/2000
          </span>
        </div>
        <textarea
          id="procedure_definition"
          rows={5}
          dir="ltr"
          lang="en"
          maxLength={2000}
          value={definition}
          onChange={(e) => {
            setDefinition(e.target.value.slice(0, 2000));
            setIsDirty(true);
          }}
          placeholder="Clinical definition, procedure principles, and physiological rationale..."
          className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-sm text-[var(--color-text)] leading-relaxed focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
        />
      </div>

      {/* 2. Indications List */}
      <div className="space-y-3 border-t border-[var(--color-border-subtle)] pt-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold text-[var(--color-text)]">
              <FormattedLabel text={AR_STRINGS.fieldIndications} />
            </h3>
            <p className="text-xs text-[var(--color-text-muted)] font-arabic">
              الحالات السريرية ودواعي اللجوء لهذا الإجراء.
            </p>
          </div>
          <button
            type="button"
            onClick={() => addItem(setIndications, "ind")}
            className="inline-flex min-h-[44px] shrink-0 whitespace-nowrap self-start sm:self-auto items-center gap-1.5 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--color-text)] hover:border-[var(--color-primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-focus-ring)]"
          >
            <Plus className="h-4 w-4" />
            <span>{AR_STRINGS.addItem}</span>
          </button>
        </div>

        {indications.length === 0 ? (
          <p className="rounded-lg border border-dashed border-[var(--color-border)] p-4 text-center text-xs text-[var(--color-text-muted)] font-arabic">
            {AR_STRINGS.emptyListDesc}
          </p>
        ) : (
          <ReorderableList
            items={indications}
            stackedOnMobile={true}
            onReorder={(newItems) => {
              setIndications(newItems);
              setIsDirty(true);
            }}
            renderItem={(item) => (
              <AutoGrowingTextarea
                value={item.text}
                maxLength={500}
                onChange={(val) => updateItemText(setIndications, item.id, val)}
                placeholder="e.g. Assessment of acute respiratory failure and acid-base imbalance in critically ill patients"
              />
            )}
            renderExtraActions={(item) => (
              <button
                type="button"
                onClick={() => removeItem(setIndications, item.id)}
                aria-label={AR_STRINGS.removeItem}
                className="inline-flex h-11 w-11 min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-md border border-[var(--color-danger)]/20 bg-[var(--color-danger-surface)] text-[var(--color-danger)] transition-colors hover:bg-[var(--color-danger)] hover:text-white"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          />
        )}
      </div>

      {/* 3. Contraindications List */}
      <div className="space-y-3 border-t border-[var(--color-border-subtle)] pt-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold text-[var(--color-text)]">
              <FormattedLabel text={AR_STRINGS.fieldContraindications} />
            </h3>
            <p className="text-xs text-[var(--color-text-muted)] font-arabic">
              موانع الاستخدام المطلقة والنسبية.
            </p>
          </div>
          <button
            type="button"
            onClick={() => addItem(setContraindications, "con")}
            className="inline-flex min-h-[44px] shrink-0 whitespace-nowrap self-start sm:self-auto items-center gap-1.5 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--color-text)] hover:border-[var(--color-primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-focus-ring)]"
          >
            <Plus className="h-4 w-4" />
            <span>{AR_STRINGS.addItem}</span>
          </button>
        </div>

        {contraindications.length === 0 ? (
          <p className="rounded-lg border border-dashed border-[var(--color-border)] p-4 text-center text-xs text-[var(--color-text-muted)] font-arabic">
            {AR_STRINGS.emptyListDesc}
          </p>
        ) : (
          <ReorderableList
            items={contraindications}
            stackedOnMobile={true}
            onReorder={(newItems) => {
              setContraindications(newItems);
              setIsDirty(true);
            }}
            renderItem={(item) => (
              <AutoGrowingTextarea
                value={item.text}
                maxLength={500}
                onChange={(val) => updateItemText(setContraindications, item.id, val)}
                placeholder="e.g. Negative modified Allen's test indicating inadequate collateral circulation"
              />
            )}
            renderExtraActions={(item) => (
              <button
                type="button"
                onClick={() => removeItem(setContraindications, item.id)}
                aria-label={AR_STRINGS.removeItem}
                className="inline-flex h-11 w-11 min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-md border border-[var(--color-danger)]/20 bg-[var(--color-danger-surface)] text-[var(--color-danger)] transition-colors hover:bg-[var(--color-danger)] hover:text-white"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          />
        )}
      </div>

      {/* 4. Common Mistakes List (Danger Styling Accent) */}
      <div className="space-y-3 border-t border-[var(--color-border-subtle)] pt-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold text-[var(--color-danger)]">
              <FormattedLabel text={AR_STRINGS.fieldCommonMistakes} />
            </h3>
            <p className="text-xs text-[var(--color-text-muted)] font-arabic">
              الأخطاء الشائعة التي يقع فيها الممارسون والطلاب أثناء الإجراء.
            </p>
          </div>
          <button
            type="button"
            onClick={() => addItem(setCommonMistakes, "cm")}
            className="inline-flex min-h-[44px] shrink-0 whitespace-nowrap self-start sm:self-auto items-center gap-1.5 rounded-md border border-[var(--color-danger)]/30 bg-[var(--color-danger-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--color-danger)] hover:bg-[var(--color-danger)] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-focus-ring)]"
          >
            <Plus className="h-4 w-4" />
            <span>{AR_STRINGS.addItem}</span>
          </button>
        </div>

        {commonMistakes.length === 0 ? (
          <p className="rounded-lg border border-dashed border-[var(--color-border)] p-4 text-center text-xs text-[var(--color-text-muted)] font-arabic">
            {AR_STRINGS.emptyListDesc}
          </p>
        ) : (
          <ReorderableList
            items={commonMistakes}
            stackedOnMobile={true}
            onReorder={(newItems) => {
              setCommonMistakes(newItems);
              setIsDirty(true);
            }}
            renderItem={(item) => (
              <AutoGrowingTextarea
                value={item.text}
                maxLength={500}
                onChange={(val) => updateItemText(setCommonMistakes, item.id, val)}
                placeholder="e.g. Failure to aspirate air bubbles immediately after draw"
              />
            )}
            renderExtraActions={(item) => (
              <button
                type="button"
                onClick={() => removeItem(setCommonMistakes, item.id)}
                aria-label={AR_STRINGS.removeItem}
                className="inline-flex h-11 w-11 min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-md border border-[var(--color-danger)]/20 bg-[var(--color-danger-surface)] text-[var(--color-danger)] transition-colors hover:bg-[var(--color-danger)] hover:text-white"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          />
        )}
      </div>

      {errorMessage && (
        <p className="text-xs text-[var(--color-danger)] font-medium" role="alert">
          {errorMessage}
        </p>
      )}

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
