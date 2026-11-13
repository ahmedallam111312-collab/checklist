import { Procedure, SiteSettings } from "@/types/database";

const globalForDemo = globalThis as unknown as {
  __DEMO_PROCEDURES__?: Procedure[];
  __DEMO_SITE_SETTINGS__?: SiteSettings;
};

const INITIAL_SETTINGS: SiteSettings = {
  id: 1,
  site_name: "Critical Ease",
  tagline: "Learn • Practice • Excel",
  splash_cta: "Get Started",
  hero_eyebrow: "Critical Care & Emergency Nursing",
  hero_title: "Welcome to Critical Ease",
  hero_description:
    "A standardized clinical reference platform for emergency and critical care nursing procedures: clear steps, interactive checklists, and instructional videos.",
  hero_cta: "Explore Procedures",
  footer_text:
    "Department of Critical Care and Emergency Nursing, Faculty of Nursing, Cairo University. All rights reserved.",
  logo_path: null,
  updated_at: new Date().toISOString(),
};

export const DEMO_SITE_SETTINGS: SiteSettings =
  globalForDemo.__DEMO_SITE_SETTINGS__ ?? INITIAL_SETTINGS;
globalForDemo.__DEMO_SITE_SETTINGS__ = DEMO_SITE_SETTINGS;

