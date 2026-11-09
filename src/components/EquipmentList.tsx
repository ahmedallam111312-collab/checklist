"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { Check } from "lucide-react";
import { EquipmentItem } from "@/types/database";
import { AR_STRINGS, formatEquipmentReady } from "@/messages/ar";

interface EquipmentListProps {
  items: EquipmentItem[];
  procedureSlug: string;
}

export function EquipmentList({ items, procedureSlug }: EquipmentListProps) {
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [isLoaded, setIsLoaded] = useState(false);

  const storageKey = `profnurse_equipment_${procedureSlug}`;

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const validIds = new Set(items.map((i) => i.id));
          const filtered = parsed.filter((id) => validIds.has(id));
          setCheckedIds(new Set(filtered));
        }
      }
    } catch {
    } finally {
      setIsLoaded(true);
    }
  }, [storageKey, items]);

  const toggleItem = (id: string) => {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      try {
        localStorage.setItem(storageKey, JSON.stringify(Array.from(next)));
      } catch {}
      return next;
    });
  };

  const total = items.length;
  const done = isLoaded ? checkedIds.size : 0;

  if (items.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-[var(--color-text-muted)] font-arabic" dir="rtl" lang="ar">
        {AR_STRINGS.sectionEmpty}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {/* Ready Counter */}
      <div className="flex items-center justify-between text-xs font-medium text-[var(--color-text-secondary)]">
        <div className="inline-flex items-center gap-1">
          <bdi dir="ltr" className="tabular-nums inline-flex items-center gap-1 font-mono">
            <span data-testid="equip-done">{done}</span>
            <span>{" / "}</span>
            <span data-testid="equip-total">{total}</span>
          </bdi>
          <span className="font-arabic font-normal ms-1">
            {" جاهز"}
          </span>
        </div>
      </div>

      {/* Equipment List */}
      <div className="divide-y divide-[var(--color-border-subtle)] overflow-hidden rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface)]">
        {items.map((item) => {
          const isChecked = checkedIds.has(item.id);

          return (
            <div
              key={item.id}
              dir="ltr"
              lang="en"
              className="flex min-h-[52px] items-center gap-3 px-4 py-2.5 transition-colors hover:bg-[var(--color-surface-raised)]/50"
            >
              <button
                type="button"
                role="checkbox"
                aria-checked={isChecked}
                aria-label={item.name}
                onClick={() => toggleItem(item.id)}
                className="group relative flex h-11 w-11 shrink-0 -m-2 items-center justify-center rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus-ring)]"
              >
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-sm transition-all duration-150 ${
                    isChecked
                      ? "bg-[var(--color-primary)] text-[var(--color-on-primary)]"
                      : "border-[1.5px] border-[var(--color-border)] bg-[var(--color-surface-sunken)] group-hover:border-[var(--color-primary)]"
                  }`}
                >
                  {isChecked && (
                    <Check className="h-4 w-4 stroke-[3] animate-in zoom-in-75 duration-150" />
                  )}
                </span>
              </button>

              {item.image_path && (
                <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md border border-[var(--color-border)]">
                  <Image
                    src={item.image_path}
                    alt={item.name}
                    fill
                    className="object-cover"
                  />
                </div>
              )}

              <span
                className={`text-base leading-snug ${
                  isChecked
                    ? "text-[var(--color-text-secondary)]"
                    : "text-[var(--color-text)]"
                }`}
              >
                {item.name}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
