# راهنمای استقرار روی لینوکس

این راهنما استقرار سامانه مدیریت بازدیدکنندگان امن‌آفرینان را روی یک سرور لینوکسی با
**Nginx + systemd + SQLite** توضیح می‌دهد.

سامانه کاملاً از نصب فعلی **PrestaShop** جداست: هیچ فایلی از PrestaShop تغییر نمی‌کند،
هیچ پوشه‌ای مشترک نیست و هیچ پایگاه داده‌ای دست نمی‌خورد. پیشنهاد می‌شود روی زیر‌دامنه
`visitors.amnafarinan.ir` مستقر شود (نمونه nginx برای هر دو حالت آمده است).

---

## ۱. پیش‌نیازها

~~~bash
sudo apt update
sudo apt install -y nginx curl ca-certificates git
# Node.js 20 یا بالاتر (یا از NodeSource نصب کنید)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v
~~~

---

## ۲. کاربر و مسیرهای اختصاصی

~~~bash
sudo useradd --system --create-home --home-dir /var/www/amnafarinan --shell /usr/sbin/nologin amnafarinan
sudo mkdir -p /var/www/amnafarinan
sudo mkdir -p /var/lib/amnafarinan            # محل دائمی پایگاه داده
sudo mkdir -p /var/backups/amnafarinan       # نسخه‌های پشتیبان
sudo mkdir -p /etc/amnafarinan               # فایل تنظیمات محیطی
sudo chown -R amnafarinan:amnafarinan /var/www/amnafarinan /var/lib/amnafarinan /var/backups/amnafarinan
~~~

> پایگاه داده SQLite باید در پوشه‌ای **خارج از پوشه‌ی build/deploy** و با مالکیت کاربر سرویس
> ذخیره شود تا با هر بار انتشار مجدد، داده‌ها از بین نرود.

---

## ۳. کپی کد و نصب وابستگی‌ها

~~~bash
sudo -u amnafarinan git clone https://github.com/triborg34/visitors.git /var/www/amnafarinan/app
cd /var/www/amnafarinan/app
sudo -u amnafarinan npm install
sudo -u amnafarinan npm run db:generate
sudo -u amnafarinan npm run build
~~~

---

## ۴. فایل تنظیمات محیطی

~~~bash
sudo nano /etc/amnafarinan/amnafarinan.env
~~~

~~~ini
NODE_ENV=production
PORT=4000
HOST=127.0.0.1
DATABASE_URL=file:/var/lib/amnafarinan/amnafarinan.db
JWT_SECRET=<یک رشته تصادفی حداقل ۳۲ کاراکتری>
JWT_EXPIRES_IN=8h
COOKIE_NAME=amn_token
CSRF_COOKIE_NAME=amn_csrf
COOKIE_SECURE=true
COOKIE_SAME_SITE=lax
TRUST_PROXY=true
CORS_ORIGIN=https://visitors.amnafarinan.ir
LOGIN_MAX_ATTEMPTS=10
LOGIN_WINDOW_MINUTES=15
API_RATE_LIMIT=600
API_RATE_WINDOW_MINUTES=15
ADMIN_USERNAME=admin
ADMIN_PASSWORD=<رمز قوی>
ADMIN_FULL_NAME=مدیر سیستم
COMPANY_NAME=امن‌آفرینان
CATALOG_URL=https://amnafarinan.ir/catalog.pdf
~~~

~~~bash
sudo chown root:amnafarinan /etc/amnafarinan/amnafarinan.env
sudo chmod 640 /etc/amnafarinan/amnafarinan.env
~~~

---

## ۵. آماده‌سازی پایگاه داده و حساب مدیر

~~~bash
cd /var/www/amnafarinan/app
sudo -u amnafarinan npm run db:migrate:deploy   # یا db:push برای اولین نصب
sudo -u amnafarinan npm run db:seed             # ساخت حساب مدیر و قالب‌های پیام
~~~

---

## ۶. سرویس systemd
ee
~~~bash
sudo cp deploy/systemd/amnafarinan-visitors.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now amnafarinan-visitors
sudo systemctl status amnafarinan-visitors
~~~

