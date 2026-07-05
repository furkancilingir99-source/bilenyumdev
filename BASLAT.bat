@echo off
title Bilenyum - Yerel Sunucu
cd /d "%~dp0"
echo.
echo  Bilenyum yerel sunucu baslatiliyor...
echo  ONEMLI: Dosyaya cift tiklama — BASLAT.bat kullan!
echo.
echo  Tarayicida ac: http://localhost:3456/deneme-dersi-yoneticisi-dashboard
echo.
echo  Kapatmak icin bu pencereyi kapat veya Ctrl+C
echo.
start "" "http://localhost:3456/deneme-dersi-yoneticisi-dashboard"
npx --yes serve -l 3456 .
