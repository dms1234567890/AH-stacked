@echo off
cd /d "%~dp0"
set "NODE_HOME=%~dp0node_runtime\node-v20.18.0-win-x64"
set "PATH=%NODE_HOME%;%PATH%"
echo Setting up project with Node.js from %NODE_HOME%
node --version
npm --version
echo Installing dependencies...
npm install
echo.
echo Generating Prisma client...
cd database
npx prisma generate
cd ..
echo.
echo Starting development servers...
npm run dev
pause
