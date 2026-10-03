"""
SMTP Mailer with CV attachment support and safe simulation mode.
"""
import smtplib
import os
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.application import MIMEApplication
from datetime import datetime
from backend.database import get_db, get_setting, log_activity

def send_cold_email(job_id: int, recipient_override: str = None) -> dict:
    """
    Sends the drafted email for a given job ID with Abbas's CV attached.
    """
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM jobs WHERE id = ?", (job_id,))
    job = cursor.fetchone()
    
    if not job:
        conn.close()
        return {"success": False, "error": f"Job with ID {job_id} not found."}

    recipient_email = recipient_override or job["contact_email"]
    if not recipient_email:
        conn.close()
        return {"success": False, "error": "No recipient email address available."}

    subject = job["email_subject"] or f"Application: {job['title']} – Abbas Saifee"
    body = job["email_body"]

    # Load settings
    smtp_server = get_setting("smtp_server", "smtp.gmail.com")
    smtp_port = int(get_setting("smtp_port", 587))
    smtp_user = get_setting("smtp_user", "abbasshabbir5153@gmail.com")
    smtp_password = get_setting("smtp_password", "")
    sender_name = get_setting("sender_name", "Abbas Saifee")
    sender_email = get_setting("sender_email", "abbasshabbir5153@gmail.com")
    test_mode = get_setting("test_mode", "true").lower() in ("true", "1", "yes")
    test_recipient = get_setting("test_recipient_email", "")

    cv_rel_path = get_setting("cv_path", "assets/Abbas_Saifee_Procurement_CV.pdf")
    base_dir = os.path.dirname(os.path.dirname(__file__))
    cv_full_path = os.path.join(base_dir, cv_rel_path)

    # If test mode is active and test_recipient is provided, we can route it there or simulate
    effective_recipient = recipient_email
    if test_mode and test_recipient and not recipient_override:
        # Route to user's test address while retaining original recipient in notes
        effective_recipient = test_recipient
        subject = f"[TEST SIMULATION for {job['company']}] {subject}"

    # Check if SMTP password is provided
    if not smtp_password or smtp_password.strip() == "":
        # Safe simulation mode
        cursor.execute(
            "UPDATE jobs SET status = 'SIMULATED_SENT', sent_at = ?, error_msg = 'Simulated (Add Gmail App Password in Settings to send live)' WHERE id = ?",
            (datetime.now().strftime("%Y-%m-%d %H:%M:%S"), job_id)
        )
        conn.commit()
        conn.close()
        
        log_activity(
            "EMAIL_SIMULATION",
            f"Simulated email send to {effective_recipient} for {job['company']}",
            f"Subject: {subject} | Attachment: {os.path.basename(cv_full_path)}"
        )
        return {
            "success": True,
            "simulated": True,
            "recipient": effective_recipient,
            "message": f"Simulated successfully! Email drafted for {job['company']} ({effective_recipient}). To send live emails, configure your SMTP password in Settings."
        }

    # Live SMTP send
    try:
        msg = MIMEMultipart()
        msg['From'] = f"{sender_name} <{sender_email}>"
        msg['To'] = effective_recipient
        msg['Subject'] = subject
        msg.attach(MIMEText(body, 'plain'))

        # Attach CV PDF
        if os.path.exists(cv_full_path):
            with open(cv_full_path, "rb") as f:
                attach = MIMEApplication(f.read(), _subtype="pdf")
                attach.add_header('Content-Disposition', 'attachment', filename=os.path.basename(cv_full_path))
                msg.attach(attach)
        else:
            log_activity("WARNING", f"CV PDF not found at {cv_full_path}")

        # Send via SMTP
        if smtp_port == 465:
            server = smtplib.SMTP_SSL(smtp_server, smtp_port, timeout=15)
        else:
            server = smtplib.SMTP(smtp_server, smtp_port, timeout=15)
            server.ehlo()
            server.starttls()
            server.ehlo()

        server.login(smtp_user, smtp_password)
        server.send_message(msg)
        server.quit()

        status_text = "TEST_SENT" if test_mode else "SENT"
        cursor.execute(
            "UPDATE jobs SET status = ?, sent_at = ?, error_msg = NULL WHERE id = ?",
            (status_text, datetime.now().strftime("%Y-%m-%d %H:%M:%S"), job_id)
        )
        conn.commit()
        conn.close()

        log_activity(
            "EMAIL_SENT",
            f"Email successfully dispatched to {effective_recipient} for {job['company']}",
            f"Status: {status_text}"
        )
        return {
            "success": True,
            "simulated": False,
            "recipient": effective_recipient,
            "message": f"Email successfully sent to {effective_recipient} with Abbas's CV attached!"
        }

    except Exception as e:
        err_msg = str(e)
        cursor.execute(
            "UPDATE jobs SET status = 'FAILED', error_msg = ? WHERE id = ?",
            (err_msg, job_id)
        )
        conn.commit()
        conn.close()
        log_activity("EMAIL_ERROR", f"Failed sending to {effective_recipient}: {err_msg}")
        return {"success": False, "error": err_msg}
