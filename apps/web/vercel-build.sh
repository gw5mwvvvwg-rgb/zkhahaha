#!/bin/bash
# Vercel 构建脚本
set -e

echo "开始构建..."

# 安装依赖（在根目录）
cd ../..
pnpm install

# 构建 web 应用
cd apps/web
pnpm build

echo "构建完成！"
