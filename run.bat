@echo off
REM Runs on 3002 so it never fights with "npm run dev" / another process on 3001.
cd /d "%~dp0"
echo Starting MLEO website (port 3002)...
echo Open in browser: http://127.0.0.1:3002
call npm run dev:run-button
pause
