# Critical Ease (دليل الإجراءات التمريضية السريرية)

منصة مرجعية رقمية لإجراءات التمريض في أقسام الطوارئ والعناية المركزة، تم تطويرها وفق مواصفات التصميم المعتمدة (Light Mode Only، نمط البطاقات البيضاء، لوحة الألوان الرسمية: كحلي داكن `#0D1526`، أزرق حيوي `#1A56DB`، أحمر حرج `#B42318`).

---

## 1. وثائق التثبيت والتشغيل والتسليم (Documentation Links)

- [دليل النشر والتهيئة للإنتاج على Vercel (docs/DEPLOYMENT.md)](docs/DEPLOYMENT.md): خطوات النشر والتسجيل السحابي وقائمة متغيرات البيئة الكاملة.
- [وثيقة التسليم والحوكمة واستعادة النسخ الاحتياطية (docs/HANDOVER.md)](docs/HANDOVER.md): قائمة الحسابات الرسمية، تدوير المفاتيح، وسيناريوهات التعافي من الكوارث.
- [دليل إدارة المحتوى للمشرفين (docs/ADMIN_GUIDE.ar.md)](docs/ADMIN_GUIDE.ar.md): إدارة الإجراءات، الخطوات الحرجة، القوائم، واستيراد الخطوات الجماعي.
- [دليل إعداد ومعالجة الفيديو (docs/VIDEO_GUIDE.md)](docs/VIDEO_GUIDE.md): متطلبات حرق العلامة المائية وضغط 720p وتكامل Mux Signed Playback.

---

## 2. متطلبات التشغيل والتثبيت المحلي (Local Setup)

- **Node.js**: إصدار 20.x أو 22.x
- **مدير الحزم**: `npm`
- **قاعدة البيانات**: مشروع Supabase (PostgreSQL 15+)
- **بث الفيديو**: حساب Mux (مع مفتاح Signing Key مفعل)
- **معالجة الفيديو**: أداة FFmpeg مثبتة ومتاحة في PATH (لحرق العلامة المائية)

```bash
# 1. استنساخ المستودع
git clone <repository-url>
cd checklists

# 2. تثبيت الحزم البرمجية
npm install

# 3. إعداد ملف البيئة المحلي
cp .env.example .env.local
# قم بإدخال بيانات الاتصال الحقيقية داخل .env.local (الملف محمي في .gitignore)
```

---

## 3. ترحيلات قاعدة البيانات (Database Migrations)

يجب تنفيذ ملفات الترحيل في لوحة Supabase SQL Editor بالترتيب التسلسلي الدقيق:

1. `supabase/migrations/001_schema.sql`: الجداول الأساسية (`procedures`، `checklist_steps`، `equipment_items`، `list_items`، `site_settings`، `public.admins`) وقواعد RLS.
2. `supabase/migrations/002_storage_limits.sql`: سياسات حاوية التخزين `site-images` والحد الأقصى للملفات (5 ميجابايت).
3. `supabase/migrations/003_storage_admin_select.sql`: قصر عمليات تعديل وحذف ملفات التخزين على المشرفين المعتمدين.
4. `supabase/migrations/004_video.sql`: أعمدة تتبع الفيديو السحابي وحالات المعالجة (`video_status`، `mux_asset_id`، `mux_playback_id`).
5. `supabase/migrations/005_login_rate_limit.sql`: جدول `public.login_attempts` للحماية ضد محاولات تسجيل الدخول المتكررة (Brute-force protection).
6. `supabase/migrations/006_optimizations.sql`: إضافة عمود `blur_data_url` وجدول منع تكرار الطلبات `public.idempotency_keys`.

---

## 4. الفحص المسبق والتشغيل والاختبارات (Run, Preflight & Testing)

```bash
# تشغيل خادم التطوير المحلي
npm run dev

# تشغيل الفحص المسبق الشامل (أسرار، تدقيق الأنواع، التدقيق البرمجي، اختبارات الوحدة، والبناء)
npm run preflight

# تشغيل اختبارات الوحدة السريعة فقط (93 اختباراً)
npm run test:unit

# فحص خلو المستودع من أي مفاتيح أو رموز سرية
npm run check:secrets

# تدقيق الأنواع البرمجية والتحقق من التوافق
npm run typecheck

# بناء حزمة الإنتاج محلياً
npm run build

# تشغيل خادم الإنتاج محلياً
npm run start

# تشغيل اختبارات الدخان للإنتاج (Smoke Test) ضد الخادم المشغل
npx tsx scripts/smoke-test.ts http://localhost:3000
```

---

## 5. متغيرات البيئة الأساسية (Environment Variables)

جميع متغيرات البيئة موثقة بالتفصيل في [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md). المتغيرات الإلزامية:

- `NEXT_PUBLIC_SITE_URL`: النطاق الرسمي للإنتاج (يمنع استخدام localhost في الإنتاج).
- `NEXT_PUBLIC_SUPABASE_URL`: رابط مشروع Supabase.
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: المفتاح العام للعميل (Anon Key).
- `SUPABASE_SECRET_KEY`: المفتاح السري للخادم (Service Role Key - محظور وصوله للعميل).
- `CRON_SECRET`: رمز مصادقة استدعاء `/api/health` اليومي لمنع خمول قاعدة البيانات المجانية.
- `MUX_TOKEN_ID` / `MUX_TOKEN_SECRET`: مفاتيح الاتصال البرمجي بخدمة Mux Video.
- `MUX_SIGNING_KEY_ID` / `MUX_SIGNING_PRIVATE_KEY`: مفاتيح توليد رموز التوقيع للبث المشفر.
- `MUX_WEBHOOK_SECRET`: الرمز السري للتحقق من تواقيع إشعارات Mux.
