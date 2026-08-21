from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from database import get_db
from models import FactorBank
from schemas import FactorBankCreate, FactorBankUpdate, FactorBankResponse

router = APIRouter(prefix="/factor-bank", tags=["factor-bank"])


@router.post("/", response_model=FactorBankResponse)
@router.post("", response_model=FactorBankResponse)
def create_factor(factor: FactorBankCreate, db: Session = Depends(get_db)):
    try:
        db_factor = FactorBank(**factor.model_dump())
        db.add(db_factor)
        db.commit()
        db.refresh(db_factor)
        return db_factor
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"خطا در ذخیره عامل: {str(e)}")


@router.get("/", response_model=List[FactorBankResponse])
@router.get("", response_model=List[FactorBankResponse])
def list_factors(
    category: Optional[str] = None,
    search: Optional[str] = None,
    active_only: bool = True,
    db: Session = Depends(get_db)
):
    query = db.query(FactorBank)
    if active_only:
        query = query.filter(FactorBank.is_active == True)
    if category:
        query = query.filter(FactorBank.category == category)
    if search:
        query = query.filter(
            FactorBank.title.contains(search) |
            FactorBank.short_description.contains(search) |
            FactorBank.tags.contains(search)
        )
    return query.order_by(FactorBank.bank_factor_id).all()


@router.get("/categories", response_model=List[str])
def get_categories(db: Session = Depends(get_db)):
    categories = db.query(FactorBank.category).distinct().all()
    return [c[0] for c in categories]


@router.get("/search", response_model=List[FactorBankResponse])
def search_factors(q: str, db: Session = Depends(get_db)):
    return db.query(FactorBank).filter(
        FactorBank.is_active == True,
        FactorBank.title.contains(q) |
        FactorBank.short_description.contains(q) |
        FactorBank.tags.contains(q)
    ).all()


@router.get("/{factor_id}", response_model=FactorBankResponse)
def get_factor(factor_id: int, db: Session = Depends(get_db)):
    factor = db.query(FactorBank).filter(FactorBank.bank_factor_id == factor_id).first()
    if not factor:
        raise HTTPException(status_code=404, detail="عامل یافت نشد")
    return factor


@router.put("/{factor_id}", response_model=FactorBankResponse)
def update_factor(factor_id: int, factor: FactorBankUpdate, db: Session = Depends(get_db)):
    db_factor = db.query(FactorBank).filter(FactorBank.bank_factor_id == factor_id).first()
    if not db_factor:
        raise HTTPException(status_code=404, detail="عامل یافت نشد")
    update_data = factor.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_factor, key, value)
    db.commit()
    db.refresh(db_factor)
    return db_factor


@router.delete("/{factor_id}")
def delete_factor(factor_id: int, db: Session = Depends(get_db)):
    factor = db.query(FactorBank).filter(FactorBank.bank_factor_id == factor_id).first()
    if not factor:
        raise HTTPException(status_code=404, detail="عامل یافت نشد")
    db.delete(factor)
    db.commit()
    return {"message": "عامل با موفقیت حذف شد"}

