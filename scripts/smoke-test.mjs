/**
 * آزمون دود (Smoke Test) روی API واقعی سامانه.
 * اجرا: node scripts/smoke-test.mjs [baseUrl]
 */
const BASE = process.argv[2] ?? 'http://localhost:4000';
let failures = 0;

function assert(condition, label, extra) {
  if (condition) {
    console.log('  ✅ ' + label);
  } else {
    failures += 1;
    console.log('  ❌ ' + label + (extra ? ' → ' + JSON.stringify(extra).slice(0, 300) : ''));
  }
}

function makeClient() {
  const jar = new Map();
  return {
    jar,
    async request(method, path, body, extraHeaders = {}) {
      const headers = { ...extraHeaders };
      if (body !== undefined) headers['Content-Type'] = 'application/json';
      if (jar.size > 0) {
        headers['Cookie'] = Array.from(jar.entries())
          .map(([k, v]) => k + '=' + v)
          .join('; ');
      }
      const csrf = jar.get('amn_csrf');
      if (csrf && method !== 'GET' && method !== 'HEAD' && path !== '/api/auth/login') {
        headers['x-csrf-token'] = csrf;
      }
      const res = await fetch(BASE + path, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      const setCookie = res.headers.getSetCookie?.() ?? [];
      for (const raw of setCookie) {
        const [pair] = raw.split(';');
        const idx = pair.indexOf('=');
        if (idx > 0) jar.set(pair.slice(0, idx).trim(), pair.slice(idx + 1).trim());
      }
      const contentType = res.headers.get('content-type') ?? '';
      let payload = null;
      if (contentType.includes('application/json')) payload = await res.json();
      else payload = Buffer.from(await res.arrayBuffer());
      return { status: res.status, body: payload, headers: res.headers };
    },
  };
}

async function run() {
  console.log('Smoke test → ' + BASE);
  const admin = makeClient();

  const health = await admin.request('GET', '/api/health');
  assert(health.status === 200 && health.body?.data?.status === 'ok', 'سلامت سرویس', health.body);

  const badLogin = await admin.request('POST', '/api/auth/login', {
    username: 'admin',
    password: 'wrong-password',
  });
  assert(badLogin.status === 401, 'ورود با رمز اشتباه رد شد', badLogin.body);

  const login = await admin.request('POST', '/api/auth/login', {
    username: 'admin',
    password: 'Admin@12345',
  });
  assert(login.status === 200 && login.body?.data?.user?.role === 'ADMIN', 'ورود مدیر', login.body);
  assert(admin.jar.has('amn_token'), 'کوکی نشست ساخته شد');
  assert(admin.jar.has('amn_csrf'), 'توکن CSRF ساخته شد');

  const me = await admin.request('GET', '/api/auth/me');
  assert(me.status === 200 && me.body?.data?.username === 'admin', 'دریافت پروفایل کاربر');

  const stamp = Date.now();
  const exhibitionName = 'نمایشگاه آزمون ' + stamp;
  const createdExhibition = await admin.request('POST', '/api/exhibitions', {
    name: exhibitionName,
    location: 'تهران',
    startDate: '2026-10-01',
    endDate: '2026-12-31',
    status: 'ACTIVE',
  });
  assert(createdExhibition.status === 201, 'ساخت نمایشگاه', createdExhibition.body);
  const exhibitionId = createdExhibition.body?.data?.id;

  const badExhibition = await admin.request('POST', '/api/exhibitions', {
    name: 'نامعتبر',
    startDate: '2026-12-31',
    endDate: '2026-01-01',
  });
  assert(badExhibition.status === 422, 'اعتبارسنجی نمایشگاه (تاریخ پایان قبل از شروع)', badExhibition.body);

  const employeeUsername = 'emp' + String(stamp).slice(-6);
  const createdUser = await admin.request('POST', '/api/users', {
    username: employeeUsername,
    fullName: 'کارمند آزمون',
    password: 'Test@12345',
    role: 'EMPLOYEE',
    activeExhibitionId: exhibitionId,
  });
  assert(createdUser.status === 201, 'ساخت کارمند', createdUser.body);

  const employee = makeClient();
  const employeeLogin = await employee.request('POST', '/api/auth/login', {
    username: employeeUsername,
    password: 'Test@12345',
  });
  assert(employeeLogin.status === 200, 'ورود کارمند', employeeLogin.body);

  const forbidden = await employee.request('GET', '/api/users');
  assert(forbidden.status === 403, 'کارمند به مدیریت کاربران دسترسی ندارد', forbidden.body);

  const forbiddenExport = await employee.request('GET', '/api/export/visitors.xlsx');
  assert(forbiddenExport.status === 403, 'کارمند به خروجی اکسل دسترسی ندارد', forbiddenExport.body);

  const visitPayload = {
    fullName: 'بازدیدکننده آزمایشی',
    gender: 'MALE',
    company: 'شرکت آزمایشی',
    mobile: '0912' + String(stamp).slice(-7),
    requestType: 'PRICE_INQUIRY',
    priority: 'HOT',
    notes: 'ثبت‌شده توسط آزمون خودکار',
    sendThankYou: true,
    preferredPlatform: 'WHATSAPP',
    marketingConsent: true,
    exhibitionId,
  };
  const visit = await employee.request('POST', '/api/visitors', visitPayload);
  assert(visit.status === 201, 'ثبت بازدیدکننده', visit.body);
  assert(visit.body?.data?.duplicate?.exists === false, 'بازدیدکننده جدید تشخیص داده شد');

  const duplicateVisit = await employee.request('POST', '/api/visitors', visitPayload);
  assert(duplicateVisit.status === 201, 'ثبت مجدد همان بازدیدکننده مجاز است', duplicateVisit.body);
  assert(duplicateVisit.body?.data?.duplicate?.exists === true, 'هشدار بازدیدکننده تکراری صادر شد');
  assert(
    duplicateVisit.body?.data?.visit?.id !== visit.body?.data?.visit?.id,
    'رکورد قبلی بازنویسی نشد (مراجعه جدید ثبت شد)',
  );

  const checkDuplicate = await employee.request(
    'GET',
    '/api/visitors/check-duplicate?mobile=' + encodeURIComponent(visitPayload.mobile),
  );
  assert(checkDuplicate.body?.data?.exists === true, 'بررسی تکراری از طریق API');

  const list = await employee.request('GET', '/api/visitors?page=1&pageSize=10');
  assert(list.status === 200 && list.body?.meta?.total >= 2, 'فهرست بازدیدکنندگان با صفحه‌بندی', list.body?.meta);

  const filtered = await employee.request('GET', '/api/visitors?priority=HOT&search=' + encodeURIComponent('0912'));
  assert(filtered.status === 200, 'فیلتر و جستجو', filtered.body?.meta);

  const visitId = visit.body?.data?.visit?.id;
  const prepared = await employee.request('POST', '/api/visitors/visits/' + visitId + '/messages/prepare', {
    templateKey: 'THANK_YOU',
    platform: 'WHATSAPP',
  });
  assert(prepared.status === 201 && prepared.body?.data?.log?.status === 'PREPARED', 'آماده‌سازی پیام', prepared.body);
  assert(
    typeof prepared.body?.data?.deepLink === 'string' &&
      prepared.body.data.deepLink.startsWith('https://wa.me/'),
    'لینک واتساپ ساخته شد',
  );
  const logId = prepared.body?.data?.log?.id;

  const opened = await employee.request(
    'POST',
    '/api/visitors/visits/' + visitId + '/messages/' + logId + '/opened',
  );
  assert(opened.body?.data?.status === 'OPENED', 'ثبت وضعیت «باز شد توسط کارمند»', opened.body);

  const confirmed = await employee.request(
    'POST',
    '/api/visitors/visits/' + visitId + '/messages/' + logId + '/confirm',
  );
  assert(confirmed.body?.data?.status === 'CONFIRMED_SENT', 'ثبت تأیید ارسال توسط کارمند', confirmed.body);

  const followUp = await employee.request('POST', '/api/visitors/visits/' + visitId + '/followups', {
    status: 'CONTACTED',
    note: 'تماس تلفنی انجام شد',
    nextFollowUpAt: '2026-11-15',
  });
  assert(followUp.status === 201 && followUp.body?.data?.status === 'CONTACTED', 'ثبت پیگیری', followUp.body);

  const patched = await employee.request('PATCH', '/api/visitors/visits/' + visitId, {
    followUpStatus: 'NEGOTIATION',
    priority: 'WARM',
  });
  assert(patched.body?.data?.followUpStatus === 'NEGOTIATION', 'به‌روزرسانی وضعیت پیگیری', patched.body);

  const visitorDetail = await admin.request('GET', '/api/visitors/' + visit.body?.data?.visit?.visitorId);
  assert(visitorDetail.status === 200 && visitorDetail.body?.data?.visits?.length >= 2, 'جزئیات بازدیدکننده با تاریخچه', visitorDetail.body?.data?.visits?.length);

  const summary = await admin.request('GET', '/api/reports/summary');
  assert(summary.status === 200 && summary.body?.data?.totalVisits >= 2, 'گزارش خلاصه', summary.body?.data?.totalVisits);

  const trend = await admin.request('GET', '/api/reports/trend?days=30');
  assert(trend.status === 200 && Array.isArray(trend.body?.data), 'گزارش روند روزانه');

  const templates = await admin.request('GET', '/api/templates');
  assert(templates.status === 200 && templates.body?.data?.length >= 5, 'خواندن قالب‌های پیام');

  const savedTemplate = await admin.request('POST', '/api/templates', {
    key: 'FOLLOW_UP',
    title: 'پیگیری آزمایشی',
    body: 'سلام {name} عزیز، پیگیری شما از {company} انجام شد. {catalog_url}',
    isActive: true,
  });
  assert(savedTemplate.status === 201, 'ذخیره قالب پیام', savedTemplate.body);

  const settings = await admin.request('PUT', '/api/settings', {
    companyName: 'امن‌آفرینان',
    catalogUrl: 'https://amnafarinan.ir/catalog.pdf',
    defaultPlatform: 'WHATSAPP',
  });
  assert(settings.status === 200, 'ذخیره تنظیمات شرکت', settings.body);

  const exportRes = await admin.request('GET', '/api/export/visitors.xlsx');
  const isXlsx =
    exportRes.status === 200 &&
    Buffer.isBuffer(exportRes.body) &&
    exportRes.body.length > 2000 &&
    exportRes.body.subarray(0, 2).toString() === 'PK';
  assert(isXlsx, 'خروجی اکسل معتبر (فایل xlsx)', {
    status: exportRes.status,
    bytes: Buffer.isBuffer(exportRes.body) ? exportRes.body.length : 0,
  });

  const auditLogs = await admin.request('GET', '/api/reports/audit-logs');
  assert(auditLogs.status === 200 && auditLogs.body?.data?.length > 0, 'ثبت لاگ حسابرسی');

  const employeeLogs = await employee.request('GET', '/api/reports/audit-logs');
  assert(employeeLogs.status === 403, 'کارمند به لاگ حسابرسی دسترسی ندارد');

  const logout = await employee.request('POST', '/api/auth/logout');
  assert(logout.status === 200, 'خروج از حساب');

  console.log('');
  if (failures === 0) {
    console.log('همه آزمون‌ها با موفقیت انجام شد.');
  } else {
    console.log(failures + ' آزمون ناموفق بود.');
  }
  process.exit(failures === 0 ? 0 : 1);
}

run().catch((error) => {
  console.error('اجرای آزمون با خطا مواجه شد:', error);
  process.exit(1);
});
