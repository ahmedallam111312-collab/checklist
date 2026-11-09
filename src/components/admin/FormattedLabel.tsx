import React from "react";

interface FormattedLabelProps {
  text: string;
  className?: string;
}

/**
 * FormattedLabel renders an Arabic form label with parenthesized English text
 * isolated as a single non-wrapping <bdi dir="ltr" lang="en"> unit.
 * This guarantees that parentheses stay balanced and never flip or wrap in RTL.
 * Example: "الأخطاء الشائعة (Common Mistakes)" ->
 *   <span>الأخطاء الشائعة</span> <bdi dir="ltr" lang="en" class="whitespace-nowrap inline-block">(Common Mistakes)</bdi>
 */
export function FormattedLabel({ text, className }: FormattedLabelProps) {
  const match = text.match(/^(.*?)\s*(\([A-Za-z0-9\s/_-]+\))$/);

  if (match) {
    const [, arabicText, englishPart] = match;
    return (
      <span className={className}>
        <span>{arabicText}</span>{" "}
        <bdi dir="ltr" lang="en" className="whitespace-nowrap inline-block font-sans">
          {englishPart}
        </bdi>
      </span>
    );
  }

  return <span className={className}>{text}</span>;
}
