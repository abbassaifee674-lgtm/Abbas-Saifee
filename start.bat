@echo off
title JobPilot - Autonomous Job Hunter ^& Outreach Dashboard
echo ======================================================================
echo    Starting JobPilot for Abbas Saifee (abbassaifee674@gmail.com)
echo ======================================================================
echo.
echo Starting Next.js Dev Server...
start "" /b npm run dev
timeout /t 4 >nul
echo.
echo Opening JobPilot Dashboard at http://localhost:3000 ...
start http://localhost:3000
echo.
echo Dashboard is running in background.
echo Press any key to stop...
pause
