@echo off
title VoiceGuard — Deepfake Detection System
color 0A

echo.
echo  ╔══════════════════════════════════════════════╗
echo  ║    VoiceGuard — Deepfake Voice Detection     ║
echo  ║         Startup Script (Windows)             ║
echo  ╚══════════════════════════════════════════════╝
echo.

:: ── Check Python ──────────────────────────────────────────────────────────
where python >nul 2>nul
if errorlevel 1 (
    echo  [ERROR] Python not found. Install from https://python.org
    pause
    exit /b 1
)
echo  [OK] Python found
python --version

:: ── Check Node ────────────────────────────────────────────────────────────
where node >nul 2>nul
if errorlevel 1 (
    echo  [ERROR] Node.js not found. Install from https://nodejs.org
    pause
    exit /b 1
)
echo  [OK] Node.js found
node --version

echo.
echo  ── Installing backend dependencies ───────────────────────────
cd /d "%~dp0backend"
pip install -r requirements.txt --quiet
echo  [OK] Backend dependencies installed

echo.
echo  ── Installing frontend dependencies ──────────────────────────
cd /d "%~dp0frontend"
if not exist node_modules (
    echo  Installing npm packages (first time — may take a minute)...
    npm install --silent
    echo  [OK] Frontend packages installed
) else (
    echo  [OK] node_modules already present
)

echo.
echo  ── Running backend self-test ─────────────────────────────────
cd /d "%~dp0backend"
python test_backend.py
echo.

echo  ── Starting servers ──────────────────────────────────────────
echo.
echo  Backend  → http://localhost:8000
echo  Frontend → http://localhost:3000
echo  API Docs → http://localhost:8000/docs
echo.
echo  Press Ctrl+C in each window to stop.
echo.
pause

:: Start backend in new window
start "VoiceGuard Backend" cmd /k "cd /d "%~dp0backend" && uvicorn main:app --reload --host 0.0.0.0 --port 8000"

:: Wait a moment then start frontend
timeout /t 3 /nobreak >nul
start "VoiceGuard Frontend" cmd /k "cd /d "%~dp0frontend" && npm start"

echo.
echo  Both servers are starting in separate windows.
echo  The browser will open automatically.
echo.
pause
