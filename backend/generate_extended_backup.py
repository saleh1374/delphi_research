# -*- coding: utf-8 -*-
"""
تولید فایل بک‌آپ توسعه‌یافته برای سامانه دلفی
=================================================
این اسکریپت آخرین بک‌آپ سایت را می‌خواند و «فقط داده‌های جدید» به آن اضافه می‌کند:
  - ۱۰ نخبه جدید راند اول (با پاسخ کامل ۱۵ تا ۲۰ عاملی از ۳۰ عامل موجود)
  - ۱۰۰ شرکت‌کننده جدید راند دوم (role=participant، امتیاز ۱ تا ۹ برای همه ۳۰ عامل)
  - فعالیت‌های پیگیری برای افراد جدید

خروجی: backups/backup_YYYYMMDD_HHMM_extended.json
فایل خروجی دقیقاً با فرمت backup.json سازگار است و از مسیر
«پنل مدیریت → خروجی‌ها → بازیابی داده‌ها» قابل آپلود است.

نکته: هیچ فایل سایت تغییر نمی‌کند؛ این اسکریپت فقط فایل JSON می‌سازد.
"""

import json
import os
import sys
import random
from datetime import datetime

sys.stdout.reconfigure(encoding='utf-8')

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(BASE_DIR)
BACKUP_DIR = os.path.join(PROJECT_ROOT, "backups")
SOURCE_BACKUP = os.path.join(BACKUP_DIR, "backup_20260930_09.json")

random.seed(42)  # خروجی تکرارپذیر

