@echo off
chcp 65001 >nul
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Chua cai Node.js. Tai ban LTS tai https://nodejs.org roi chay lai file nay.
  pause
  exit /b 1
)
if not exist node_modules (
  echo Dang cai dat thu vien lan dau...
  call npm install
)
echo Dang build website...
call npm run build
if errorlevel 1 ( pause & exit /b 1 )
start "" http://localhost:3000
node server/index.js
pause
