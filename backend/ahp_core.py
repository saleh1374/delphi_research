# -*- coding: utf-8 -*-
"""
هسته محاسبات ماژول «تحلیل سلسله‌مراتبی AHP»
===========================================
این ماژول مرحله دوم پژوهش است و هیچ دسترسی‌ای به داده‌های دلفی ندارد؛
صرفاً از روی خروجی راند دوم دلفی (عوامل امتیازخورده) سلسله‌مراتب را می‌سازد
و مقایسه‌های زوجی ذخیره‌شده خبرگان را محاسبه می‌کند.

روش‌ها:
  - وزن‌دهی: میانگین هندسی سطرها (Geometric Mean / Row)
  - سازگاری: λmax ، CI = (λmax-n)/(n-1) ، CR = CI/RI  (جدول RI ساتی)
  - تجمیع نظر خبرگان: میانگین هندسی عناصر هم‌سطحِ ماتریس‌ها
  - وزن نهایی: وزن بُعد × وزن محلی عامل داخل بُعد
"""
import math
from datetime import datetime, UTC
from itertools import combinations

# ── ثابت‌های کلی ────────────────────────────────────────────────────────────
GOAL = ("اولویت‌بندی عوامل مؤثر بر توسعه صادرات برق ایران "
        "با تأکید بر نیروگاه‌های تجدیدپذیر (خورشیدی)")

SCALE = "saaty_1_9"

DIMENSION_ORDER = [
    "زیرساخت و شبکه",
    "بازار و تنظیم‌گری",
    "اقتصادی و مالی",
    "فنی و فناوری",
    "راهبردی و رقابتی",
    "منطقه‌ای و ژئوپلیتیکی",
]

# جدول RI ساتی (Saaty)
RI_TABLE = {
    1: 0.0, 2: 0.0, 3: 0.58, 4: 0.90, 5: 1.12, 6: 1.24,
    7: 1.32, 8: 1.41, 9: 1.45, 10: 1.49, 11: 1.51, 12: 1.48,
}

# طیف ۱ تا ۹ ساتی + وارونه‌ها (برای نرمال‌سازی ورودی)
_SAATY_MAIN = [1, 2, 3, 4, 5, 6, 7, 8, 9]
SAATY_SET = sorted(set(_SAATY_MAIN + [1.0 / v for v in _SAATY_MAIN[1:]]))

SCALE_LABELS_FA = {
    1: "اهمیت برابر",
    2: "دو میانه (بین برابر و کمی مهم‌تر)",
    3: "کمی مهم‌تر",
    4: "دو میانه (بین کمی مهم‌تر و مهم‌تر)",
    5: "مهم‌تر",
    6: "دو میانه (بین مهم‌تر و خیلی مهم‌تر)",
    7: "خیلی مهم‌تر",
    8: "دو میانه (بین خیلی مهم‌تر و کاملاً مهم‌تر)",
    9: "کاملاً مهم‌تر",
}


def now_str():
    return datetime.now(UTC).strftime("%Y-%m-%d %H:%M:%S")


def normalize_text(text):
    """نرمال‌سازی متن عوامل برای تطبیق (یونیکد فارسی/عربی، نیم‌فاصله، فاصله‌ها)."""
    if not text:
        return ""
    t = str(text).replace("\u200c", " ").replace("\u200d", " ")
    t = t.replace("\u064a", "\u0649").replace("\u0643", "\u06a9")
    t = t.replace("\u06cc", "\u0649").replace("\u0643", "\u06a9")
    t = "\u06a9" if t == "\u0643" else t
    t = t.replace("\u064a", "\u06cc")
    t = " ".join(t.split())
    return t.strip()


def snap_saaty(value):
    """نرمال‌سازی مقدار به نزدیک‌ترین قضاوت ساتی (۱..۹ یا وارونه آن)."""
    try:
        v = float(value)
    except (TypeError, ValueError):
        return 1.0
    if v <= 0:
        return 1.0
    if v >= 1:
        return float(max(1, min(9, int(round(v)))))
    inv = 1.0 / v
    inv = float(max(1, min(9, int(round(inv)))))
    return 1.0 / inv