سرویس روی `127.0.0.1:4000` گوش می‌دهد و فقط از طریق Nginx در دسترس است.

---

## ۷. پیکربندی Nginx

### ۷.۱ حالت زیر‌دامنه (پیشنهادی)

~~~bash
sudo cp deploy/nginx/visitors.amnafarinan.ir.conf /etc/nginx/sites-available/
sudo ln -s /etc/nginx/sites-available/visitors.amnafarinan.ir.conf /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
~~~

### ۷.۲ حالت مسیر زیرمجموعه (`/visitors`)

~~~bash
sudo cp deploy/nginx/amnafarinan.ir-visitors-path.conf /etc/nginx/sites-available/
sudo ln -s /etc/nginx/sites-available/amnafarinan.ir-visitors-path.conf /etc/nginx/sites-enabled/
~~~

> در حالت مسیر زیرمجموعه، بیلد فرانت‌اند را با base مناسب و درخواست‌های API را به /api
> پروکسی کنید؛ برای جلوگیری از تداخل با PrestaShop توصیه می‌شود از زیر‌دامنه استفاده شود.

---

## ۸. گواهی SSL

~~~bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d visitors.amnafarinan.ir
sudo systemctl enable --now certbot.timer
~~~

---

## ۹. پشتیبان‌گیری

~~~bash
sudo cp deploy/cron/amnafarinan-backup /etc/cron.d/amnafarinan-backup
sudo chmod 644 /etc/cron.d/amnafarinan-backup
~~~

اسکریپت پشتیبان از VACUUM INTO استفاده می‌کند تا کپی سازگار باشد و ۲۰ نسخه آخر را نگه می‌دارد.
کپی‌های روزانه را به یک فضای خارج از سرور هم منتقل کنید.

---

## ۱۰. به‌روزرسانی نسخه جدید

~~~bash
cd /var/www/amnafarinan/app
sudo -u amnafarinan git pull
sudo -u amnafarinan npm install
sudo -u amnafarinan npm run build
sudo -u amnafarinan npm run db:migrate:deploy
sudo systemctl restart amnafarinan-visitors
~~~

---

## ۱۱. چک‌لیست امنیتی

- [ ] JWT_SECRET تصادفی و حداقل ۳۲ کاراکتری
- [ ] COOKIE_SECURE=true و HTTPS فعال
- [ ] TRUST_PROXY=true در پشت nginx
- [ ] پورت ۴۰۰۰ فقط روی 127.0.0.1 گوش می‌دهد (فایروال)
- [ ] دسترسی پوشه پایگاه داده فقط برای کاربر amnafarinan
- [ ] پشتیبان‌گیری خودکار روزانه + کپی خارج از سرور
- [ ] تغییر رمز پیش‌فرض مدیر پس از اولین ورود
- [ ] CORS_ORIGIN فقط دامنه واقعی سامانه

---

## ۱۲. عیب‌یابی

| مشکل | بررسی |
|---|---|
| ۵۰۳ از nginx | systemctl status amnafarinan-visitors و journalctl -u amnafarinan-visitors -n 50 |
| خطای CSRF | کوکی amn_csrf و هدر x-csrf-token باید هم‌ریشه باشند؛ COOKIE_SAME_SITE را بررسی کنید |
| خطای دیتابیس | دسترسی پوشه /var/lib/amnafarinan و مقدار DATABASE_URL |
| صفحه خالی (SPA) | در nginx از try_files استفاده شده باشد |
| کندی | SQLite روی دیسک شبکه‌ای نباشد؛ حالت WAL فعال است |

---

## ۱۳. هم‌زیستی با PrestaShop

- این برنامه هیچ فایلی از نصب PrestaShop را نمی‌خواند یا تغییر نمی‌دهد.
- پوشه برنامه، پورت، سرویس systemd و مسیر پایگاه داده کاملاً جدا هستند.
- اگر روی مسیر /visitors مستقر می‌کنید، در location مربوط به PrestaShop دست نزنید و
  فقط بلوک جدید را اضافه کنید.
- برای اتصال دوطرفه در آینده (مثلاً ثبت بازدیدکننده از سایت)، از API همین سرویس استفاده کنید
  و توکن را در ماژول PrestaShop نگه دارید.