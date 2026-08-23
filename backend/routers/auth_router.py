from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from database import get_db
from models import Expert
from auth import verify_admin_password, issue_token, is_valid_token, revoke_token, hash_password, verify_password

router = APIRouter(prefix="/auth", tags=["auth"])


class AdminLoginRequest(BaseModel):
    password: str


class AdminLogoutRequest(BaseModel):
    token: str


class ExpertLookupRequest(BaseModel):
    name: str


class ExpertVerifyRequest(BaseModel):
    expert_id: int
    password: str


@router.post("/admin-login")
def admin_login(body: AdminLoginRequest):
    if not verify_admin_password(body.password):
        raise HTTPException(status_code=401, detail="رمز عبور مدیر اشتباه است")
    token = issue_token()
    return {"token": token}


@router.post("/admin-logout")
def admin_logout(body: AdminLogoutRequest):
    revoke_token(body.token)
    return {"message": "خروج انجام شد"}


@router.get("/admin-check")
def admin_check(token: str):
    if not is_valid_token(token):
        raise HTTPException(status_code=401, detail="نشست نامعتبر است")
    return {"valid": True}


@router.post("/expert-lookup")
def expert_lookup(body: ExpertLookupRequest, db: Session = Depends(get_db)):
    """Search experts by name WITHOUT exposing sensitive data."""
    name = body.name.strip()
    if len(name) < 2:
        return []
    experts = db.query(Expert).filter(Expert.full_name.contains(name)).limit(10).all()
    return [
        {
            "expert_id": e.expert_id,
            "name": e.full_name,
            "org": e.organization,
            "has_password": bool(e.password_hash),
        }
        for e in experts
    ]


@router.post("/expert-verify")
def expert_verify(body: ExpertVerifyRequest, db: Session = Depends(get_db)):
    """Verify a returning participant's password."""
    expert = db.query(Expert).filter(Expert.expert_id == body.expert_id).first()
    if not expert:
        raise HTTPException(status_code=404, detail="شرکت‌کننده یافت نشد")

    if not expert.password_hash:
        raise HTTPException(status_code=400, detail="این شرکت‌کننده رمز عبور ندارد")

    if not verify_password(body.password, expert.password_hash):
        raise HTTPException(status_code=401, detail="رمز عبور اشتباه است")

    return {"expert_id": expert.expert_id, "name": expert.full_name}