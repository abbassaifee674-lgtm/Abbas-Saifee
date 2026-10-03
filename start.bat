@echo off
title Abbas Saifee - Autonomous Job Hunter AI Agent
echo ======================================================================
echo    Starting Abbas Saifee Autonomous Job Hunter ^& Outreach Agent
echo ======================================================================
echo.
echo Starting FastAPI Web Server...
start "" /b python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000
timeout /t 2 >nul
echo.
echo Starting Cloudflare Public Tunnel for Remote Access...
start "" /b cloudflared tunnel --url http://127.0.0.1:8000
echo.
echo Local Dashboard: http://localhost:8000
echo Remote Public Link (TryCloudflare) is generating in background...
start http://localhost:8000
echo.
echo Press any key to stop...
pause
