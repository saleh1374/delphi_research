from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from database import get_db
from models import ResponseFactor, Response

router = APIRouter(prefix="/final-factors", tags=["final-factors"])


class FactorEdit(BaseModel):
    factor_text: Optional[str] = None
    factor_category: Optional[str] = None
    factor_note: Optional[str] = None


# ── Batch operations (must be BEFORE /{factor_id}) ──

@router.put("/batch-rename")
def batch_rename_factors(payload: dict, db: Session = Depends(get_db)):
    old_text = payload.get("old_text", "").strip()
    new_text = payload.get("new_text", "").strip()
    new_category = payload.get("category")
    if not old_text or not new_text:
        raise HTTPException(status_code=400, detail="متن قدیم و جدید الزامی است")
    factors = db.query(ResponseFactor).filter(ResponseFactor.factor_text == old_text).all()
    updated = 0
    for f in factors:
        f.factor_text = new_text
        if new_category:
            f.factor_category = new_category
        updated += 1
    db.commit()
    return {"message": f"{updated} مورد ویرایش شد", "updated": updated}


@router.post("/batch-delete")
def batch_delete_factors(payload: dict, db: Session = Depends(get_db)):
    text = payload.get("text", "").strip()
    if not text:
        raise HTTPException(status_code=400, detail="متن عامل الزامی است")
    factors = db.query(ResponseFactor).filter(ResponseFactor.factor_text == text).all()
    deleted = len(factors)
    for f in factors:
        db.delete(f)
    db.commit()
    return {"message": f"{deleted} مورد حذف شد", "deleted": deleted}


# ── Detail endpoint (must be BEFORE /{factor_id}) ──

@router.get("/detail/{factor_text:path}")
def get_factor_detail(factor_text: str, db: Session = Depends(get_db)):
    factors = db.query(ResponseFactor).join(
        Response, ResponseFactor.response_id == Response.response_id
    ).filter(ResponseFactor.factor_text == factor_text).all()
    if not factors:
        raise HTTPException(status_code=404, detail="عامل یافت نشد")
    result = []
    for f in factors:
        result.append({
            "factor_id": f.factor_id,
            "response_id": f.response_id,
            "expert_id": f.response.expert_id,
            "expert_name": f.response.expert.full_name if f.response.expert else "ناشناس",
            "round_no": f.response.round_no,
            "row_no": f.row_no,
            "factor_text": f.factor_text,
            "factor_note": f.factor_note,
            "factor_category": f.factor_category,
            "is_from_reference_list": f.is_from_reference_list,
            "rating": f.rating
        })
    return result


# ── List ──

@router.get("/")
def list_unique_factors(
    category: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    factors = db.query(ResponseFactor).join(
        Response, ResponseFactor.response_id == Response.response_id
    ).filter(Response.round_no == 1).all()

    grouped = {}
    for f in factors:
        text = f.factor_text.strip()
        if not text:
            continue
        if text not in grouped:
            grouped[text] = {"title": text, "category": f.factor_category, "count": 0, "response_ids": [], "factor_ids": []}
        grouped[text]["count"] += 1
        if f.response_id not in grouped[text]["response_ids"]:
            grouped[text]["response_ids"].append(f.response_id)
        grouped[text]["factor_ids"].append(f.factor_id)
        if f.factor_category and f.factor_category != grouped[text]["category"]:
            if grouped[text]["category"] is None:
                grouped[text]["category"] = f.factor_category

    result = []
    for text, data in sorted(grouped.items(), key=lambda x: x[1]["count"], reverse=True):
        if category and data["category"] != category:
            continue
        if search and search.lower() not in text.lower():
            continue
        result.append(data)
    return result


# ── Single factor CRUD (must be LAST) ──

@router.put("/{factor_id}")
def edit_factor(factor_id: int, data: FactorEdit, db: Session = Depends(get_db)):
    factor = db.query(ResponseFactor).filter(ResponseFactor.factor_id == factor_id).first()
    if not factor:
        raise HTTPException(status_code=404, detail="عامل یافت نشد")
    if data.factor_text is not None and data.factor_text.strip():
        factor.factor_text = data.factor_text.strip()
    if data.factor_category is not None:
        factor.factor_category = data.factor_category
    if data.factor_note is not None:
        factor.factor_note = data.factor_note
    db.commit()
    db.refresh(factor)
    return {"message": "ذخیره شد", "factor_id": factor.factor_id}


@router.delete("/{factor_id}")
def delete_factor(factor_id: int, db: Session = Depends(get_db)):
    factor = db.query(ResponseFactor).filter(ResponseFactor.factor_id == factor_id).first()
    if not factor:
        raise HTTPException(status_code=404, detail="عامل یافت نشد")
    db.delete(factor)
    db.commit()
    return {"message": "حذف شد"}