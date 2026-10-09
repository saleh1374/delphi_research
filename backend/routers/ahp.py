# -*- coding: utf-8 -*-
"""
API ماژول «تحلیل سلسله‌مراتبی AHP» (مرحله دوم پژوهش)

 - سلسله‌مراتب سه‌سطحی از روی داده‌های موجود (عوامل امتیازخورده راند ۲ دلفی)
 - پرسشنامه مقایسه زوجی (۱۵ مقایسه ابعاد + C(n,2) برای هر بُعد = ۷۹ مقایسه)
 - محاسبه خودکار وزن‌ها (میانگین هندسی)، λmax، CI، CR و تجمیع نظر خبرگان
 - خروجی JSON / CSV فارسی
"""
import io
import json

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel

from database import get_db
from models import AHPJudgment, Expert
import ahp_core

router = APIRouter(prefix="/ahp", tags=["ahp"])

UTF8_BOM = "\ufeff"


# ── اسکیماها ────────────────────────────────────────────────────────────────
class AHPItemIn(BaseModel):
    level: int
    parent: str
    item_a: str
    item_b: str
    value: float


class AHPBatchIn(BaseModel):
    expert_id: int
    items: List[AHPItemIn] = []


class AHPResetIn(BaseModel):
    expert_id: int
    level: Optional[int] = None
    parent: Optional[str] = None


# ── کمکی‌ها ─────────────────────────────────────────────────────────────────
def _get_expert(db: Session, expert_id: int) -> Expert:
    expert = db.query(Expert).filter(Expert.expert_id == expert_id).first()
    if not expert:
        raise HTTPException(status_code=404, detail="نخبه یافت نشد")
    return expert


def _canonical_pairs(hierarchy):
    """کلید استاندارد هر جفت مقایسه (بر اساس ترتیب سلسله‌مراتب)."""
    canon = {}
    for p in ahp_core.build_pair_list(hierarchy):
        canon[(p["level"], p["parent"], p["item_a"], p["item_b"])] = p
    return canon


def _saved_values(db: Session, expert_id: int, hierarchy):
    """قضاوت‌های ذخیره‌شده خبره به شکل {کلید جفت: مقدار}"""
    rows = db.query(AHPJudgment).filter(AHPJudgment.expert_id == expert_id).all()
    out = {}
    for r in rows:
        out[(r.level, r.parent, r.item_a, r.item_b)] = float(r.value)
    return out


def _csv_response(rows, headers, filename):
    output = io.StringIO()
    output.write(UTF8_BOM)
    import csv as _csv
    writer = _csv.writer(output, lineterminator="\r\n")
    if headers:
        writer.writerow(headers)
    for row in rows:
        writer.writerow(row)
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


# ── سلسله‌مراتب ─────────────────────────────────────────────────────────────
@router.get("/hierarchy")
def get_hierarchy(db: Session = Depends(get_db)):
    hierarchy = ahp_core.build_hierarchy(db)
    pairs = ahp_core.build_pair_list(hierarchy)
    return {
        "scale": hierarchy["scale"],
        "goal": hierarchy["goal"],
        "source": hierarchy["source"],
        "hierarchy_levels": hierarchy["hierarchy_levels"],
        "dimensions": hierarchy["dimensions"],
        "counts": hierarchy["counts"],
        "scale_labels": {str(k): v for k, v in ahp_core.SCALE_LABELS_FA.items()},
        "question_count": len(pairs),
    }


# ── پرسشنامه مقایسه زوجی ───────────────────────────────────────────────────
@router.get("/questionnaire")
def get_questionnaire(expert_id: Optional[int] = None, db: Session = Depends(get_db)):
    hierarchy = ahp_core.build_hierarchy(db)
    pairs = ahp_core.build_pair_list(hierarchy)
    values = _saved_values(db, expert_id, hierarchy) if expert_id else {}
    expert = None
    if expert_id:
        e = _get_expert(db, expert_id)
        expert = {"expert_id": e.expert_id, "name": e.full_name, "organization": e.organization}

    questions = []
    for idx, p in enumerate(pairs):
        key = (p["level"], p["parent"], p["item_a"], p["item_b"])
        questions.append({
            "index": idx,
            "level": p["level"],
            "parent": p["parent"],
            "item_a": p["item_a"],
            "item_b": p["item_b"],
            "value": values.get(key),
        })
    answered = sum(1 for q in questions if q["value"] is not None)
    total = len(questions)
    return {
        "expert_id": expert_id,
        "expert": expert,
        "goal": hierarchy["goal"],
        "scale": hierarchy["scale"],
        "scale_labels": {str(k): v for k, v in ahp_core.SCALE_LABELS_FA.items()},
        "dimensions": hierarchy["dimensions"],
        "questions": questions,
        "answered": answered,
        "total": total,
        "percent": round(answered / total * 100, 1) if total else 0.0,
        "completed": answered >= total and total > 0,
    }


