@echo off
cd /d "%~dp0"
set "NODE_HOME=%~dp0node_runtime\node-v20.18.0-win-x64"
set "PATH=%NODE_HOME%;%PATH%"
echo Running Cloudinary test with Node.js from %NODE_HOME%
node scripts/cloudinary-test.js
pause