def fmt_value(value):
    """نمایش قضاوت: اعداد صحیح صحیح، وارونه‌ها کسری ساده."""
    v = float(value)
    if v == int(v):
        return int(v)
    inv = 1.0 / v
    if abs(inv - round(inv)) < 1e-9 and 1 <= round(inv) <= 9:
        return f"1/{int(round(inv))}"
    return round(v, 4)


# ── ساخت سلسله‌مراتب از روی داده‌های موجود ─────────────────────────────────
def _collect_delphi_factors(db):
    """عوامل امتیازخورده راند دوم دلفی + میانگین امتیاز دلفی."""
    from models import Response, ResponseFactor

    rows = (
        db.query(ResponseFactor, Response)
        .join(Response, ResponseFactor.response_id == Response.response_id)
        .filter(Response.round_no == 2)
        .all()
    )
    factors = {}
    for rf, resp in rows:
        if rf.rating is None:
            continue
        title = (rf.factor_text or "").strip()
        if not title:
            continue
        entry = factors.setdefault(title, {
            "title": title,
            "category": (rf.factor_category or "").strip() or None,
            "ratings": [],
            "response_ids": set(),
        })
        entry["ratings"].append(rf.rating)
        entry["response_ids"].add(resp.response_id)
        if not entry["category"] and rf.factor_category:
            entry["category"] = rf.factor_category.strip()
    return factors


def _fallback_from_factor_bank(db):
    """اگر راند دوم هنوز امتیازی ندارد، سلسله‌مراتب از بانک عوامل ساخته می‌شود."""
    from models import FactorBank

    rows = db.query(FactorBank).filter(FactorBank.is_active == True).all()  # noqa: E712
    seen = set()
    factors = {}
    for f in rows:
        title = (f.title or "").strip()
        if not title or title in seen:
            continue
        seen.add(title)
        factors[title] = {
            "title": title,
            "category": (f.category or "").strip() or None,
            "ratings": [],
            "response_ids": set(),
        }
    return factors


def build_hierarchy(db):
    """
    سلسله‌مراتب سه‌سطحی:
      سطح ۱ (هدف)  → GOAL
      سطح ۲ (ابعاد) → دسته‌های موجود (factor_bank.category / دسته عوامل راند ۲)
      سطح ۳ (عوامل) → عواملی که در راند ۲ دلفی امتیاز خورده‌اند
    """
    factors = _collect_delphi_factors(db)
    source = "round2"
    if not factors:
        factors = _fallback_from_factor_bank(db)
        source = "factor_bank"

    # اگر دسته عامل خالی بود، از بانک عوامل کمک بگیر
    bank_map = {}
    try:
        from models import FactorBank
        for f in db.query(FactorBank).all():
            key = normalize_text(f.title)
            if key and key not in bank_map:
                bank_map[key] = (f.category or "").strip()
    except Exception:
        pass
    for entry in factors.values():
        if not entry["category"]:
            entry["category"] = bank_map.get(normalize_text(entry["title"]), "") or "سایر"

    # گروه‌بندی عوامل بر اساس بُعد
    by_cat = {}
    for entry in factors.values():
        by_cat.setdefault(entry["category"], []).append(entry)

    ordered_cats = [c for c in DIMENSION_ORDER if c in by_cat]
    ordered_cats += sorted([c for c in by_cat if c not in DIMENSION_ORDER])

    dimensions = []
    for di, cat in enumerate(ordered_cats, 1):
        items = sorted(by_cat[cat], key=lambda e: e["title"])
        dim_factors = []
        for fi, entry in enumerate(items, 1):
            ratings = entry["ratings"]
            mean = round(sum(ratings) / len(ratings), 2) if ratings else None
            dim_factors.append({
                "code": f"{di}.{fi}",
                "title": entry["title"],
                "dimension": cat,
                "delphi_mean": mean,
                "delphi_count": len(ratings),
                "delphi_experts": len(entry["response_ids"]),
            })
        dimensions.append({
            "code": str(di),
            "title": cat,
            "factor_count": len(dim_factors),
            "comparison_count": len(dim_factors) * (len(dim_factors) - 1) // 2,
            "factors": dim_factors,
        })

    dim_pairs = len(dimensions) * (len(dimensions) - 1) // 2 if len(dimensions) > 1 else 0
    total_pairs = dim_pairs + sum(d["comparison_count"] for d in dimensions)

    return {
        "scale": SCALE,
        "source": source,
        "goal": GOAL,
        "hierarchy_levels": [
            {"level": 1, "name": "سطح هدف", "items": [{"code": "هدف", "title": GOAL}]},
            {"level": 2, "name": "ابعاد اصلی", "items": [
                {"code": d["code"], "title": d["title"], "parent": "goal",
                 "factor_count": d["factor_count"], "comparison_count": d["comparison_count"]}
                for d in dimensions
            ]},
            {"level": 3, "name": "عوامل", "items": [
                {"code": f["code"], "title": f["title"], "dimension": f["dimension"]}
                for d in dimensions for f in d["factors"]
            ]},
        ],
        "dimensions": dimensions,
        "counts": {
            "dimensions": len(dimensions),
            "factors": sum(d["factor_count"] for d in dimensions),
            "level2_comparisons": dim_pairs,
            "level3_comparisons": sum(d["comparison_count"] for d in dimensions),
            "total_comparisons": total_pairs,
        },
    }


