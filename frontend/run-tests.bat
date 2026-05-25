@echo off
echo ========================================
echo 多客陪玩前端 - 测试覆盖率运行脚本
echo ========================================
echo.

cd /d "%~dp0"

echo [1/3] 检查Node.js环境...
node --version >nul 2>&1
if errorlevel 1 (
    echo [错误] 未找到Node.js，请先安装Node.js 18+
    echo 下载地址: https://nodejs.org/
    pause
    exit /b 1
)

echo [OK] Node.js环境检查通过
echo.

echo [2/3] 安装项目依赖...
call npm install
if errorlevel 1 (
    echo [错误] 依赖安装失败
    pause
    exit /b 1
)

echo [OK] 依赖安装完成
echo.

echo [3/3] 运行覆盖率测试...
echo.
call npm run test:coverage

if errorlevel 1 (
    echo.
    echo [错误] 测试失败，请检查上方错误信息
    pause
    exit /b 1
)

echo.
echo ========================================
echo 测试完成！
echo ========================================
echo.
echo 覆盖率报告已生成在: coverage/index.html
echo.

set /p open_report=是否打开覆盖率报告？(Y/N):
if /i "%open_report%"=="Y" (
    start coverage/index.html
)

pause
