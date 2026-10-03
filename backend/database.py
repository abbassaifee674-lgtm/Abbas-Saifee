"""
SQLite Database manager for Abbas Saifee Job Hunter & Outreach Agent.
"""
import sqlite3
import json
import os
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "jobs.db")

def get_db():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    cursor = conn.cursor()
    
    # Table for Jobs & Companies
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS jobs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        company TEXT NOT NULL,
        country TEXT NOT NULL,
        location TEXT,
        job_url TEXT,
        company_domain TEXT,
        contact_email TEXT,
        email_source TEXT,
        description TEXT,
        source_portal TEXT,
        source_name TEXT,
        source_url TEXT,
        cv_match_score INTEGER DEFAULT 88,
        cv_match_reasons TEXT,
        discovered_date TEXT,
        status TEXT DEFAULT 'DISCOVERED',
        email_subject TEXT,
        email_body TEXT,
        sent_at TIMESTAMP,
        error_msg TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # Alter table if existing database lacks new columns
    existing_cols = [c[1] for c in cursor.execute("PRAGMA table_info(jobs)").fetchall()]
    new_cols = [
        ("source_name", "TEXT"),
        ("source_url", "TEXT"),
        ("cv_match_score", "INTEGER DEFAULT 88"),
        ("cv_match_reasons", "TEXT"),
        ("discovered_date", "TEXT")
    ]
    for col_name, col_type in new_cols:
        if col_name not in existing_cols:
            try:
                cursor.execute(f"ALTER TABLE jobs ADD COLUMN {col_name} {col_type}")
            except Exception:
                pass

    # Table for Global Settings
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT
    )
    """)

    # Table for Activity Logs
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS activity_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        event_type TEXT,
        message TEXT,
        details TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    conn.commit()

    # Seed default settings if not exists
    default_settings = {
        "smtp_server": "smtp.gmail.com",
        "smtp_port": "587",
        "smtp_user": "abbasshabbir5153@gmail.com",
        "smtp_password": "",
        "sender_name": "Abbas Saifee",
        "sender_email": "abbasshabbir5153@gmail.com",
        "test_mode": "true",  # In test mode, emails can be simulated or sent to user's test address
        "test_recipient_email": "abbasshabbir5153@gmail.com",
        "auto_pitch_generation": "true",
        "cv_path": "assets/Abbas_Saifee_Procurement_CV.pdf"
    }

    for k, v in default_settings.items():
        cursor.execute("INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)", (k, v))
    conn.commit()
    conn.close()

def log_activity(event_type: str, message: str, details: str = ""):
    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO activity_logs (event_type, message, details) VALUES (?, ?, ?)",
            (event_type, message, details)
        )
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"Error logging activity: {e}")

def get_setting(key: str, default=None):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT value FROM settings WHERE key = ?", (key,))
    row = cursor.fetchone()
    conn.close()
    return row["value"] if row else default

def set_setting(key: str, value: str):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)", (key, str(value)))
    conn.commit()
    conn.close()

def get_all_settings():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT key, value FROM settings")
    rows = cursor.fetchall()
    conn.close()
    return {r["key"]: r["value"] for r in rows}
