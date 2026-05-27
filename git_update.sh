#!/bin/bash
# Git 更新脚本 - 提交并推送最新代码到 GitHub

cd /home/devbox/project/kaifa

echo "📦 添加所有变更文件..."
git add -A

echo "📝 提交代码..."
read -p "请输入本次提交说明: " msg
if [ -z "$msg" ]; then
  git commit -m "更新代码"
else
  git commit -m "$msg"
fi

echo "🚀 推送到 GitHub..."
git push

echo "✅ 完成！"
