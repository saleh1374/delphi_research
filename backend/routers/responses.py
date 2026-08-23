from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from database import get_db
from models import Response, ResponseFactor
from schemas import ResponseCreate, ResponseUpdate, ResponseDetail, FactorCreate

router = APIRouter(prefix="/responses", tags=["responses"])


@router.post("/", response_model=ResponseDetail)
@router.post("", response_model=ResponseDetail)
def create_response(response: ResponseCreate, db: Session = Depends(get_db)):
    if not response.factors:
        raise HTTPException(status_code=400, detail="حداقل یک عامل باید ثبت شود")

    try:
        db_response = Response(
            expert_id=response.expert_id,
            round_no=response.round_no,
            response_status=response.response_status,
            response_note=response.response_note
        )
        db.add(db_response)
        db.flush()

        for factor in response.factors:
            db_factor = ResponseFactor(
                response_id=db_response.response_id,
                row_no=factor.row_no,
                factor_text=factor.factor_text,
                factor_note=factor.factor_note,
                factor_source=factor.factor_source,
                factor_category=factor.factor_category,
                is_from_reference_list=factor.is_from_reference_list,
                rating=factor.rating
            )
            db.add(db_factor)

        db.commit()
        db.refresh(db_response)
        return db_response
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"خطا در ذخیره پاسخ: {str(e)}")


@router.get("/", response_model=List[ResponseDetail])
@router.get("", response_model=List[ResponseDetail])
def list_responses(
    expert_id: Optional[int] = None,
    round_no: Optional[int] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Response).options(joinedload(Response.factors))
    if expert_id:
        query = query.filter(Response.expert_id == expert_id)
    if round_no:
        query = query.filter(Response.round_no == round_no)
    return query.order_by(Response.response_id.desc()).all()


@router.get("/{response_id}", response_model=ResponseDetail)
def get_response(response_id: int, db: Session = Depends(get_db)):
    response = db.query(Response).options(
        joinedload(Response.factors)
    ).filter(Response.response_id == response_id).first()
    if not response:
        raise HTTPException(status_code=404, detail="پاسخ یافت نشد")
    return response


@router.get("/expert/{expert_id}/latest", response_model=Optional[ResponseDetail])
def get_latest_response(expert_id: int, db: Session = Depends(get_db)):
    response = db.query(Response).options(
        joinedload(Response.factors)
    ).filter(
        Response.expert_id == expert_id
    ).order_by(Response.response_id.desc()).first()
    return response


@router.put("/{response_id}", response_model=ResponseDetail)
def update_response(response_id: int, response: ResponseUpdate, db: Session = Depends(get_db)):
    db_response = db.query(Response).filter(Response.response_id == response_id).first()
    if not db_response:
        raise HTTPException(status_code=404, detail="پاسخ یافت نشد")

    update_data = response.model_dump(exclude_unset=True)
    factors_data = update_data.pop("factors", None)

    for key, value in update_data.items():
        setattr(db_response, key, value)

    if factors_data is not None:
        db.query(ResponseFactor).filter(
            ResponseFactor.response_id == response_id
        ).delete()
        for factor in factors_data:
            db_factor = ResponseFactor(
                response_id=response_id,
                row_no=factor["row_no"],
                factor_text=factor["factor_text"],
                factor_note=factor.get("factor_note"),
                factor_source=factor.get("factor_source"),
                factor_category=factor.get("factor_category"),
                is_from_reference_list=factor.get("is_from_reference_list", False),
                rating=factor.get("rating")
            )
            db.add(db_factor)

    db.commit()
    db.refresh(db_response)
    return db_response


@router.delete("/{response_id}")
def delete_response(response_id: int, db: Session = Depends(get_db)):
    response = db.query(Response).filter(Response.response_id == response_id).first()
    if not response:
        raise HTTPException(status_code=404, detail="پاسخ یافت نشد")
    db.delete(response)
    db.commit()
    return {"message": "پاسخ با موفقیت حذف شد"}

