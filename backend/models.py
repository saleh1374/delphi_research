from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, ForeignKey, Float
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base


class Expert(Base):
    __tablename__ = "experts"

    expert_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    full_name = Column(String(200), nullable=False, index=True)
    organization = Column(String(300), nullable=False)
    position = Column(String(200), nullable=False)
    field_study = Column(String(200), nullable=False)
    degree = Column(String(100), nullable=False)
    years_energy = Column(String(50), nullable=False)
    phone = Column(String(20), nullable=True)
    email = Column(String(200), nullable=True)
    qualification_method = Column(String(100), nullable=True)
    qualification_note = Column(Text, nullable=True)
    is_active_delphi = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    responses = relationship("Response", back_populates="expert", cascade="all, delete-orphan")
    activities = relationship("Activity", back_populates="expert", cascade="all, delete-orphan")
    ahp_comparisons = relationship("AHPComparison", back_populates="expert", cascade="all, delete-orphan")


class Response(Base):
    __tablename__ = "responses"

    response_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    expert_id = Column(Integer, ForeignKey("experts.expert_id"), nullable=False)
    round_no = Column(Integer, default=1)
    response_status = Column(String(50), default="ناتمام")
    response_note = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    expert = relationship("Expert", back_populates="responses")
    factors = relationship("ResponseFactor", back_populates="response", cascade="all, delete-orphan")


class ResponseFactor(Base):
    __tablename__ = "response_factors"

    factor_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    response_id = Column(Integer, ForeignKey("responses.response_id"), nullable=False)
    row_no = Column(Integer, nullable=False)
    factor_text = Column(Text, nullable=False)
    factor_note = Column(Text, nullable=True)
    factor_source = Column(String(300), nullable=True)
    factor_category = Column(String(100), nullable=True)
    is_from_reference_list = Column(Boolean, default=False)
    rating = Column(Integer, nullable=True)

    response = relationship("Response", back_populates="factors")


class Activity(Base):
    __tablename__ = "activities"

    activity_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    expert_id = Column(Integer, ForeignKey("experts.expert_id"), nullable=False)
    activity_type = Column(String(100), nullable=False)
    activity_status = Column(String(50), default="در انتظار")
    follow_up_date = Column(String(20), nullable=True)
    activity_note = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    expert = relationship("Expert", back_populates="activities")


class FactorBank(Base):
    __tablename__ = "factor_bank"

    bank_factor_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    title = Column(String(300), nullable=False)
    category = Column(String(100), nullable=False)
    short_description = Column(Text, nullable=False)
    why_important = Column(Text, nullable=True)
    context_note = Column(Text, nullable=True)
    source_label = Column(String(300), nullable=True)
    source_ref = Column(String(300), nullable=True)
    tags = Column(String(500), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class AHPFactor(Base):
    __tablename__ = "ahp_factors"

    ahp_factor_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    title = Column(String(300), nullable=False)
    category = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class AHPComparison(Base):
    __tablename__ = "ahp_comparisons"

    comparison_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    expert_id = Column(Integer, ForeignKey("experts.expert_id"), nullable=False)
    factor_a_id = Column(Integer, ForeignKey("ahp_factors.ahp_factor_id"), nullable=False)
    factor_b_id = Column(Integer, ForeignKey("ahp_factors.ahp_factor_id"), nullable=False)
    value = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    expert = relationship("Expert", back_populates="ahp_comparisons")
    factor_a = relationship("AHPFactor", foreign_keys=[factor_a_id])
    factor_b = relationship("AHPFactor", foreign_keys=[factor_b_id])


class UniqueFactor(Base):
    __tablename__ = "unique_factors"

    unique_factor_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    title = Column(String(300), nullable=False, unique=True)
    category = Column(String(100), nullable=True)
    frequency = Column(Integer, default=1)
    source_response_ids = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class SiteSettings(Base):
    __tablename__ = "site_settings"

    setting_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    setting_key = Column(String(100), nullable=False, unique=True, index=True)
    setting_value = Column(Text, nullable=True)
    setting_group = Column(String(50), nullable=False, default="general")
    label = Column(String(200), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
