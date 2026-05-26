#!/bin/bash
cd /home/devbox/project/kaifa
git init
git add -A
git commit -m "fix: 统一所有 Mine 功能页面布局

- 统一 Header 为 fixed + height 70px（22 个页面）
- 统一 padding-top: 82px
- 统一 border-radius: 10px
- 修复 Activity / EditProfile / 记录类页面 Header
- 修复 albumService.isLoggedIn 错误
- 统一 PC 端 max-width: 650px 居中"
echo "✅ 本地提交完成！"
echo ""
echo "如果还需要推送到远程仓库，请执行："
echo "  git remote add origin <仓库地址>"
echo "  git push -u origin master"
