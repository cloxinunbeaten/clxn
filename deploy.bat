@echo off
echo [1/3] Degisiklikler ekleniyor...
git add .

set /p commit_msg="Commit mesajini girin (Bos birakirsiniz 'auto update' olur): "
if "%commit_msg%"=="" set commit_msg=auto update

echo [2/3] Commit atiliyor...
git commit -m "%commit_msg%"

echo [3/3] GitHub'a push ediliyor...
git push origin main

echo.
echo ====================================
echo Basariyla yuklendi ve Netlify'a gonderildi!
echo ====================================
pause