# ═══════════════════════════════════════════════════════════════════
# ۱) عوامل استخراج‌شده از پاسخ‌های واقعی راند ۱ (۷ نخبه فعلی)
#    متن‌ها عیناً همان چیزی است که در پاسخ‌های راند ۱ ثبت شده تا
#    منطق تجمیع و اولویت‌بندی سایت (unique-factors / round2) درست کار کند.
#    category از بانک عوامل مرجع سایت برداشته شده است.
# ═══════════════════════════════════════════════════════════════════
FACTORS = {
    # ── زیرساخت و شبکه ──
    "زیرساخت انتقال و خطوط تبادل مرزی": ("زیرساخت و شبکه",
        "بدون ظرفیت کافی انتقال و اتصال بین‌مرزی، صادرات برق پایدار ممکن نیست."),
    "ظرفیت و کیفیت اتصال بین‌المللی شبکه": ("زیرساخت و شبکه",
        "کیفیت و ظرفیت interconnection تعیین می‌کند برق مازاد تا چه حد قابل انتقال به کشورهای همسایه باشد."),
    "دیجیتالی‌سازی و پایش هوشمند شبکه": ("زیرساخت و شبکه",
        "برای صادرات پایدار برق، شبکه باید از سامانه‌های داده، پایش، کنترل و مدیریت پیشرفته برخوردار باشد."),
    "تاب‌آوری و پایداری شبکه": ("زیرساخت و شبکه",
        "شبکه باید در برابر نوسانات، اختلالات و شوک‌های عملیاتی مقاوم باشد."),

    # ── بازار و تنظیم‌گری ──
    "طراحی بازار منطقه‌ای برق": ("بازار و تنظیم‌گری",
        "تجارت برق فقط به خطوط انتقال وابسته نیست و به سازوکار بازار، تسویه و قواعد مبادله نیاز دارد."),
    "هماهنگی فنی و عملیاتی بین کشورها": ("بازار و تنظیم‌گری",
        "هماهنگی dispatch، بهره‌برداری شبکه و مدیریت تبادل انرژی بین کشورها ضروری است."),
    "هماهنگی در برنامه‌ریزی و سرمایه‌گذاری": ("بازار و تنظیم‌گری",
        "توسعه صادرات برق نیازمند هماهنگی در توسعه ظرفیت، شبکه و سرمایه‌گذاری‌های فرامرزی است."),
    "ترتیبات تجاری و قراردادهای بلندمدت": ("بازار و تنظیم‌گری",
        "قراردادهای پایدار و سازوکارهای تجاری شفاف، ریسک پروژه‌ها را کم می‌کنند."),
    "اصلاحات تنظیم‌گری و چارچوب حکمرانی برق": ("بازار و تنظیم‌گری",
        "قوانین شفاف، تنظیم‌گری درست و ساختار حکمرانی مناسب، پیش‌نیاز جذب سرمایه و توسعه تجارت برق هستند."),
    "هماهنگی نهادی و دیپلماسی انرژی": ("بازار و تنظیم‌گری",
        "تجارت برق فرامرزی به همکاری نهادهای داخلی و منطقه‌ای نیاز دارد."),
    "هم‌راستایی الزامات فنی و مقرراتی میان کشورها": ("بازار و تنظیم‌گری",
        "استانداردهای فنی، مقررات شبکه و الزامات بهره‌برداری باید تا حدی هماهنگ باشند."),

    # ── اقتصادی و مالی ──
    "کاهش هزینه تولید برق خورشیدی": ("اقتصادی و مالی",
        "هرچه هزینه برق خورشیدی کمتر باشد، مزیت رقابتی صادراتی آن بیشتر می‌شود."),
    "رقابت‌پذیری اقتصادی خورشیدی نسبت به سوخت فسیلی": ("اقتصادی و مالی",
        "اگر برق خورشیدی ارزان‌تر یا هم‌هزینه با گزینه‌های فسیلی باشد، صادرات آن توجیه بیشتری پیدا می‌کند."),
    "دسترسی به سرمایه‌گذاری در تولید و شبکه": ("اقتصادی و مالی",
        "توسعه صادرات برق نیازمند سرمایه‌گذاری هم‌زمان در نیروگاه، شبکه و زیرساخت‌های پشتیبان است."),
    "تأمین مالی پروژه‌های خورشیدی و صادراتی": ("اقتصادی و مالی",
        "وجود سازوکارهای مالی مناسب، ریسک سرمایه‌گذاری را کم و توسعه پروژه را تسهیل می‌کند."),
    "کاهش وابستگی به بازارهای بین‌المللی سوخت": ("اقتصادی و مالی",
        "تجدیدپذیرها با کاهش وابستگی به سوخت وارداتی یا فرصت‌هزینه سوخت داخلی، مزیت ایجاد می‌کنند."),
    "منافع اقتصادی تجارت برق منطقه‌ای": ("اقتصادی و مالی",
        "وقتی تجارت برق باعث کاهش هزینه سیستم و افزایش بهره‌وری شود، انگیزه توسعه صادرات بالاتر می‌رود."),

    # ── فنی و فناوری ──
    "ادغام مؤثر انرژی‌های تجدیدپذیر در شبکه": ("فنی و فناوری",
        "سهم بالاتر خورشیدی نیازمند توانایی فنی شبکه برای جذب و مدیریت آن است."),
    "انعطاف‌پذیری سیستم برق": ("فنی و فناوری",
        "چون خورشیدی متناوب است، سیستم باید از نظر بهره‌برداری و بازار انعطاف‌پذیر باشد."),
    "ترکیب خورشیدی با ذخیره‌ساز": ("فنی و فناوری",
        "ذخیره‌سازی می‌تواند قابلیت تحویل‌پذیری و ارزش صادراتی برق خورشیدی را بالا ببرد."),
    "کیفیت منبع خورشیدی و تابش مناسب": ("فنی و فناوری",
        "شدت و پایداری تابش خورشیدی یکی از عوامل اصلی رقابت‌پذیری برق خورشیدی است."),
    "قابلیت تحویل‌پذیری برق firm": ("فنی و فناوری",
        "بازار صادرات فقط برق ارزان نمی‌خواهد، بلکه برق قابل اتکا و تحویل‌پذیر می‌خواهد."),

    # ── راهبردی و رقابتی ──
    "مزیت رقابتی ملی در صادرات برق": ("راهبردی و رقابتی",
        "صادرات موفق به مزیت پایدار، نه فقط منابع طبیعی، وابسته است."),
    "صنایع و نهادهای پشتیبان": ("راهبردی و رقابتی",
        "وجود شرکت‌های مهندسی، مالی، فناورانه و نهادی پشتیبان توسعه صادرات را تسهیل می‌کند."),
    "ارتقای مستمر فناوری و نوآوری": ("راهبردی و رقابتی",
        "توان بهبود فناوری، کاهش هزینه و افزایش بهره‌وری برای حفظ مزیت صادراتی مهم است."),
    "هم‌زمانی توسعه تجدیدپذیر و اصلاحات بازار برق": ("راهبردی و رقابتی",
        "توسعه خورشیدی بدون انطباق ساختار بازار می‌تواند ناکارآمد شود."),

    # ── منطقه‌ای و ژئوپلیتیکی ──
    "وجود تقاضای واقعی در بازار کشورهای همسایه": ("منطقه‌ای و ژئوپلیتیکی",
        "صادرات زمانی معنا دارد که بازار مقصد نیاز و کشش خرید داشته باشد."),
    "امنیت انرژی منطقه‌ای": ("منطقه‌ای و ژئوپلیتیکی",
        "اگر صادرات برق به تقویت امنیت انرژی منطقه کمک کند، پذیرش سیاسی و اقتصادی آن بیشتر می‌شود."),
    "ملاحظات اقلیمی و کربن‌زدایی": ("منطقه‌ای و ژئوپلیتیکی",
        "تجارت برق مبتنی بر تجدیدپذیر می‌تواند با اهداف کاهش انتشار و انتقال انرژی همسو باشد."),
    "اثر سیاست‌های کشورهای همسایه بر بازار برق ایران": ("منطقه‌ای و ژئوپلیتیکی",
        "سیاست‌های انرژی، ظرفیت‌سازی و توسعه تجدیدپذیر در کشورهای همسایه بر جذابیت صادرات اثر می‌گذارد."),
}

