"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { Check } from "lucide-react";
import { EquipmentItem } from "@/types/database";
import { AR_STRINGS } from "@/messages/ar";
import { getPublicImageUrl } from "@/lib/images/url";

interface EquipmentListProps {
  items: EquipmentItem[];
  procedureSlug: string;
}

export function EquipmentList({ items, procedureSlug }: EquipmentListProps) {
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [isLoaded, setIsLoaded] = useState(false);

  const storageKey = `critical_ease_equipment_${procedureSlug}`;

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
      <p
        className="py-6 text-center text-base text-text-muted font-arabic"
        dir="rtl"
        lang="ar"
      >
        {AR_STRINGS.sectionEmpty}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs font-semibold text-rose-dark">
        <div className="inline-flex items-center gap-1">
          <bdi dir="ltr" className="font-latin inline-flex items-center gap-1 tabular-nums">
            <span data-testid="equip-done">{done}</span>
            <span>{" / "}</span>
            <span data-testid="equip-total">{total}</span>
          </bdi>
          <span className="ms-1 font-arabic font-medium text-text-secondary">
            {" جاهز"}
          </span>
        </div>
      </div>

      <div className="divide-y divide-border-subtle overflow-hidden rounded-xl border border-border-subtle bg-white">
        {items.map((item) => {
          const isChecked = checkedIds.has(item.id);
          const imageSrc = getPublicImageUrl(item.image_path || item.photo_path);

          return (
            <div
              key={item.id}
              dir="ltr"
              lang="en"
              className="flex min-h-[56px] items-center gap-3 px-4 py-3 transition-colors hover:bg-light-1/70"
            >
              <button
                type="button"
                role="checkbox"
                aria-checked={isChecked}
                aria-label={item.name}
                onClick={() => toggleItem(item.id)}
                className="group relative -m-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-md"
              >
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-md transition-all duration-150 ${
                    isChecked
                      ? "bg-navy text-white shadow-sm"
                      : "border-[1.5px] border-border bg-light-1 group-hover:border-rose-dark"
                  }`}
                >
                  {isChecked && <Check className="h-4 w-4 stroke-[3]" />}
                </span>
              </button>

              {imageSrc && (
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-border-subtle bg-light-1">
                  <Image
                    src={imageSrc}
                    alt={item.name}
                    fill
                    placeholder={item.blur_data_url ? "blur" : "empty"}
                    blurDataURL={item.blur_data_url || undefined}
                    sizes="48px"
                    className="object-cover"
                  />
                </div>
              )}

              <span
                className={`font-latin text-base leading-snug ${
                  isChecked ? "text-text-muted" : "text-navy font-medium"
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
