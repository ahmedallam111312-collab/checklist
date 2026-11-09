export type VideoStatus = 'none' | 'uploading' | 'processing' | 'ready' | 'error';
export type ListKind = 'indication' | 'contraindication' | 'common_mistake';

export interface SiteSettings {
  id: number;
  site_name: string;
  tagline: string;
  splash_cta: string;
  hero_eyebrow: string;
  hero_title: string;
  hero_description: string;
  hero_cta: string;
  footer_text: string;
  logo_path?: string | null;
  updated_at: string;
}

export interface ChecklistStep {
  id: string;
  procedure_id: string;
  sort_order: number;
  phase?: string | null;
  text_en: string;
  text_ar?: string | null;
  is_critical: boolean;
}

export interface EquipmentItem {
  id: string;
  procedure_id: string;
  name: string;
  image_path?: string | null;
  photo_path?: string | null;
  sort_order: number;
}

export interface ListItem {
  id: string;
  procedure_id: string;
  kind: ListKind;
  text: string;
  sort_order: number;
}

export interface Procedure {
  id: string;
  slug: string;
  title: string;
  short_description: string;
  definition: string;
  cover_path?: string | null;
  cover_alt: string;
  sort_order: number;
  published: boolean;
  mux_upload_id?: string | null;
  mux_asset_id?: string | null;
  mux_playback_id?: string | null;
  video_status: VideoStatus;
  created_at: string;
  updated_at: string;
  checklist_steps?: ChecklistStep[];
  equipment_items?: EquipmentItem[];
  list_items?: ListItem[];
}
