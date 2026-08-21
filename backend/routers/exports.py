from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session, joinedload
from database import get_db
from models import Expert, Response, ResponseFactor, Activity, FactorBank
import csv
import io
import json

router = APIRouter(prefix="/export", tags=["export"])

UTF8_BOM = '\ufeff'


def make_csv_response(rows, headers, filename):
    output = io.StringIO()
    output.write(UTF8_BOM)
    writer = csv.writer(output, lineterminator='\r\n')
    writer.writerow(headers)
    for row in rows:
        writer.writerow(row)
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@router.get("/experts.csv")
def export_experts(db: Session = Depends(get_db)):
    experts = db.query(Expert).all()
    headers = ["شناسه", "نام و نام خانوادگی", "سازمان", "سمت", "رشته", "مدرک", "سابقه انرژی", "تلفن", "ایمیل", "تاریخ ایجاد"]
    rows = [
        [e.expert_id, e.full_name, e.organization, e.position, e.field_study,
         e.degree, e.years_energy, e.phone or "", e.email or "",
         e.created_at.strftime("%Y-%m-%d %H:%M") if e.created_at else ""]
        for e in experts
    ]
    return make_csv_response(rows, headers, "experts.csv")


@router.get("/responses.csv")
def export_responses(db: Session = Depends(get_db)):
    responses = db.query(Response).options(joinedload(Response.factors), joinedload(Response.expert)).all()
    headers = ["شناسه پاسخ", "نام نخبه", "شماره راند", "وضعیت", "یادداشت", "شناسه عامل", "ردیف", "متن عامل", "توضیح عامل", "منبع", "دسته", "از فهرست مرجع"]
    rows = []
    for r in responses:
        expert_name = r.expert.full_name if r.expert else ""
        if r.factors:
            for f in r.factors:
                rows.append([
                    r.response_id, expert_name, r.round_no, r.response_status,
                    r.response_note or "", f.factor_id, f.row_no, f.factor_text,
                    f.factor_note or "", f.factor_source or "", f.factor_category or "",
                    "بله" if f.is_from_reference_list else "خیر"
                ])
        else:
            rows.append([r.response_id, expert_name, r.round_no, r.response_status, r.response_note or "", "", "", "", "", "", ""])
    return make_csv_response(rows, headers, "responses.csv")


@router.get("/activities.csv")
def export_activities(db: Session = Depends(get_db)):
    activities = db.query(Activity).options(joinedload(Activity.expert)).all()
    headers = ["شناسه", "نام نخبه", "نوع فعالیت", "وضعیت", "تاریخ پیگیری", "یادداشت", "تاریخ ایجاد"]
    rows = [
        [a.activity_id, a.expert.full_name if a.expert else "", a.activity_type,
         a.activity_status, a.follow_up_date or "", a.activity_note or "",
         a.created_at.strftime("%Y-%m-%d %H:%M") if a.created_at else ""]
        for a in activities
    ]
    return make_csv_response(rows, headers, "activities.csv")


@router.get("/combined.csv")
def export_combined(db: Session = Depends(get_db)):
    responses = db.query(Response).options(joinedload(Response.factors), joinedload(Response.expert)).all()
    headers = ["نام نخبه", "سازمان", "شماره راند", "وضعیت پاسخ", "ردیف عامل", "متن عامل", "توضیح", "منبع عامل", "دسته عامل", "از مرجع", "یادداشت پژوهشگر"]
    rows = []
    for r in responses:
        expert_name = r.expert.full_name if r.expert else ""
        org = r.expert.organization if r.expert else ""
        if r.factors:
            for f in r.factors:
                rows.append([
                    expert_name, org, r.round_no, r.response_status,
                    f.row_no, f.factor_text, f.factor_note or "",
                    f.factor_source or "", f.factor_category or "",
                    "بله" if f.is_from_reference_list else "خیر",
                    r.response_note or ""
                ])
        else:
            rows.append([expert_name, org, r.round_no, r.response_status, "", "", "", "", "", "", r.response_note or ""])
    return make_csv_response(rows, headers, "combined.csv")


