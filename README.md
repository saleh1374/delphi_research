# سامانه مدیریت پژوهش دلفی

## موضوع پژوهش
**بررسی عوامل مؤثر بر صادرات برق ایران با استفاده از نیروگاه‌های خورشیدی**

## قابلیت‌های سامانه

### بخش مدیریت (پنل مدیر)
- ثبت، ویرایش و حذف نخبگان
- انتخاب نخبه و ثبت پاسخ راند اول دلفی
- مشاهده و ویرایش پاسخ‌ها
- ثبت فعالیت‌های پیگیری
- مشاهده داشبورد آماری
- دریافت خروجی‌های CSV و JSON

### بخش پرسشنامه عمومی (برای نخبگان)
- فرم ساده و زیبا برای ثبت پاسخ
- قابل اجرا روی موبایل و دسکتاپ
- فهرست پیشنهادی عوامل مرجع
- امکان افزودن عوامل از فهرست مرجع

### ماژول تحلیل سلسله‌مراتبی AHP (مرحله دوم پژوهش)
- ساخت خودکار سلسله‌مراتب سه‌سطحی از روی داده‌های موجود:
  - سطح ۱ (هدف): اولویت‌بندی عوامل مؤثر بر توسعه صادرات برق ایران با تأکید بر نیروگاه‌های تجدیدپذیر (خورشیدی)
  - سطح ۲ (ابعاد): شش دسته موجود در `factor_bank.category`
  - سطح ۳ (عوامل): عوامل امتیازخورده راند دوم دلفی (۳۰ عامل)
- پرسشنامه مقایسه زوجی: ۱۵ مقایسه ابعاد + C(n,2) برای هر بُعد = **۷۹ مقایسه برای هر خبره**
- طیف کلاسیک ساتی ۱ تا ۹، مقایسه‌های متقارن (B/A خودکار ۱/۵ و قطری همیشه ۱)
- ذخیره خودکار و قابل ادامه، مشابه پرسشنامه دلفی (صفحه عمومی `/ahp-survey`)
- محاسبه خودکار: وزن میانگین هندسی سطرها، λmax، CI، CR با RIهای ساتی
- تجمیع نظر خبرگان با میانگین هندسی و گزارش CR ماتریس گروهی
- وزن نهایی = وزن بُعد × وزن محلی عامل + نمایش میانگین امتیاز دلفی راند ۲ برای مقایسه
- جداول نتایج، نمودار ستونی ۳۰ عامل و نمودار دایره‌ای ۶ بُعد
- خروجی JSON (با بلوک `ahp`) و Excel/CSV فارسی
- فهرست خبرگان شرکت‌کننده + دعوت و کپی لینک اختصاصی
- راهنمای یک‌صفحه‌ای خبره: `/ahp-guide`

## نحوه اجرا

### ۱. نصب پیش‌نیازها
```bash
cd backend
pip install -r requirements.txt
```

