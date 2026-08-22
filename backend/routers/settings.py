from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import inspect
from typing import Dict, List, Optional
from pydantic import BaseModel
from database import get_db, engine
from models import SiteSettings, Base

router = APIRouter(prefix="/settings", tags=["settings"])


class SettingUpdate(BaseModel):
    setting_value: Optional[str] = None


class SettingBulkUpdate(BaseModel):
    settings: Dict[str, str]


class SettingOut(BaseModel):
    setting_key: str
    setting_value: Optional[str]
    setting_group: str
    label: Optional[str]

    class Config:
        from_attributes = True


DEFAULT_SETTINGS = [
    # ── survey1 (راند اول) ──
    {"key": "s1_page_title", "value": "پرسشنامه راند اول دلفی", "group": "survey1", "label": "عنوان صفحه"},
    {"key": "s1_hero_title", "value": "پرسشنامه راند اول دلفی", "group": "survey1", "label": "عنوان هدر"},
    {"key": "s1_hero_subtitle", "value": "بررسی عوامل مؤثر بر صادرات برق ایران با به‌کارگیری استراتژی توسعه نیروگاه‌های تجدیدپذیر (خورشیدی)", "group": "survey1", "label": "توضیحات هدر"},
    {"key": "s1_question_title", "value": "سؤال اصلی پژوهش", "group": "survey1", "label": "عنوان سؤال"},
    {"key": "s1_question_text", "value": "عوامل مؤثر بر توسعه صادرات برق ایران با تأکید بر توسعه نیروگاه‌های تجدیدپذیر (خورشیدی) کدامند؟", "group": "survey1", "label": "متن سؤال اصلی"},
    {"key": "s1_section_title_info", "value": "اطلاعات فردی", "group": "survey1", "label": "عنوان بخش اطلاعات فردی"},
    {"key": "s1_section_desc_info", "value": "لطفاً اطلاعات خود را تکمیل کنید تا بتوانید در پژوهش شرکت کنید", "group": "survey1", "label": "توضیح بخش اطلاعات فردی"},
    {"key": "s1_section_title_factors", "value": "فهرست عوامل پیشنهادی شما", "group": "survey1", "label": "عنوان بخش عوامل"},
    {"key": "s1_section_desc_factors", "value": "عوامل خود را در ردیف‌های زیر وارد کنید یا از فهرست بالا انتخاب کنید", "group": "survey1", "label": "توضیح بخش عوامل"},
    {"key": "s1_ref_section_title", "value": "فهرست پیشنهادی عوامل مرجع", "group": "survey1", "label": "عنوان بخش عوامل مرجع"},
    {"key": "s1_ref_section_desc", "value": "می‌توانید از این عوامل الهام بگیرید یا آنها را مستقیماً به فرم اضافه کنید", "group": "survey1", "label": "توضیح بخش عوامل مرجع"},
    {"key": "s1_ref_tip", "value": "روی دکمه «افزودن به فرم» کلیک کنید تا عامل به اولین ردیف خالی اضافه شود", "group": "survey1", "label": "راهنمای عوامل مرجع"},
    {"key": "s1_note_title", "value": "یادداشت اختیاری", "group": "survey1", "label": "عنوان یادداشت"},
    {"key": "s1_note_placeholder", "value": "اگر نکته یا توضیحی دارید بنویسید...", "group": "survey1", "label": "متن placeholder یادداشت"},
    {"key": "s1_factor_count_label", "value": "تعداد عوامل ثبت‌شده", "group": "survey1", "label": "متن شمارنده عوامل"},
    {"key": "s1_success_title", "value": "پاسخ شما ثبت شد", "group": "survey1", "label": "عنوان پیام موفقیت"},
    {"key": "s1_success_desc", "value": "از همکاری شما سپاسگزاریم", "group": "survey1", "label": "توضیح پیام موفقیت"},
    {"key": "s1_max_factors", "value": "20", "group": "survey1", "label": "حداکثر تعداد عوامل"},

    # ── survey2 (راند دوم) ──
    {"key": "s2_page_title", "value": "پرسشنامه راند دوم - اولویت‌بندی عوامل", "group": "survey2", "label": "عنوان صفحه"},
    {"key": "s2_hero_title", "value": "پرسشنامه راند دوم دلفی", "group": "survey2", "label": "عنوان هدر"},
    {"key": "s2_hero_subtitle", "value": "اولویت‌بندی عوامل مؤثر بر صادرات برق ایران", "group": "survey2", "label": "توضیحات هدر"},
    {"key": "s2_guide_title", "value": "راهنما", "group": "survey2", "label": "عنوان راهنما"},
    {"key": "s2_guide_text", "value": "عوامل شناسایی‌شده از راند اول در اختیار شما قرار گرفته است. لطفاً برای هر عامل میزان اهمیت آن را با استفاده از مقیاس ۱ تا ۹ مشخص کنید.", "group": "survey2", "label": "متن راهنما"},
    {"key": "s2_guide_scale", "value": "مقیاس: ۱ = بی‌اهمیت | ۳ = کم‌اهمیت | ۵ = متوسط | ۷ = مهم | ۹ = بسیار مهم", "group": "survey2", "label": "توضیح مقیاس"},
    {"key": "s2_success_title", "value": "اولویت‌بندی شما ثبت شد", "group": "survey2", "label": "عنوان پیام موفقیت"},
    {"key": "s2_success_desc", "value": "از همکاری شما سپاسگزاریم", "group": "survey2", "label": "توضیح پیام موفقیت"},

    # ── general ──
    {"key": "site_title", "value": "سامانه مدیریت پژوهش دلفی", "group": "general", "label": "عنوان سایت"},
    {"key": "site_subtitle", "value": "صادرات برق خورشیدی", "group": "general", "label": "زیرعنوان سایت"},
]


