import { z } from "zod";

/**
 * Helper to generate a URL-safe lowercase kebab-case slug from a title.
 * Enforces the database constraint: ^[a-z0-9]+(-[a-z0-9]+)*$ and max length 60.
 */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-") // Replace non-alphanumeric with hyphen
    .replace(/^-+|-+$/g, "") // Strip leading and trailing hyphens
    .slice(0, 60);
}

export const slugSchema = z
  .string()
  .min(1, "Slug is required")
  .max(60, "Slug cannot exceed 60 characters")
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Slug must be lowercase alphanumeric with hyphens (e.g., abg-sampling)");

export const procedureDetailsSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(80, "Title cannot exceed 80 characters")
    .trim(),
  slug: slugSchema,
  short_description: z
    .string()
    .max(200, "Short description cannot exceed 200 characters")
    .default(""),
  cover_path: z.string().nullable().optional(),
  cover_alt: z
    .string()
    .max(200, "Alt text cannot exceed 200 characters")
    .default(""),
  blur_data_url: z.string().nullable().optional(),
  published: z.boolean().default(false),
});

export type ProcedureDetailsInput = z.infer<typeof procedureDetailsSchema>;

export const procedureOverviewSchema = z.object({
  definition: z
    .string()
    .max(2000, "Definition cannot exceed 2000 characters")
    .default(""),
  indications: z.array(
    z.string().min(1, "Item cannot be empty").max(500, "Item cannot exceed 500 characters").trim()
  ),
  contraindications: z.array(
    z.string().min(1, "Item cannot be empty").max(500, "Item cannot exceed 500 characters").trim()
  ),
  common_mistakes: z.array(
    z.string().min(1, "Item cannot be empty").max(500, "Item cannot exceed 500 characters").trim()
  ),
});

export type ProcedureOverviewInput = z.infer<typeof procedureOverviewSchema>;

export const reorderBatchSchema = z.object({
  items: z.array(
    z.object({
      id: z.string().uuid(),
      sort_order: z.number().int().min(0),
    })
  ),
});

export type ReorderBatchInput = z.infer<typeof reorderBatchSchema>;

export const siteSettingsSchema = z.object({
  site_name: z.string().min(1).max(300).trim(),
  tagline: z.string().max(300).default(""),
  splash_cta: z.string().max(300).default(""),
  hero_eyebrow: z.string().max(300).default(""),
  hero_title: z.string().max(300).default(""),
  hero_description: z.string().max(1000).default(""),
  hero_cta: z.string().max(300).default(""),
  footer_text: z.string().max(300).default(""),
  logo_path: z.string().nullable().optional(),
});

export type SiteSettingsInput = z.infer<typeof siteSettingsSchema>;

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export type LoginInput = z.infer<typeof loginSchema>;

// Bidi strip helper for server validation
const stripBidiChars = (val: string) =>
  val.normalize("NFC").replace(/[\u202A-\u202E\u2066-\u2069]/g, "").trim();

// Equipment validation schemas
export const equipmentItemSchema = z.object({
  id: z.string().uuid().optional(),
  name: z
    .string()
    .min(1, "اسم الأداة مطلوب")
    .max(120, "اسم الأداة لا يمكن أن يتجاوز 120 حرفًا")
    .transform(stripBidiChars),
  photo_path: z.string().nullable().optional(),
  image_path: z.string().nullable().optional(),
  sort_order: z.number().int().min(0).default(0),
});

export const equipmentBatchSchema = z.object({
  procedureId: z.string().uuid(),
  items: z
    .array(equipmentItemSchema)
    .max(100, "لا يمكن إضافة أكثر من 100 أداة لكل إجراء"),
});

export type EquipmentItemInput = z.infer<typeof equipmentItemSchema>;
export type EquipmentBatchInput = z.infer<typeof equipmentBatchSchema>;

// Checklist validation schemas
export const checklistStepSchema = z.object({
  id: z.string().uuid().optional(),
  text_en: z
    .string()
    .min(1, "نص الخطوة باللغة الإنجليزية مطلوب")
    .max(500, "نص الخطوة بالإنجليزية لا يمكن أن يتجاوز 500 حرف")
    .transform(stripBidiChars),
  text_ar: z
    .string()
    .max(500, "نص الخطوة باللغة العربية لا يمكن أن يتجاوز 500 حرف")
    .transform(stripBidiChars)
    .nullable()
    .optional(),
  is_critical: z.boolean().default(false),
  phase: z
    .string()
    .max(80, "اسم المرحلة لا يمكن أن يتجاوز 80 حرفًا")
    .transform(stripBidiChars)
    .nullable()
    .optional(),
  sort_order: z.number().int().min(0).default(0),
});

export const checklistBatchSchema = z.object({
  procedureId: z.string().uuid(),
  steps: z
    .array(checklistStepSchema)
    .max(200, "لا يمكن إضافة أكثر من 200 خطوة لكل إجراء"),
});

export type ChecklistStepInput = z.infer<typeof checklistStepSchema>;
export type ChecklistBatchInput = z.infer<typeof checklistBatchSchema>;

