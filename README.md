# ProcureHunter AI – Autonomous Job Hunting & Outreach Agent for Abbas Saifee

**ProcureHunter AI** is an intelligent, autonomous job hunting and cold outreach agent engineered specifically for **Abbas Saifee** (Procurement Specialist with 6+ years experience in Aviation, Industrial & General Procurement, SAP MM, Capex/Opex budgets AED 12-15M).

---

## 🎯 Target Countries (12 Countries)
The agent is pre-configured and optimized to hunt procurement, sourcing, and purchasing roles across:
1. 🇱🇺 **Luxembourg** (Cargolux, Luxair, ArcelorMittal, SES Satellites, Ferrero, etc.)
2. 🇦🇹 **Austria** (FACC AG, Voestalpine, OMV Group, Andritz, Austrian Airlines)
3. 🇸🇬 **Singapore** (SIA Engineering Company, ST Engineering, SATS, Keppel, Dyson)
4. 🇲🇾 **Malaysia** (MAB Engineering, Petronas, Sime Darby, AirAsia, Nestlé)
5. 🇦🇺 **Australia** (Qantas, Boeing Australia, BHP, Rio Tinto, Virgin Australia)
6. 🇳🇴 **Norway** (Kongsberg Gruppen, Equinor, Yara International, Aker Solutions)
7. 🇩🇰 **Denmark** (Vestas Wind Systems, Maersk, DSV Global Transport, Danfoss, Novo Nordisk)
8. 🇳🇿 **New Zealand** (Air New Zealand, Fonterra, Fisher & Paykel Healthcare, Fletcher Building)
9. 🇿🇦 **South Africa** (Sasol, Anglo American, Transnet, Aspen Pharmacare, Denel Aviation)
10. 🇩🇪 **Germany** (Lufthansa Technik, Airbus Germany, Siemens, DHL Group, BASF, BMW)
11. 🇫🇷 **France** (Airbus France, Safran Group, Air France KLM, Schneider Electric, Danone)
12. 🇮🇹 **Italy** (Leonardo S.p.A., Eni, Pirelli, ITA Airways, Geven S.p.A.)

---

## ⚡ Core Features
1. **Autonomous Job Hunter Engine**:
   - Continuously scans active job openings and high-volume corporate career portals for roles such as *Procurement Specialist, Technical Buyer, Strategic Sourcing Specialist, Supply Chain & Purchasing Officer*.
2. **Contact & Email Extraction**:
   - Automatically uncovers and predicts direct talent acquisition, hiring team, and HR email addresses (`recruitment@`, `careers@`, `jobs@`, `hr@`).
3. **AI-Tailored Cold Pitch Generator**:
   - Crafts customized, high-converting outreach emails highlighting Abbas's exact achievements:
     - 6+ years in Aviation and Manufacturing Procurement.
     - Directing AED 12–15 Million in CAPEX and OPEX budgets at Gulf Aircraft & Engineering Services.
     - Sourcing OEM certified parts, managing AOG (Aircraft On Ground) emergency shipments.
     - SAP PRO HANA (MM module) and Wings ERP inventory optimization (MSL auto RQs).
     - BE Electronics from NED University + OTAR Part 145/43 Foundation.
     - Ready to relocate with contact number (`+971 564541753`), email, and LinkedIn.
4. **Official ATS-Optimized CV Generation & Attachment**:
   - Generates an executive, ATS-friendly PDF CV: `assets/Abbas_Saifee_Procurement_CV.pdf`.
   - Automatically attaches the CV to every cold email sent.
5. **Interactive Executive Web Dashboard**:
   - Modern glassmorphic dark theme dashboard accessible at `http://localhost:8000`.
   - Filter jobs by any of the 12 countries.
   - Review and customize email drafts before dispatching.
   - Safe Simulation mode to review without accidental dispatches.
   - Direct live sending via Gmail App Password / SMTP.
   - "Send All Approved" one-click batch application button.
   - Add custom companies or openings found manually anytime.

---

## 🚀 How to Run the Agent

### Method 1: Double-Click (Easiest)
Simply double-click the `start.bat` file in this folder. It will launch the agent and open the dashboard in your default browser.

### Method 2: Via Terminal / Command Line
1. Open PowerShell or Command Prompt in this folder (`c:\Users\Lenovo\Desktop\abbas`).
2. Run the Web Dashboard:
   ```powershell
   python run_agent.py --port 8000
   ```
3. Open your browser at:
   ```
   http://localhost:8000
   ```

### Command-Line Scan (Headless Mode):
- Scan all 12 countries directly:
  ```powershell
  python run_agent.py --scan-all
  ```
- Scan a specific country (e.g., Luxembourg):
  ```powershell
  python run_agent.py --country Luxembourg
  ```

---

## 📧 How to Configure Live Sending (Gmail SMTP)
By default, the agent runs in **Safe Simulation Mode** (emails are prepared and simulated so you can review everything safely).

To start sending real emails to companies from Abbas's email address:
1. Open the dashboard at `http://localhost:8000`.
2. Click the **⚙️ Settings** icon in the top right.
3. Switch **Operation Mode** from *Safe Simulation* to *Live Production Mode*.
4. Enter Abbas's **Google App Password** (Generated in Google Account > Security > 2-Step Verification > App Passwords).
5. Click **Save Settings**.
6. Now when you click **Send Now** or **Send All Approved**, the agent sends the email directly with `Abbas_Saifee_Procurement_CV.pdf` attached!

---

## 📂 Project Structure
```
abbas/
  ├── assets/
  │   └── Abbas_Saifee_Procurement_CV.pdf   # Official ATS-friendly PDF CV
  ├── backend/
  │   ├── main.py                          # FastAPI Server
  │   ├── candidate.py                     # Abbas Saifee's verified CV profile
  │   ├── job_hunter.py                    # Autonomous Hunter for 12 target countries
  │   ├── email_extractor.py               # Email regex and domain resolution
  │   ├── pitch_generator.py               # AI cold outreach email generator
  │   ├── mailer.py                        # SMTP sender with CV attachment
  │   └── database.py                      # SQLite storage & settings
  ├── frontend/
  │   ├── index.html                       # Modern Executive Dashboard
  │   ├── style.css                        # Glassmorphism dark styling
  │   └── app.js                           # Real-time UI logic & filtering
  ├── data/
  │   └── jobs.db                          # Discovered opportunities database
  ├── generate_cv_pdf.py                   # ReportLab CV generator script
  ├── run_agent.py                         # Unified runner CLI & Server
  ├── start.bat                            # 1-Click Windows launcher
  └── README.md
```