const INITIAL_PROCEDURES: Procedure[] = [
  {
    id: "demo-proc-1",
    slug: "abg-sampling",
    title: "ABG Sampling",
    short_description: "Demo procedure description for layout testing only.",
    definition: "Demo clinical definition placeholder. Real clinical content will be provided by the nursing department.",
    cover_path: null,
    cover_alt: "Demo ABG setup photo placeholder",
    sort_order: 10,
    published: true,
    video_status: "none",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    list_items: [
      { id: "li-1", procedure_id: "demo-proc-1", kind: "indication", text: "Demo indication 1: Skill lab assessment scenario", sort_order: 1 },
      { id: "li-2", procedure_id: "demo-proc-1", kind: "indication", text: "Demo indication 2: Simulation training exercise", sort_order: 2 },
      { id: "li-3", procedure_id: "demo-proc-1", kind: "indication", text: "Demo indication 3: Mock lab protocol testing", sort_order: 3 },
      { id: "li-4", procedure_id: "demo-proc-1", kind: "contraindication", text: "Demo contraindication 1: Uncalibrated mock equipment", sort_order: 1 },
      { id: "li-5", procedure_id: "demo-proc-1", kind: "contraindication", text: "Demo contraindication 2: Incomplete safety orientation", sort_order: 2 },
      { id: "li-6", procedure_id: "demo-proc-1", kind: "common_mistake", text: "Demo mistake 1: Omitting mock patient verification step", sort_order: 1 },
      { id: "li-7", procedure_id: "demo-proc-1", kind: "common_mistake", text: "Demo mistake 2: Incorrect mock needle angle during drill", sort_order: 2 },
    ],
    equipment_items: [
      { id: "eq-1", procedure_id: "demo-proc-1", name: "Demo heparinized syringe kit", image_path: null, sort_order: 1 },
      { id: "eq-2", procedure_id: "demo-proc-1", name: "Demo antiseptic prep swab", image_path: null, sort_order: 2 },
      { id: "eq-3", procedure_id: "demo-proc-1", name: "Demo sterile gauze dressing", image_path: null, sort_order: 3 },
      { id: "eq-4", procedure_id: "demo-proc-1", name: "Demo biohazard mock container", image_path: null, sort_order: 4 },
    ],
    checklist_steps: [
      {
        id: "step-1",
        procedure_id: "demo-proc-1",
        sort_order: 1,
        phase: "Preparation Phase",
        text_en: "Demo step 1: Check simulated equipment status and verify mock environment.",
        text_ar: "خطوة تجريبية 1: التحقق من جاهزية المعدات والبيئة المحاكية.",
        is_critical: false,
      },
      {
        id: "step-2",
        procedure_id: "demo-proc-1",
        sort_order: 2,
        phase: "Preparation Phase",
        text_en: "Demo step 2: Confirm simulated patient identity and safety parameters.",
        text_ar: "خطوة تجريبية حرجة 2: تأكيد هوية المريض ومعايير الأمان المحاكية.",
        is_critical: true,
      },
      {
        id: "step-3",
        procedure_id: "demo-proc-1",
        sort_order: 3,
        phase: "Procedure Phase",
        text_en: "Demo step 3: Apply mock sterile technique to simulated puncture site, carefully checking all procedural landmarks, stabilizing the simulated vessel with non-dominant palpation, and preparing the collection syringe with steady gentle traction.",
        text_ar: "خطوة تجريبية 3: تطبيق تقنية التعقيم المحاكية على موضع الإجراء التجريبي مع الفحص الدقيق لكافة المعالم التشريحية المحاكية وتثبيت الوعاء التدريبي وتحضير المحقنة بسحب هادئ ومستقر.",
        is_critical: false,
      },
      {
        id: "step-4",
        procedure_id: "demo-proc-1",
        sort_order: 4,
        phase: "Procedure Phase",
        text_en: "Demo step 4: Evacuate mock air bubbles immediately upon sample collection.",
        text_ar: "خطوة تجريبية حرجة 4: تفريغ الفقاعات الهوائية المحاكية فور سحب العينة.",
        is_critical: true,
      },
      {
        id: "step-5",
        procedure_id: "demo-proc-1",
        sort_order: 5,
        phase: "Post-Procedure Phase",
        text_en: "Demo step 5: Safely discard mock procedural sharps into designated container.",
        text_ar: null, // Test step with no Arabic translation
        is_critical: false,
      },
      {
        id: "step-6",
        procedure_id: "demo-proc-1",
        sort_order: 6,
        phase: "Post-Procedure Phase",
        text_en: "Demo step 6: Document simulated observations and mock vital metrics.",
        text_ar: "خطوة تجريبية 6: توثيق الملاحظات التجريبية والقياسات الحيوية المحاكية.",
        is_critical: false,
      },
    ],
  },
  {
    id: "demo-proc-2",
    slug: "cvp-measurement",
    title: "CVP Measurement",
    short_description: "Demo procedure description for layout testing only.",
    definition: "Demo clinical definition placeholder. Real clinical content will be provided by the nursing department.",
    cover_path: null,
    cover_alt: "Demo CVP setup photo placeholder",
    sort_order: 20,
    published: true,
    video_status: "none",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    list_items: [
      { id: "li-8", procedure_id: "demo-proc-2", kind: "indication", text: "Demo indication 1: Hemodynamic monitoring lab demo", sort_order: 1 },
      { id: "li-9", procedure_id: "demo-proc-2", kind: "contraindication", text: "Demo contraindication 1: Catheter malfunction simulation", sort_order: 1 },
      { id: "li-10", procedure_id: "demo-proc-2", kind: "common_mistake", text: "Demo mistake 1: Misaligning zero reference level in lab", sort_order: 1 },
    ],
    equipment_items: [
      { id: "eq-5", procedure_id: "demo-proc-2", name: "Demo manometer setup", image_path: null, sort_order: 1 },
      { id: "eq-6", procedure_id: "demo-proc-2", name: "Demo 3-way stopcock connector", image_path: null, sort_order: 2 },
    ],
    checklist_steps: [
      {
        id: "step-7",
        procedure_id: "demo-proc-2",
        sort_order: 1,
        phase: "Setup",
        text_en: "Demo step 1: Position simulated manikin in supine alignment.",
        text_ar: "خطوة تجريبية 1: وضع الدمية المحاكية في استلقاء مستوٍ.",
        is_critical: false,
      },
      {
        id: "step-8",
        procedure_id: "demo-proc-2",
        sort_order: 2,
        phase: "Setup",
        text_en: "Demo step 2: Zero transducer to phlebostatic level reference marker.",
        text_ar: "خطوة تجريبية حرجة 2: ضبط نقطة الصفر للمحول على المستوى المرجعي التجريبي.",
        is_critical: true,
      },
      {
        id: "step-9",
        procedure_id: "demo-proc-2",
        sort_order: 3,
        phase: "Recording",
        text_en: "Demo step 3: Observe mock respiratory waveform oscillation.",
        text_ar: "خطوة تجريبية 3: مراقبة تذبذب الموجة التنفسية المحاكية.",
        is_critical: false,
      },
    ],
  },
  {
    id: "demo-proc-3",
    slug: "12-lead-ecg",
    title: "12-Lead ECG",
    short_description: "Demo procedure description for layout testing only.",
    definition: "Demo clinical definition placeholder. Real clinical content will be provided by the nursing department.",
    cover_path: null,
    cover_alt: "Demo 12-Lead ECG setup photo placeholder",
    sort_order: 30,
    published: true,
    video_status: "none",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    list_items: [
      { id: "li-11", procedure_id: "demo-proc-3", kind: "indication", text: "Demo indication 1: Skill lab rhythm analysis simulation", sort_order: 1 },
      { id: "li-12", procedure_id: "demo-proc-3", kind: "contraindication", text: "Demo contraindication 1: Broken cable artifact drill", sort_order: 1 },
      { id: "li-13", procedure_id: "demo-proc-3", kind: "common_mistake", text: "Demo mistake 1: Interchanging limb lead wires during drill", sort_order: 1 },
    ],
    equipment_items: [
      { id: "eq-7", procedure_id: "demo-proc-3", name: "Demo 12-Lead electrocardiograph device", image_path: null, sort_order: 1 },
      { id: "eq-8", procedure_id: "demo-proc-3", name: "Demo electrode pads set", image_path: null, sort_order: 2 },
    ],
    checklist_steps: [
      {
        id: "step-10",
        procedure_id: "demo-proc-3",
        sort_order: 1,
        phase: "Lead Placement",
        text_en: "Demo step 1: Clean and prepare mock electrode contact sites.",
        text_ar: "خطوة تجريبية 1: تنظيف وتجهيز مواضع أقطاب التوصيل المحاكية.",
        is_critical: false,
      },
      {
        id: "step-11",
        procedure_id: "demo-proc-3",
        sort_order: 2,
        phase: "Lead Placement",
        text_en: "Demo step 2: Affix V1 and V2 in fourth intercostal space landmarks.",
        text_ar: "خطوة تجريبية حرجة 2: تثبيت القطبين V1 و V2 في المعالم الوربية الرابعة المحاكية.",
        is_critical: true,
      },
    ],
  },
  {
    id: "demo-proc-4",
    slug: "bls",
    title: "BLS",
    short_description: "Demo procedure description for layout testing only.",
    definition: "Demo clinical definition placeholder. Real clinical content will be provided by the nursing department.",
    cover_path: null,
    cover_alt: "Demo BLS setup photo placeholder",
    sort_order: 40,
    published: true,
    video_status: "none",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    list_items: [
      { id: "li-14", procedure_id: "demo-proc-4", kind: "indication", text: "Demo indication 1: Basic life support simulation practice", sort_order: 1 },
      { id: "li-15", procedure_id: "demo-proc-4", kind: "contraindication", text: "Demo contraindication 1: Environmental hazard alert simulation", sort_order: 1 },
      { id: "li-16", procedure_id: "demo-proc-4", kind: "common_mistake", text: "Demo mistake 1: Leaning on chest between mock compressions", sort_order: 1 },
    ],
    equipment_items: [
      { id: "eq-9", procedure_id: "demo-proc-4", name: "Demo CPR manikin torso", image_path: null, sort_order: 1 },
      { id: "eq-10", procedure_id: "demo-proc-4", name: "Demo automated training defibrillator", image_path: null, sort_order: 2 },
    ],
    checklist_steps: [
      {
        id: "step-12",
        procedure_id: "demo-proc-4",
        sort_order: 1,
        phase: "Assessment",
        text_en: "Demo step 1: Check scene safety and tap mock manikin shoulder.",
        text_ar: "خطوة تجريبية حرجة 1: التحقق من أمان المحيط واختبار استجابة الدمية المحاكية.",
        is_critical: true,
      },
      {
        id: "step-13",
        procedure_id: "demo-proc-4",
        sort_order: 2,
        phase: "CPR Cycle",
        text_en: "Demo step 2: Deliver 30 high-quality mock chest compressions at 100-120 cpm.",
        text_ar: "خطوة تجريبية حرجة 2: إجراء 30 ضغطة صدر تجريبية بمعدل 100-120 بالدقيقة.",
        is_critical: true,
      },
    ],
  },
  {
    id: "demo-proc-5",
    slug: "acls",
    title: "ACLS",
    short_description: "Demo procedure description for layout testing only.",
    definition: "Demo clinical definition placeholder. Real clinical content will be provided by the nursing department.",
    cover_path: null,
    cover_alt: "Demo ACLS setup photo placeholder",
    sort_order: 50,
    published: true,
    video_status: "none",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    list_items: [
      { id: "li-17", procedure_id: "demo-proc-5", kind: "indication", text: "Demo indication 1: Advanced cardiac life support megacode drill", sort_order: 1 },
      { id: "li-18", procedure_id: "demo-proc-5", kind: "contraindication", text: "Demo contraindication 1: Simulated ROSC detection", sort_order: 1 },
      { id: "li-19", procedure_id: "demo-proc-5", kind: "common_mistake", text: "Demo mistake 1: Pausing CPR longer than 10 seconds during drill", sort_order: 1 },
    ],
    equipment_items: [
      { id: "eq-11", procedure_id: "demo-proc-5", name: "Demo crash cart simulation kit", image_path: null, sort_order: 1 },
      { id: "eq-12", procedure_id: "demo-proc-5", name: "Demo advanced airway trainer", image_path: null, sort_order: 2 },
    ],
    checklist_steps: [
      {
        id: "step-14",
        procedure_id: "demo-proc-5",
        sort_order: 1,
        phase: "Primary Assessment",
        text_en: "Demo step 1: Initiate continuous cardiac rhythm monitoring on training simulator.",
        text_ar: "خطوة تجريبية 1: بدء مراقبة تخطيط القلب المستمر على المحاكي التدريبي.",
        is_critical: false,
      },
      {
        id: "step-15",
        procedure_id: "demo-proc-5",
        sort_order: 2,
        phase: "Defibrillation",
        text_en: "Demo step 2: Clear mock team before simulated shock delivery.",
        text_ar: "خطوة تجريبية حرجة 2: إبعاد جميع أفراد الفريق المحاكى قبل تفريغ الصدمة التجريبية.",
        is_critical: true,
      },
    ],
  },
];

