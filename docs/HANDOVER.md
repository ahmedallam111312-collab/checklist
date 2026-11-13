# وثيقة التسليم والتشغيل النهائي (Handover & Governance Document)
## منصة Critical Ease — دليل الإجراءات السريرية المعتمد

---

## 1. قائمة الحسابات الرسمية وبيانات الاعتماد (Accounts Checklist with Credentials Blanks)

يجب ملء وتوثيق هذه البيانات في خزينة كلمات المرور المؤسسية الخاصة بالقسم (مثل 1Password أو Bitwarden) فور استلام المنصة:

```text
================================================================================
CRITICAL EASE INSTITUTIONAL CREDENTIALS RECORD (خزينة بيانات الاعتماد الرسمية)
================================================================================

1. GITHUB REPOSITORY (Department Organization)
   - Organization: [________________________________________]
   - Repository:   [ https://github.com/___________________ ]
   - Admin Email:  [________________________________________]
   - Admin Login:  [________________________________________]

2. VERCEL PROJECT (Production Hosting)
   - Team Account: [________________________________________]
   - Project Name: [ critical-ease                         ]
   - Login Email:  [________________________________________]
   - Team Role:    [ Owner / Administrator                 ]

3. SUPABASE PROJECT (Database & Storage)
   - Organization: [________________________________________]
   - Project Name: [ critical-ease-production              ]
   - Project Ref:  [________________________________________]
   - Database Pwd: [________________________________________]
   - Admin Login:  [________________________________________]

4. MUX VIDEO (Encrypted Video Infrastructure)
   - Organization: [________________________________________]
   - Environment:  [ Production                            ]
   - Admin Login:  [________________________________________]

5. DOMAIN REGISTRAR & DNS (Custom Domain)
   - Registrar:    [ GoDaddy / Cloudflare / Namecheap      ]
   - Domain Name:  [________________________________________]
   - DNS Account:  [________________________________________]
   - Nameservers:  [________________________________________]
================================================================================
```

---

## 2. إجراءات نقل الملكية الرسمية لكل خدمة (Step-by-Step Ownership Transfer)

### أ. مستودع GitHub
1. يقوم المشرف الحالي بنقل ملكية المستودع إلى حساب المنظمة الرسمي التابع للقسم عبر:
   `Settings` > `General` > `Danger Zone` > **Transfer ownership**.
2. تعيين صلاحية **Admin** لمدير تقنية المعلومات في القسم، وإزالة كافة الحسابات الشخصية للمطورين.
3. تفعيل الحماية على الفرع الرئيسي `main`:
   - منع الرفع المباشر (`Require pull request reviews before merging`).
   - إلزام اجتياز فحوصات الاختبار (`Require status checks to pass before merging`).

### ب. منصة الاستضافة Vercel
1. في لوحة تحكم Vercel، توجه إلى `Settings` > `General` > **Transfer Project**.
2. حدد فريق العمل المؤسسي التابع للقسم (Department Team).
3. بعد إتمام النقل، تحقق من بقاء متغيرات البيئة (Environment Variables) كما هي.

### ج. قاعدة بيانات Supabase
1. توجه إلى `Organization Settings` > `Members`.
2. قم بدعوة ممثل القسم برتبة **Owner**.
3. بعد قبول الدعوة، يمكن للمالك الجديد تخفيض أو إزالة الحسابات المؤقتة.
4. مراجعة جدول `public.admins` عبر SQL Editor للتأكد من حصر الصلاحيات الإدارية في بريد القسم الرسمي:
   ```sql
   SELECT * FROM public.admins;
   ```

### د. منصة بث الفيديو Mux
1. توجه إلى `Settings` > `Users` في Mux.
2. أضف بريد المسؤول الجديد برتبة **Admin**.
3. بعد تأكيد الحساب، انقل الملكية الكاملة (Primary Contact).

---

## 3. إجراءات تدوير المفاتيح والرموز السرية (Secret Rotation Procedure)

في حال حدوث اشتباه بتسريب أي مفتاح، أو كإجراء أمني دوري سنوي، يجب اتباع الترتيب التالي حصراً:

```
[خطوة 1: Supabase Keys] ──> [خطوة 2: Mux Tokens & Signing] ──> [خطوة 3: Cron Secrets] ──> [خطوة 4: Vercel Redeploy]
```

### جدول تفصيلي لترتيب التدوير وتأثير الأخطاء:

