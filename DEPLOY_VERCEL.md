# Vercel 部署指南

## 问题排查

如果部署一直卡在排队或构建失败，请尝试以下方案：

## 方案一：在 Vercel UI 中手动配置（推荐）

### 1. 项目设置
- **Framework Preset**: Next.js
- **Root Directory**: `apps/web`
- **Build Command**: `pnpm install && pnpm --filter web build`
- **Install Command**: `pnpm install`
- **Output Directory**: `apps/web/.next`

### 2. 环境变量（如果需要）
在项目 Settings → Environment Variables 中添加：
- `NEXT_PUBLIC_CONTRACT_ADDRESS` (可选)
- `NEXT_PUBLIC_KYC_PASS_ADDRESS` (可选)

### 3. 重要：忽略 .npmrc 代理配置
`.npmrc` 文件中的代理设置可能在 Vercel 上导致问题。Vercel 会自动忽略 `.vercelignore` 中列出的文件。

## 方案二：使用 Vercel CLI 部署

```bash
# 1. 安装 Vercel CLI
npm i -g vercel

# 2. 登录
vercel login

# 3. 在项目根目录部署
cd c:\1monad
vercel

# 4. 按照提示配置：
# - Root Directory: apps/web
# - Build Command: pnpm install && pnpm --filter web build
# - Output Directory: apps/web/.next

# 5. 生产环境部署
vercel --prod
```

## 方案三：简化构建（如果 pnpm workspace 有问题）

如果 pnpm workspace 在 Vercel 上有问题，可以临时修改构建命令：

1. 在 Vercel 项目设置中，修改 Build Command 为：
```bash
cd apps/web && npm install && npm run build
```

2. 但这需要先确保 `apps/web/package.json` 包含所有依赖。

## 方案四：检查构建日志

1. 在 Vercel 部署页面，点击 "构建日志"
2. 查看具体错误信息
3. 常见问题：
   - 依赖安装失败 → 检查 `.npmrc` 代理设置
   - 构建超时 → 优化构建命令
   - 找不到模块 → 检查 Root Directory 设置

## 方案五：使用 GitHub Actions + Vercel

如果直接部署有问题，可以：
1. 使用 GitHub Actions 构建
2. 将构建产物推送到 GitHub
3. Vercel 从 GitHub 拉取并部署

## 当前配置

- ✅ `vercel.json` 已配置
- ✅ `.vercelignore` 已创建（忽略 .npmrc 代理配置）
- ✅ Root Directory 需要在 Vercel UI 中设置为 `apps/web`