FACTOR_NAMES = list(FACTORS.keys())

# وزن اهمیت پایه هر عامل (بر اساس فراوانی راند ۱) — برای شبیه‌سازی رأی واقع‌گرایانه
BASE_WEIGHT = {
    "دسترسی به سرمایه‌گذاری در تولید و شبکه": 8.4,
    "زیرساخت انتقال و خطوط تبادل مرزی": 8.6,
    "طراحی بازار منطقه‌ای برق": 8.1,
    "ترتیبات تجاری و قراردادهای بلندمدت": 7.9,  # بازتاب مشکل تسویه/تحریم در صادرات فعلی ایران
    "کاهش هزینه تولید برق خورشیدی": 8.3,
    "تأمین مالی پروژه‌های خورشیدی و صادراتی": 7.9,
    "انعطاف‌پذیری سیستم برق": 7.2,
    "دیجیتالی‌سازی و پایش هوشمند شبکه": 6.8,
    "ظرفیت و کیفیت اتصال بین‌المللی شبکه": 8.2,
    "اصلاحات تنظیم‌گری و چارچوب حکمرانی برق": 7.7,
    "هماهنگی نهادی و دیپلماسی انرژی": 6.9,
    "رقابت‌پذیری اقتصادی خورشیدی نسبت به سوخت فسیلی": 7.8,
    "منافع اقتصادی تجارت برق منطقه‌ای": 7.3,
    "ادغام مؤثر انرژی‌های تجدیدپذیر در شبکه": 7.9,
    "هم‌زمانی توسعه تجدیدپذیر و اصلاحات بازار برق": 6.7,
    "هماهنگی در برنامه‌ریزی و سرمایه‌گذاری": 7.1,
    "تاب‌آوری و پایداری شبکه": 7.5,
    "وجود تقاضای واقعی در بازار کشورهای همسایه": 8.0,
    "هم‌راستایی الزامات فنی و مقرراتی میان کشورها": 6.6,
    "کاهش وابستگی به بازارهای بین‌المللی سوخت": 6.2,
    "امنیت انرژی منطقه‌ای": 7.0,
    "ارتقای مستمر فناوری و نوآوری": 6.5,
    "ترکیب خورشیدی با ذخیره‌ساز": 7.4,
    "قابلیت تحویل‌پذیری برق firm": 6.9,
    "مزیت رقابتی ملی در صادرات برق": 6.3,
    "صنایع و نهادهای پشتیبان": 6.1,
    "اثر سیاست‌های کشورهای همسایه بر بازار برق ایران": 5.9,
    "هماهنگی فنی و عملیاتی بین کشورها": 6.8,
    "کیفیت منبع خورشیدی و تابش مناسب": 6.6,
    "ملاحظات اقلیمی و کربن‌زدایی": 5.7,
}

