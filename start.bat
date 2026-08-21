@echo off
cd /d "%~dp0backend"
echo ========================================
echo   Delphi Research System
echo   Starting server...
echo ========================================
echo.
pip install -r requirements.txt
echo.
echo Server: http://localhost:8000
echo Survey: http://localhost:8000/survey
echo.
start http://localhost:8000
python -m uvicorn main:app --host 0.0.0.0 --port 8000
pause
