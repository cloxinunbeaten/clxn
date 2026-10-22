@echo off
setlocal
cd /d "%~dp0"
if errorlevel 1 goto :fail

set "commit_msg=%~1"
if "%commit_msg%"=="" set "commit_msg=auto update"

echo [1/4] Degisiklikler ekleniyor...
git add -A
if errorlevel 1 goto :fail

echo [2/4] Commit atiliyor...
git diff --cached --quiet
if errorlevel 1 (
  git commit -m "%commit_msg%"
  if errorlevel 1 goto :fail
) else (
  echo Yeni degisiklik yok, bekleyen commitler gonderilecek.
)

echo [3/4] GitHub'daki degisiklikler aliniyor...
git pull --rebase --autostash -X theirs origin main
if errorlevel 1 (
  echo.
  echo Birlestirme basarisiz oldu, islem geri aliniyor...
  git rebase --abort >nul 2>&1
  goto :fail
)

echo [4/4] GitHub'a push ediliyor...
git push origin main
if errorlevel 1 (
  echo Push reddedildi, bir kez daha deneniyor...
  git pull --rebase --autostash -X theirs origin main
  if errorlevel 1 (
    git rebase --abort >nul 2>&1
    goto :fail
  )
  git push origin main
  if errorlevel 1 goto :fail
)

echo.
echo ====================================
echo Basariyla yuklendi ve VPS deploy akisi tetiklendi!
echo ====================================
pause
exit /b 0

:fail
echo.
echo ====================================
echo HATA: Yukleme tamamlanamadi. Yukaridaki mesaji kontrol et.
echo ====================================
pause
exit /b 1