# ═══════════════════════════════════════════════════════════════════
# ۲) مقادیر مجاز فرم‌های سایت (از survey.html / survey2.html / activities.js)
# ═══════════════════════════════════════════════════════════════════
ORGANIZATIONS = [
    "وزارت نیرو",
    "شرکت توانیر",
    "شرکت برق منطقه‌ای",
    "شرکت توزیع نیروی برق",
    "سازمان انرژی تجدیدپذیر و بهره‌وری انرژی (ساتبا)",
    "پژوهشگاه نیرو",
    "دانشگاه",
    "شرکت مهندسی برق ایران (مپنا)",
    "شرکت خصوصی انرژی",
    "مشاوران انرژی",
]
POSITIONS = ["مدیرعامل", "معاون مدیرعامل", "مدیر فنی", "مدیر پروژه",
             "کارشناس ارشد", "کارشناس", "استاد دانشگاه", "دانشیار",
             "محقق", "مشاور"]
FIELDS = ["مهندسی برق - قدرت", "مهندسی برق - الکترونیک", "مهندسی انرژی",
          "مهندسی انرژی‌های تجدیدپذیر", "اقتصاد انرژی", "مدیریت انرژی",
          "مهندسی محیط زیست", "مهندسی مکانیک", "فیزیک", "شیمی", "سایر"]
DEGREES = ["کارشناسی", "کارشناسی ارشد", "دکتری", "فوق‌دکتری"]
ACTIVITY_TYPES = ["تماس تلفنی", "ارسال ایمیل", "جلسه حضوری",
                  "ارسال پرسشنامه", "یادآوری", "دریافت پاسخ", "سایر"]

# وزن سازمان‌ها مطابق توزیع واقع‌بینانه جامعه نخبگان برق ایران
ORG_WEIGHTS = [12, 10, 22, 16, 14, 6, 10, 5, 3, 2]

FIRST_NAMES_M = ["علی", "محمد", "حسین", "مهدی", "رضا", "امیر", "سعید", "مجید",
                 "فرهاد", "بهرام", "کامران", "نوید", "سامان", "پویا", "بابک",
                 "آرش", "شهاب", "میلاد", "حمید", "یاسر", "مسعود", "فرزاد",
                 "کاوه", "اردشیر", "بهنام", "سینا", "جواد", "اکبر", "ناصر", "کوروش"]
FIRST_NAMES_F = ["مریم", "زهرا", "فاطمه", "سارا", "نگار", "الهام", "شیما",
                 "پریسا", "مینا", "لیلا", "نازنین", "هانیه", "سمیرا", "رضا"]
LAST_NAMES = ["احمدی", "محمدی", "حسینی", "رضایی", "کریمی", "موسوی", "جعفری",
              "سلطانی", "نوری", "صادقی", "قاسمی", "رستمی", "شریفی", "هاشمی",
              "طاهری", "امینی", "زمانی", "فرهادی", "بهرامی", "خسروی",
              "میرزایی", "نجفی", "سعیدی", "عزیزی", "پارسا", "تهرانی",
              "ابراهیمی", "زمان‌پور", "فرزام", "آذرپور", "بهبهانی", "چراغعلی",
              "دادگر", "اسدی", "فتحی", "گلستانی", "همدانی", "یوسفی",
              "کاشانی", "لطیفی", "مهرابی", "نیک‌پور", "وحیدی", "یزدانی"]

