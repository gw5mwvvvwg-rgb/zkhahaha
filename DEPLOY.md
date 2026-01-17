# 🚀 部署指南 - Hackathon 演示页面

本指南将教你如何将项目部署到 Vercel，让评委可以直接访问和使用演示页面。

## 📋 前置要求

1. **GitHub 账号**（如果没有，请先注册：https://github.com）
2. **Vercel 账号**（可以免费注册：https://vercel.com）
3. **MetaMask 钱包**（测试时需要）
4. **已部署的合约地址**（Monad Testnet 上）

## 🎯 部署步骤

### 第一步：部署合约（如果还没部署）

1. 在项目根目录创建 `.env` 文件：
   ```env
   MONAD_RPC=https://testnet-rpc.monad.xyz
   PRIVATE_KEY=你的私钥（不含0x）
   ```

2. 编译合约：
   ```bash
   pnpm compile
   ```

3. 部署合约：
   ```bash
   pnpm deploy:testnet
   ```

4. **重要**：复制部署后的合约地址，下一步需要用到！

### 第二步：准备 GitHub 仓库

1. **创建 GitHub 仓库**：
   - 访问 https://github.com/new
   - 创建新仓库（例如：`parallel-zk-playground`）
   - 选择 Public（公开）

2. **推送代码到 GitHub**：
   ```bash
   # 在项目根目录执行
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/你的用户名/parallel-zk-playground.git
   git push -u origin main
   ```

   **注意**：如果 `.env` 文件中有敏感信息，确保它已经在 `.gitignore` 中！

### 第三步：部署到 Vercel

1. **登录 Vercel**：
   - 访问 https://vercel.com
   - 使用 GitHub 账号登录

2. **导入项目**：
   - 点击 "New Project"（新建项目）
   - 选择你刚创建的 GitHub 仓库
   - 点击 "Import"

3. **配置项目**：
   - **Framework Preset**: 选择 "Next.js"（应该会自动检测）
   - **Root Directory**: 保持默认（或填写 `apps/web`）
   - **Build Command**: `cd ../.. && pnpm install && pnpm --filter web build`
   - **Output Directory**: `.next`（保持默认）

4. **设置环境变量**：
   
   在 "Environment Variables" 部分添加：
   
   | 变量名 | 值 |
   |--------|-----|
   | `NEXT_PUBLIC_CONTRACT_ADDRESS` | 你的合约地址（例如：`0x1234...`） |

   **重要**：变量名必须是 `NEXT_PUBLIC_` 开头，才能在浏览器中使用！

5. **部署**：
   - 点击 "Deploy" 按钮
   - 等待部署完成（通常 2-5 分钟）

### 第四步：访问演示页面

部署完成后，你会得到一个 URL，例如：`https://parallel-zk-playground.vercel.app`

**演示页面地址**：`https://你的项目名.vercel.app/demo`

## ✅ 测试清单

部署完成后，请测试以下功能：

- [ ] 访问 `/demo` 页面
- [ ] 点击"连接钱包"按钮，能够连接 MetaMask
- [ ] 能够自动或手动切换到 Monad Testnet
- [ ] 点击"发送交易"按钮，能够成功发起交易
- [ ] 交易成功后，能够看到交易哈希和区块浏览器链接
- [ ] 点击区块浏览器链接，能够查看交易详情

## 🎤 给评委的演示流程

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
   - 等待交易确认（通常几秒到几十秒）
   - 点击"在区块浏览器查看"链接
   - 展示交易详情

## 🔧 常见问题

### Q1: 部署后页面显示 "合约地址未配置"

**A**: 检查 Vercel 环境变量中是否设置了 `NEXT_PUBLIC_CONTRACT_ADDRESS`，并且变量名必须以 `NEXT_PUBLIC_` 开头。

### Q2: MetaMask 提示 "网络不存在"

**A**: 确保点击"切换到 Monad Testnet"按钮，会在 MetaMask 中自动添加网络配置。

### Q3: 交易失败

**A**: 检查：
- 是否在 Monad Testnet 上
- 钱包是否有足够的 MON 代币（测试币）
- 合约地址是否正确

### Q4: 如何获取 Monad Testnet 测试币？

**A**: 访问 Monad Testnet 水龙头或官方文档获取测试币。

### Q5: 部署失败

**A**: 检查：
- Build Command 是否正确
- 环境变量是否设置正确
- 查看 Vercel 部署日志中的错误信息

## 📝 快速部署命令（高级）

如果你熟悉命令行，也可以使用 Vercel CLI：

```bash
# 安装 Vercel CLI
npm i -g vercel

# 在项目根目录执行
cd apps/web
vercel

# 按照提示操作
# 设置环境变量：vercel env add NEXT_PUBLIC_CONTRACT_ADDRESS
```

## 🎉 完成！

部署完成后，你的演示页面就可以公网访问了。评委可以通过你提供的 URL 直接测试所有功能，无需任何本地环境配置。

**演示页面链接**：`https://你的项目名.vercel.app/demo`

祝你 Hackathon 成功！🚀
