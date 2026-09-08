import os
import io
import csv
import json
import time
import logging
from threading import Thread

import requests
from sqlalchemy.orm import joinedload

from database import SessionLocal
from models import Expert, Response, ResponseFactor, Activity, FactorBank

logger = logging.getLogger("backup_scheduler")

BACKUP_FOLDER = "backups"
DATE_FMT = "%Y%m%d_%H%M%S"


def collect_backup_data():
    db = SessionLocal()
    try:
        experts = db.query(Expert).all()
        responses = db.query(Response).options(joinedload(Response.factors)).all()
        activities = db.query(Activity).all()
        factors = db.query(FactorBank).all()

        return {
            "generated_at": time.strftime("%Y-%m-%d %H:%M:%S"),
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
                      "from_reference": f.is_from_reference_list, "rating": f.rating}
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
    finally:
        db.close()


def commit_file_to_github(repo, token, file_path, content_bytes, message):
    url = f"https://api.github.com/repos/{repo}/contents/{file_path}"
    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/vnd.github+json",
        "Content-Type": "application/json"
    }
    import base64
    body = {
        "message": message,
        "content": base64.b64encode(content_bytes).decode("utf-8")
    }
    existing = requests.get(url, headers=headers)
    if existing.status_code == 200:
        body["sha"] = existing.json().get("sha")
    resp = requests.put(url, headers=headers, json=body)
    return resp


def push_backup(date_str=None):
    token = os.environ.get("GITHUB_TOKEN", "").strip()
    repo = os.environ.get("GITHUB_REPO", "").strip()
    if not token or not repo:
        logger.warning("GITHUB_TOKEN or GITHUB_REPO not set; skipping backup")
        return False

    data = collect_backup_data()
    stamp = date_str or time.strftime(DATE_FMT)
    file_path = f"{BACKUP_FOLDER}/backup_{stamp}.json"
    content = json.dumps(data, ensure_ascii=False, indent=2).encode("utf-8")
    message = f"auto-backup {stamp}"

    try:
        resp = commit_file_to_github(repo, token, file_path, content, message)
        if resp.status_code in (200, 201):
            logger.info(f"Backup uploaded: {file_path}")
            return True
        logger.error(f"GitHub upload failed: {resp.status_code} {resp.text[:500]}")
    except Exception as e:
        logger.error(f"GitHub upload error: {e}")
    return False


def run_backup_in_background():
    def _job():
        try:
            push_backup()
        except Exception as e:
            logger.error(f"Backup job error: {e}")
    Thread(target=_job, daemon=True).start()


def start_scheduler():
    token = os.environ.get("GITHUB_TOKEN", "").strip()
    repo = os.environ.get("GITHUB_REPO", "").strip()
    if not token or not repo:
        logger.warning("Backup scheduler not started: set GITHUB_TOKEN and GITHUB_REPO")
        return

    interval = int(os.environ.get("BACKUP_INTERVAL_HOURS", "1"))
    run_backup_in_background()

    def _loop():
        while True:
            time.sleep(interval * 3600)
            try:
                push_backup()
            except Exception as e:
                logger.error(f"Backup loop error: {e}")

    Thread(target=_loop, daemon=True).start()
    logger.info(f"Backup scheduler started (every {interval}h)")
