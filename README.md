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
│   ├── requirements.txt      # وابستگی‌ها
│   └── routers/
│       ├── experts.py        # API نخبگان
│       ├── responses.py      # API پاسخ‌ها
│       ├── activities.py     # API فعالیت‌ها
│       ├── factor_bank.py    # API بانک عوامل
│       └── exports.py        # API خروجی‌ها
├── frontend/
│   ├── index.html            # صفحه اصلی مدیریت
│   ├── survey.html           # فرم پرسشنامه عمومی
│   ├── css/
│   │   └── style.css         # استایل‌های CSS
│   └── js/
│       ├── api.js            # ابزارهای ارتباطی
│       ├── app.js            # کنترلر اصلی
│       ├── experts.js        # مدیریت نخبگان
│       ├── responses.js      # مدیریت پاسخ‌ها
│       ├── activities.js     # مدیریت فعالیت‌ها
│       ├── factorbank.js     # مدیریت بانک عوامل
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

## ویژگی‌ها
- رابط کاربری فارسی راست‌چین (RTL)
- طراحی واکنش‌گرا (Responsive) مناسب موبایل و دسکتاپ
- حالت روشن و تیره
- خروجی CSV با رمزگذاری UTF-8 BOM سازگار با Excel
- بانک عوامل مرجع با ۳۱ عامل در ۶ دسته‌بندی
- دیتابیس SQLite با قابلیت مهاجرت به PostgreSQL