@router.get("/unique-factors.csv")
def export_unique_factors(db: Session = Depends(get_db)):
    all_factors = db.query(ResponseFactor).all()
    seen = set()
    unique = []
    for f in all_factors:
        text = f.factor_text.strip()
        if text and text not in seen:
            seen.add(text)
            unique.append(f)
    headers = ["متن عامل", "دسته", "منبع", "تعداد تکرار"]
    factor_counts = {}
    for f in all_factors:
        text = f.factor_text.strip()
        if text:
            factor_counts[text] = factor_counts.get(text, 0) + 1
    rows = [[f.factor_text, f.factor_category or "", f.factor_source or "", factor_counts.get(f.factor_text.strip(), 0)] for f in unique]
    return make_csv_response(rows, headers, "unique_factors.csv")


@router.get("/ahp-priorities.csv")
def export_ahp_priorities(db: Session = Depends(get_db)):
    from models import AHPFactor, AHPComparison
    factors = db.query(AHPFactor).filter(AHPFactor.is_active == True).all()
    comparisons = db.query(AHPComparison).all()

    if not factors:
        return make_csv_response([], ["عامل", "دسته", "وزن", "رتبه"], "ahp_priorities.csv")

    factor_ids = [f.ahp_factor_id for f in factors]
    n = len(factor_ids)

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
    headers = ["رتبه", "عنوان عامل", "دسته", "وزن اولویت", "درصد"]
    rows = []
    for rank, (fid, weight) in enumerate(sorted_f, 1):
        f = next((f for f in factors if f.ahp_factor_id == fid), None)
        if f:
            rows.append([rank, f.title, f.category, round(weight, 4), f"{round(weight*100, 1)}%"])

    return make_csv_response(rows, headers, "ahp_priorities.csv")


@router.get("/factor-frequency.csv")
def export_factor_frequency(db: Session = Depends(get_db)):
    all_factors = db.query(ResponseFactor).all()
    factor_counts = {}
    for f in all_factors:
        text = f.factor_text.strip()
        if text:
            if text not in factor_counts:
                factor_counts[text] = {"count": 0, "category": f.factor_category}
            factor_counts[text]["count"] += 1

    total = len(all_factors)
    headers = ["رتبه", "عنوان عامل", "دسته", "فراوانی", "درصد"]
    rows = []
    for i, (text, data) in enumerate(sorted(factor_counts.items(), key=lambda x: x[1]["count"], reverse=True), 1):
        pct = round(data["count"] / total * 100, 1) if total > 0 else 0
        rows.append([i, text, data["category"] or "نامشخص", data["count"], f"{pct}%"])

    return make_csv_response(rows, headers, "factor_frequency.csv")


@router.get("/backup.json")
def export_backup(db: Session = Depends(get_db)):
    experts = db.query(Expert).all()
    responses = db.query(Response).options(joinedload(Response.factors)).all()
    activities = db.query(Activity).all()
    factors = db.query(FactorBank).all()

    data = {
        "experts": [
            {"id": e.expert_id, "full_name": e.full_name, "organization": e.organization,
             "position": e.position, "field_study": e.field_study, "degree": e.degree,
             "years_energy": e.years_energy, "phone": e.phone, "email": e.email}
            for e in experts
        ],
        "responses": [
            {"id": r.response_id, "expert_id": r.expert_id, "round_no": r.round_no,
             "status": r.response_status, "note": r.response_note,
             "factors": [
                 {"row": f.row_no, "text": f.factor_text, "note": f.factor_note,
                  "source": f.factor_source, "category": f.factor_category,
                  "from_reference": f.is_from_reference_list}
                 for f in r.factors
             ]}
            for r in responses
        ],
        "activities": [
            {"id": a.activity_id, "expert_id": a.expert_id, "type": a.activity_type,
             "status": a.activity_status, "follow_up_date": a.follow_up_date, "note": a.activity_note}
            for a in activities
        ],
        "factor_bank": [
            {"id": f.bank_factor_id, "title": f.title, "category": f.category,
             "description": f.short_description, "why_important": f.why_important,
             "source": f.source_label}
            for f in factors
        ]
    }

    output = json.dumps(data, ensure_ascii=False, indent=2)
    return StreamingResponse(
        iter([UTF8_BOM + output]),
        media_type="application/json; charset=utf-8",
        headers={"Content-Disposition": "attachment; filename=backup.json"}
    )
