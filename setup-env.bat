@echo off
echo Setting up Prime Academic Manager Environment...
echo.

:: Add bundled Node.js to PATH
set "NODE_HOME=%~dp0node_runtime\node-v20.18.0-win-x64"
set "PATH=%NODE_HOME%;%PATH%"

:: Verify Node.js and npm
echo Checking Node.js...
node --version
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js not found at %NODE_HOME%
    pause
    exit /b 1
)

echo Checking npm...
npm --version
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: npm not found
    pause
    exit /b 1
)

echo.
echo Environment is ready!
echo.
echo You can now run:
echo   npm install
echo   npm run dev
echo.
pause