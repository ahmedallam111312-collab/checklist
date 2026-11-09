/**
 * Pure checklist bulk import parser.
 * Strict compliance with SPEC.md section 5 & Phase 2B requirements:
 *
 * Format, one line per step:
 * - "# Phase name" sets the phase for following lines ("#" alone clears it)
 * - Leading "!" marks the step critical
 * - Split EN and AR at the FIRST "|" (Arabic part optional)
 * - Blank lines ignored; trim every field
 *
 * Normalization:
 * - Unicode NFC (.normalize("NFC"))
 * - Collapse runs of spaces and tabs ([ \t]+ -> " ")
 * - Strip bidi override, embedding, and isolate characters:
 *     U+202A to U+202E (LRE, RLE, PDF, LRO, RLO)
 *     U+2066 to U+2069 (LRI, RLI, FSI, PDI)
 *   Preserve LRM (U+200E), RLM (U+200F), ZWJ (U+200D), and ZWNJ (U+200C).
 *
 * Rules:
 * - English required (error with line number)
 * - text_en <= 500 chars, text_ar <= 500 chars, phase <= 80 chars
 * - At most 200 step lines per import
 *
 * Warnings (non-blocking):
 * - Leading numbering such as "1." or "2)" or "3-" (numbering is automatic)
 * - Duplicate English lines within the import
 */

export interface ParsedStepItem {
  lineNumber: number;
  phase: string | null;
  text_en: string;
  text_ar: string | null;
  is_critical: boolean;
  warnings?: string[];
}

export interface ParseChecklistIssue {
  line: number;
  message: string;
}

export interface ParseChecklistResult {
  valid: boolean;
  steps: ParsedStepItem[];
  errors: ParseChecklistIssue[];
  warnings: ParseChecklistIssue[];
  totalLines: number;
}

// Regex to strip bidi override, embedding, and isolate characters:
// U+202A..U+202E (Embedding/Override/Pop Directional Format)
// U+2066..U+2069 (Directional Isolates: LRI, RLI, FSI, PDI)
const BIDI_STRIP_REGEX = /[\u202A-\u202E\u2066-\u2069]/g;

// Regex to detect leading numbering e.g. "1.", "1)", "1 -", "12."
const LEADING_NUMBER_REGEX = /^\s*\d+[\.\)\-]\s*/;

/**
 * Normalizes text:
 * 1. Unicode NFC
 * 2. Strips bidi overrides/embeddings/isolates
 * 3. Collapses runs of spaces and tabs into a single space
 * 4. Trims leading and trailing whitespace
 */
export function normalizeChecklistText(input: string): string {
  if (!input) return "";
  return input
    .normalize("NFC")
    .replace(BIDI_STRIP_REGEX, "")
    .replace(/[ \t]+/g, " ")
    .trim();
}

/**
 * Parses raw import text according to the bulk checklist specification.
 */
export function parseChecklistImport(rawText: string): ParseChecklistResult {
  const errors: ParseChecklistIssue[] = [];
  const warnings: ParseChecklistIssue[] = [];
  const steps: ParsedStepItem[] = [];

  if (!rawText || rawText.trim() === "") {
    return {
      valid: false,
      steps: [],
      errors: [{ line: 0, message: "النص المُدخل فارغ. يرجى لصق خطوات صالحة." }],
      warnings: [],
      totalLines: 0,
    };
  }

  // Split lines on CRLF or LF
  const rawLines = rawText.split(/\r?\n/);
  let currentPhase: string | null = null;
  const seenEnglish = new Map<string, number>(); // normalized text_en -> first line number
  let stepLineCount = 0;

  for (let i = 0; i < rawLines.length; i++) {
    const lineNumber = i + 1;
    const rawLine = rawLines[i];
    const trimmedLine = rawLine.trim();

    // Ignore blank lines
    if (trimmedLine === "") {
      continue;
    }

    // 1. Phase declaration
    if (trimmedLine.startsWith("#")) {
      const phaseContent = trimmedLine.slice(1);
      const normalizedPhase = normalizeChecklistText(phaseContent);

      if (normalizedPhase === "") {
        // "#" alone clears the phase
        currentPhase = null;
      } else {
        if (normalizedPhase.length > 80) {
          errors.push({
            line: lineNumber,
            message: `اسم المرحلة يتجاوز الحد الأقصى (80 حرفًا). الطول الحالي: ${normalizedPhase.length} حرفًا.`,
          });
        }
        currentPhase = normalizedPhase;
      }
      continue;
    }

    // 2. Step line
    stepLineCount++;
    if (stepLineCount > 200) {
      errors.push({
        line: lineNumber,
        message: "تجاوز الاستيراد الحد الأقصى المسموح به (200 خطوة لكل عملية استيراد).",
      });
      break;
    }

    let lineToParse = trimmedLine;
    let isCritical = false;

    // Check critical prefix "!"
    if (lineToParse.startsWith("!")) {
      isCritical = true;
      lineToParse = lineToParse.slice(1).trim();
    }

    // Split at the FIRST pipe "|"
    const pipeIndex = lineToParse.indexOf("|");
    let rawEn = "";
    let rawAr: string | null = null;

    if (pipeIndex === -1) {
      rawEn = lineToParse;
      rawAr = null;
    } else {
      rawEn = lineToParse.slice(0, pipeIndex);
      rawAr = lineToParse.slice(pipeIndex + 1);
    }

    const normEn = normalizeChecklistText(rawEn);
    const normAr = rawAr !== null ? normalizeChecklistText(rawAr) : null;
    const stepWarnings: string[] = [];

    // Validation: English required
    if (!normEn) {
      errors.push({
        line: lineNumber,
        message: "نص الخطوة باللغة الإنجليزية مطلوب ولا يمكن أن يكون فارغًا.",
      });
      continue;
    }

    // Length validation
    if (normEn.length > 500) {
      errors.push({
        line: lineNumber,
        message: `نص الخطوة بالإنجليزية يتجاوز 500 حرف (الطول الحالي: ${normEn.length} حرفًا).`,
      });
    }

    if (normAr && normAr.length > 500) {
      errors.push({
        line: lineNumber,
        message: `نص الخطوة بالعربية يتجاوز 500 حرف (الطول الحالي: ${normAr.length} حرفًا).`,
      });
    }

    // Warning: Leading numbering
    if (LEADING_NUMBER_REGEX.test(rawEn)) {
      const warnMsg = "تحذير: تحتوي الخطوة على ترقيم يدوي في بدايتها. الترقيم يتم آليًا في واجهة العرض.";
      warnings.push({ line: lineNumber, message: warnMsg });
      stepWarnings.push(warnMsg);
    }

    // Warning: Duplicate English line
    const lowerEn = normEn.toLowerCase();
    if (seenEnglish.has(lowerEn)) {
      const prevLine = seenEnglish.get(lowerEn)!;
      const warnMsg = `تحذير: نص الخطوة مكرر تمامًا مع السطر رقم ${prevLine}.`;
      warnings.push({ line: lineNumber, message: warnMsg });
      stepWarnings.push(warnMsg);
    } else {
      seenEnglish.set(lowerEn, lineNumber);
    }

    steps.push({
      lineNumber,
      phase: currentPhase,
      text_en: normEn,
      text_ar: normAr && normAr.length > 0 ? normAr : null,
      is_critical: isCritical,
      warnings: stepWarnings.length > 0 ? stepWarnings : undefined,
    });
  }

  return {
    valid: errors.length === 0,
    steps,
    errors,
    warnings,
    totalLines: rawLines.length,
  };
}
