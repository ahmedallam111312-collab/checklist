"use client";

import React, { useState } from "react";
import { ArrowUp, ArrowDown, GripVertical } from "lucide-react";
import { AR_STRINGS } from "@/messages/ar";

export interface ReorderableItem {
  id: string;
  [key: string]: any;
}

interface ReorderableListProps<T extends ReorderableItem> {
  items: T[];
  onReorder: (newItems: T[]) => void;
  renderItem: (item: T, index: number) => React.ReactNode;
  renderExtraActions?: (item: T, index: number) => React.ReactNode;
  keyExtractor?: (item: T) => string;
  stackedOnMobile?: boolean;
}

export function ReorderableList<T extends ReorderableItem>({
  items,
  onReorder,
  renderItem,
  renderExtraActions,
  keyExtractor = (item) => item.id,
  stackedOnMobile = false,
}: ReorderableListProps<T>) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const moveUp = (index: number) => {
    if (index <= 0) return;
    const next = [...items];
    const temp = next[index - 1];
    next[index - 1] = next[index];
    next[index] = temp;
    onReorder(next);
  };

  const moveDown = (index: number) => {
    if (index >= items.length - 1) return;
    const next = [...items];
    const temp = next[index + 1];
    next[index + 1] = next[index];
    next[index] = temp;
    onReorder(next);
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const next = [...items];
    const draggedItem = next[draggedIndex];
    next.splice(draggedIndex, 1);
    next.splice(index, 0, draggedItem);
    setDraggedIndex(index);
    onReorder(next);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  return (
    <ul className="divide-y divide-[var(--color-border-subtle)] overflow-hidden rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface)]">
      {items.map((item, index) => {
        const isFirst = index === 0;
        const isLast = index === items.length - 1;

        return (
          <li
            key={keyExtractor(item)}
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragEnd={handleDragEnd}
            className={`flex ${
              stackedOnMobile ? "flex-col sm:flex-row sm:items-start" : "flex-row items-center"
            } gap-2.5 sm:gap-3 p-3 transition-colors ${
              draggedIndex === index
                ? "bg-[var(--color-surface-raised)] opacity-75 ring-1 ring-[var(--color-primary)]"
                : "hover:bg-[var(--color-surface-raised)]/40"
            }`}
          >
            {/* Desktop Drag Handle (Hidden on touch-only devices) */}
            <div
              className={`hidden cursor-grab active:cursor-grabbing sm:flex h-11 w-8 shrink-0 items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-text)] ${
                stackedOnMobile ? "mt-0.5" : ""
              }`}
              title="سحب للترتيب"
              aria-hidden="true"
            >
              <GripVertical className="h-5 w-5" />
            </div>

            {/* Custom Content Slot */}
            <div className="w-full flex-1 min-w-0">
              {renderItem(item, index)}
            </div>

            {/* Accessible Reorder Controls (Keyboard & Touch Primary) */}
            <div
              className={`flex items-center gap-1.5 shrink-0 ${
                stackedOnMobile ? "self-end sm:self-start justify-end mt-1 sm:mt-0.5" : ""
              }`}
              dir="ltr"
            >
              {renderExtraActions && renderExtraActions(item, index)}
              <button
                type="button"
                onClick={() => moveUp(index)}
                disabled={isFirst}
                aria-label={`${AR_STRINGS.adminMoveUp} (${index + 1})`}
                className="inline-flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-md border border-[var(--color-border-subtle)] bg-[var(--color-surface-raised)] text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-primary)] disabled:opacity-30 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus-ring)]"
              >
                <ArrowUp className="h-4 w-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => moveDown(index)}
                disabled={isLast}
                aria-label={`${AR_STRINGS.adminMoveDown} (${index + 1})`}
                className="inline-flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-md border border-[var(--color-border-subtle)] bg-[var(--color-surface-raised)] text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-primary)] disabled:opacity-30 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus-ring)]"
              >
                <ArrowDown className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
