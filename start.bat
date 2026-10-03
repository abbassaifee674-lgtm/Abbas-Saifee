@echo off
title Abbas Saifee - Autonomous Job Hunter AI Agent
echo ======================================================================
echo    Starting Abbas Saifee Autonomous Job Hunter ^& Outreach Agent
echo ======================================================================
echo.
echo Target Countries: Luxembourg, Austria, Singapore, Malaysia, Australia,
echo                   Norway, Denmark, New Zealand, South Africa, Germany,
echo                   France, Italy
echo.
echo Opening Web Dashboard at http://localhost:8000 ...
start http://localhost:8000
echo.
python run_agent.py --port 8000
pause
