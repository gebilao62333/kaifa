@echo off
chcp 65001 >nul
echo ========================================
echo    多客陪玩后端服务启动中...
echo ========================================
echo.
echo 正在启动服务...
echo.

cd /d "%~dp0"

"C:\Program Files\nodejs\node.exe" simple-server.js

pause
