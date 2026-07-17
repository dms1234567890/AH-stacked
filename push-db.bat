@echo off
cd /d "%~dp0"
set "NODE_HOME=%~dp0node_runtime\node-v20.18.0-win-x64"
set "PATH=%NODE_HOME%;%PATH%"
echo Pushing database schema with Node.js from %NODE_HOME%
node --version
call npm run db:check
if %ERRORLEVEL% NEQ 0 (
    echo Database connection check failed. Update DATABASE_URL and try again.
    pause
    exit /b 1
)
call npm run db:push
pause