def build_pair_list(hierarchy):
    """فهرست کامل مقایسه‌های زوجی (۱۵ مقایسه ابعاد + C(n,2) برای هر بُعد)."""
    dims = hierarchy["dimensions"]
    pairs = []
    for i, j in combinations(range(len(dims)), 2):
        pairs.append({
            "level": 2, "parent": "goal",
            "item_a": dims[i]["title"], "item_b": dims[j]["title"],
        })
    for dim in dims:
        titles = [f["title"] for f in dim["factors"]]
        for i, j in combinations(range(len(titles)), 2):
            pairs.append({
                "level": 3, "parent": dim["title"],
                "item_a": titles[i], "item_b": titles[j],
            })
    return pairs


def matrix_specs(hierarchy):
    """مشخصات ماتریس‌های موردنیاز: (سطح، والد، عنصرها)."""
    specs = [{
        "level": 2, "parent": "goal", "name": "ابعاد اصلی نسبت به هدف",
        "items": [d["title"] for d in hierarchy["dimensions"]],
    }]
    for dim in hierarchy["dimensions"]:
        specs.append({
            "level": 3, "parent": dim["title"],
            "name": f"عوامل بُعد «{dim['title']}»",
            "items": [f["title"] for f in dim["factors"]],
        })
    return specs


# ── ریاضیات AHP ─────────────────────────────────────────────────────────────
def build_matrix(items, values):
    """
    ساخت ماتریس مقایسه زوجی n×n از روی قضاوت‌ها.
    values: دیکشنری {(i, j): a_ij} برای i < j ؛ خانه‌های ناقص = 1 (بی‌طرف)
    خانه‌های قطری همیشه ۱ و خانه‌های پایین قطری وارونه بالای قطری.
    """
    n = len(items)
    matrix = [[1.0] * n for _ in range(n)]
    for (i, j), v in values.items():
        if not (0 <= i < n and 0 <= j < n) or i == j:
            continue
        val = float(v) if v else 1.0
        if val <= 0:
            val = 1.0
        if i < j:
            matrix[i][j] = val
            matrix[j][i] = 1.0 / val
        else:
            matrix[j][i] = val
            matrix[i][j] = 1.0 / val
    return matrix


def geometric_weights(matrix):
    """وزن محلی با میانگین هندسی سطرها (و نرمال‌سازی)."""
    n = len(matrix)
    if n == 0:
        return []
    weights = []
    for i in range(n):
        prod = 1.0
        for j in range(n):
            prod *= max(matrix[i][j], 1e-12)
        weights.append(prod ** (1.0 / n))
    total = sum(weights)
    if total <= 0:
        return [1.0 / n] * n
    return [w / total for w in weights]


