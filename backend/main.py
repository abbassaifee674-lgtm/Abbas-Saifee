"""
FastAPI Server for Abbas Saifee Autonomous Job Hunter & Outreach Agent.
"""
import os
import asyncio
from fastapi import FastAPI, HTTPException, BackgroundTasks, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel
from typing import Optional, List

from backend.database import (
    init_db, get_db, get_setting, set_setting, 
    get_all_settings, log_activity
)
from backend.candidate import ABBAS_PROFILE, TARGET_COUNTRIES
from backend.job_hunter import run_full_scan, TARGET_COUNTRIES as COUNTRY_NAMES, get_daily_quota_stats
from backend.mailer import send_cold_email
from backend.pitch_generator import generate_cold_email
from backend.email_extractor import guess_recruitment_emails
from backend.cv_matcher import analyze_cv_match

app = FastAPI(title="Abbas Saifee Job Hunter AI Agent", version="1.1.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

async def daily_autonomous_worker():
    """Background task that automatically ensures 50 jobs are discovered and saved daily."""
    await asyncio.sleep(5)  # brief initial delay
    while True:
        try:
            quota = get_daily_quota_stats()
            if quota["found_today"] < 50:
                log_activity("AUTO_SCHEDULER", f"Autonomous daily target check: {quota['found_today']}/50 found today. Auto-fetching 50 fresh jobs...")
                await run_full_scan()
            else:
                log_activity("AUTO_SCHEDULER", f"Autonomous daily target satisfied: {quota['found_today']}/50 found today.")
        except Exception as e:
            print(f"Error in daily scheduler: {e}")
        # Check every 6 hours
        await asyncio.sleep(6 * 3600)

# Startup
@app.on_event("startup")
async def startup_event():
    init_db()
    cv_path = os.path.join(os.path.dirname(__file__), "..", "assets", "Abbas_Saifee_Procurement_CV.pdf")
    if not os.path.exists(cv_path):
        from generate_cv_pdf import generate_abbas_cv
        generate_abbas_cv(cv_path)
    # Launch autonomous daily scheduler in background
    asyncio.create_task(daily_autonomous_worker())

# Pydantic schemas
class ManualJobCreate(BaseModel):
    company: str
    title: str
    country: str
    location: Optional[str] = ""
    contact_email: Optional[str] = ""
    job_url: Optional[str] = ""
    company_domain: Optional[str] = ""
    description: Optional[str] = ""
    source_name: Optional[str] = "Manual Addition"

class UpdateEmailDraft(BaseModel):
    subject: str
    body: str
    contact_email: Optional[str] = None

class SettingsUpdate(BaseModel):
    smtp_server: Optional[str] = None
    smtp_port: Optional[str] = None
    smtp_user: Optional[str] = None
    smtp_password: Optional[str] = None
    sender_name: Optional[str] = None
    sender_email: Optional[str] = None
    test_mode: Optional[str] = None
    test_recipient_email: Optional[str] = None

# Background scanning lock
is_scanning = False

@app.get("/api/candidate")
def get_candidate_profile():
    return ABBAS_PROFILE

@app.get("/api/countries")
def get_countries():
    return TARGET_COUNTRIES

@app.get("/api/daily-quota")
def get_daily_quota():
    return get_daily_quota_stats()

@app.get("/api/stats")
def get_stats():
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute("SELECT COUNT(*) as total FROM jobs")
    total_jobs = cursor.fetchone()["total"]

    cursor.execute("SELECT COUNT(*) as count FROM jobs WHERE contact_email IS NOT NULL AND contact_email != ''")
    emails_found = cursor.fetchone()["count"]

    cursor.execute("SELECT COUNT(*) as count FROM jobs WHERE status IN ('SENT', 'TEST_SENT', 'SIMULATED_SENT')")
    emails_sent = cursor.fetchone()["count"]

    cursor.execute("SELECT COUNT(*) as count FROM jobs WHERE status = 'DRAFTED'")
    drafts_ready = cursor.fetchone()["count"]

    # Breakdown by country
    cursor.execute("SELECT country, COUNT(*) as count FROM jobs GROUP BY country")
    country_counts = {r["country"]: r["count"] for r in cursor.fetchall()}

    conn.close()

    daily_quota = get_daily_quota_stats()

    return {
        "total_jobs": total_jobs,
        "emails_found": emails_found,
        "emails_sent": emails_sent,
        "drafts_ready": drafts_ready,
        "is_scanning": is_scanning,
        "country_counts": country_counts,
        "target_countries_count": len(TARGET_COUNTRIES),
        "daily_quota": daily_quota
    }

@app.get("/api/jobs")
def get_jobs(
    country: Optional[str] = None,
    status: Optional[str] = None,
    search: Optional[str] = None
):
    conn = get_db()
    cursor = conn.cursor()

    query = "SELECT * FROM jobs WHERE 1=1"
    params = []

    if country and country != "All":
        query += " AND country = ?"
        params.append(country)

    if status and status != "All":
        query += " AND status = ?"
        params.append(status)

    if search:
        query += " AND (company LIKE ? OR title LIKE ? OR location LIKE ?)"
        term = f"%{search}%"
        params.extend([term, term, term])

    query += " ORDER BY id DESC"
    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()

    return [dict(r) for r in rows]

async def _run_scan_task(selected_countries: Optional[List[str]] = None):
    global is_scanning
    is_scanning = True
    try:
        await run_full_scan(selected_countries)
    finally:
        is_scanning = False

@app.post("/api/scan")
async def trigger_scan(background_tasks: BackgroundTasks, countries: Optional[List[str]] = None):
    global is_scanning
    if is_scanning:
        return {"status": "already_running", "message": "Agent scan is already in progress."}
    
    background_tasks.add_task(_run_scan_task, countries)
    return {"status": "started", "message": "Autonomous job search started across target countries."}

@app.post("/api/jobs/manual")
def add_manual_job(job: ManualJobCreate):
    conn = get_db()
    cursor = conn.cursor()

    email = job.contact_email
    if not email:
        guessed = guess_recruitment_emails(job.company, job.company_domain)
        email = guessed[0] if guessed else ""

    pitch = generate_cold_email(
        company_name=job.company,
        job_title=job.title,
        country=job.country
    )

    # Run CV match analysis
    match_result = analyze_cv_match(
        job_title=job.title,
        job_description=job.description or "",
        company_industry=""
    )
    cv_score = match_result["score"]
    cv_reasons_str = " • ".join(match_result["reasons"])
    from datetime import datetime
    today_str = datetime.now().strftime("%Y-%m-%d")

    source_name = job.source_name or "LinkedIn / Direct Addition"
    source_url = job.job_url or f"https://www.{job.company_domain}"

    cursor.execute("""
    INSERT INTO jobs (
        title, company, country, location, job_url, 
        company_domain, contact_email, email_source, 
        description, source_portal, source_name, source_url,
        cv_match_score, cv_match_reasons, discovered_date,
        status, email_subject, email_body
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        job.title, job.company, job.country, job.location,
        job.job_url, job.company_domain, email,
        "User Specified / Domain Match", job.description,
        source_name, source_name, source_url,
        cv_score, cv_reasons_str, today_str,
        "DRAFTED" if email else "DISCOVERED",
        pitch["subject"], pitch["body"]
    ))
    job_id = cursor.lastrowid
    conn.commit()
    conn.close()

    log_activity("MANUAL_JOB", f"Added manual opportunity: {job.title} at {job.company} ({job.country}) [CV Match: {cv_score}%]")
    return {"success": True, "job_id": job_id}

@app.put("/api/jobs/{job_id}/draft")
def update_email_draft(job_id: int, payload: UpdateEmailDraft):
    conn = get_db()
    cursor = conn.cursor()
    
    updates = ["email_subject = ?", "email_body = ?"]
    params = [payload.subject, payload.body]
    
    if payload.contact_email:
        updates.append("contact_email = ?")
        params.append(payload.contact_email)
        
    params.append(job_id)
    
    cursor.execute(f"UPDATE jobs SET {', '.join(updates)} WHERE id = ?", params)
    conn.commit()
    conn.close()
    return {"success": True, "message": "Draft updated successfully."}

@app.post("/api/jobs/{job_id}/send")
def send_job_email(job_id: int, recipient_override: Optional[str] = None):
    result = send_cold_email(job_id, recipient_override)
    return result

@app.post("/api/jobs/batch-send")
def batch_send(job_ids: List[int]):
    results = []
    for jid in job_ids:
        res = send_cold_email(jid)
        results.append({"job_id": jid, "result": res})
    return {"total": len(job_ids), "details": results}

@app.get("/api/cv/download")
def download_cv():
    cv_path = os.path.join(os.path.dirname(__file__), "..", "assets", "Abbas_Saifee_Procurement_CV.pdf")
    if not os.path.exists(cv_path):
        from generate_cv_pdf import generate_abbas_cv
        generate_abbas_cv(cv_path)
    return FileResponse(
        cv_path,
        media_type="application/pdf",
        filename="Abbas_Saifee_Procurement_CV.pdf"
    )

@app.get("/api/settings")
def get_settings():
    return get_all_settings()

@app.post("/api/settings")
def update_settings(payload: SettingsUpdate):
    for k, v in payload.dict(exclude_unset=True).items():
        if v is not None:
            set_setting(k, v)
    return {"success": True, "message": "Settings updated successfully."}

@app.get("/api/logs")
def get_logs(limit: int = 50):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM activity_logs ORDER BY id DESC LIMIT ?", (limit,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

# Static mount for frontend
frontend_dir = os.path.join(os.path.dirname(__file__), "..", "frontend")
if os.path.exists(frontend_dir):
    app.mount("/", StaticFiles(directory=frontend_dir, html=True), name="frontend")
