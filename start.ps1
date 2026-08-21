$Host.UI.RawUI.WindowTitle = "Delphi Research System"
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location "$scriptPath\backend"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Delphi Research System" -ForegroundColor Cyan
Write-Host "  Starting server..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

pip install -r requirements.txt -q

Write-Host ""
Write-Host "Server: http://localhost:8000" -ForegroundColor Green
Write-Host "Survey: http://localhost:8000/survey" -ForegroundColor Green
Write-Host ""

Start-Process "http://localhost:8000"
python -m uvicorn main:app --host 0.0.0.0 --port 8000
