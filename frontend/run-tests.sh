#!/bin/bash

echo "========================================"
echo "多客陪玩前端 - 测试覆盖率运行脚本"
echo "========================================"
echo ""

echo "[1/3] 检查Node.js环境..."
if ! command -v node &> /dev/null; then
    echo "[错误] 未找到Node.js，请先安装Node.js 18+"
    echo "下载地址: https://nodejs.org/"
    exit 1
fi

node_version=$(node --version)
echo "[OK] Node.js版本: $node_version"
echo ""

echo "[2/3] 安装项目依赖..."
npm install
if [ $? -ne 0 ]; then
    echo "[错误] 依赖安装失败"
    exit 1
fi

echo "[OK] 依赖安装完成"
echo ""

echo "[3/3] 运行覆盖率测试..."
echo ""
npm run test:coverage

if [ $? -ne 0 ]; then
    echo ""
    echo "[错误] 测试失败，请检查上方错误信息"
    exit 1
fi

echo ""
echo "========================================"
echo "测试完成！"
echo "========================================"
echo ""
echo "覆盖率报告已生成在: coverage/index.html"
echo ""

read -p "是否打开覆盖率报告？(Y/N): " open_report
if [ "$open_report" = "Y" ] || [ "$open_report" = "y" ]; then
    open coverage/index.html 2>/dev/null || xdg-open coverage/index.html 2>/dev/null || echo "请手动打开 coverage/index.html"
fi
