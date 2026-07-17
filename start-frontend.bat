@echo off
cd /d "%~dp0"
set "NODE_HOME=%~dp0node_runtime\node-v20.18.0-win-x64"
set "PATH=%NODE_HOME%;%PATH%"
echo Starting frontend with Node.js from %NODE_HOME%
node --version
cd apps\frontend
echo.
echo Starting Next.js dev server on http://localhost:3000
echo Make sure the backend is running first (start-backend.bat)
echo.
call npm run dev
pause