def consistency(matrix, weights):
    """محاسبه λmax ، CI و CR برای یک ماتریس."""
    n = len(matrix)
    if n <= 1:
        return {"lambda_max": float(n), "ci": 0.0, "cr": 0.0, "ri": 0.0,
                "is_consistent": True}
    lam = 0.0
    for i in range(n):
        ws = sum(matrix[i][j] * weights[j] for j in range(n))
        if weights[i] > 0:
            lam += ws / weights[i]
    lambda_max = lam / n
    ci = (lambda_max - n) / (n - 1)
    ri = RI_TABLE.get(n, 1.49)
    cr = (ci / ri) if ri else 0.0
    return {
        "lambda_max": round(lambda_max, 4),
        "ci": round(ci, 4),
        "ri": round(ri, 4),
        "cr": round(cr, 4),
        "is_consistent": bool(cr < 0.1),
    }


def aggregate_geometric(matrices):
    """میانگین هندسی عناصر هم‌سطحِ ماتریس‌های خبرگان (ماتریس گروهی)."""
    if not matrices:
        return []
    n = len(matrices[0])
    group = [[1.0] * n for _ in range(n)]
    for i in range(n):
        for j in range(n):
            if i == j:
                continue
            vals = [m[i][j] for m in matrices if m and m[i][j] > 0]
            if not vals:
                group[i][j] = 1.0
                continue
            log_sum = sum(math.log(v) for v in vals)
            group[i][j] = math.exp(log_sum / len(vals))
    for i in range(n):
        group[i][i] = 1.0
        for j in range(i + 1, n):
            group[j][i] = 1.0 / group[i][j]
    return group


def _matrix_values(judgments, items, level, parent):
    """قضاوت‌های ذخیره‌شده یک ماتریس را به {(i,j): value} تبدیل می‌کند."""
    index = {title: i for i, title in enumerate(items)}
    values = {}
    for jb in judgments:
        if jb["level"] != level or jb["parent"] != parent:
            continue
        i = index.get(jb["item_a"])
        j = index.get(jb["item_b"])
        if i is None or j is None or i == j:
            continue
        if i > j:
            i, j = j, i
            value = 1.0 / jb["value"] if jb["value"] else 1.0
        else:
            value = jb["value"]
        values[(i, j)] = value
    return values


def _load_judgments(db):
    from models import AHPJudgment
    rows = db.query(AHPJudgment).all()
    return [{
        "expert_id": r.expert_id,
        "level": r.level,
        "parent": r.parent,
        "item_a": r.item_a,
        "item_b": r.item_b,
        "value": float(r.value),
        "date": r.updated_at.strftime("%Y-%m-%d %H:%M:%S") if r.updated_at else None,
    } for r in rows]


def _expert_names(db):
    from models import Expert
    return {e.expert_id: e.full_name for e in db.query(Expert).all()}


def _expert_orgs(db):
    from models import Expert
    return {e.expert_id: e.organization for e in db.query(Expert).all()}


def _analyze_group(hierarchy, judgments_by_expert):
    """ماتریس گروهی (میانگین هندسی همه خبرگان) + وزن‌ها و CR گروهی."""
    specs = matrix_specs(hierarchy)
    group_matrices = {}
    group_stats = []
    for spec in specs:
        per_expert = []
        for judgments in judgments_by_expert.values():
            values = _matrix_values(judgments, spec["items"], spec["level"], spec["parent"])
            if values:
                per_expert.append(build_matrix(spec["items"], values))
        matrix = aggregate_geometric(per_expert)
        weights = geometric_weights(matrix)
        stats = consistency(matrix, weights) if len(spec["items"]) > 1 else {
            "lambda_max": 1.0, "ci": 0.0, "ri": 0.0, "cr": 0.0, "is_consistent": True}
        group_matrices[(spec["level"], spec["parent"])] = matrix
        group_stats.append({
            "matrix": spec["name"], "level": spec["level"], "parent": spec["parent"],
            "size": len(spec["items"]), "experts_count": len(per_expert), **stats,
        })
    return group_matrices, group_stats


