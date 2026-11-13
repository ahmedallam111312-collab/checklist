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
    <ul className="squircle-card divide-y divide-border-subtle overflow-hidden rounded-card border border-border-subtle bg-white shadow-card-soft">
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
            } gap-2.5 sm:gap-3 p-3.5 transition-colors ${
              draggedIndex === index
                ? "bg-light-1 opacity-80 ring-2 ring-rose-dark"
                : "hover:bg-light-1/50"
            }`}
          >
            {/* Desktop Drag Handle (Hidden on touch-only devices) */}
            <div
              className={`hidden cursor-grab active:cursor-grabbing sm:flex h-11 w-8 shrink-0 items-center justify-center text-text-secondary hover:text-navy ${
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
                className="squircle-pill inline-flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-pill border border-border-subtle bg-light-1 text-text-secondary transition-colors hover:border-rose-dark hover:text-rose-dark disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ArrowUp className="h-4 w-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => moveDown(index)}
                disabled={isLast}
                aria-label={`${AR_STRINGS.adminMoveDown} (${index + 1})`}
                className="squircle-pill inline-flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-pill border border-border-subtle bg-light-1 text-text-secondary transition-colors hover:border-rose-dark hover:text-rose-dark disabled:opacity-30 disabled:cursor-not-allowed"
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