def ensure_settings_table():
    inspector = inspect(engine)
    if "site_settings" not in inspector.get_table_names():
        SiteSettings.__table__.create(bind=engine, checkfirst=True)


def seed_settings(db: Session):
    try:
        ensure_settings_table()
    except Exception:
        pass
    try:
        existing = db.query(SiteSettings).count()
    except Exception:
        Base.metadata.create_all(bind=engine)
        existing = 0
    if existing > 0:
        return
    for item in DEFAULT_SETTINGS:
        db.add(SiteSettings(
            setting_key=item["key"],
            setting_value=item["value"],
            setting_group=item["group"],
            label=item["label"],
        ))
    db.commit()


@router.get("/", response_model=List[SettingOut])
def list_settings(group: Optional[str] = None, db: Session = Depends(get_db)):
    try:
        query = db.query(SiteSettings)
        if group:
            query = query.filter(SiteSettings.setting_group == group)
        return query.order_by(SiteSettings.setting_id).all()
    except Exception:
        ensure_settings_table()
        return []


@router.get("/public")
def get_public_settings(db: Session = Depends(get_db)):
    try:
        rows = db.query(SiteSettings).all()
        return {r.setting_key: r.setting_value for r in rows}
    except Exception:
        ensure_settings_table()
        return {}


@router.get("/group/{group_name}", response_model=List[SettingOut])
def get_group_settings(group_name: str, db: Session = Depends(get_db)):
    try:
        return db.query(SiteSettings).filter(
            SiteSettings.setting_group == group_name
        ).order_by(SiteSettings.setting_id).all()
    except Exception:
        ensure_settings_table()
        return []


@router.put("/bulk")
def bulk_update_settings(body: SettingBulkUpdate, db: Session = Depends(get_db)):
    try:
        ensure_settings_table()
    except Exception:
        pass
    try:
        for key, value in body.settings.items():
            row = db.query(SiteSettings).filter(SiteSettings.setting_key == key).first()
            if row:
                row.setting_value = value
            else:
                db.add(SiteSettings(setting_key=key, setting_value=value, setting_group="custom"))
        db.commit()
    except Exception:
        Base.metadata.create_all(bind=engine)
        db.rollback()
        for key, value in body.settings.items():
            row = db.query(SiteSettings).filter(SiteSettings.setting_key == key).first()
            if row:
                row.setting_value = value
            else:
                db.add(SiteSettings(setting_key=key, setting_value=value, setting_group="custom"))
        db.commit()
    return {"message": "تنظیمات با موفقیت ذخیره شد"}


@router.put("/{setting_key}")
def update_setting(setting_key: str, body: SettingUpdate, db: Session = Depends(get_db)):
    row = db.query(SiteSettings).filter(SiteSettings.setting_key == setting_key).first()
    if not row:
        db.add(SiteSettings(setting_key=setting_key, setting_value=body.setting_value, setting_group="custom"))
    else:
        row.setting_value = body.setting_value
    db.commit()
    return {"message": "ذخیره شد"}
