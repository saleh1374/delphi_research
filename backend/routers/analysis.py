from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from database import get_db
from models import AHPFactor, AHPComparison, ResponseFactor, Expert, UniqueFactor
from pydantic import BaseModel

router = APIRouter(prefix="/analysis", tags=["analysis"])


class AHPFactorCreate(BaseModel):
    title: str
    category: str
    description: Optional[str] = None


class AHPComparisonCreate(BaseModel):
    expert_id: int
    factor_a_id: int
    factor_b_id: int
    value: float


class AHPFactorResponse(BaseModel):
    ahp_factor_id: int
    title: str
    category: str
    description: Optional[str]
    is_active: bool
    class Config:
        from_attributes = True


class AHPComparisonResponse(BaseModel):
    comparison_id: int
    expert_id: int
    factor_a_id: int
    factor_b_id: int
    value: float
    class Config:
        from_attributes = True


@router.get("/ahp-factors", response_model=List[AHPFactorResponse])
def list_ahp_factors(db: Session = Depends(get_db)):
    return db.query(AHPFactor).filter(AHPFactor.is_active == True).all()


@router.post("/ahp-factors", response_model=AHPFactorResponse)
def create_ahp_factor(factor: AHPFactorCreate, db: Session = Depends(get_db)):
    db_factor = AHPFactor(**factor.model_dump())
    db.add(db_factor)
    db.commit()
    db.refresh(db_factor)
    return db_factor


@router.delete("/ahp-factors/{factor_id}")
def delete_ahp_factor(factor_id: int, db: Session = Depends(get_db)):
    factor = db.query(AHPFactor).filter(AHPFactor.ahp_factor_id == factor_id).first()
    if not factor:
        raise HTTPException(status_code=404, detail="عامل یافت نشد")
    db.delete(factor)
    db.commit()
    return {"message": "حذف شد"}


@router.get("/ahp-comparisons", response_model=List[AHPComparisonResponse])
def list_ahp_comparisons(expert_id: Optional[int] = None, db: Session = Depends(get_db)):
    query = db.query(AHPComparison)
    if expert_id:
        query = query.filter(AHPComparison.expert_id == expert_id)
    return query.all()


@router.post("/ahp-comparisons", response_model=AHPComparisonResponse)
def create_ahp_comparison(comp: AHPComparisonCreate, db: Session = Depends(get_db)):
    existing = db.query(AHPComparison).filter(
        AHPComparison.expert_id == comp.expert_id,
        AHPComparison.factor_a_id == comp.factor_a_id,
        AHPComparison.factor_b_id == comp.factor_b_id
    ).first()
    if existing:
        existing.value = comp.value
        db.commit()
        db.refresh(existing)
        return existing
    db_comp = AHPComparison(**comp.model_dump())
    db.add(db_comp)
    db.commit()
    db.refresh(db_comp)
    return db_comp


@router.post("/ahp-comparisons/batch")
def batch_create_comparisons(comparisons: List[AHPComparisonCreate], db: Session = Depends(get_db)):
    count = 0
    for comp in comparisons:
        existing = db.query(AHPComparison).filter(
            AHPComparison.expert_id == comp.expert_id,
            AHPComparison.factor_a_id == comp.factor_a_id,
            AHPComparison.factor_b_id == comp.factor_b_id
        ).first()
        if existing:
            existing.value = comp.value
        else:
            db.add(AHPComparison(**comp.model_dump()))
        count += 1
    db.commit()
    return {"message": f"{count} مقایسه ذخیره شد"}


