from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from database import get_db
from models import Expert
from schemas import ExpertCreate, ExpertUpdate, ExpertResponse

router = APIRouter(prefix="/experts", tags=["experts"])


@router.post("/", response_model=ExpertResponse)
def create_expert(expert: ExpertCreate, db: Session = Depends(get_db)):
    db_expert = Expert(**expert.model_dump())
    db.add(db_expert)
    db.commit()
    db.refresh(db_expert)
    return db_expert


@router.get("/", response_model=List[ExpertResponse])
def list_experts(
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    query = db.query(Expert)
    if search:
        query = query.filter(
            Expert.full_name.contains(search) |
            Expert.organization.contains(search) |
            Expert.position.contains(search) |
            Expert.field_study.contains(search)
        )
    return query.order_by(Expert.expert_id.desc()).offset(skip).limit(limit).all()


@router.get("/{expert_id}", response_model=ExpertResponse)
def get_expert(expert_id: int, db: Session = Depends(get_db)):
    expert = db.query(Expert).filter(Expert.expert_id == expert_id).first()
    if not expert:
        raise HTTPException(status_code=404, detail="نخبه یافت نشد")
    return expert


@router.put("/{expert_id}", response_model=ExpertResponse)
def update_expert(expert_id: int, expert: ExpertUpdate, db: Session = Depends(get_db)):
    db_expert = db.query(Expert).filter(Expert.expert_id == expert_id).first()
    if not db_expert:
        raise HTTPException(status_code=404, detail="نخبه یافت نشد")
    update_data = expert.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_expert, key, value)
    db.commit()
    db.refresh(db_expert)
    return db_expert


@router.delete("/{expert_id}")
def delete_expert(expert_id: int, db: Session = Depends(get_db)):
    expert = db.query(Expert).filter(Expert.expert_id == expert_id).first()
    if not expert:
        raise HTTPException(status_code=404, detail="نخبه یافت نشد")
    db.delete(expert)
    db.commit()
    return {"message": "نخبه با موفقیت حذف شد"}
