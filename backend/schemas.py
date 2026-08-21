from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class ExpertBase(BaseModel):
    full_name: str
    organization: str
    position: str
    field_study: str
    degree: str
    years_energy: str
    phone: Optional[str] = None
    email: Optional[str] = None
    qualification_method: Optional[str] = None
    qualification_note: Optional[str] = None
    is_active_delphi: Optional[bool] = True


class ExpertCreate(ExpertBase):
    pass


class ExpertUpdate(BaseModel):
    full_name: Optional[str] = None
    organization: Optional[str] = None
    position: Optional[str] = None
    field_study: Optional[str] = None
    degree: Optional[str] = None
    years_energy: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    qualification_method: Optional[str] = None
    qualification_note: Optional[str] = None
    is_active_delphi: Optional[bool] = None


class ExpertResponse(ExpertBase):
    expert_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class FactorBase(BaseModel):
    row_no: int
    factor_text: str
    factor_note: Optional[str] = None
    factor_source: Optional[str] = None
    factor_category: Optional[str] = None
    is_from_reference_list: Optional[bool] = False


class FactorCreate(FactorBase):
    pass


class FactorResponse(FactorBase):
    factor_id: int
    response_id: int

    class Config:
        from_attributes = True


class ResponseBase(BaseModel):
    expert_id: int
    round_no: Optional[int] = 1
    response_status: Optional[str] = "ناتمام"
    response_note: Optional[str] = None


class ResponseCreate(BaseModel):
    expert_id: int
    round_no: Optional[int] = 1
    response_status: Optional[str] = "ناتمام"
    response_note: Optional[str] = None
    factors: List[FactorCreate] = []


class ResponseUpdate(BaseModel):
    round_no: Optional[int] = None
    response_status: Optional[str] = None
    response_note: Optional[str] = None
    factors: Optional[List[FactorCreate]] = None


class ResponseDetail(ResponseBase):
    response_id: int
    created_at: datetime
    updated_at: datetime
    factors: List[FactorResponse] = []

    class Config:
        from_attributes = True


class ActivityBase(BaseModel):
    expert_id: int
    activity_type: str
    activity_status: Optional[str] = "در انتظار"
    follow_up_date: Optional[str] = None
    activity_note: Optional[str] = None


class ActivityCreate(ActivityBase):
    pass


class ActivityUpdate(BaseModel):
    activity_type: Optional[str] = None
    activity_status: Optional[str] = None
    follow_up_date: Optional[str] = None
    activity_note: Optional[str] = None


class ActivityResponse(ActivityBase):
    activity_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class FactorBankBase(BaseModel):
    title: str
    category: str
    short_description: str
    why_important: Optional[str] = None
    context_note: Optional[str] = None
    source_label: Optional[str] = None
    source_ref: Optional[str] = None
    tags: Optional[str] = None
    is_active: Optional[bool] = True


class FactorBankCreate(FactorBankBase):
    pass


class FactorBankUpdate(BaseModel):
    title: Optional[str] = None
    category: Optional[str] = None
    short_description: Optional[str] = None
    why_important: Optional[str] = None
    context_note: Optional[str] = None
    source_label: Optional[str] = None
    source_ref: Optional[str] = None
    tags: Optional[str] = None
    is_active: Optional[bool] = None


class FactorBankResponse(FactorBankBase):
    bank_factor_id: int
    created_at: datetime

    class Config:
        from_attributes = True


class DashboardStats(BaseModel):
    total_experts: int
    total_responses: int
    total_activities: int
    total_factors: int
    completed_responses: int
    pending_activities: int