@router.post("/comparisons")
def save_comparisons(payload: AHPBatchIn, db: Session = Depends(get_db)):
    _get_expert(db, payload.expert_id)
    hierarchy = ahp_core.build_hierarchy(db)
    canon = _canonical_pairs(hierarchy)

    existing = {
        (r.level, r.parent, r.item_a, r.item_b): r
        for r in db.query(AHPJudgment).filter(AHPJudgment.expert_id == payload.expert_id).all()
    }

    saved = 0
    skipped = 0
    for item in payload.items:
        if item.item_a == item.item_b or item.level not in (2, 3):
            skipped += 1
            continue
        key = (item.level, item.parent, item.item_a, item.item_b)
        if key not in canon:
            # شاید جهت معکوس رسیده باشد → استاندارد می‌کنیم
            rkey = (item.level, item.parent, item.item_b, item.item_a)
            if rkey in canon:
                key = rkey
                value = 1.0 / item.value if item.value else 1.0
            else:
                skipped += 1
                continue
        else:
            value = item.value

        value = ahp_core.snap_saaty(value)
        row = existing.get(key)
        if row:
            if abs(float(row.value) - value) > 1e-9:
                row.value = value
                saved += 1
        else:
            db.add(AHPJudgment(
                expert_id=payload.expert_id,
                level=key[0], parent=key[1], item_a=key[2], item_b=key[3],
                value=value,
            ))
            saved += 1
    db.commit()

    all_pairs = len(canon)
    rows = db.query(AHPJudgment).filter(AHPJudgment.expert_id == payload.expert_id).all()
    answered = min(sum(1 for r in rows
                       if (r.level, r.parent, r.item_a, r.item_b) in canon), all_pairs)
    return {
        "message": "ذخیره شد",
        "saved": saved,
        "skipped": skipped,
        "answered": answered,
        "total": all_pairs,
        "percent": round(answered / all_pairs * 100, 1) if all_pairs else 0.0,
        "completed": answered >= all_pairs and all_pairs > 0,
    }


@router.delete("/comparisons")
def reset_comparisons(payload: AHPResetIn, db: Session = Depends(get_db)):
    _get_expert(db, payload.expert_id)
    query = db.query(AHPJudgment).filter(AHPJudgment.expert_id == payload.expert_id)
    if payload.level is not None:
        query = query.filter(AHPJudgment.level == payload.level)
    if payload.parent:
        query = query.filter(AHPJudgment.parent == payload.parent)
    deleted = query.count()
    query.delete(synchronize_session=False)
    db.commit()
    return {"message": "پاک شد", "deleted": deleted}


# ── نتایج ───────────────────────────────────────────────────────────────────
@router.get("/results")
def get_results(expert_id: Optional[int] = None, db: Session = Depends(get_db)):
    hierarchy = ahp_core.build_hierarchy(db)
    results = ahp_core.compute_results(db, hierarchy)
    results["counts"] = hierarchy["counts"]
    results["dimensions_hierarchy"] = hierarchy["dimensions"]
    if expert_id is not None:
        _get_expert(db, expert_id)
        mine = ahp_core.compute_results(db, hierarchy, only_expert_id=expert_id)
        mine["answered"] = sum(e["answered"] for e in mine["consistency"]["experts"])
        results["mine"] = mine
    return results


@router.get("/my-result")
def my_result(expert_id: int, db: Session = Depends(get_db)):
    """نتیجه فردی یک خبره (برای صفحه عمومی پرسشنامه AHP)."""
    _get_expert(db, expert_id)
    hierarchy = ahp_core.build_hierarchy(db)
    mine = ahp_core.compute_results(db, hierarchy, only_expert_id=expert_id)
    consistency = mine["consistency"]["experts"][0] if mine["consistency"]["experts"] else None
    return {
        "expert_id": expert_id,
        "goal": hierarchy["goal"],
        "counts": hierarchy["counts"],
        "dimensions": mine["dimensions"],
        "factors": mine["factors"],
        "consistency": consistency,
        "completed": bool(consistency and consistency["completed"]),
    }


# ── فهرست خبرگان ───────────────────────────────────────────────────────────
@router.get("/experts")
def list_experts(db: Session = Depends(get_db)):
    hierarchy = ahp_core.build_hierarchy(db)
    progress = ahp_core.expert_progress(db, hierarchy)
    return {
        "counts": hierarchy["counts"],
        "experts": progress,
        "completed_count": sum(1 for e in progress if e["completed"]),
        "started_count": sum(1 for e in progress if e["answered"] > 0),
    }


