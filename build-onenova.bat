@echo off
chcp 65001 >nul
cd /d "%~dp0"
if not exist node_modules call npm install
call npm run build:onenova > build-onenova.log 2>&1
set ERR=%errorlevel%
type build-onenova.log
if not "%ERR%"=="0" ( echo. & echo BUILD LOI - xem build-onenova.log & pause & exit /b 1 )
echo.
echo Da tao: dist-onenova\huong-dan-nguoi-tham-gia-onenova.html
pause
