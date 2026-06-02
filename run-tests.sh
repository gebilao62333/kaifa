#!/bin/bash

# 多客陪玩平台 - 测试启动脚本
# 项目路径: /home/devbox/project/kaifa

echo "========================================"
echo " 多客陪玩平台 - 测试工具"
echo "========================================"
echo ""
echo "请选择要执行的测试："
echo "1) 前端E2E测试 (Playwright)"
echo "2) 后端性能测试 (Artillery)"
echo "3) 前端单元测试 (Vitest)"
echo "4) 后端单元测试 (Jest)"
echo "5) 查看测试文档"
echo "0) 退出"
echo ""
read -p "请输入选项 (0-5): " choice

case $choice in
    1)
        echo ""
        echo "正在启动前端E2E测试..."
        cd /home/devbox/project/kaifa/frontend
        echo "当前目录: $(pwd)"
        echo ""
        echo "请选择E2E测试方式："
        echo "1) 安装Playwright浏览器"
        echo "2) 运行所有E2E测试"
        echo "3) UI模式运行测试"
        echo "4) 查看测试报告"
        read -p "请输入选项 (1-4): " e2e_choice
        case $e2e_choice in
            1) npm run test:e2e:install ;;
            2) npm run test:e2e ;;
            3) npm run test:e2e:ui ;;
            4) npm run test:e2e:report ;;
            *) echo "无效选项" ;;
        esac
        ;;
    2)
        echo ""
        echo "正在启动后端性能测试..."
        cd /home/devbox/project/kaifa/backend
        echo "当前目录: $(pwd)"
        echo ""
        echo "请选择性能测试方式："
        echo "1) 简单冒烟测试"
        echo "2) 完整负载测试"
        echo "3) 运行测试并生成报告"
        read -p "请输入选项 (1-3): " perf_choice
        case $perf_choice in
            1) npx artillery run tests/load-tests/simple-smoke-test.yml ;;
            2) npm run test:load ;;
            3) npm run test:load:report ;;
            *) echo "无效选项" ;;
        esac
        ;;
    3)
        echo ""
        echo "正在启动前端单元测试..."
        cd /home/devbox/project/kaifa/frontend
        echo "当前目录: $(pwd)"
        echo ""
        npm run test:coverage
        ;;
    4)
        echo ""
        echo "正在启动后端单元测试..."
        cd /home/devbox/project/kaifa/backend
        echo "当前目录: $(pwd)"
        echo ""
        npm run test:coverage
        ;;
    5)
        echo ""
        echo "测试文档位于："
        echo "- E2E测试指南: /home/devbox/project/kaifa/E2E-AND-PERFORMANCE-TESTING.md"
        echo "- 完整测试报告: /home/devbox/project/kaifa/完整测试报告.md"
        echo ""
        if command -v xdg-open &> /dev/null; then
            xdg-open /home/devbox/project/kaifa/E2E-AND-PERFORMANCE-TESTING.md
        elif command -v open &> /dev/null; then
            open /home/devbox/project/kaifa/E2E-AND-PERFORMANCE-TESTING.md
        else
            echo "请手动打开上述文档"
        fi
        ;;
    0)
        echo "退出"
        exit 0
        ;;
    *)
        echo "无效选项"
        exit 1
        ;;
esac