def compute_results(db, hierarchy, only_expert_id=None):
    """محاسبه کامل نتایج AHP (گروهی و تفکیکی خبرگان)."""
    judgments = _load_judgments(db)
    if only_expert_id is not None:
        judgments = [j for j in judgments if j["expert_id"] == only_expert_id]

    by_expert = {}
    for jb in judgments:
        by_expert.setdefault(jb["expert_id"], []).append(jb)

    names = _expert_names(db)
    orgs = _expert_orgs(db)
    specs = matrix_specs(hierarchy)
    total_pairs = hierarchy["counts"]["total_comparisons"]

    # ── ماتریس گروهی ──
    group_matrices, group_stats = _analyze_group(hierarchy, by_expert)

    # ── وزن بُعد (سطح ۲) ──
    dim_titles = [d["title"] for d in hierarchy["dimensions"]]
    dim_weights = geometric_weights(group_matrices[(2, "goal")]) if dim_titles else []
    dim_weight_map = {t: dim_weights[i] for i, t in enumerate(dim_titles)} if dim_weights else {}

    # ── وزن محلی عوامل داخل هر بُعد (سطح ۳) + وزن نهایی ──
    factors_out = []
    dim_out = []
    for di, dim in enumerate(hierarchy["dimensions"]):
        matrix = group_matrices.get((3, dim["title"]))
        items = [f["title"] for f in dim["factors"]]
        local = geometric_weights(matrix) if matrix else [1.0 / max(len(items), 1)] * len(items)
        dim_weight = dim_weight_map.get(dim["title"], 0.0)
        gstat = next((g for g in group_stats if g["level"] == 3 and g["parent"] == dim["title"]), None)
        dim_out.append({
            "code": dim["code"], "title": dim["title"],
            "weight": round(dim_weight, 6),
            "percent": round(dim_weight * 100, 2),
            "factor_count": dim["factor_count"],
            "comparison_count": dim["comparison_count"],
            "group_cr": gstat["cr"] if gstat else None,
            "group_ci": gstat["ci"] if gstat else None,
            "group_lambda_max": gstat["lambda_max"] if gstat else None,
            "group_is_consistent": gstat["is_consistent"] if gstat else None,
        })
        for fi, f in enumerate(dim["factors"]):
            lw = local[fi] if fi < len(local) else 0.0
            factors_out.append({
                "code": f["code"], "title": f["title"], "dimension": dim["title"],
                "local_weight": round(lw, 6),
                "global_weight": round(dim_weight * lw, 6),
                "percent": round(dim_weight * lw * 100, 2),
                "delphi_mean": f["delphi_mean"],
                "delphi_count": f["delphi_count"],
            })

    # رتبه‌بندی ابعاد و عوامل
    for rank, item in enumerate(sorted(dim_out, key=lambda x: x["weight"], reverse=True), 1):
        item["rank"] = rank
    for rank, item in enumerate(sorted(factors_out, key=lambda x: x["global_weight"], reverse=True), 1):
        item["rank"] = rank
    dim_out.sort(key=lambda x: x["rank"])
    factors_out.sort(key=lambda x: x["rank"])

    # ── سازگاری خبرگان ──
    expert_consistency = []
    for eid, ej in sorted(by_expert.items()):
        matrices_info = []
        answered_total = 0
        for spec in specs:
            values = _matrix_values(ej, spec["items"], spec["level"], spec["parent"])
            size = len(spec["items"])
            pairs_total = size * (size - 1) // 2
            answered_total += len(values)
            if size <= 1:
                continue
            matrix = build_matrix(spec["items"], values)
            weights = geometric_weights(matrix)
            stats = consistency(matrix, weights)
            matrices_info.append({
                "matrix": spec["name"], "level": spec["level"], "parent": spec["parent"],
                "answered": len(values), "total": pairs_total, **stats,
            })
        cr_values = [m["cr"] for m in matrices_info]
        cr_max = max(cr_values) if cr_values else 0.0
        expert_consistency.append({
            "expert_id": eid,
            "name": names.get(eid, f"نخبه {eid}"),
            "organization": orgs.get(eid, ""),
            "answered": answered_total,
            "total": total_pairs,
            "percent": round(answered_total / total_pairs * 100, 1) if total_pairs else 0.0,
            "completed": answered_total >= total_pairs,
            "cr_max": round(cr_max, 4),
            "inconsistent_matrices": sum(1 for m in matrices_info if not m["is_consistent"]),
            "is_consistent": bool(cr_max < 0.1),
            "matrices": matrices_info,
        })

    group_cr_max = max([g["cr"] for g in group_stats], default=0.0)

    charts_final = [{"code": f["code"], "title": f["title"], "weight": f["global_weight"]}
                    for f in sorted(factors_out, key=lambda x: x["global_weight"], reverse=True)]
    charts_dims = [{"title": d["title"], "weight": d["weight"]}
                   for d in sorted(dim_out, key=lambda x: x["weight"], reverse=True)]

    return {
        "generated_at": now_str(),
        "scale": SCALE,
        "goal": hierarchy["goal"],
        "experts_count": len(by_expert),
        "comparison_count": len(judgments),
        "total_comparisons": total_pairs,
        "dimensions": dim_out,
        "factors": factors_out,
        "consistency": {
            "group": group_stats,
            "group_cr_max": round(group_cr_max, 4),
            "group_is_consistent": bool(group_cr_max < 0.1),
            "experts": expert_consistency,
        },
        "charts": {"final_weights": charts_final, "dimension_weights": charts_dims},
        "totals": {
            "global_weight_sum": round(sum(f["global_weight"] for f in factors_out), 6),
            "dimension_weight_sum": round(sum(d["weight"] for d in dim_out), 6),
        },
    }


