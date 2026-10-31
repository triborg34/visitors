# مستند API

نشانی پایه در محیط عملیاتی: `https://visitors.amnafarinan.ir/api`
در توسعه: `http://localhost:4000/api`

## قرارداد پاسخ‌ها

پاسخ موفق:

~~~json
{
  "success": true,
  "data": {},
  "meta": { "page": 1, "pageSize": 20, "total": 42, "totalPages": 3 },
  "message": "متن اختیاری"
}
~~~

پاسخ ناموفق:

~~~json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "اطلاعات وارد شده معتبر نیست.",
    "details": { "mobile": ["شماره موبایل معتبر نیست."] }
  }
}
~~~

کدهای وضعیت: ۲۰۰ موفق، ۲۰۱ ساخته شد، ۴۰۰ درخواست نامعتبر، ۴۰۱ احراز هویت نشده،
۴۰۳ دسترسی غیرمجاز، ۴۰۴ یافت نشد، ۴۰۹ تکراری، ۴۲۲ خطای اعتبارسنجی، ۴۲۹ محدودیت نرخ، ۵۰۰ خطای سرور.

## احراز هویت

- ورود با `POST /api/auth/login` کوکی `amn_token` (HttpOnly) و `amn_csrf` (قابل خواندن در JS) را می‌سازد.
- درخواست‌های تغییردهنده وضعیت باید هدر `x-csrf-token` را با مقدار کوکی `amn_csrf` یکسان بفرستند.
- در صورت نیاز به کلاینت غیرمرورگر، هدر `Authorization: Bearer <token>` هم پذیرفته می‌شود.
- نشست منقضی: پاسخ ۴۰۱.

---

## احراز هویت — /api/auth

| متد | مسیر | دسترسی | توضیح |
|---|---|---|---|
| POST | /auth/login | عمومی | ورود؛ بدنه: username، password |
| POST | /auth/logout | نشست‌دار | خروج و پاک کردن کوکی |
| GET | /auth/me | نشست‌دار | پروفایل کاربر جاری |
| GET | /auth/csrf | عمومی | دریافت توکن CSRF |
| POST | /auth/change-password | نشست‌دار | تغییر رمز؛ بدنه: currentPassword، newPassword |

نمونه ورود:

~~~json
{ "username": "admin", "password": "Admin@12345" }
~~~

## کاربران — /api/users (فقط مدیر)

| متد | مسیر | توضیح |
|---|---|---|
| GET | /users | فهرست کاربران؛ پارامترها: search، role، isActive، page، pageSize |
| POST | /users | ساخت کارمند؛ بدنه: username، fullName، password، role، phone، email، activeExhibitionId |
| PATCH | /users/:id | ویرایش (نام، نقش، وضعیت فعال، نمایشگاه فعال) |
| POST | /users/:id/reset-password | بازنشانی رمز؛ بدنه: newPassword، mustChangePassword |
| DELETE | /users/:id | حذف نرم |

## نمایشگاه‌ها — /api/exhibitions

| متد | مسیر | دسترسی | توضیح |
|---|---|---|---|
| GET | /exhibitions | همه | فهرست نمایشگاه‌ها؛ پارامتر: status |
| GET | /exhibitions/active | همه | نمایشگاه‌های فعال و پیش‌رو برای انتخاب کارمند |
| POST | /exhibitions | مدیر | ساخت نمایشگاه |
| PATCH | /exhibitions/:id | مدیر | ویرایش |
| DELETE | /exhibitions/:id | مدیر | حذف نرم (مراجعات باقی می‌مانند) |

نمونه ساخت:

~~~json
{
  "name": "نمایشگاه پتروشیمی تهران",
  "location": "مرکز نمایشگاه بین‌المللی",
  "startDate": "2026-10-01",
  "endDate": "2026-10-05",
  "status": "ACTIVE"
}
~~~

## بازدیدکنندگان و مراجعات — /api/visitors

| متد | مسیر | دسترسی | توضیح |
|---|---|---|---|
| GET | /visitors | کارمند: فقط مراجعات خودش | فهرست با فیلتر، مرتب‌سازی و صفحه‌بندی |
| GET | /visitors/check-duplicate?mobile= | نشست‌دار | بررسی تکراری بودن شماره |
| POST | /visitors | نشست‌دار | ثبت مراجعه جدید |
| GET | /visitors/:id | کارمند: فقط مراجعات خودش | جزئیات بازدیدکننده و تاریخچه |
| GET | /visitors/followups | نشست‌دار | فهرست پیگیری‌ها؛ پارامترها: status، employeeId، search، nextFollowUpBefore |
| POST | /visitors/followups/:id | مالک مراجعه یا مدیر | ویرایش پیگیری |
| DELETE | /visitors/followups/:id | مالک مراجعه یا مدیر | حذف پیگیری |
| PATCH | /visitors/visits/:visitId | مالک مراجعه یا مدیر | تغییر وضعیت پیگیری، اولویت یا مسئول |
| POST | /visitors/visits/:visitId/followups | مالک مراجعه یا مدیر | ثبت پیگیری جدید |
| GET | /visitors/visits/:visitId/messages | مالک مراجعه یا مدیر | تاریخچه پیام |
| POST | /visitors/visits/:visitId/messages/prepare | مالک مراجعه یا مدیر | آماده‌سازی پیام |
| POST | /visitors/visits/:visitId/messages/:logId/opened | مالک مراجعه یا مدیر | ثبت «باز شد توسط کارمند» |
| POST | /visitors/visits/:visitId/messages/:logId/confirm | مالک مراجعه یا مدیر | ثبت «ارسال تأیید شد توسط کارمند» |

