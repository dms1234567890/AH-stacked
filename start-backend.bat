@echo off
cd /d "%~dp0"
set "NODE_HOME=%~dp0node_runtime\node-v20.18.0-win-x64"
set "PATH=%NODE_HOME%;%PATH%"
echo Starting NestJS backend on http://localhost:3001
echo.
cd apps\backend

echo Building backend...
call "%NODE_HOME%\npm.cmd" run build
if %ERRORLEVEL% NEQ 0 (
    echo Backend build failed.
    pause
    exit /b 1
)
echo.
echo Starting backend on http://localhost:3001
echo.

"%NODE_HOME%\node.exe" --env-file=..\..\.env dist\main.js

echo.
echo Backend stopped.
pause
