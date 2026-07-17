@echo off
cd /d "%~dp0"
set "NODE_HOME=%~dp0node_runtime\node-v20.18.0-win-x64"
set "PATH=%NODE_HOME%;%PATH%"

echo ============================================
echo INSTALL ALL - Prime Academic Manager
echo ============================================
echo.

echo [1/4] Installing workspace dependencies...
call npm install
echo.

echo [2/4] Generating Prisma client...
cd database
call "%NODE_HOME%\npx.cmd" prisma generate
cd ..
echo.

echo [3/4] Checking database connection...
call npm run db:check
if %ERRORLEVEL% NEQ 0 (
    echo Database connection check failed. Update DATABASE_URL and run install-all.bat again.
    pause
    exit /b 1
)
echo.

echo [4/4] Pushing database schema...
echo.
call npm run db:push
echo.

echo ============================================
echo Setup Complete!
echo ============================================
echo.
echo IMPORTANT: If you saw a database connection error above:
echo   1. Update DATABASE_URL in .env with a working PostgreSQL URL
echo   2. Run npm run db:check
echo   3. Then run install-all.bat again
echo.
echo If setup succeeded, next steps:
echo   1. Run seed-from-sheets.bat to import data (optional)
echo   2. Run start-backend.bat
echo   3. Run start-frontend.bat
echo   4. Open http://localhost:3000
echo.
pause
