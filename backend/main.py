from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from database import engine, SessionLocal, Base
from models import Expert, Response, ResponseFactor, Activity, FactorBank, AHPFactor, AHPComparison
from routers import experts, responses, activities, factor_bank, exports
from routers.analysis import router as analysis_router
from routers.analysis2 import router2 as analysis2_router
from routers.settings import router as settings_router, seed_settings
from routers.final_factors import router as final_factors_router
from seed import seed_factor_bank
import os
from sqlalchemy import text

app = FastAPI(
    title="سامانه مدیریت پژوهش دلفی",
    description="مدیریت نخبگان و اجرای راند اول دلفی",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(experts.router, prefix="/api")
app.include_router(responses.router, prefix="/api")
app.include_router(activities.router, prefix="/api")
app.include_router(factor_bank.router, prefix="/api")
app.include_router(exports.router, prefix="/api")
app.include_router(analysis_router, prefix="/api")
app.include_router(analysis2_router, prefix="/api")
app.include_router(settings_router, prefix="/api")
app.include_router(final_factors_router, prefix="/api")

frontend_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend")
app.mount("/static", StaticFiles(directory=frontend_dir), name="static")

AHP_SEED = [
    {"title": "زیرساخت انتقال و خطوط تبادل مرزی", "category": "زیرساخت و شبکه", "description": "ظرفیت کافی انتقال و اتصال بین‌مرزی"},
    {"title": "ظرفیت و کیفیت اتصال بین‌المللی شبکه", "category": "زیرساخت و شبکه", "description": "کیفیت interconnection"},
    {"title": "طراحی بازار منطقه‌ای برق", "category": "بازار و تنظیم‌گری", "description": "سازوکار بازار و تسویه"},
    {"title": "اصلاحات تنظیم‌گری و حکمرانی", "category": "بازار و تنظیم‌گری", "description": "قوانین شفاف و ساختار حکمرانی"},
    {"title": "کاهش هزینه تولید برق خورشیدی", "category": "اقتصادی و مالی", "description": "هزینه تولید و مزیت رقابتی"},
    {"title": "دسترسی به سرمایه‌گذاری", "category": "اقتصادی و مالی", "description": "تأمین مالی پروژه‌ها"},
    {"title": "ادغام تجدیدپذیر در شبکه", "category": "فنی و فناوری", "description": "توانایی فنی جذب خورشیدی"},
    {"title": "ترکیب خورشیدی با ذخیره‌ساز", "category": "فنی و فناوری", "description": "storage و firm power"},
    {"title": "مزیت رقابتی ملی", "category": "راهبردی و رقابتی", "description": "توان نوآوری و ارتقا"},
    {"title": "تقاضای واقعی در بازار همسایگان", "category": "منطقه‌ای و ژئوپلیتیکی", "description": "نیاز و کشش بازار مقصد"},
]


def seed_ahp_factors(db):
    existing = db.query(AHPFactor).count()
    if existing > 0:
        return
    for item in AHP_SEED:
        db.add(AHPFactor(**item))
    db.commit()


@app.on_event("startup")
def startup():
    # Create tables
    try:
        Base.metadata.create_all(bind=engine)
    except Exception as e:
        print(f"Warning during table creation: {e}")
    
    # Migration: Add rating column if missing
    db = None
    try:
        db = SessionLocal()
        # Check if column exists first
        from sqlalchemy import inspect
        inspector = inspect(engine)
        columns = [c["name"] for c in inspector.get_columns("response_factors")]
        if "rating" not in columns:
            db.execute(text("ALTER TABLE response_factors ADD COLUMN rating INTEGER"))
            db.commit()
            print("Added 'rating' column to response_factors")
    except Exception as e:
        print(f"Migration note: {e}")
    finally:
        if db:
            try:
                db.close()
            except:
                pass

    db = SessionLocal()
    try:
        seed_factor_bank(db)
        seed_ahp_factors(db)
        seed_settings(db)
    except Exception as e:
        print(f"Warning during seeding: {e}")
        try:
            Base.metadata.create_all(bind=engine)
            db.rollback()
            seed_settings(db)
        except Exception as e2:
            print(f"Warning during retry seeding: {e2}")
    finally:
        db.close()


@app.get("/")
def serve_index():
    return FileResponse(os.path.join(frontend_dir, "index.html"))


@app.get("/survey")
def serve_survey():
    return FileResponse(os.path.join(frontend_dir, "survey.html"))


@app.get("/survey2")
def serve_survey2():
    return FileResponse(os.path.join(frontend_dir, "survey2.html"))


@app.get("/api/dashboard")
def dashboard_stats():
    db = SessionLocal()
    try:
        total_experts = db.query(Expert).count()
        total_responses = db.query(Response).count()
        total_activities = db.query(Activity).count()
        total_factors = db.query(ResponseFactor).count()
        completed = db.query(Response).filter(Response.response_status == "تکمیل‌شده").count()
        pending = db.query(Activity).filter(Activity.activity_status == "در انتظار").count()
        return {
            "total_experts": total_experts,
            "total_responses": total_responses,
            "total_activities": total_activities,
            "total_factors": total_factors,
            "completed_responses": completed,
            "pending_activities": pending
        }
    finally:
        db.close()


@app.get("/api/expert-progress")
def expert_progress():
    db = SessionLocal()
    try:
        experts = db.query(Expert).all()
        result = []
        for e in experts:
            r1 = db.query(Response).filter(Response.expert_id == e.expert_id, Response.round_no == 1).first()
            r2 = db.query(Response).filter(Response.expert_id == e.expert_id, Response.round_no == 2).first()
            ahp = db.query(AHPComparison).filter(AHPComparison.expert_id == e.expert_id).count()
            result.append({
                "expert_id": e.expert_id,
                "name": e.full_name,
                "org": e.organization,
                "qualification_method": e.qualification_method or "-",
                "is_active": e.is_active_delphi,
                "round1_status": r1.response_status if r1 else "انجام نشده",
                "round1_date": r1.created_at.strftime("%Y-%m-%d %H:%M") if r1 else None,
                "round2_status": r2.response_status if r2 else "انجام نشده",
                "round2_date": r2.created_at.strftime("%Y-%m-%d %H:%M") if r2 else None,
                "ahp_count": ahp
            })
        return result
    finally:
        db.close()


@app.get("/api/expert/{expert_id}/profile")
def expert_profile(expert_id: int):
    db = SessionLocal()
    try:
        expert = db.query(Expert).filter(Expert.expert_id == expert_id).first()
        if not expert:
            return {"error": "نخبه یافت نشد"}
        latest_response = db.query(Response).filter(
            Response.expert_id == expert_id
        ).order_by(Response.response_id.desc()).first()
        latest_activity = db.query(Activity).filter(
            Activity.expert_id == expert_id
        ).order_by(Activity.activity_id.desc()).first()
        return {
            "expert": {
                "id": expert.expert_id,
                "name": expert.full_name,
                "org": expert.organization,
                "position": expert.position,
                "field": expert.field_study,
                "degree": expert.degree,
                "years": expert.years_energy,
                "phone": expert.phone,
                "email": expert.email,
                "qualification": expert.qualification_method,
                "qualification_note": expert.qualification_note
            },
            "latest_response_id": latest_response.response_id if latest_response else None,
            "latest_response_status": latest_response.response_status if latest_response else None,
            "latest_activity": {
                "type": latest_activity.activity_type,
                "status": latest_activity.activity_status
            } if latest_activity else None
        }
    finally:
        db.close()

