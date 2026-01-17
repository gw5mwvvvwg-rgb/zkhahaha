# 🎯 Hackathon 演示页面快速指南

## ✅ 需求清单

- [x] 公网可访问 URL（Vercel 的 xxx.vercel.app）
- [x] 页面能连接钱包
- [x] 能切到 Monad Testnet
- [x] 点一个按钮能在 Monad Testnet 发起交易并成功
- [x] 带 Explorer 链接
- [x] 不需要登录、不需要本地环境、评委打开就能点

## 🚀 三步完成部署

### 第一步：部署合约（如果还没部署）

```bash
# 1. 配置 .env 文件（在项目根目录创建 .env 文件）
# 方法 1: 使用 PowerShell 脚本（推荐）
.\scripts\create-env.ps1

# 方法 2: 手动创建 .env 文件，内容如下：
# MONAD_RPC=https://testnet-rpc.monad.xyz
# PRIVATE_KEY=33dc309b60664f0e4cc1a9de83cc603fbac73c34e8bda7102dfb2271a1774d15
# CONTRACT_ADDRESS=

# 2. 部署合约
pnpm compile
pnpm deploy:testnet

# 3. 复制合约地址（下一步要用！）
```

### 第二步：推送到 GitHub

```bash
# 在项目根目录执行
git init
git add .
git commit -m "Initial commit"
git branch -M main

# 创建 GitHub 仓库后，执行：
git remote add origin https://github.com/你的用户名/项目名.git
git push -u origin main
```

### 第三步：部署到 Vercel

1. **访问 https://vercel.com，用 GitHub 登录**

2. **点击 "New Project" → 选择你的仓库 → "Import"**

3. **配置项目**：
   - Framework Preset: Next.js（自动检测）
   - Root Directory: `apps/web`
   - 其他保持默认

4. **添加环境变量**：
   - 在 "Environment Variables" 部分添加：
   - 变量名：`NEXT_PUBLIC_CONTRACT_ADDRESS`
   - 变量值：你的合约地址（例如：`0x1234...`）
   - **重要**：必须以 `NEXT_PUBLIC_` 开头！

5. **点击 "Deploy"**

## 🎯 演示页面地址

部署完成后，你会得到一个 URL：

**演示页面**：`https://你的项目名.vercel.app/demo`

**首页**：`https://你的项目名.vercel.app`

## 📱 评委使用流程

1. **打开演示页面**：`https://你的项目名.vercel.app/demo`

2. **连接钱包**：
   - 点击"连接钱包"按钮
   - 在 MetaMask 中确认连接

3. **切换到 Monad Testnet**：
   - 如果还没切换，点击"切换到 Monad Testnet"
   - 在 MetaMask 中确认添加/切换网络

4. **发送交易**：
   - 点击"发送交易到 Monad Testnet"按钮
   - 在 MetaMask 中确认交易

5. **查看结果**：
   - 等待交易确认
   - 点击"在区块浏览器查看"链接

## ⚠️ 常见问题

### Q: 页面显示"合约地址未配置"

**A**: 检查 Vercel 环境变量中是否设置了 `NEXT_PUBLIC_CONTRACT_ADDRESS`（必须以 `NEXT_PUBLIC_` 开头）

### Q: 如何获取 Monad Testnet 测试币？

**A**: 访问 Monad Testnet 水龙头或官方文档获取测试币

### Q: 部署失败怎么办？

**A**: 
- 检查 Build Command 是否正确
- 查看 Vercel 部署日志
- 确保 `vercel.json` 文件在根目录

## 🎉 完成！

部署完成后，评委就可以直接访问你的演示页面，无需任何本地环境配置！

祝你 Hackathon 成功！🚀