| الترتيب | المفتاح السري | الخطوات المطلوبة | الأثر والخلل في حال التطبيق الخاطئ |
|---|---|---|---|
| **1** | **`SUPABASE_SECRET_KEY`** | 1. ادخل Supabase > Settings > API.<br>2. اضغط **Rotate service_role secret**.<br>3. حدّث القيمة فوراً في Vercel تحت `SUPABASE_SECRET_KEY`. | في حال تدوير المفتاح دون تحديث Vercel، ستتعطل عمليات إدارة الإجراءات وتحديثات المشرفين (خطأ HTTP 401). |
| **2** | **`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`** | 1. في لوحة Supabase API، قم بتدوير **Anon / Public Key**.<br>2. حدّث القيمة في Vercel.<br>3. **قم بإعادة نشر المشروع بدون كاش (Redeploy without cache).** | إذا لم تتم إعادة البناء بدون كاش، سيبقى المتصفح يستخدم المفتاح القديم المدمج وقت البناء، مما يعطل استعراض الإجراءات للطلبة. |
| **3** | **`MUX_SIGNING_KEY_ID` و `MUX_SIGNING_PRIVATE_KEY`** | 1. ادخل Mux > Settings > Signing Keys.<br>2. أنشئ مفتاح توقيع جديد.<br>3. حدّث كلا المتغيرين في Vercel وأعد النشر.<br>4. بعد التأكد من عمل الفيديو، احذف المفتاح القديم من Mux. | إذا حذفت المفتاح القديم من Mux قبل تحديث Vercel، ستتوقف مقاطع الفيديو فوراً عن العمل لدى كافة المستخدمين (خطأ 403 Forbidden). |
| **4** | **`MUX_TOKEN_ID` و `MUX_TOKEN_SECRET`** | 1. في Mux Settings > Access Tokens، أنشئ توكن جديد بصلاحيات Video Full Access.<br>2. حدّث Vercel وأعد النشر.<br>3. احذف التوكن القديم من Mux. | يتعطل رفع مقاطع الفيديو الجديدة واستعلام الحالات من المشرف فقط. الفيديوهات الجاهزة تستمر في البث دون انقطاع. |
| **5** | **`MUX_WEBHOOK_SECRET`** | 1. في Mux Settings > Webhooks، عدّل إعدادات الويب هوك واحصل على الرمز الجديد.<br>2. حدّث `MUX_WEBHOOK_SECRET` في Vercel وأعد النشر. | تفشل مصادقة إشعارات اكتمال معالجة الفيديو، وتبقى الفيديوهات عالقة في حالة "قيد المعالجة" (Processing). |
| **6** | **`CRON_SECRET`** | 1. ولّد رمزاً عشوائياً (32 حرفاً): `openssl rand -hex 16`.<br>2. حدّث `CRON_SECRET` في Vercel.<br>3. أعد النشر لتحديث خادم Next.js. | تفشل مهام keep-alive اليومية بخطأ 401، مما قد يؤدي لإيقاف قاعدة بيانات Supabase المجانية في حال خمولها 7 أيام. |

---

## 4. دليل استعادة النسخ الاحتياطية (Disaster Recovery & Backup Restoration)

توفر المنصة محرك استعادة بيانات مدمج (`scripts/restore-backup.ts`) يطبق مبدأ التحديث والدمج الآمن (`upsert by ID`) دون حذف السجلات القائمة.

### خطوات الاستعادة خطوة بخطوة:

1. **تحميل ملف النسخة الاحتياطية:**
   - النسخ الاحتياطية التلقائية تُحفظ من لوحة تحكم المشرف (`/admin/settings`) بصيغة ملف JSON يحمل اسم التاريخ، مثل `critical-ease-backup-2026-11-13.json`.
2. **التشغيل التجريبي الآمن أولاً (Dry-Run Mode):**
   - قم بتشغيل سكريبت الاستعادة دون وسيطة `--apply` للتحقق من سلامة البنية وحساب عدد السجلات التي ستتم استعادتها:
   ```bash
   npx tsx scripts/restore-backup.ts backups/critical-ease-backup-2026-11-13.json
   ```
   - النتيجة المتوقعة: يقوم المحرك بقراءة جداول `site_settings`، `procedures`، `list_items`، `equipment_items`، و`checklist_steps` ويطبع أعداد السجلات دون إجراء أي تعديل فعلي على قاعدة البيانات.
3. **تطبيق الاستعادة على قاعدة البيانات (Apply Mode):**
   - بعد التأكد من مطابقة السجلات، نفّذ الاستعادة الفعلية:
   ```bash
   npx tsx scripts/restore-backup.ts backups/critical-ease-backup-2026-11-13.json --apply
   ```
4. **التحقق بعد الاستعادة:**
   - تشغيل سكريبت فحص الجاهزية والتحقق من سلامة البيانات:
   ```bash
   npx tsx scripts/check-production-readiness.ts
   ```

---

## 5. دليل معالجة الفيديو والعلامة المائية (Video Processing & Watermark Runbook)

وفق متطلبات التصميم وحماية المحتوى:
- يجب ألا يتجاوز طول الفيديو دقيقة إلى دقيقتين (معدل 45-90 ثانية).
- يجب حرق العلامة المائية الثابتة لشعار Critical Ease في زاوية الإطار.
- يتم ضغط الفيديو بدقة 720p ومعدل بت للصوت 128k لتوفير النطاق الترددي للطلبة عبر شبكات الهاتف المحمول.

### أمر FFmpeg القياسي المعتمد:
```bash
npx tsx scripts/watermark.ts input-procedure.mp4 output-ready.mp4
```

أو مباشرة عبر سطر الأوامر باستخدام FFmpeg:
```bash
ffmpeg -i input.mp4 -i public/brand/watermark.png -filter_complex "[0:v]scale=-2:720[scaled];[scaled][1:v]overlay=W-w-24:24" -c:v libx264 -preset slow -crf 22 -c:a aac -b:a 128k -movflags +faststart output.mp4
```