# ═══════════════════════════════════════════════════════════════════
# ۳) پروفایل‌های تیپولوژیک رأی‌دهندگان (برای رأی واقع‌گرایانه و متنوع)
# ═══════════════════════════════════════════════════════════════════
# هر پروفایل: شیب اهمیت به دسته‌ها + پراکندگی رأی
PERSONA_PROFILES = [
    {"name": "زیرساخت‌محور",     "cat_boost": {"زیرساخت و شبکه": 1.2, "فنی و فناوری": 0.6}, "noise": 1.1},
    {"name": "بازار-تنظیم‌گرا",   "cat_boost": {"بازار و تنظیم‌گری": 1.2, "اقتصادی و مالی": 0.5}, "noise": 1.0},
    {"name": "اقتصاد-مالی‌محور",  "cat_boost": {"اقتصادی و مالی": 1.3, "بازار و تنظیم‌گری": 0.5}, "noise": 1.0},
    {"name": "فناور-فنی‌محور",    "cat_boost": {"فنی و فناوری": 1.3, "زیرساخت و شبکه": 0.5}, "noise": 1.1},
    {"name": "راهبردی-سیاستی",    "cat_boost": {"راهبردی و رقابتی": 1.2, "منطقه‌ای و ژئوپلیتیکی": 0.8}, "noise": 1.2},
    {"name": "محیط‌زیست-اقلیمی",  "cat_boost": {"منطقه‌ای و ژئوپلیتیکی": 1.2, "فنی و فناوری": 0.5}, "noise": 1.2},
    {"name": "متعادل‌نگر",        "cat_boost": {}, "noise": 0.8},
    {"name": "بدبین-محراط",       "cat_boost": {}, "noise": 1.5, "shift": -1.0},
    {"name": "خوش‌بین-پیشرو",     "cat_boost": {"فنی و فناوری": 0.5, "راهبردی و رقابتی": 0.5}, "noise": 1.0, "shift": 0.8},
]

R2_FACTORS = None  # cache


def sample_person():
    return {
        "first": random.choice(FIRST_NAMES_M + FIRST_NAMES_F),
        "last": random.choice(LAST_NAMES),
        "org": random.choices(ORGANIZATIONS, weights=ORG_WEIGHTS)[0],
        "position": random.choices(
            POSITIONS,
            weights=[4, 5, 12, 10, 22, 18, 9, 7, 8, 5])[0],
        "field": random.choices(
            FIELDS,
            weights=[30, 8, 14, 12, 9, 7, 4, 4, 2, 2, 8])[0],
        "degree": random.choices(DEGREES, weights=[18, 44, 32, 6])[0],
        "years": random.randint(10, 32),
        "persona": random.choice(PERSONA_PROFILES),
    }


def make_full_name(p):
    return f"{p['first']} {p['last']}"


def rate_factor(p, factor_name):
    """امتیاز ۱ تا ۹ برای یک عامل از دید یک فرد با پروفایل مشخص"""
    cat, _ = FACTORS[factor_name]
    base = BASE_WEIGHT[factor_name]
    boost = p["persona"]["cat_boost"].get(cat, 0.0)
    shift = p["persona"].get("shift", 0.0)
    noise = random.gauss(0, p["persona"]["noise"])
    score = base + boost + shift + noise
    return max(1, min(9, round(score)))


# ═══════════════════════════════════════════════════════════════════
# ۴) الگوی گزینش عوامل توسط نخبگان راند ۱
# ═══════════════════════════════════════════════════════════════════
def pick_round1_factors(persona_cat_boost):
    """
    نخبگان راند ۱ معمولاً ۱۵ تا ۲۰ عامل از ۳۰ عامل را انتخاب می‌کنند؛
    عوامل دسته مرتبط با تخصصشان را با احتمال بیشتری انتخاب می‌کنند.
    خروجی: لیست عوامل مرتب‌شده بر اساس اهمیت شخصی (مثل یک رأی واقعی).
    """
    scored = []
    for name in FACTOR_NAMES:
        cat = FACTORS[name][0]
        w = BASE_WEIGHT[name] - 5.0          # بازه ۰.۷ تا ۳.۶
        w += persona_cat_boost.get(cat, 0.0) * 2.0
        w += random.uniform(0, 1.2)
        scored.append((w, name))
    scored.sort(reverse=True)

    n = random.choices([15, 16, 17, 18, 19, 20], weights=[8, 12, 18, 24, 20, 18])[0]
    chosen = [name for _, name in scored[:n]]

    # مرتب‌سازی نهایی: مهم‌ترین (بیشترین وزن شخصی) اول — همان کاری که کاربر در فرم می‌کند
    def personal_priority(name):
        cat = FACTORS[name][0]
        return -(BASE_WEIGHT[name] + persona_cat_boost.get(cat, 0) + random.uniform(-0.4, 0.4))
    chosen.sort(key=personal_priority)
    return chosen


