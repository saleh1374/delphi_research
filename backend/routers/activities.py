from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from database import get_db
from models import Activity
from schemas import ActivityCreate, ActivityUpdate, ActivityResponse

router = APIRouter(prefix="/activities", tags=["activities"])


class BulkDeleteRequest(BaseModel):
    ids: List[int]


@router.post("/", response_model=ActivityResponse)
@router.post("", response_model=ActivityResponse)
def create_activity(activity: ActivityCreate, db: Session = Depends(get_db)):
    try:
        db_activity = Activity(**activity.model_dump())
        db.add(db_activity)
        db.commit()
        db.refresh(db_activity)
        return db_activity
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"خطا در ذخیره فعالیت: {str(e)}")


@router.get("/", response_model=List[ActivityResponse])
@router.get("", response_model=List[ActivityResponse])
def list_activities(
    expert_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Activity)
    if expert_id:
        query = query.filter(Activity.expert_id == expert_id)
    return query.order_by(Activity.activity_id.desc()).all()


@router.get("/expert/{expert_id}", response_model=List[ActivityResponse])
def get_expert_activities(expert_id: int, db: Session = Depends(get_db)):
    return db.query(Activity).filter(
        Activity.expert_id == expert_id
    ).order_by(Activity.activity_id.desc()).all()


@router.get("/{activity_id}", response_model=ActivityResponse)
def get_activity(activity_id: int, db: Session = Depends(get_db)):
    activity = db.query(Activity).filter(Activity.activity_id == activity_id).first()
    if not activity:
        raise HTTPException(status_code=404, detail="فعالیت یافت نشد")
    return activity


@router.put("/{activity_id}", response_model=ActivityResponse)
def update_activity(activity_id: int, activity: ActivityUpdate, db: Session = Depends(get_db)):
    db_activity = db.query(Activity).filter(Activity.activity_id == activity_id).first()
    if not db_activity:
        raise HTTPException(status_code=404, detail="فعالیت یافت نشد")
    update_data = activity.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_activity, key, value)
    db.commit()
    db.refresh(db_activity)
    return db_activity


@router.delete("/{activity_id}")
def delete_activity(activity_id: int, db: Session = Depends(get_db)):
    activity = db.query(Activity).filter(Activity.activity_id == activity_id).first()
    if not activity:
        raise HTTPException(status_code=404, detail="فعالیت یافت نشد")
    db.delete(activity)
    db.commit()
    return {"message": "فعالیت با موفقیت حذف شد"}


@router.post("/delete-bulk")
def bulk_delete_activities(request: BulkDeleteRequest, db: Session = Depends(get_db)):
    if not request.ids:
        raise HTTPException(status_code=400, detail="لیست آی‌دی‌ها خالی است")
    deleted = db.query(Activity).filter(Activity.activity_id.in_(request.ids)).delete(synchronize_session='fetch')
    db.commit()
    return {"message": f"{deleted} فعالیت با موفقیت حذف شد", "deleted_count": deleted}

