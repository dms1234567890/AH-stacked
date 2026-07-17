@echo off
cd /d "%~dp0"
set "NODE_HOME=%~dp0node_runtime\node-v20.18.0-win-x64"
set "PATH=%NODE_HOME%;%PATH%"
echo.
echo === Seed Data from Google Sheets to PostgreSQL ===
echo.
echo This script will:
echo 1. Read your existing Google Sheets data
echo 2. Create users (login credentials) in PostgreSQL
echo 3. Import employees, teachers, subjects, batches, admissions
echo.
echo Your Google Sheets login credentials will work for the new app!
echo.
echo IMPORTANT: Make sure your .env file has the Google Service Account
echo credentials configured correctly.
echo.
pause

:: Run the seed script
echo.
echo Step 1: Running seed script...
echo This will read from your Google Sheets and populate PostgreSQL...
echo.
call "%NODE_HOME%\npx.cmd" ts-node scripts/seed-from-sheets.ts
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: Seed script failed
    echo.
    echo Common issues:
    echo - Google Service Account credentials not configured in .env
    echo - PostgreSQL database URL not configured in .env
    echo - Google Sheets not shared with service account email
    echo.
    pause
    exit /b 1
)

echo.
echo === Seeding Complete! ===
echo You can now log in with your existing Google Sheets credentials.
echo.
echo Next steps:
echo 1. Run "start-backend.bat" to start the API server
echo 2. Run "start-frontend.bat" to start the web app
echo 3. Open http://localhost:3000 in your browser
echo.
pause
