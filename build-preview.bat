@echo off
chcp 65001 >nul
cd /d "%~dp0"
if not exist node_modules call npm install
call npm run build
if errorlevel 1 ( pause & exit /b 1 )
start "" http://localhost:4173
npm run preview
