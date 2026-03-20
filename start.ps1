# VoiceGuard — Deepfake Detection System
# PowerShell Startup Script
# Run: Right-click → "Run with PowerShell"  OR  pwsh start.ps1

$Host.UI.RawUI.WindowTitle = "VoiceGuard Startup"

Write-Host ""
Write-Host " ╔══════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host " ║    VoiceGuard — Deepfake Voice Detection     ║" -ForegroundColor Cyan
Write-Host " ║         Startup Script (PowerShell)          ║" -ForegroundColor Cyan
Write-Host " ╚══════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$backend  = Join-Path $root "backend"
$frontend = Join-Path $root "frontend"

# ── Check prerequisites ────────────────────────────────────────────────────
function Require($cmd, $install) {
    if (-not (Get-Command $cmd -ErrorAction SilentlyContinue)) {
        Write-Host " [ERROR] '$cmd' not found. Install from $install" -ForegroundColor Red
        exit 1
    }
    $ver = & $cmd --version 2>&1
    Write-Host " [OK] $cmd $ver" -ForegroundColor Green
}

Require "python" "https://python.org"
Require "node"   "https://nodejs.org"
Require "npm"    "https://nodejs.org"

# ── Install backend deps ───────────────────────────────────────────────────
Write-Host ""
Write-Host " Installing backend dependencies..." -ForegroundColor Yellow
Set-Location $backend
pip install -r requirements.txt -q
Write-Host " [OK] Backend dependencies ready" -ForegroundColor Green

# ── Install frontend deps ──────────────────────────────────────────────────
Write-Host ""
Write-Host " Installing frontend dependencies..." -ForegroundColor Yellow
Set-Location $frontend
if (-not (Test-Path "node_modules")) {
    npm install --silent
    Write-Host " [OK] Frontend packages installed" -ForegroundColor Green
} else {
    Write-Host " [OK] node_modules already present" -ForegroundColor Green
}

# ── Run backend self-test ──────────────────────────────────────────────────
Write-Host ""
Write-Host " Running backend self-test..." -ForegroundColor Yellow
Set-Location $backend
python test_backend.py

# ── Launch servers ─────────────────────────────────────────────────────────
Write-Host ""
Write-Host " Starting servers..." -ForegroundColor Cyan
Write-Host ""
Write-Host "   Backend  → http://localhost:8000"     -ForegroundColor White
Write-Host "   Frontend → http://localhost:3000"     -ForegroundColor White
Write-Host "   API Docs → http://localhost:8000/docs" -ForegroundColor White
Write-Host ""

# Backend in new terminal
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$backend'; Write-Host 'Starting FastAPI backend...' -ForegroundColor Cyan; uvicorn main:app --reload --host 0.0.0.0 --port 8000"

# Wait then launch frontend
Start-Sleep -Seconds 2
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$frontend'; Write-Host 'Starting React frontend...' -ForegroundColor Cyan; npm start"

Write-Host " Both servers launched in separate windows." -ForegroundColor Green
Write-Host " Browser will open automatically at http://localhost:3000" -ForegroundColor Green
Write-Host ""
Write-Host " Press Enter to close this window." -ForegroundColor Gray
Read-Host