پارامترهای فهرست بازدیدکنندگان:
search، exhibitionId، employeeId، priority، requestType، followUpStatus، platform،
marketingConsent، sendThankYou، from، to، page، pageSize، sortBy، sortDir.

ثبت مراجعه:

~~~json
{
  "fullName": "علی رضایی",
  "gender": "MALE",
  "company": "صنایع پتروشیمی پارس",
  "mobile": "09121234567",
  "requestType": "PRICE_INQUIRY",
  "priority": "HOT",
  "notes": "درخواست قیمت عمده",
  "sendThankYou": true,
  "preferredPlatform": "WHATSAPP",
  "marketingConsent": true,
  "exhibitionId": "<شناسه نمایشگاه>"
}
~~~

پاسخ شامل `data.duplicate` است؛ اگر شماره قبلاً ثبت شده باشد `duplicate.exists = true` و
سابقه مراجعه قبلی برگردانده می‌شود (رکورد قبلی حذف یا بازنویسی نمی‌شود).

مقادیر enum:
gender: MALE، FEMALE، UNKNOWN
requestType: PRICE_INQUIRY، CATALOG، TECHNICAL_CONSULTATION، PARTNERSHIP، OTHER
priority: HOT، WARM، NORMAL
followUpStatus: NEW، CONTACTED، NEGOTIATION، FINALIZED، REJECTED
preferredPlatform: BALE، EITAA، WHATSAPP، TELEGRAM، NONE
exhibition status: UPCOMING، ACTIVE، COMPLETED
message status: NOT_REQUESTED، PREPARED، OPENED، CONFIRMED_SENT، API_SENT، FAILED

آماده‌سازی پیام:

~~~json
{ "templateKey": "THANK_YOU", "platform": "WHATSAPP" }
~~~

پاسخ شامل `data.log` (رکورد پیام با وضعیت PREPARED) و `data.deepLink` (لینک بازکردن پیام‌رسان)
است. هیچ پیامی به‌صورت خودکار ارسال نمی‌شود.

## قالب‌های پیام — /api/templates

| متد | مسیر | دسترسی | توضیح |
|---|---|---|---|
| GET | /templates | همه | فهرست قالب‌ها شامل پیش‌فرض‌های ذخیره‌نشده |
| POST | /templates | مدیر | ساخت یا به‌روزرسانی قالب؛ بدنه: key، title، body، isActive |
| PATCH | /templates/:id | مدیر | ویرایش قالب ذخیره‌شده |

کلیدها: THANK_YOU، COMPANY_INTRO، PRODUCT_INTRO، CATALOG، FOLLOW_UP
متغیرها: {name}، {company}، {mobile}، {exhibition}، {employee}، {catalog_url}

## تنظیمات شرکت — /api/settings

| متد | مسیر | دسترسی | توضیح |
|---|---|---|---|
| GET | /settings | همه | تنظیمات شرکت |
| PUT | /settings | مدیر | ذخیره تنظیمات (companyName، website، phone، email، logoUrl، catalogUrl، defaultPlatform، description) |

## گزارش‌ها — /api/reports

| متد | مسیر | توضیح |
|---|---|---|
| GET | /reports/summary | آمار کلی؛ پارامترها: exhibitionId، employeeId، from، to |
| GET | /reports/trend | روند روزانه؛ پارامترها: days، exhibitionId |
| GET | /reports/employees | فهرست کارمندان فعال برای فیلترها |
| GET | /reports/audit-logs | لاگ حسابرسی (فقط مدیر) |

## خروجی اکسل و PDF — /api/export (فقط مدیر)

| متد | مسیر | توضیح |
|---|---|---|
| GET | /export/visitors.xlsx | فایل xlsx با همان فیلترهای فهرست بازدیدکنندگان |
| GET | /export/visitors.pdf | فایل PDF با همان فیلترها (جدول راست‌به‌چپ + آمار خلاصه) |

شامل دو شیت/بخش: «بازدیدکنندگان» با ستون‌های فارسی و تاریخ شمسی و میلادی، و «آمار خلاصه».

## سلامت سرویس

| متد | مسیر | توضیح |
|---|---|---|
| GET | /api/health | وضعیت سرویس (بدون احراز هویت) |