# ── خروجی‌ها ────────────────────────────────────────────────────────────────
@router.get("/export.json")
def export_json(db: Session = Depends(get_db)):
    block = ahp_core.ahp_json_block(db)
    payload = {"generated_at": ahp_core.now_str(), "ahp": block}
    output = json.dumps(payload, ensure_ascii=False, indent=2)
    return StreamingResponse(
        iter([output]),
        media_type="application/json; charset=utf-8",
        headers={"Content-Disposition": "attachment; filename=ahp_results.json"},
    )


@router.get("/export.csv")
def export_csv(db: Session = Depends(get_db)):
    hierarchy = ahp_core.build_hierarchy(db)
    results = ahp_core.compute_results(db, hierarchy)

    rows = []
    # بلوک ۱: نتایج سطح ۲ (ابعاد)
    rows.append(["جدول ۱: نتایج سطح ۲ — ابعاد اصلی"])
    rows.append(["بُعد", "وزن", "درصد", "رتبه", "تعداد عامل", "تعداد مقایسه", "CR گروهی"])
    for d in sorted(results["dimensions"], key=lambda x: x["rank"]):
        rows.append([d["title"], d["weight"], d["percent"], d["rank"],
                     d["factor_count"], d["comparison_count"], d["group_cr"]])
    rows.append([])

    # بلوک ۲: نتایج نهایی سطح ۳ (عوامل)
    rows.append(["جدول ۲: نتایج نهایی سطح ۳ — عوامل"])
    rows.append(["رتبه", "کد عامل", "عنوان", "بُعد", "وزن محلی", "وزن جهانی", "درصد", "میانگین دلفی"])
    for f in sorted(results["factors"], key=lambda x: x["rank"]):
        rows.append([f["rank"], f["code"], f["title"], f["dimension"],
                     f["local_weight"], f["global_weight"], f["percent"],
                     f["delphi_mean"] if f["delphi_mean"] is not None else ""])
    rows.append([])

    # بلوک ۳: جدول سازگاری
    rows.append(["جدول ۳: نرخ سازگاری (CR) خبرگان و ماتریس گروهی"])
    rows.append(["نخبه", "تعداد مقایسه‌ها", "کل مقایسه‌ها", "CR فردی (حداکثر)",
                 "تعداد ماتریس ناسازگار", "وضعیت"])
    for e in results["consistency"]["experts"]:
        rows.append([e["name"], e["answered"], e["total"], e["cr_max"],
                     e["inconsistent_matrices"],
                     "سازگار" if e["is_consistent"] else "ناسازگار (CR ≥ 0.1)"])
    rows.append(["ماتریس گروهی", results["comparison_count"], results["total_comparisons"],
                 results["consistency"]["group_cr_max"], "",
                 "سازگار" if results["consistency"]["group_is_consistent"] else "ناسازگار (CR ≥ 0.1)"])
    rows.append([])

    # بلوک ۴: جزئیات سازگاری هر ماتریس
    rows.append(["جدول ۴: جزئیات سازگاری هر ماتریس (هر خبره)"])
    rows.append(["نخبه", "ماتریس", "تعداد مقایسه", "λmax", "CI", "RI", "CR", "وضعیت"])
    for e in results["consistency"]["experts"]:
        for m in e["matrices"]:
            rows.append([e["name"], m["matrix"], f'{m["answered"]}/{m["total"]}',
                         m["lambda_max"], m["ci"], m["ri"], m["cr"],
                         "سازگار" if m["is_consistent"] else "ناسازگار"])

    headers = None
    return _csv_response(rows, headers, "ahp_results.csv")


@router.get("/guide.json")
def guide_json(db: Session = Depends(get_db)):
    """راهنمای فشرده یک‌صفحه‌ای خبره (طیف ۱ تا ۹ + نحوه پاسخ‌گویی)."""
    hierarchy = ahp_core.build_hierarchy(db)
    return {
        "goal": hierarchy["goal"],
        "scale": ahp_core.SCALE,
        "scale_labels": {str(k): v for k, v in ahp_core.SCALE_LABELS_FA.items()},
        "counts": hierarchy["counts"],
        "how_to": [
            "برای هر جفت، ابتدا مشخص کنید کدام گزینه مهم‌تر است (دکمه سمت مقابل).",
            "سپس با اسلایدر مشخص کنید چند برابر مهم‌تر است (۱ تا ۹).",
            "عدد ۱ یعنی اهمیت برابر؛ عدد ۹ یعنی کاملاً مهم‌تر.",
            "پاسخ‌ها به‌صورت خودکار ذخیره می‌شوند و قابل ادامه هستند.",
            "اگر نرخ سازگاری (CR) شما ۰.۱ یا بیشتر شد، مقایسه‌های ناسازگار بازبینی شوند.",
        ],
    }