export const DEMO_PROCEDURES: Procedure[] =
  globalForDemo.__DEMO_PROCEDURES__ ?? INITIAL_PROCEDURES;
globalForDemo.__DEMO_PROCEDURES__ = DEMO_PROCEDURES;

export function addDemoProcedure(proc: Procedure) {
  DEMO_PROCEDURES.push(proc);
}

export function updateDemoProcedureDetails(id: string, details: Partial<Procedure>): boolean {
  const index = DEMO_PROCEDURES.findIndex((p) => p.id === id);
  if (index === -1) return false;
  DEMO_PROCEDURES[index] = {
    ...DEMO_PROCEDURES[index],
    ...details,
    updated_at: new Date().toISOString(),
  };
  return true;
}

export function updateDemoProcedureOverview(
  id: string,
  definition: string,
  indications: string[],
  contraindications: string[],
  common_mistakes: string[]
): boolean {
  const proc = DEMO_PROCEDURES.find((p) => p.id === id);
  if (!proc) return false;
  proc.definition = definition;
  proc.updated_at = new Date().toISOString();

  const newItems = [
    ...indications.map((text, idx) => ({
      id: `li-${id}-ind-${idx}`,
      procedure_id: id,
      kind: "indication" as const,
      text,
      sort_order: (idx + 1) * 10,
    })),
    ...contraindications.map((text, idx) => ({
      id: `li-${id}-con-${idx}`,
      procedure_id: id,
      kind: "contraindication" as const,
      text,
      sort_order: (idx + 1) * 10,
    })),
    ...common_mistakes.map((text, idx) => ({
      id: `li-${id}-cm-${idx}`,
      procedure_id: id,
      kind: "common_mistake" as const,
      text,
      sort_order: (idx + 1) * 10,
    })),
  ];

  proc.list_items = newItems;
  return true;
}

export function deleteDemoProcedure(id: string): boolean {
  const index = DEMO_PROCEDURES.findIndex((p) => p.id === id);
  if (index === -1) return false;
  DEMO_PROCEDURES.splice(index, 1);
  return true;
}

export function reorderDemoProcedures(items: Array<{ id: string; sort_order: number }>) {
  for (const item of items) {
    const proc = DEMO_PROCEDURES.find((p) => p.id === item.id);
    if (proc) {
      proc.sort_order = item.sort_order;
    }
  }
}

export function updateDemoSiteSettings(settings: Partial<SiteSettings>) {
  Object.assign(DEMO_SITE_SETTINGS, settings, { updated_at: new Date().toISOString() });
}