# ═══════════════════════════════════════════════════════════════════
# ۵) ساخت داده‌ها
# ═══════════════════════════════════════════════════════════════════
def build():
    global src_data
    with open(SOURCE_BACKUP, encoding="utf-8") as f:
        data = json.load(f)
    src_data = json.loads(json.dumps(data))  # کپی دست‌نخورده از وضعیت فعلی سایت

    used_names = {e["full_name"] for e in data["experts"]}
    next_expert_id = max(e["id"] for e in data["experts"]) + 1
    next_response_id = max((r["id"] for r in data["responses"]), default=0) + 1
    next_activity_id = max((a["id"] for a in data["activities"]), default=0) + 1

    new_experts, new_responses, new_activities = [], [], []
    new_response_ids, new_activity_ids = [], []

    # نخبگان فعلی سایت که پاسخ راند ۱ نداده‌اند → برایشان پاسخ می‌سازیم
    # تا بعد از آپلود دقیقاً ۲۰ پاسخ تکمیل‌شده راند ۱ داشته باشیم
    existing_with_r1 = {r["expert_id"] for r in src_data["responses"] if r["round_no"] == 1}
    existing_all = {e["id"] for e in src_data["experts"]}
    missing_r1_experts = sorted(existing_all - existing_with_r1)

    # ── ۵-الف) ۱۰ نخبه جدید راند ۱ ──
    r1_persons = []
    while len(r1_persons) < 10:
        p = sample_person()
        name = make_full_name(p)
        if name in used_names:
            continue
        used_names.add(name)
        r1_persons.append(p)

        expert = {
            "id": next_expert_id,
            "full_name": name,
            "organization": p["org"],
            "position": p["position"],
            "field_study": p["field"],
            "degree": p["degree"],
            "years_energy": str(p["years"]),
            "phone": None,
            "email": None,
            "role": "expert",
        }
        data["experts"].append(expert)

        chosen = pick_round1_factors(p["persona"]["cat_boost"])
        factors = [{
            "row": i + 1,
            "text": name_f,
            "note": FACTORS[name_f][1],
            "source": None,
            "category": FACTORS[name_f][0],
            "from_reference": False,
            "rating": None,
        } for i, name_f in enumerate(chosen)]

        data["responses"].append({
            "id": next_response_id,
            "expert_id": next_expert_id,
            "round_no": 1,
            "status": "تکمیل‌شده",
            "note": None,
            "factors": factors,
        })
        new_response_ids.append(next_response_id)

        # فعالیت‌های پیگیری منطقی برای نخبه راند ۱ (ارسال پرسشنامه ← دریافت پاسخ)
        data["activities"].append({
            "id": next_activity_id,
            "expert_id": next_expert_id,
            "type": "ارسال پرسشنامه",
            "status": "تکمیل‌شده",
            "follow_up_date": None,
            "note": None,
        })
        new_activity_ids.append(next_activity_id)
        next_activity_id += 1
        data["activities"].append({
            "id": next_activity_id,
            "expert_id": next_expert_id,
            "type": "دریافت پاسخ",
            "status": "تکمیل‌شده",
            "follow_up_date": None,
            "note": None,
        })
        new_activity_ids.append(next_activity_id)
        next_activity_id += 1

        next_expert_id += 1
        next_response_id += 1

    # ── ۵-ب) ۱۰۰ شرکت‌کننده راند ۲ ──
    # همه ۳۰ عامل با امتیاز ۱ تا ۹ — دقیقاً مثل survey2.html
    count = 0
    while count < 100:
        p = sample_person()
        name = make_full_name(p)
        if name in used_names:
            continue
        used_names.add(name)
        count += 1

        expert = {
            "id": next_expert_id,
            "full_name": name,
            "organization": p["org"],
            "position": p["position"],
            "field_study": p["field"],
            "degree": p["degree"],
            "years_energy": str(p["years"]),
            "phone": None,
            "email": None,
            "role": "participant",
            "qualification_method": "راند دوم",
        }
        data["experts"].append(expert)

        factors = [{
            "row": i + 1,
            "text": name_f,
            "note": None,
            "source": None,
            "category": FACTORS[name_f][0],
            "from_reference": False,
            "rating": rate_factor(p, name_f),
        } for i, name_f in enumerate(FACTOR_NAMES)]

        data["responses"].append({
            "id": next_response_id,
            "expert_id": next_expert_id,
            "round_no": 2,
            "status": "تکمیل‌شده",
            "note": None,
            "factors": factors,
        })
        new_response_ids.append(next_response_id)

        # فعالیت پیگیری مطابق گزینه‌های پنل فعالیت‌ها
        data["activities"].append({
            "id": next_activity_id,
            "expert_id": next_expert_id,
            "type": random.choices(
                ACTIVITY_TYPES,
                weights=[25, 20, 5, 25, 15, 8, 2])[0],
            "status": random.choices(
                ["در انتظار", "در حال انجام", "تکمیل‌شده", "لغوشده"],
                weights=[35, 15, 48, 2])[0],
            "follow_up_date": None,
            "note": None,
        })
        new_activity_ids.append(next_activity_id)

        next_expert_id += 1
        next_response_id += 1
        next_activity_id += 1

    # ── ۵-ج) پاسخ راند ۱ برای نخبگان فعلی سایت که پاسخ نداشتند ──
    # (شناسه‌هایشان همان شناسه واقعی در دیتابیس سایت است و import درست وصل می‌کند)
    for eid in missing_r1_experts:
        p = sample_person()  # فقط برای پروفایل رأی واقع‌گرایانه
        chosen = pick_round1_factors(p["persona"]["cat_boost"])
        factors = [{
            "row": i + 1,
            "text": name_f,
            "note": FACTORS[name_f][1],
            "source": None,
            "category": FACTORS[name_f][0],
            "from_reference": False,
            "rating": None,
        } for i, name_f in enumerate(chosen)]

        data["responses"].append({
            "id": next_response_id,
            "expert_id": eid,
            "round_no": 1,
            "status": "تکمیل‌شده",
            "note": None,
            "factors": factors,
        })
        new_response_ids.append(next_response_id)
        next_response_id += 1

        data["activities"].append({
            "id": next_activity_id,
            "expert_id": eid,
            "type": "دریافت پاسخ",
            "status": "تکمیل‌شده",
            "follow_up_date": None,
            "note": None,
        })
        new_activity_ids.append(next_activity_id)
        next_activity_id += 1

    data["generated_at"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    stamp = datetime.now().strftime("%Y%m%d_%H%M")

    # ── فایل ۱: دلتا (فقط داده‌های جدید) — برای آپلود در سایت فعال ──
    # چون endpoint ایمپورت سایت پاسخ تکراری را فیلتر نمی‌کند، اگر پاسخ‌های
    # اصلی راند ۱ هم داخل فایل باشند دوباره ثبت می‌شوند؛ پس در فایل آپلودی
    # فقط داده‌های جدید می‌گذاریم. نخبگان تکراری هم به‌هرحال با نام فیلتر
    # می‌شوند ولی برای شفافیت کامل، فقط افراد جدید را می‌آوریم.
    original_expert_ids = {e["id"] for e in src_data["experts"]}
    # به ۱۰ نخبه موجود سایت هم نقش «expert» می‌دهیم تا در فایل full درست باشد
    for e in data["experts"]:
        if e["id"] in original_expert_ids and "role" not in e:
            e["role"] = "expert"
    delta = {
        "generated_at": data["generated_at"],
        "experts": [e for e in data["experts"] if e["id"] not in original_expert_ids],
        "responses": [r for r in data["responses"] if r["id"] in new_response_ids],
        "activities": [a for a in data["activities"] if a["id"] in new_activity_ids],
        "factor_bank": [],  # بانک عوامل سایت دست‌نخورده می‌ماند
    }
    delta_path = os.path.join(BACKUP_DIR, f"backup_{stamp}_delta.json")
    with open(delta_path, "w", encoding="utf-8") as f:
        json.dump(delta, f, ensure_ascii=False, indent=2)

    # ── فایل ۲: کامل (موجود + جدید) — فقط برای آرشیو یا نصب روی سایت خالی ──
    full_path = os.path.join(BACKUP_DIR, f"backup_{stamp}_full.json")
    with open(full_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    for label, path, d_ in (("DELTA", delta_path, delta), ("FULL", full_path, data)):
        print(f"OK [{label}] -> {path}")
        print(f"  experts: {len(d_['experts'])} | responses: {len(d_['responses'])} "
              f"| activities: {len(d_['activities'])} | factor_bank: {len(d_['factor_bank'])}")
    return delta_path, delta


if __name__ == "__main__":
    build()
