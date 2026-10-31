# راهنمای اتصال به پیام‌رسان‌ها

این سند توضیح می‌دهد چگونه به هر یک از چهار پیام‌رسان زیر متصل شوید:

| پلتفرم | نام فارسی | روش اتصال |
|---|---|---|
| WhatsApp | واتساپ بیزینس | Cloud API (Meta) |
| Telegram | تلگرام | Bot API |
| Bale | بله | Bot API + سرویس سفیر |
| Eitaa | ایتا | ایتایار (EitaaYar) |

---

## ۱. واتساپ بیزینس (WhatsApp Business Cloud API)

### پیش‌نیازها
- حساب Meta Business (business.facebook.com)
- حساب توسعه‌دهنده Meta (developers.facebook.com)
- یک شماره تلفن موبایل جدید (برای شماره تجاری)
- حساب WhatsApp Business Account (WABA)

### مراحل راه‌اندازی

**گام ۱ — ساخت حساب Meta Business**
1. به [business.facebook.com](https://business.facebook.com) بروید
2. با ایمیل شرکت ثبت‌نام کنید
3. نام کسب‌وکار و اطلاعات شرکت را وارد کنید

**گام ۲ — ساخت اپلیکیشن**
1. به [developers.facebook.com](https://developers.facebook.com) بروید
2. روی «Create App» کلیک کنید
3. نوع اپلیکیشن را «Business» انتخاب کنید
4. نام اپلیکیشن و ایمیل تماس را وارد کنید
5. حساب Meta Business خود را متصل کنید

**گام ۳ — افزودن محصول WhatsApp**
1. در داشبورد اپلیکیشن، روی «Add Product» کلیک کنید
2. «WhatsApp» را پیدا کنید و «Set up» را بزنید
3. یک WhatsApp Business Account (WABA) بسازید یا انتخاب کنید
4. یک شماره تلفن اضافه کنید (شماره جدید یا شماره فعلی شرکت)

**گام ۴ — دریافت اطلاعات API**
از بخش «WhatsApp → API Setup» این اطلاعات را یادداشت کنید:
- **Phone Number ID**: شناسه شماره تلفن (مثلاً `106540352242922`)
- **WhatsApp Business Account ID**: شناسه حساب واتساپ

**گام ۵ — دریافت توکن دائمی (Permanent Token)**
1. به [business.facebook.com/settings/system-users](https://business.facebook.com/settings/system-users) بروید
2. روی «Add» کلیک کنید و یک System User بسازید
3. نقش «Admin» بدهید
4. روی «Generate New Token» کلیک کنید
5. اپلیکیشن خود را انتخاب کنید
6. پرمیژن‌های زیر را فعال کنید:
   - `whatsapp_business_messaging`
   - `whatsapp_business_management`
7. روی «Generate Token» بزنید
8. **توکن را کپی و ذخیره کنید** (فقط یک بار نمایش داده می‌شود)

### نحوه ارسال پیام
```http
POST https://graph.facebook.com/v21.0/{PHONE_NUMBER_ID}/messages
Authorization: Bearer {ACCESS_TOKEN}
Content-Type: application/json

{
  "messaging_product": "whatsapp",
  "recipient_type": "individual",
  "to": "989123456789",
  "type": "text",
  "text": {
    "preview_url": true,
    "body": "سلام {name} عزیز،\n\nاز حضور شما در غرفه امن‌آفرینان سپاسگزاریم."
  }
}
```

### محدودیت‌های مهم
- **بیرون از پنجره ۲۴ ساعته**: فقط می‌توانید از **قالب‌های تأییدشده** (Template Messages) استفاده کنید
- **قالب‌ها**: باید از Meta تأیید بگیرند (معمولاً ۱–۲۴ ساعت)
- **محدودیت نرخ**: ۸۰ پیام در ثانیه
- **جفت‌ارسال**: به هر کاربر حداکثر ۱ پیام در ۶ ثانیه

### تنظیمات در سامانه
- **توکن دسترسی**: توکن دائمی (Permanent Token) از System Users
- **شناسه شماره تلفن**: Phone Number ID از API Setup

---

## ۲. تلگرام (Telegram Bot API)

### پیش‌نیازها
- یک حساب تلگرام فعال

### مراحل راه‌اندازی

**گام ۱ — ساخت ربات**
1. در تلگرام، @BotFather را پیدا کنید و باز کنید
2. دستور `/newbot` را بفرستید
3. یک نام برای ربات انتخاب کنید (مثلاً `Amnafarinan Support`)
4. یک username انتخاب کنید (باید با `bot` تمام شود، مثلاً `amnafarinan_bot`)
5. **توکن ربات** دریافت کنید (فرمت: `123456789:ABC-DEF1234ghIkl-zyx57W2v1u123ew11`)

**گام ۲ — (اختیاری) تنظیمات ربات**
- `/setdescription` — توضیحات ربات
- `/setabouttext` — متن درباره
- `/setuserpic` — تصویر پروفایل

### نحوه ارسال پیام
```http
POST https://api.telegram.org/bot{TOKEN}/sendMessage
Content-Type: application/json

{
  "chat_id": "CHAT_ID",
  "text": "سلام {name} عزیز،\n\nاز حضور شما در غرفه امن‌آفرینان سپاسگزاریم."
}
```

### نحوه دریافت Chat ID
1. ربات را در تلگرام پیدا کنید و روی «Start» بزنید
2. به `https://api.telegram.org/bot{TOKEN}/getUpdates` درخواست بدهید
3. در پاسخ، `chat.id` را ببینید

### محدودیت‌های مهم
- فقط به کاربرانی که **با ربات گفتگو را شروع کرده‌اند** می‌توانید پیام بدهید
- محدودیت نرخ: ۳۰ پیام در ثانیه (قابل افزایش با Paid Broadcasts)

### تنظیمات در سامانه
- **توکن ربات**: توکن دریافتی از @BotFather

---

## ۳. بله (Bale)

### روش اول: Bot API (مانند تلگرام)

**گام ۱ — ساخت ربات**
1. در بله، @Bot_Father را پیدا کنید و باز کنید
2. دستور `/newbot` را بفرستید
3. نام و username ربات را وارد کنید
4. **توکن ربات** دریافت کنید

**نحوه ارسال پیام:**
```http
POST https://tapi.bale.ai/bot{TOKEN}/sendMessage
Content-Type: application/json

{
  "chat_id": "CHAT_ID",
  "text": "سلام {name} عزیز،\n\nاز حضور شما در غرفه امن‌آفرینان سپاسگزاریم."
}
```

### روش دوم: سرویس سفیر (Safir) — ارسال به شماره تلفن

این سرویس امکان ارسال مستقیم به شماره تلفن را فراهم می‌کند (بدون نیاز به شروع گفتگو توسط کاربر).

**گام ۱ — ثبت‌نام در پنل کسب‌وکار بله**
1. به [business.ble.ir](https://business.ble.ir) بروید
2. با شماره تلفن شرکت ثبت‌نام کنید
3. اطلاعات کسب‌وکار را وارد کنید
4. یک بازو (Bot) بسازید
5. **Bot ID** (عددی) دریافت کنید

**گام ۲ — دریافت API Access Key**
1. در پنل کسب‌وکار بله، به بخش «تنظیمات API» بروید
2. **API Access Key** را کپی کنید

**نحوه ارسال پیام:**
```http
POST https://safir.bale.ai/api/v3/send_message
api-access-key: {API_ACCESS_KEY}
Content-Type: application/json

{
  "request_id": "unique-request-id",
  "bot_id": 123456789,
  "phone_number": "989123456789",
  "message_data": {
    "message": {
      "text": "سلام {name} عزیز،\n\nاز حضور شما در غرفه امن‌آفرینان سپاسگزاریم."
    }
  }
}
```

### محدودیت‌های مهم
- **Bot API**: فقط به کاربرانی که گفتگو را شروع کرده‌اند
- **سفیر**: به شماره‌هایی که کاربر بله دارند
- **محدودیت اعتبار**: بر اساس تعامل کاربران، اعتبار روزانه اعطا می‌شود
- **محدودیت مخاطبین**: به تعداد مخاطبین بازو محدود است

### تنظیمات در سامانه
- **توکن ربات**: توکن Bot API از @Bot_Father
- **شناسه ربات (Bot ID)**: عدد Bot ID از پنل کسب‌وکار بله (برای سفیر)

---

## ۴. ایتا (Eitaa)

### پیش‌نیازها
- ثبت‌نام در [eitaayar.ir](https://eitaayar.ir)

### مراحل راه‌اندازی

**گام ۱ — ثبت‌نام در ایتایار**
1. به [eitaayar.ir](https://eitaayar.ir) بروید
2. با ایمیل ثبت‌نام کنید
3. حساب خود را تأیید کنید

**گام ۲ — ساخت برنامه (Application)**
1. در پنل ایتایار، یک برنامه جدید بسازید
2. **توکن API** دریافت کنید

**گام ۳ — اتصال ربات**
1. ربات خود را در ایتا پیدا کنید و با دستور `/start` شروع کنید
2. Chat ID کاربر را از پنل ایتایار دریافت کنید

### نحوه ارسال پیام
```http
POST https://eitaayar.ir/api/app/sendMessage
Content-Type: application/json

{
  "token": "YOUR_TOKEN",
  "chat_id": 279058397,
  "text": "سلام {name} عزیز،\n\nاز حضور شما در غرفه امن‌آفرینان سپاسگزاریم."
}
```

**یا از طریق URL pattern:**
```http
POST https://eitaayar.ir/api/{TOKEN}/sendMessage
Content-Type: application/json

{
  "chat_id": "chat_id",
  "text": "سلام {name} عزیز،\n\nاز حضور شما در غرفه امن‌آفرینان سپاسگزاریم."
}
```

### قالب‌بندی متن (Markdown)
| قالب | نشانه | مثال |
|---|---|---|
| پررنگ | `**…**` | **سلام** |
| کج | `__…__` | __سلام__ |
| کد درون‌خطی | `` `…` `` | `کد` |
| پیوند | `[…](url)` | [ایتا](https://eitaa.com) |

### محدودیت‌های مهم
- کاربر باید **ابتدا گفتگو را شروع کند** (با زدن `/start`)
- **محدودیت اعتبار روزانه**: بر اساس تعInteractionEnabled کاربران
- ارسال فقط به کاربرانی که **دسترسی ارسال** داده‌اند

### تنظیمات در سامانه
- **توکن ایتایار**: توکن دریافتی از eitaayar.ir

---

## خلاصه تنظیمات در سامانه

| پلتفرم | فیلد ۱ | فیلد ۲ |
|---|---|---|
| واتساپ | توکن دسترسی (Access Token) | Phone Number ID |
| تلگرام | توکن ربات | — |
| بله | توکن ربات (Bot API) | Bot ID (برای سفیر) |
| ایتا | توکن ایتایار | — |

## نکات امنیتی

1. **توکن‌ها را به اشتراک نگذارید** — هر توکن مانند رمز عبور است
2. **در محیط production از متغیرهای محیطی استفاده کنید** — توکن‌ها را مستقیم در کد نگذارید
3. **توکن‌ها را دوره‌ای تعویض کنید** — به خصوص توکن‌های واتساپ
4. **لاگ حسابرسی** — سامانه تمام عملیات اتصال را ثبت می‌کند
