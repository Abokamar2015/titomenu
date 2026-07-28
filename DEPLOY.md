# دليل نشر TitoMenu على Railway (خطوة بخطوة)

هذا الدليل ينقل موقع **titomenu.com** بالكامل خارج Replit:
- قاعدة البيانات والصور: **Supabase** (تم نقلها بالفعل ✅)
- الاستضافة: **Railway** (يقرأ الكود من GitHub)
- الدومين: **Namecheap** (تغيير DNS فقط)

> مهم: لا تلغِ اشتراك Replit إلا بعد أن تتأكد أن الموقع يعمل على Railway والدومين موجّه إليه.

---

## المرحلة 1 — إنشاء المشروع على Railway

1. ادخل إلى https://railway.app وسجّل الدخول (يمكنك الدخول بحساب GitHub — هذا أسهل).
2. اضغط **New Project** → **Deploy from GitHub repo**.
3. اختر المستودع: **Abokamar2015/titomenu** (فرع `main`).
4. Railway سيكتشف ملف `Dockerfile` تلقائياً ويبدأ البناء. انتظر حتى ينتهي (قد يستغرق دقائق).

## المرحلة 2 — إضافة متغيرات البيئة (Variables)

في صفحة الخدمة على Railway، افتح تبويب **Variables** وأضف المتغيرات التالية
(انسخ القيم من Replit: أداة Secrets في مشروعك — لا ترسلها لأي شخص):

| الاسم | القيمة |
|---|---|
| `SUPABASE_DATABASE_URL` | رابط قاعدة بيانات Supabase (Session pooler، منفذ 5432) |
| `SUPABASE_DB_PASSWORD` | كلمة مرور قاعدة بيانات Supabase |
| `SUPABASE_URL` | رابط مشروع Supabase مثل `https://xxxx.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | مفتاح service_role (الطويل الذي يبدأ بـ eyJ) |
| `ADMIN_PASSWORD` | كلمة مرور دخول لوحة الإدارة (نفسها الحالية) |
| `SESSION_SECRET` | نفس القيمة الحالية من Replit Secrets |

بعد الحفظ سيعيد Railway تشغيل الخدمة تلقائياً.

## المرحلة 3 — التأكد أن الموقع يعمل

1. في تبويب **Settings → Networking** اضغط **Generate Domain** للحصول على رابط مؤقت مثل `xxxx.up.railway.app`.
2. افتح الرابط وتأكد من:
   - ظهور المنيو بالصور بالعربية والإنجليزية ✅
   - فتح `/admin` وتسجيل الدخول بكلمة مرور الإدارة ✅
   - تعديل صنف تجريبي ورفع صورة ثم التراجع ✅

## المرحلة 4 — ربط الدومينات

في Railway → **Settings → Networking → Custom Domain** أضف ثلاثة دومينات:
1. `titomenu.com`
2. `www.titomenu.com`
3. `admin.titomenu.com`

Railway سيعطيك لكل واحد قيمة **CNAME** (مثل `xxxx.up.railway.app`).

## المرحلة 5 — تعديل DNS في Namecheap

ادخل Namecheap → Domain List → **Manage** بجانب titomenu.com → تبويب **Advanced DNS**:

1. **احذف** السجلات القديمة التي تشير إلى Replit (A records و CNAME الخاصة بـ replit).
2. أضف السجلات الجديدة:

| Type | Host | Value |
|---|---|---|
| ALIAS (أو CNAME) | `@` | القيمة التي أعطاها Railway لـ titomenu.com |
| CNAME | `www` | القيمة التي أعطاها Railway لـ www.titomenu.com |
| CNAME | `admin` | القيمة التي أعطاها Railway لـ admin.titomenu.com |

> ملاحظة: إذا لم يتوفر ALIAS للجذر `@` في Namecheap، استخدم **CNAME** إن ظهر، أو فعّل إعادة توجيه من `titomenu.com` إلى `www.titomenu.com`.

3. انتظر من 10 دقائق إلى ساعة حتى ينتشر التغيير، وستظهر علامة ✅ بجانب كل دومين في Railway مع شهادة HTTPS تلقائية.

## المرحلة 6 — التحقق النهائي ثم إلغاء Replit

تأكد من كل النقاط التالية على الدومين الحقيقي:
- [ ] `www.titomenu.com` يعرض المنيو كاملاً بالصور
- [ ] تبديل اللغة عربي/إنجليزي يعمل
- [ ] `admin.titomenu.com` يفتح لوحة الإدارة وتسجيل الدخول يعمل
- [ ] إضافة/تعديل صنف مع صورة جديدة يعمل
- [ ] رمز QR المطبوع يفتح الموقع بشكل صحيح

بعد التأكد من كل شيء، يمكنك بأمان:
1. إيقاف النشر (Deployment) في Replit.
2. إلغاء الاشتراك.

---

## معلومات تقنية (للمطورين)

- خدمة واحدة على Railway تبني الواجهة (React/Vite) وتشغّل خادم Express الذي يقدّم الواجهة و `/api` معاً (انظر `Dockerfile`).
- `admin.titomenu.com` يعيد التوجيه تلقائياً إلى مسار `/admin`.
- الصور تُخدم من مسار `/api/storage/objects/...` الذي يقرأ من حاوية Supabase Storage باسم `menu-images`.
- قاعدة البيانات: Supabase Postgres عبر Session pooler (منفذ 5432). الاتصال يُبنى من `SUPABASE_DATABASE_URL` مع استبدال كلمة المرور بـ `SUPABASE_DB_PASSWORD` إن وُجدت.