def expert_progress(db, hierarchy=None):
    """پیشرفت هر خبره در پرسشنامه مقایسه زوجی (با اولویت خبرگان راند اول دلفی)."""
    from models import Expert, Response

    if hierarchy is None:
        hierarchy = build_hierarchy(db)
    total = hierarchy["counts"]["total_comparisons"]
    judgments = _load_judgments(db)
    counts = {}
    for jb in judgments:
        counts[jb["expert_id"]] = counts.get(jb["expert_id"], 0) + 1

    round1_experts = {
        r.expert_id for r in db.query(Response).filter(Response.round_no == 1).all()
    }

    experts = db.query(Expert).filter(Expert.is_active_delphi == True).all()  # noqa: E712
    out = []
    for e in experts:
        answered = counts.get(e.expert_id, 0)
        out.append({
            "expert_id": e.expert_id,
            "name": e.full_name,
            "organization": e.organization,
            "position": e.position,
            "phone": e.phone,
            "email": e.email,
            "role": e.role or "expert",
            "in_round1": e.expert_id in round1_experts,
            "answered": min(answered, total),
            "total": total,
            "percent": round(min(answered, total) / total * 100, 1) if total else 0.0,
            "completed": answered >= total and total > 0,
        })
    # اولویت با خبرگان راند اول دلفی، سپس درصد پیشرفت
    out.sort(key=lambda x: (-x["percent"], not x["in_round1"], x["name"]))
    return out


def ahp_json_block(db, hierarchy=None, results=None):
    """
    بلوک «ahp» برای خروجی JSON سایت (فرمت بکاپ):
    {scale, hierarchy_levels, comparisons, results}
    """
    if hierarchy is None:
        hierarchy = build_hierarchy(db)
    if results is None:
        results = compute_results(db, hierarchy)

    comparisons = [{
        "expert_id": jb["expert_id"],
        "level": jb["level"],
        "parent": jb["parent"],
        "item_a": jb["item_a"],
        "item_b": jb["item_b"],
        "value": round(float(jb["value"]), 6),
        "value_label": fmt_value(jb["value"]),
        "date": jb["date"],
    } for jb in _load_judgments(db)]

    return {
        "scale": SCALE,
        "goal": hierarchy["goal"],
        "hierarchy_levels": hierarchy["hierarchy_levels"],
        "counts": hierarchy["counts"],
        "comparisons": comparisons,
        "results": results,
    }
