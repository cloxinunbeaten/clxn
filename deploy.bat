@echo off
setlocal
cd /d "C:\Users\harun\Downloads\cloxin"

echo ====================================
echo   GITHUB OTOMATIK YUKLEME ARACI
echo ====================================
echo.

echo [1/4] Degisiklikler kontrol ediliyor ve ekleniyor...
git add .
REM Uyarıların hata kodu tetiklemesini önlemek için hata seviyesi sıfırlanır
ver > nul
echo [BILGI] Degisiklikler eklendi.
echo.

set /p commit_msg="Commit mesajini girin (Bos birakirsiniz 'auto update' olur): "
if "%commit_msg%"=="" set commit_msg=auto update

echo.
echo [2/4] Commit atiliyor... ("%commit_msg%")
git commit -m "%commit_msg%"
if %errorlevel% neq 0 (
    echo [HATA] Commit atilamadi!
    goto HATA
)
echo [BILGI] Commit basariyla olusturuldu.
echo.

echo [3/4] GitHub'a push ediliyor...
git push origin main
if %errorlevel% neq 0 (
    echo [HATA] GitHub'a gonderim ^(push^) basarisiz oldu!
    goto HATA
)
echo [BILGI] GitHub'a gonderim basarili!
echo.

echo ====================================
echo [4/4] Basariyla yuklendi ve VPS deploy akisi tetiklendi!
echo ====================================
goto SON

:HATA
echo.
echo ====================================
echo [X] ISLEM BASARISIZ OLDU! Lutfen yukaridaki hata mesajini inceleyin.
echo ====================================

:SON
echo.
endlocal
pause