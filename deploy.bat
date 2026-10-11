@echo off
cd /d "%~dp0"
if errorlevel 1 exit /b 1

echo [1/3] Degisiklikler ekleniyor...
git add -A
if errorlevel 1 exit /b 1

set "commit_msg=%~1"
if "%commit_msg%"=="" set commit_msg=auto update

echo [2/3] Commit atiliyor...
git commit -m "%commit_msg%"
if errorlevel 1 exit /b 1

echo [3/3] GitHub'a push ediliyor...
git push origin main
if errorlevel 1 exit /b 1

echo.
echo ====================================
echo Basariyla yuklendi ve VPS deploy akisi tetiklendi!
echo ====================================
pause