@router.get("/ahp-priorities")
def calculate_priorities(expert_id: Optional[int] = None, db: Session = Depends(get_db)):
    factors = db.query(AHPFactor).filter(AHPFactor.is_active == True).all()
    if not factors:
        return {"factors": [], "consistency": []}

    factor_ids = [f.ahp_factor_id for f in factors]
    n = len(factor_ids)

    if expert_id:
        comparisons = db.query(AHPComparison).filter(AHPComparison.expert_id == expert_id).all()
    else:
        comparisons = db.query(AHPComparison).all()

    if not comparisons:
        return {
            "factors": [{"id": f.ahp_factor_id, "title": f.title, "category": f.category, "weight": round(1.0/n, 4), "rank": i+1} for i, f in enumerate(factors)],
            "consistency": []
        }

    expert_ids = list(set(c.expert_id for c in comparisons))
    all_weights = {fid: [] for fid in factor_ids}

    for eid in expert_ids:
        expert_comps = [c for c in comparisons if c.expert_id == eid]
        matrix = {(comp.factor_a_id, comp.factor_b_id): comp.value for comp in expert_comps}
        for fid in factor_ids:
            matrix[(fid, fid)] = 1.0
            for fid2 in factor_ids:
                if (fid, fid2) not in matrix and (fid2, fid) in matrix:
                    val = matrix[(fid2, fid)]
                    matrix[(fid, fid2)] = 1.0 / val if val != 0 else 1.0

        avgs = []
        for fj in factor_ids:
            col_vals = [matrix.get((fi, fj), 1.0) for fi in factor_ids]
            avgs.append(sum(col_vals) / len(col_vals))

        total = sum(avgs) if sum(avgs) > 0 else 1.0
        weights = [a / total for a in avgs]

        for i, fi in enumerate(factor_ids):
            all_weights[fi].append(weights[i])

    avg_weights = {}
    for fid in factor_ids:
        w_list = all_weights[fid]
        avg_weights[fid] = sum(w_list) / len(w_list) if w_list else 1.0/n

    total_w = sum(avg_weights.values()) or 1.0
    for fid in avg_weights:
        avg_weights[fid] /= total_w

    sorted_f = sorted(avg_weights.items(), key=lambda x: x[1], reverse=True)
    result_factors = []
    for rank, (fid, weight) in enumerate(sorted_f, 1):
        f = next((f for f in factors if f.ahp_factor_id == fid), None)
        if f:
            result_factors.append({"id": fid, "title": f.title, "category": f.category, "weight": round(weight, 4), "rank": rank})

    ri_values = {1: 0, 2: 0, 3: 0.58, 4: 0.90, 5: 1.12, 6: 1.24, 7: 1.32, 8: 1.41, 9: 1.45, 10: 1.49}
    consistency_results = []
    for eid in expert_ids:
        expert_comps = [c for c in comparisons if c.expert_id == eid]
        expert = db.query(Expert).filter(Expert.expert_id == eid).first()
        matrix = {(comp.factor_a_id, comp.factor_b_id): comp.value for comp in expert_comps}
        for fid in factor_ids:
            matrix[(fid, fid)] = 1.0
            for fid2 in factor_ids:
                if (fid, fid2) not in matrix and (fid2, fid) in matrix:
                    val = matrix[(fid2, fid)]
                    matrix[(fid, fid2)] = 1.0 / val if val != 0 else 1.0

        avgs = []
        for fj in factor_ids:
            col_vals = [matrix.get((fi, fj), 1.0) for fi in factor_ids]
            avgs.append(sum(col_vals) / len(col_vals))
        total = sum(avgs) if sum(avgs) > 0 else 1.0
        weights = [a / total for a in avgs]

        weighted_sum = []
        for i, fi in enumerate(factor_ids):
            row_sum = sum(matrix.get((fi, fj), 1.0) * weights[j] for j, fj in enumerate(factor_ids))
            weighted_sum.append(row_sum)

        lambda_vals = [ws / w if w != 0 else 0 for ws, w in zip(weighted_sum, weights)]
        lambda_max = sum(lambda_vals) / len(lambda_vals) if lambda_vals else n
        ci = (lambda_max - n) / (n - 1) if n > 1 else 0
        si = ri_values.get(n, 1.49)
        cr = ci / si if si != 0 else 0

        consistency_results.append({
            "expert_id": eid,
            "expert_name": expert.full_name if expert else f"نخبه {eid}",
            "consistency_ratio": round(cr, 4),
            "is_consistent": cr < 0.1,
            "lambda_max": round(lambda_max, 4),
            "ci": round(ci, 4),
            "si": round(si, 4)
        })

    return {"factors": result_factors, "consistency": consistency_results}