### ۲. اجرای سرور
```bash
cd backend
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### ۳. دسترسی
- **پنل مدیریت:** http://localhost:8000
- **پرسشنامه عمومی:** http://localhost:8000/survey

## ساختار پروژه
```
delphi_research/
├── backend/
│   ├── main.py              # سرور اصلی FastAPI
│   ├── database.py           # تنظیمات دیتابیس
│   ├── models.py             # مدل‌های SQLAlchemy
│   ├── schemas.py            # اسکیماهای Pydantic
│   ├── seed.py               # داده‌های اولیه عوامل مرجع
│   ├── ahp_core.py            # هسته محاسبات AHP (وزن‌ها، λmax، CI، CR)
│   ├── requirements.txt      # وابستگی‌ها
│   └── routers/
│       ├── experts.py        # API نخبگان
│       ├── responses.py      # API پاسخ‌ها
│       ├── activities.py     # API فعالیت‌ها
│       ├── factor_bank.py    # API بانک عوامل
│       ├── ahp.py            # API ماژول AHP
│       └── exports.py        # API خروجی‌ها
├── frontend/
│   ├── index.html            # صفحه اصلی مدیریت
│   ├── survey.html           # فرم پرسشنامه عمومی
│   ├── ahp_survey.html       # پرسشنامه عمومی AHP
│   ├── ahp_guide.html        # راهنمای یک‌صفحه‌ای خبره
│   ├── css/
│   │   ├── style.css         # استایل‌های CSS
│   │   └── ahp.css           # استایل ماژول AHP
│   └── js/
│       ├── api.js            # ابزارهای ارتباطی
│       ├── app.js            # کنترلر اصلی
│       ├── experts.js        # مدیریت نخبگان
│       ├── responses.js      # مدیریت پاسخ‌ها
│       ├── activities.js     # مدیریت فعالیت‌ها
│       ├── factorbank.js     # مدیریت بانک عوامل
│       ├── ahp_common.js     # اجزای مشترک پرسشنامه AHP
│       ├── ahp.js            # ماژول AHP در پنل مدیر
│       └── exports.js        # خروجی‌گیری
└── README.md
```

## APIها

### نخبگان
- `POST /api/experts` - ایجاد نخبه
- `GET /api/experts` - لیست نخبگان
- `GET /api/experts/{id}` - جزئیات نخبه
- `PUT /api/experts/{id}` - ویرایش نخبه
- `DELETE /api/experts/{id}` - حذف نخبه

### پاسخ‌ها
- `POST /api/responses` - ایجاد پاسخ
- `GET /api/responses` - لیست پاسخ‌ها
- `GET /api/responses/{id}` - جزئیات پاسخ
- `GET /api/responses/expert/{id}/latest` - آخرین پاسخ نخبه
- `PUT /api/responses/{id}` - ویرایش پاسخ
- `DELETE /api/responses/{id}` - حذف پاسخ

### فعالیت‌ها
- `POST /api/activities` - ایجاد فعالیت
- `GET /api/activities` - لیست فعالیت‌ها
- `PUT /api/activities/{id}` - ویرایش فعالیت
- `DELETE /api/activities/{id}` - حذف فعالیت

### بانک عوامل
- `GET /api/factor-bank` - لیست عوامل
- `GET /api/factor-bank/categories` - دسته‌بندی‌ها
- `GET /api/factor-bank/search?q=` - جست‌وجو
- `POST /api/factor-bank` - ایجاد عامل
- `PUT /api/factor-bank/{id}` - ویرایش عامل
- `DELETE /api/factor-bank/{id}` - حذف عامل

### خروجی‌ها
- `GET /api/export/experts.csv`
- `GET /api/export/responses.csv`
- `GET /api/export/activities.csv`
- `GET /api/export/combined.csv`
- `GET /api/export/unique-factors.csv`
- `GET /api/export/backup.json`

### ماژول AHP
- `GET /api/ahp/hierarchy` - سلسله‌مراتب سه‌سطحی + تعداد مقایسه‌ها
- `GET /api/ahp/questionnaire?expert_id=` - پرسشنامه مقایسه زوجی + پاسخ‌های ذخیره‌شده
- `POST /api/ahp/comparisons` - ذخیره خودکار مقایسه‌ها
- `DELETE /api/ahp/comparisons` - پاک‌سازی مقایسه‌های یک خبره/ماتریس
- `GET /api/ahp/results` - نتایج گروهی (وزن‌ها، رتبه‌ها، سازگاری)
- `GET /api/ahp/my-result?expert_id=` - نتیجه فردی خبره (صفحه عمومی)
- `GET /api/ahp/experts` - فهرست خبرگان و پیشرفت آن‌ها
- `GET /api/ahp/export.json` / `GET /api/ahp/export.csv` - خروجی‌ها
- `GET /api/ahp/guide.json` - داده راهنمای خبره

## ویژگی‌ها
- رابط کاربری فارسی راست‌چین (RTL)
- طراحی واکنش‌گرا (Responsive) مناسب موبایل و دسکتاپ
- حالت روشن و تیره
- خروجی CSV با رمزگذاری UTF-8 BOM سازگار با Excel
- بانک عوامل مرجع با ۳۱ عامل در ۶ دسته‌بندی
- دیتابیس SQLite با قابلیت مهاجرت به PostgreSQL
