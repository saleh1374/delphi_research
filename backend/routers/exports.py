from fastapi import APIRouter, Depends, UploadFile, File
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session, joinedload
from database import get_db
from models import Expert, Response, ResponseFactor, Activity, FactorBank
import csv
import io
import json
import math

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
                  "from_reference": f.is_from_reference_list,
                  "rating": f.rating}
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


def calculate_kendall_w(ratings_list):
    if not ratings_list or len(ratings_list[0]) < 2:
        return 0.0
    m = len(ratings_list)
    n = len(ratings_list[0])
    if n < 2:
        return 0.0
    mean_ranks = [0.0] * n
    for r in ratings_list:
        ranked = sorted(range(n), key=lambda i: r[i])
        for rank, idx in enumerate(ranked, 1):
            mean_ranks[idx] += rank
    for i in range(n):
        mean_ranks[i] /= m
    mean_all = sum(mean_ranks) / n
    ss = sum((R - mean_all) ** 2 for R in mean_ranks)
    w = 12 * ss / (m * m * (n ** 3 - n))
    return w


@router.get("/round2-priorities.csv")
def export_round2_priorities(db: Session = Depends(get_db)):
    responses = db.query(Response).options(
        joinedload(Response.factors),
        joinedload(Response.expert)
    ).filter(Response.round_no == 2).all()

    factor_data = {}
    for r in responses:
        expert_name = r.expert.full_name if r.expert else ""
        for f in r.factors:
            text = f.factor_text.strip()
            if text:
                if text not in factor_data:
                    factor_data[text] = {"category": f.factor_category, "ratings": [], "expert_names": []}
                rating = f.rating if f.rating is not None else 5
                factor_data[text]["ratings"].append(rating)
                factor_data[text]["expert_names"].append(expert_name)

    if not factor_data:
        return make_csv_response([], ["رتبه", "عنوان عامل", "دسته", "میانگین امتیاز", "حداکثر", "حداقل", "انحراف معیار", "تعداد رأی", "افراد"], "round2_priorities.csv")

    factor_list = []
    for text, data in factor_data.items():
        ratings = data["ratings"]
        avg = sum(ratings) / len(ratings)
        variance = sum((r - avg) ** 2 for r in ratings) / len(ratings)
        std_dev = math.sqrt(variance)
        factor_list.append({
            "text": text,
            "category": data["category"],
            "avg": avg,
            "max": max(ratings),
            "min": min(ratings),
            "std_dev": std_dev,
            "count": len(ratings),
            "experts": ", ".join(data["expert_names"])
        })

    factor_list.sort(key=lambda x: x["avg"], reverse=True)

    all_ratings = []
    for data in factor_data.values():
        all_ratings.append(data["ratings"])

    kendall_w = calculate_kendall_w(all_ratings) if len(all_ratings[0]) > 1 else 0

    headers = ["رتبه", "عنوان عامل", "دسته", "میانگین امتیاز", "حداکثر", "حداقل", "انحراف معیار", "تعداد رأی", "افراد رأی‌دهنده"]
    rows = []
    for rank, f in enumerate(factor_list, 1):
        rows.append([
            rank, f["text"], f["category"] or "نامشخص",
            round(f["avg"], 2), f["max"], f["min"],
            round(f["std_dev"], 2), f["count"], f["experts"]
        ])

    return make_csv_response(rows, headers, "round2_priorities.csv")


@router.post("/import")
async def import_backup(file: UploadFile = File(...), db: Session = Depends(get_db)):
    content = await file.read()
    text = content.decode('utf-8-sig')
    data = json.loads(text)

    imported = {"experts": 0, "responses": 0, "factors": 0, "activities": 0, "factor_bank": 0}

    expert_id_map = {}
    for e_data in data.get("experts", []):
        existing = db.query(Expert).filter(Expert.full_name == e_data["full_name"]).first()
        if existing:
            expert_id_map[e_data["id"]] = existing.expert_id
        else:
            expert = Expert(
                full_name=e_data["full_name"],
                organization=e_data.get("organization", ""),
                position=e_data.get("position", ""),
                field_study=e_data.get("field_study", ""),
                degree=e_data.get("degree", ""),
                years_energy=e_data.get("years_energy", 0),
                phone=e_data.get("phone"),
                email=e_data.get("email")
            )
            db.add(expert)
            db.flush()
            expert_id_map[e_data["id"]] = expert.expert_id
            imported["experts"] += 1

    for fb_data in data.get("factor_bank", []):
        existing = db.query(FactorBank).filter(FactorBank.title == fb_data["title"]).first()
        if not existing:
            fb = FactorBank(
                title=fb_data["title"],
                category=fb_data.get("category", ""),
                short_description=fb_data.get("description", ""),
                why_important=fb_data.get("why_important", ""),
                source_label=fb_data.get("source", "")
            )
            db.add(fb)
            imported["factor_bank"] += 1

    for r_data in data.get("responses", []):
        old_expert_id = r_data.get("expert_id")
        new_expert_id = expert_id_map.get(old_expert_id, old_expert_id)

        response = Response(
            expert_id=new_expert_id,
            round_no=r_data.get("round_no", 1),
            response_status=r_data.get("status", "ناقص"),
            response_note=r_data.get("note")
        )
        db.add(response)
        db.flush()
        imported["responses"] += 1

        for f_data in r_data.get("factors", []):
            factor = ResponseFactor(
                response_id=response.response_id,
                row_no=f_data.get("row", 0),
                factor_text=f_data.get("text", ""),
                factor_note=f_data.get("note"),
                factor_source=f_data.get("source"),
                factor_category=f_data.get("category"),
                is_from_reference_list=f_data.get("from_reference", False),
                rating=f_data.get("rating")
            )
            db.add(factor)
            imported["factors"] += 1

    for a_data in data.get("activities", []):
        old_expert_id = a_data.get("expert_id")
        new_expert_id = expert_id_map.get(old_expert_id, old_expert_id)

        activity = Activity(
            expert_id=new_expert_id,
            activity_type=a_data.get("type", ""),
            activity_status=a_data.get("status", ""),
            follow_up_date=a_data.get("follow_up_date"),
            activity_note=a_data.get("note")
        )
        db.add(activity)
        imported["activities"] += 1

    db.commit()
    return {"message": "بازیابی با موفقیت انجام شد", "imported": imported}
