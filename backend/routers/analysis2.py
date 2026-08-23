from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models import ResponseFactor, Response, Expert, UniqueFactor, AHPComparison
from typing import Optional

router2 = APIRouter(prefix="/analysis", tags=["analysis2"])


@router2.get("/factor-frequency")
def get_factor_frequency(round_no: Optional[int] = None, db: Session = Depends(get_db)):
    query = db.query(ResponseFactor)
    if round_no:
        query = query.join(Response).filter(Response.round_no == round_no)
    all_factors = query.all()
    factor_counts = {}
    for f in all_factors:
        text = f.factor_text.strip()
        if text:
            if text not in factor_counts:
                factor_counts[text] = {"count": 0, "category": f.factor_category, "responses": set()}
            factor_counts[text]["count"] += 1
            factor_counts[text]["responses"].add(f.response_id)

    total = len(all_factors)
    result = []
    for text, data in sorted(factor_counts.items(), key=lambda x: x[1]["count"], reverse=True):
        result.append({
            "title": text,
            "count": data["count"],
            "percentage": round(data["count"] / total * 100, 1) if total > 0 else 0,
            "category": data["category"],
            "response_count": len(data["responses"])
        })
    return result


@router2.get("/unique-factors")
def get_unique_factors(db: Session = Depends(get_db)):
    all_factors = db.query(ResponseFactor).all()
    factor_map = {}
    for f in all_factors:
        text = f.factor_text.strip()
        if text:
            if text not in factor_map:
                factor_map[text] = {"category": f.factor_category, "count": 0, "response_ids": []}
            factor_map[text]["count"] += 1
            if f.response_id not in factor_map[text]["response_ids"]:
                factor_map[text]["response_ids"].append(f.response_id)

    unique_factors = []
    for text, data in sorted(factor_map.items(), key=lambda x: x[1]["count"], reverse=True):
        unique_factors.append({
            "title": text,
            "category": data["category"],
            "frequency": data["count"],
            "response_count": len(data["response_ids"])
        })
    return unique_factors


@router2.get("/research-stats")
def get_research_stats(db: Session = Depends(get_db)):
    total_experts = db.query(Expert).count()
    active_experts = db.query(Expert).filter(Expert.is_active_delphi == True).count()
    total_responses = db.query(Response).count()
    completed = db.query(Response).filter(Response.response_status == "تکمیل‌شده").count()
    total_factors = db.query(ResponseFactor).count()

    all_factors = db.query(ResponseFactor).all()
    unique_texts = set()
    for f in all_factors:
        t = f.factor_text.strip()
        if t:
            unique_texts.add(t)

    total_ahp = db.query(AHPComparison).count()
    experts_with_ahp_list = db.query(AHPComparison.expert_id).distinct().all()
    experts_with_ahp = len(experts_with_ahp_list)

    avg_factors = round(total_factors / total_responses, 1) if total_responses > 0 else 0

    categories = {}
    for f in all_factors:
        cat = f.factor_category or "نامشخص"
        categories[cat] = categories.get(cat, 0) + 1

    return {
        "total_experts": total_experts,
        "active_experts": active_experts,
        "total_delphi_responses": total_responses,
        "completed_responses": completed,
        "total_factors_identified": total_factors,
        "unique_factors": len(unique_texts),
        "total_ahp_comparisons": total_ahp,
        "experts_with_ahp": experts_with_ahp,
        "average_factors_per_expert": avg_factors,
        "factor_categories": categories
    }


@router2.get("/round2-ratings")
def get_round2_ratings(db: Session = Depends(get_db)):
    round2_responses = db.query(Response).filter(Response.round_no == 2).all()
    if not round2_responses:
        return {"factors": [], "total_respondents": 0}

    response_ids = [r.response_id for r in round2_responses]
    factors = db.query(ResponseFactor).filter(
        ResponseFactor.response_id.in_(response_ids),
        ResponseFactor.rating.isnot(None)
    ).all()

    factor_ratings = {}
    for f in factors:
        text = f.factor_text.strip()
        if text:
            if text not in factor_ratings:
                factor_ratings[text] = {
                    "category": f.factor_category,
                    "ratings": [],
                    "count": 0
                }
            factor_ratings[text]["ratings"].append(f.rating)
            factor_ratings[text]["count"] += 1

    result = []
    for text, data in sorted(factor_ratings.items(), key=lambda x: sum(x[1]["ratings"]) / len(x[1]["ratings"]) if x[1]["ratings"] else 0, reverse=True):
        avg = sum(data["ratings"]) / len(data["ratings"]) if data["ratings"] else 0
        result.append({
            "title": text,
            "category": data["category"],
            "average_rating": round(avg, 2),
            "rating_count": data["count"],
            "min_rating": min(data["ratings"]),
            "max_rating": max(data["ratings"])
        })

    return {"factors": result, "total_respondents": len(round2_responses)}
