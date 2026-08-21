from models import FactorBank

FACTOR_BANK_SEED = [
    {
        "title": "زیرساخت انتقال و خطوط تبادل مرزی",
        "category": "زیرساخت و شبکه",
        "short_description": "بدون ظرفیت کافی انتقال و اتصال بین‌مرزی، صادرات برق پایدار ممکن نیست.",
        "why_important": "در مطالعات بانک جهانی درباره تجارت برق منطقه‌ای، زیرساخت interconnection یکی از پایه‌های اصلی ادغام بازار معرفی شده است.",
        "context_note": "تجارت برق منطقه‌ای",
        "source_label": "World Bank, Beyond Borders / Regional Power Integration",
        "source_ref": "World Bank [web:59][web:62]",
        "tags": "زیرساخت, انتقال, مرزی, interconnection"
    },
    {
        "title": "ظرفیت و کیفیت اتصال بین‌المللی شبکه",
        "category": "زیرساخت و شبکه",
        "short_description": "کیفیت و ظرفیت interconnection تعیین می‌کند برق مازاد تا چه حد قابل انتقال به کشورهای همسایه باشد.",
        "why_important": "در ادبیات تجارت برق منطقه‌ای، capacity و connectivity از شروط کلیدی تجارت برق هستند.",
        "context_note": "ادبیات تجارت برق منطقه‌ای",
        "source_label": "World Bank / ESMAP connectivity frameworks",
        "source_ref": "World Bank [web:61][web:62]",
        "tags": "اتصال, شبکه, بین‌المللی, capacity"
    },
    {
        "title": "دیجیتالی‌سازی و پایش هوشمند شبکه",
        "category": "زیرساخت و شبکه",
        "short_description": "برای صادرات پایدار برق، شبکه باید از سامانه‌های داده، پایش، کنترل و مدیریت پیشرفته برخوردار باشد.",
        "why_important": "در برنامه‌های جدید اتصال منطقه‌ای، ابزارهای دیجیتال برای قابلیت اطمینان شبکه مهم شناخته شده‌اند.",
        "context_note": "برنامه‌های اتصال منطقه‌ای",
        "source_label": "World Bank regional electricity integration logic",
        "source_ref": "World Bank [web:62]",
        "tags": "دیجیتال, پایش, هوشمند, SCADA"
    },
    {
        "title": "تاب‌آوری و پایداری شبکه",
        "category": "زیرساخت و شبکه",
        "short_description": "شبکه باید در برابر نوسانات، اختلالات و شوک‌های عملیاتی مقاوم باشد.",
        "why_important": "تجارت برق منطقه‌ای زمانی موفق است که شبکه قابلیت اتکای کافی داشته باشد.",
        "context_note": "امنیت انرژی منطقه‌ای",
        "source_label": "World Bank / regional power security framing",
        "source_ref": "World Bank [web:59][web:62]",
        "tags": "تاب‌آوری, پایداری, قابلیت اطمینان"
    },
    {
        "title": "طراحی بازار منطقه‌ای برق",
        "category": "بازار و تنظیم‌گری",
        "short_description": "تجارت برق فقط به خطوط انتقال وابسته نیست و به سازوکار بازار، تسویه و قواعد مبادله نیاز دارد.",
        "why_important": "بانک جهانی پنج بلوک اصلی ادغام منطقه‌ای را معرفی می‌کند که market design یکی از آن‌هاست.",
        "context_note": "ادغام منطقه‌ای بازار برق",
        "source_label": "World Bank",
        "source_ref": "World Bank [web:62]",
        "tags": "بازار, طراحی, منطقه‌ای, market design"
    },
    {
        "title": "هماهنگی فنی و عملیاتی بین کشورها",
        "category": "بازار و تنظیم‌گری",
        "short_description": "هماهنگی dispatch، بهره‌برداری شبکه و مدیریت تبادل انرژی بین کشورها ضروری است.",
        "why_important": "در چارچوب ادغام منطقه‌ای، technical and operational coordination یک بلوک کلیدی است.",
        "context_note": "چارچوب ادغام منطقه‌ای",
        "source_label": "World Bank",
        "source_ref": "World Bank [web:62]",
        "tags": "هماهنگی, فنی, عملیاتی, dispatch"
    },
    {
        "title": "هماهنگی در برنامه‌ریزی و سرمایه‌گذاری",
        "category": "بازار و تنظیم‌گری",
        "short_description": "توسعه صادرات برق نیازمند هماهنگی در توسعه ظرفیت، شبکه و سرمایه‌گذاری‌های فرامرزی است.",
        "why_important": "planning and investment coordination به‌عنوان یکی از ارکان ادغام منطقه‌ای مطرح شده است.",
        "context_note": "ادغام منطقه‌ای",
        "source_label": "World Bank",
        "source_ref": "World Bank [web:62]",
        "tags": "برنامه‌ریزی, سرمایه‌گذاری, هماهنگی"
    },
    {
        "title": "ترتیبات تجاری و قراردادهای بلندمدت",
        "category": "بازار و تنظیم‌گری",
        "short_description": "قراردادهای پایدار و سازوکارهای تجاری شفاف، ریسک پروژه‌ها را کم می‌کنند.",
        "why_important": "در تحلیل بازار برق MENA، قراردادهای بلندمدت برای کاهش ریسک و تسهیل تأمین مالی مهم دانسته شده‌اند.",
        "context_note": "بازار برق MENA",
        "source_label": "Oxford/OIES MENA electricity markets",
        "source_ref": "Oxford/OIES [web:25][web:27]",
        "tags": "قرارداد, بلندمدت, تجاری, ریسک"
    },
    {
        "title": "اصلاحات تنظیم‌گری و چارچوب حکمرانی برق",
        "category": "بازار و تنظیم‌گری",
        "short_description": "قوانین شفاف، تنظیم‌گری درست و ساختار حکمرانی مناسب، پیش‌نیاز جذب سرمایه و توسعه تجارت برق هستند.",
        "why_important": "مطالعه MENA بر اصلاحات بخش برق، حذف ناکارایی‌ها و بهبود ساختار بازار تأکید می‌کند.",
        "context_note": "اصلاحات بخش برق MENA",
        "source_label": "Oxford/OIES",
        "source_ref": "Oxford/OIES [web:25][web:27]",
        "tags": "اصلاحات, تنظیم‌گری, حکمرانی"
    },
    {
        "title": "هماهنگی نهادی و دیپلماسی انرژی",
        "category": "بازار و تنظیم‌گری",
        "short_description": "تجارت برق فرامرزی به همکاری نهادهای داخلی و منطقه‌ای نیاز دارد.",
        "why_important": "در تجربه‌های تجارت منطقه‌ای، institution building و هماهنگی نهادی از پیش‌شرط‌هاست.",
        "context_note": "تجارت منطقه‌ای انرژی",
        "source_label": "World Bank / WRI",
        "source_ref": "World Bank / WRI [web:62][web:67]",
        "tags": "نهادی, دیپلماسی, انرژی"
    },
    {
        "title": "هم‌راستایی الزامات فنی و مقرراتی میان کشورها",
        "category": "بازار و تنظیم‌گری",
        "short_description": "استانداردهای فنی، مقررات شبکه و الزامات بهره‌برداری باید تا حدی هماهنگ باشند.",
        "why_important": "WRI بر harmonizing regulatory and technical requirements across borders تأکید کرده است.",
        "context_note": "همکاری فرامرزی",
        "source_label": "WRI",
        "source_ref": "WRI [web:67]",
        "tags": "فنی, مقرراتی, هماهنگی, استاندارد"
    },
    {
        "title": "کاهش هزینه تولید برق خورشیدی",
        "category": "اقتصادی و مالی",
        "short_description": "هرچه هزینه برق خورشیدی کمتر باشد، مزیت رقابتی صادراتی آن بیشتر می‌شود.",
        "why_important": "IRENA نشان می‌دهد خورشیدی utility-scale در سطح جهانی بسیار رقابتی شده است.",
        "context_note": "رقابت‌پذیری جهانی",
        "source_label": "IRENA",
        "source_ref": "IRENA [web:60]",
        "tags": "هزینه, خورشیدی, رقابت‌پذیری"
    },
    {
        "title": "رقابت‌پذیری اقتصادی خورشیدی نسبت به سوخت فسیلی",
        "category": "اقتصادی و مالی",
        "short_description": "اگر برق خورشیدی ارزان‌تر یا هم‌هزینه با گزینه‌های فسیلی باشد، صادرات آن توجیه بیشتری پیدا می‌کند.",
        "why_important": "IRENA گزارش کرده بخش بزرگی از پروژه‌های جدید تجدیدپذیر ارزان‌تر از گزینه‌های فسیلی هستند.",
        "context_note": "گذار انرژی",
        "source_label": "IRENA",
        "source_ref": "IRENA [web:60]",
        "tags": "رقابت‌پذیری, فسیلی, خورشیدی"
    },
    {
        "title": "دسترسی به سرمایه‌گذاری در تولید و شبکه",
        "category": "اقتصادی و مالی",
        "short_description": "توسعه صادرات برق نیازمند سرمایه‌گذاری هم‌زمان در نیروگاه، شبکه و زیرساخت‌های پشتیبان است.",
        "why_important": "مطالعه MENA جذب سرمایه در generation capacity و networks را مهم می‌داند.",
        "context_note": "بازار برق MENA",
        "source_label": "Oxford/OIES",
        "source_ref": "Oxford/OIES [web:27][web:25]",
        "tags": "سرمایه‌گذاری, تولید, شبکه"
    },
    {
        "title": "تأمین مالی پروژه‌های خورشیدی و صادراتی",
        "category": "اقتصادی و مالی",
        "short_description": "وجود سازوکارهای مالی مناسب، ریسک سرمایه‌گذاری را کم و توسعه پروژه را تسهیل می‌کند.",
        "why_important": "قراردادهای بلندمدت و ساختارهای کاهش ریسک برای پروژه‌های برق اهمیت بالایی دارند.",
        "context_note": "تأمین مالی پروژه",
        "source_label": "Oxford/OIES",
        "source_ref": "Oxford/OIES [web:25]",
        "tags": "تأمین مالی, پروژه, خورشیدی"
    },
    {
        "title": "کاهش وابستگی به بازارهای بین‌المللی سوخت",
        "category": "اقتصادی و مالی",
        "short_description": "تجدیدپذیرها با کاهش وابستگی به سوخت وارداتی یا فرصت‌هزینه سوخت داخلی، مزیت ایجاد می‌کنند.",
        "why_important": "IRENA تأکید می‌کند تجدیدپذیرها علاوه بر مزیت هزینه، امنیت انرژی را هم بهبود می‌دهند.",
        "context_note": "امنیت انرژی",
        "source_label": "IRENA",
        "source_ref": "IRENA [web:60]",
        "tags": "وابستگی, سوخت, تجدیدپذیر, امنیت"
    },
    {
        "title": "منافع اقتصادی تجارت برق منطقه‌ای",
        "category": "اقتصادی و مالی",
        "short_description": "وقتی تجارت برق باعث کاهش هزینه سیستم و افزایش بهره‌وری شود، انگیزه توسعه صادرات بالاتر می‌رود.",
        "why_important": "بانک جهانی کاهش هزینه‌های کل سیستم را از منافع اصلی تجارت منطقه‌ای می‌داند.",
        "context_note": "تجارت منطقه‌ای",
        "source_label": "World Bank",
        "source_ref": "World Bank [web:59][web:70]",
        "tags": "منافع, اقتصادی, منطقه‌ای"
    },
    {
        "title": "ادغام مؤثر انرژی‌های تجدیدپذیر در شبکه",
        "category": "فنی و فناوری",
        "short_description": "سهم بالاتر خورشیدی نیازمند توانایی فنی شبکه برای جذب و مدیریت آن است.",
        "why_important": "مطالعه بازار برق MENA افزایش نقش renewables و integration آن‌ها را محور اصلی گذار می‌داند.",
        "context_note": "گذار انرژی MENA",
        "source_label": "Oxford/OIES",
        "source_ref": "Oxford/OIES [web:27][web:64]",
        "tags": "ادغام, تجدیدپذیر, شبکه, integration"
    },
    {
        "title": "انعطاف‌پذیری سیستم برق",
        "category": "فنی و فناوری",
        "short_description": "چون خورشیدی متناوب است، سیستم باید از نظر بهره‌برداری و بازار انعطاف‌پذیر باشد.",
        "why_important": "در گذار انرژی MENA تأکید شده زیرساخت و طراحی بازار باید برای منابع متناوب سازگار شوند.",
        "context_note": "گذار انرژی MENA",
        "source_label": "Oxford/OIES / Wuppertal MENA transformation",
        "source_ref": "Oxford/OIES [web:27][web:69]",
        "tags": "انعطاف‌پذیری, متناوب, سیستم"
    },
    {
        "title": "ترکیب خورشیدی با ذخیره‌ساز",
        "category": "فنی و فناوری",
        "short_description": "ذخیره‌سازی می‌تواند قابلیت تحویل‌پذیری و ارزش صادراتی برق خورشیدی را بالا ببرد.",
        "why_important": "IRENA نشان می‌دهد solar-plus-storage در مناطق با منبع خورشیدی قوی به برق firm و رقابتی نزدیک شده است.",
        "context_note": "ذخیره‌سازی انرژی",
        "source_label": "IRENA-related reporting",
        "source_ref": "IRENA [web:63][web:68]",
        "tags": "ذخیره‌سازی, ترکیب, خورشیدی, storage"
    },
    {
        "title": "کیفیت منبع خورشیدی و تابش مناسب",
        "category": "فنی و فناوری",
        "short_description": "شدت و پایداری تابش خورشیدی یکی از عوامل اصلی رقابت‌پذیری برق خورشیدی است.",
        "why_important": "IRENA مناطق با منبع خورشیدی قوی را از محرک‌های اصلی رقابت‌پذیری معرفی می‌کند.",
        "context_note": "منابع تجدیدپذیر",
        "source_label": "IRENA-related reporting",
        "source_ref": "IRENA [web:63]",
        "tags": "تابش, خورشیدی, کیفیت, منبع"
    },
    {
        "title": "قابلیت تحویل‌پذیری برق firm",
        "category": "فنی و فناوری",
        "short_description": "بازار صادرات فقط برق ارزان نمی‌خواهد، بلکه برق قابل اتکا و تحویل‌پذیر می‌خواهد.",
        "why_important": "در تحلیل‌های جدید IRENA، برق firm مبتنی بر خورشیدی و ذخیره‌ساز اهمیت زیادی یافته است.",
        "context_note": "برق firm",
        "source_label": "IRENA-related reporting",
        "source_ref": "IRENA [web:63][web:68]",
        "tags": "firm, تحویل‌پذیری, قابلیت اطمینان"
    },
    {
        "title": "مزیت رقابتی ملی در صادرات برق",
        "category": "راهبردی و رقابتی",
        "short_description": "صادرات موفق به مزیت پایدار، نه فقط منابع طبیعی، وابسته است.",
        "why_important": "در چارچوب پورتر، رقابت‌پذیری به توان نوآوری و ارتقای مستمر وابسته است.",
        "context_note": "چارچوب پورتر",
        "source_label": "Porter framework cited in proposal references",
        "source_ref": "Porter framework",
        "tags": "مزیت, رقابتی, ملی, پورتر"
    },
    {
        "title": "صنایع و نهادهای پشتیبان",
        "category": "راهبردی و رقابتی",
        "short_description": "وجود شرکت‌های مهندسی، مالی، فناورانه و نهادی پشتیبان توسعه صادرات را تسهیل می‌کند.",
        "why_important": "در چارچوب مزیت رقابتی، صنایع مرتبط و پشتیبان اهمیت بالایی دارند.",
        "context_note": "چارچوب مزیت رقابتی",
        "source_label": "Porter framework cited in proposal references",
        "source_ref": "Porter framework",
        "tags": "صنایع, نهادها, پشتیبانی"
    },
    {
        "title": "ارتقای مستمر فناوری و نوآوری",
        "category": "راهبردی و رقابتی",
        "short_description": "توان بهبود فناوری، کاهش هزینه و افزایش بهره‌وری برای حفظ مزیت صادراتی مهم است.",
        "why_important": "رویکرد مزیت رقابتی ملی بر innovation and upgrading تأکید دارد.",
        "context_note": "نوآوری و ارتقا",
        "source_label": "Porter-related logic in proposal references",
        "source_ref": "Porter framework",
        "tags": "نوآوری, فناوری, ارتقا"
    },
    {
        "title": "هم‌زمانی توسعه تجدیدپذیر و اصلاحات بازار برق",
        "category": "راهبردی و رقابتی",
        "short_description": "توسعه خورشیدی بدون انطباق ساختار بازار می‌تواند ناکارآمد شود.",
        "why_important": "مطالعه MENA این دو مسیر را موازی و نیازمند هم‌سویی می‌داند.",
        "context_note": "گذار انرژی MENA",
        "source_label": "Oxford/OIES",
        "source_ref": "Oxford/OIES [web:27][web:25]",
        "tags": "هم‌زمانی, اصلاحات, بازار"
    },
    {
        "title": "وجود تقاضای واقعی در بازار کشورهای همسایه",
        "category": "منطقه‌ای و ژئوپلیتیکی",
        "short_description": "صادرات زمانی معنا دارد که بازار مقصد نیاز و کشش خرید داشته باشد.",
        "why_important": "منطقه‌گرایی برق بر مبنای complementarities و نیازهای متفاوت کشورها شکل می‌گیرد.",
        "context_note": "بازار منطقه‌ای",
        "source_label": "World Bank regional market framing",
        "source_ref": "World Bank [web:59][web:62]",
        "tags": "تقاضا, بازار, همسایه"
    },
    {
        "title": "امنیت انرژی منطقه‌ای",
        "category": "منطقه‌ای و ژئوپلیتیکی",
        "short_description": "اگر صادرات برق به تقویت امنیت انرژی منطقه کمک کند، پذیرش سیاسی و اقتصادی آن بیشتر می‌شود.",
        "why_important": "هم بانک جهانی و هم WRI interconnection را ابزار تقویت امنیت انرژی می‌دانند.",
        "context_note": "امنیت انرژی منطقه",
        "source_label": "World Bank / WRI",
        "source_ref": "World Bank / WRI [web:59][web:67]",
        "tags": "امنیت, انرژی, منطقه‌ای"
    },
    {
        "title": "ملاحظات اقلیمی و کربن‌زدایی",
        "category": "منطقه‌ای و ژئوپلیتیکی",
        "short_description": "تجارت برق مبتنی بر تجدیدپذیر می‌تواند با اهداف کاهش انتشار و انتقال انرژی همسو باشد.",
        "why_important": "بانک جهانی climate change mitigation را از محرک‌های اصلی تجارت برق منطقه‌ای معرفی می‌کند.",
        "context_note": "تغییرات اقلیمی",
        "source_label": "World Bank",
        "source_ref": "World Bank [web:59]",
        "tags": "اقلیم, کربن, انتشار, تجدیدپذیر"
    },
    {
        "title": "اثر سیاست‌های کشورهای همسایه بر بازار برق ایران",
        "category": "منطقه‌ای و ژئوپلیتیکی",
        "short_description": "سیاست‌های انرژی، ظرفیت‌سازی و توسعه تجدیدپذیر در کشورهای همسایه بر جذابیت صادرات اثر می‌گذارد.",
        "why_important": "مطالعات cross-border effects نشان می‌دهد بازارهای متصل از سیاست‌ها و توسعه طرف مقابل اثر می‌پذیرند.",
        "context_note": "اثرات فرامرزی",
        "source_label": "ادبیات cross-border electricity market interaction",
        "source_ref": "مطالعات مرتبط",
        "tags": "سیاست, همسایه, اثر, cross-border"
    },
    {
        "title": "همبستگی تولید تجدیدپذیر در کشورهای همسایه",
        "category": "منطقه‌ای و ژئوپلیتیکی",
        "short_description": "اگر کشورهای همسایه هم‌زمان تولید خورشیدی بالایی داشته باشند، ارزش صادراتی برق خورشیدی ممکن است افت کند.",
        "why_important": "مطالعات جدید درباره spillover effects نشان می‌دهد توسعه تجدیدپذیر در همسایگان می‌تواند بر ارزش بازار برق اثر بگذارد.",
        "context_note": "اثرات بازار منطقه‌ای",
        "source_label": "Recent cross-border renewable market evidence",
        "source_ref": "IRENA [web:63]",
        "tags": "همبستگی, تولید, همسایه, spillover"
    }
]


def seed_factor_bank(db):
    existing = db.query(FactorBank).count()
    if existing > 0:
        return False
    for item in FACTOR_BANK_SEED:
        factor = FactorBank(**item)
        db.add(factor)
    db.commit()
    return True
