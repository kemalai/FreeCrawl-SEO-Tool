@echo off
setlocal EnableDelayedExpansion
title FreeCrawl SEO Tool - Launcher
color 0B

cd /d "%~dp0"

echo ============================================================
echo   FreeCrawl SEO Tool - Launcher
echo ============================================================
echo.

REM ---- 1) Node.js kontrolu --------------------------------------------------
where node >nul 2>nul
if errorlevel 1 (
    echo [HATA] Node.js bulunamadi.
    echo.
    echo FreeCrawl SEO Tool Node.js 22+ gerektirir.
    echo Lutfen https://nodejs.org/ adresinden LTS surumunu indirip kurun.
    echo Kurulumdan sonra bu BAT dosyasini tekrar calistirin.
    echo.
    pause
    exit /b 1
)

for /f "tokens=*" %%v in ('node -v') do set NODE_VERSION=%%v
echo [OK] Node.js bulundu: !NODE_VERSION!

REM ---- 2) npm kontrolu ------------------------------------------------------
where npm >nul 2>nul
if errorlevel 1 (
    echo [HATA] npm bulunamadi. Node.js kurulumunuz bozuk olabilir.
    echo.
    pause
    exit /b 1
)
for /f "tokens=*" %%v in ('npm -v') do set NPM_VERSION=%%v
echo [OK] npm bulundu: v!NPM_VERSION!

echo.

REM ---- 3) Bagimliliklarin kurulu olup olmadigi --------------------------------
set NEED_INSTALL=0
if not exist "node_modules" (
    set NEED_INSTALL=1
) else if not exist "apps\desktop\node_modules" (
    set NEED_INSTALL=1
) else if not exist "node_modules\electron" (
    set NEED_INSTALL=1
)

if "!NEED_INSTALL!"=="1" (
    echo [BILGI] Gerekli kutuphaneler yuklu degil veya eksik.
    echo.
    echo Bu islem ilk calistirmada birkac dakika surebilir ve yaklasik
    echo 500-800 MB disk alani kullanir.
    echo.
    set /p CONFIRM="Kutuphaneleri simdi yuklemek istiyor musunuz? (E/H): "
    if /i "!CONFIRM!"=="E" goto DO_INSTALL
    if /i "!CONFIRM!"=="Y" goto DO_INSTALL
    echo.
    echo Kurulum iptal edildi. Program baslatilamaz.
    pause
    exit /b 1

    :DO_INSTALL
    echo.
    echo ------------------------------------------------------------
    echo   npm install calisiyor...
    echo ------------------------------------------------------------
    call npm install
    if errorlevel 1 (
        echo.
        echo [HATA] npm install basarisiz oldu. Internet baglantinizi
        echo kontrol edin veya hata mesajini inceleyin.
        pause
        exit /b 1
    )
    echo.
    echo [OK] Kutuphaneler basariyla yuklendi.
    echo.
) else (
    echo [OK] Gerekli kutuphaneler yuklu.
    echo.
)

REM ---- 4) Uygulamayi baslat -------------------------------------------------
echo ============================================================
echo   FreeCrawl SEO Tool baslatiliyor (npm run dev)...
echo   Bu pencereyi KAPATMAYIN - uygulamanin yasam dongusu buna bagli.
echo ============================================================
echo.

call npm run dev

echo.
echo ------------------------------------------------------------
echo   Uygulama kapatildi.
echo ------------------------------------------------------------
pause
endlocal
