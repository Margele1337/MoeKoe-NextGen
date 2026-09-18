@echo off
cd /d "%~dp0"

echo ============================================
echo   MoeKoe Music - Dev Mode
echo ============================================
echo.

:: Clean up stale processes from previous run
echo   Cleaning up old processes...
for /f "tokens=5" %%p in ('netstat -ano ^| findstr ":6521"') do taskkill /F /PID %%p >nul 2>&1
for /f "tokens=5" %%p in ('netstat -ano ^| findstr ":8080"') do taskkill /F /PID %%p >nul 2>&1

:: ELECTRON_RUN_AS_NODE is cleared by electron/start-electron.cjs

echo.
echo   API  : http://localhost:6521
echo   Web  : http://localhost:8080
echo ============================================
echo.

start "API" /D "%~dp0" cmd /k "npm run api"
start "Vite" /D "%~dp0" cmd /k "npm run serve"

echo   Waiting for Vite to start...
timeout /t 4 /nobreak >nul

echo   Starting Electron...
start "MoeKoe Music" /D "%~dp0" cmd /k "npm run electron:serve"

echo.
echo   Done. Check the 3 terminal windows for status.
echo   If Electron window doesn't appear, check its terminal for errors.
