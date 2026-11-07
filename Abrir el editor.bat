@echo off
chcp 65001 >nul
title Design System Creator
cd /d "%~dp0"
where node >nul 2>nul || (echo No encuentro Node.js. Pide a Claude que lo instale. & pause & exit /b 1)
if not exist "web\node_modules" (echo Preparando la web por primera vez, tarda un par de minutos... & pushd web & call npm install & popd)
node servidor.mjs --abrir
pause
