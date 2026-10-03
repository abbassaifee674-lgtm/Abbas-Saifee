"""
Runner script for Abbas Saifee Job Hunter AI Agent.
Supports both Web Dashboard and Autonomous CLI Mode.
"""
import sys
import os
import argparse
import asyncio
import uvicorn

# Add current workspace to sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from backend.database import init_db
from backend.job_hunter import run_full_scan, TARGET_COUNTRIES
from generate_cv_pdf import generate_abbas_cv

def main():
    parser = argparse.ArgumentParser(description="Abbas Saifee Autonomous Job Hunter & Outreach Agent")
    parser.add_argument("--server", action="store_true", default=True, help="Start the interactive Web Dashboard")
    parser.add_argument("--port", type=int, default=8000, help="Port to run the dashboard on (default: 8000)")
    parser.add_argument("--scan-all", action="store_true", help="Run full scan for all 12 target countries via CLI")
    parser.add_argument("--country", type=str, help="Run scan for a specific country (e.g. 'Luxembourg', 'Singapore')")

    args = parser.parse_args()

    # 1. Initialize Database
    init_db()

    # 2. Ensure CV PDF is generated
    cv_path = os.path.join(os.path.dirname(__file__), "assets", "Abbas_Saifee_Procurement_CV.pdf")
    if not os.path.exists(cv_path):
        print("[*] Generating official PDF CV for Abbas Saifee...")
        generate_abbas_cv(cv_path)

    # 3. Handle CLI Scan
    if args.scan_all or args.country:
        selected = [args.country] if args.country else TARGET_COUNTRIES
        print(f"[*] Starting Autonomous Job Hunter for countries: {', '.join(selected)}")
        discovered = asyncio.run(run_full_scan(selected))
        print(f"[+] Scan complete! Found {len(discovered)} procurement opportunities with generated cold outreach drafts.")
        return

    # 4. Start Web Dashboard
    print("=" * 70)
    print("  🚀 Abbas Saifee – Autonomous Procurement Job Hunter AI Agent")
    print("=" * 70)
    print(f"  Target Countries: 12 (Luxembourg, Singapore, Germany, Australia, etc.)")
    print(f"  Candidate: Abbas Saifee (Procurement Specialist | 6+ Yrs)")
    print(f"  Dashboard URL: http://localhost:{args.port}")
    print("=" * 70)

    uvicorn.run("backend.main:app", host="0.0.0.0", port=args.port, reload=False)

if __name__ == "__main__":
    main()
