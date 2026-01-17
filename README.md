# Parallel ZK Playground

并行 ZK 证明批量验证演示项目 · Monad Testnet

## 🎯 项目概述

Parallel ZK Playground 是一个展示并行友好的 ZK 证明批量验证的演示项目，部署在 Monad Testnet 上。项目重点展示了如何利用 Monad 的并行执行能力，通过合理的存储布局设计避免写热点，实现高效的批量验证。

### 核心特性

- **并行友好存储布局**: 使用 `mapping(bytes32 => Result)` 分散写入，每个 proofId 独立存储槽
- **批量验证**: 支持一次交易验证 10/50/100 个 Proof
- **实时指标**: 展示 batch size、gas used、gas/proof、latency(ms)、成功率
- **完整工作流**: Upload → Batch Verify → View Receipt

### 技术栈

- **合约**: Solidity 0.8.24 + Hardhat + TypeScript
- **前端**: Next.js 14 + TypeScript + Tailwind CSS + ethers v6
- **包管理**: PNPM Workspace (Monorepo)
- **网络**: Monad Testnet

## 🚀 快速开始

### 方式一：使用 PowerShell 脚本（推荐 Windows 用户）

```powershell
# 1. 快速设置（检查环境、安装依赖、创建 .env）
.\setup.ps1

# 2. 检查环境变量配置
.\scripts\check-env.ps1

# 3. 快速启动（一键执行完整流程）
.\scripts\quick-start.ps1 all

# 或者分步执行：
.\scripts\quick-start.ps1 setup    # 仅安装依赖
.\scripts\quick-start.ps1 compile  # 仅编译合约
.\scripts\quick-start.ps1 deploy   # 编译并部署合约
.\scripts\quick-start.ps1 dev      # 启动前端
.\scripts\quick-start.ps1 demo     # 运行演示脚本
```

### 方式二：手动执行（通用）

#### 1. 安装依赖

```bash
# 安装所有依赖（根目录和所有包）
pnpm install
```

**⚠️ 如果遇到网络连接错误（ERR_PNPM_META_FETCH_FAIL）：**

国内用户推荐使用淘宝镜像加速：

```powershell
# 方式 1: 使用 PowerShell 脚本配置镜像
.\scripts\fix-network.ps1 taobao

# 方式 2: 项目已包含 .npmrc 配置文件（已配置淘宝镜像）
# 如果仍有问题，可以手动切换镜像源
.\scripts\fix-network.ps1 [taobao|official]
```

然后重新运行 `pnpm install`。

#### 2. 配置环境变量

```bash
# 复制 .env.example 到 .env
# Windows PowerShell:
Copy-Item .env.example .env

# Linux/Mac:
cp .env.example .env

# 编辑 .env 文件，填入以下内容：
# MONAD_RPC=https://testnet-rpc.monad.xyz
# PRIVATE_KEY=your_private_key_here
# CONTRACT_ADDRESS= (部署后会自动填充)
```

#### 3. 编译合约

```bash
pnpm compile
```

#### 4. 部署合约

```bash
pnpm deploy:testnet
```

部署完成后，合约地址会自动写入 `.env` 文件，或者你可以手动复制并添加到 `.env`。

#### 5. 启动前端

```bash
pnpm dev:web
```

打开浏览器访问 `http://localhost:3000`。

#### 6. 运行批量验证演示脚本

```bash
# 在另一个终端执行
pnpm demo:batch
```

该脚本会自动生成 10/50/100 三组 ProofJobs，分别调用 `verifyBatch`，并输出详细的指标报告。

## 📖 使用指南

### 演示动线

#### 1. Upload Proof (`/upload`)

- 填写或自动生成 Proof 信息：
  - **Work**: 工作量（默认 200，最大 2000）
  - **Deadline**: 过期时间（可选，留空表示永不过期）
  - **Public Input Hash**: 公共输入哈希（留空自动生成）
  - **Proof**: 证明数据 bytes（留空自动生成）
- 点击 **"Add to Local List"** 将 ProofJob 保存到 localStorage
- 可以在列表中查看、删除已保存的 ProofJobs

#### 2. Batch Verify (`/batch`)

- 在页面顶部设置**合约地址**（如果还未设置）
- 选择要验证的 ProofJobs（支持选择 10/50/100 或手动勾选）
- 点击 **"Verify Batch"** 执行批量验证
- 等待交易确认后，查看详细指标：
  - Batch Size
  - TX Hash（可点击跳转到区块浏览器）
  - Gas Used
  - Gas/Proof
  - Latency (ms)
  - Success Rate

#### 3. View Receipt (`/receipt` 或 `/receipt/[id]`)

- 输入 Proof ID（或通过路由参数 `?id=0x...` 传入）
- 设置合约地址
- 点击 **"查询"** 查看验证结果
- 页面显示：
  - 合约状态：done、ok、timestamp、verifier
  - 事件详情：ProofVerified 事件的所有字段
- 可以使用 **"复制链接"** 按钮分享回执链接（用于现场演示）

## 🎤 评委话术（90 秒）

### 1. 痛点（15 秒）

传统 EVM 的 ZK 证明批量验证面临两个核心问题：
- **串行执行瓶颈**: 逐个验证导致高延迟
- **写热点冲突**: 使用全局累加器（如 `totalVerified++`）导致存储冲突，无法并行化

### 2. Monad 并行机会（20 秒）

Monad 的并行执行能力为我们提供了新机会：
- **独立存储写入**: 不同 proofId 的写入操作可以并行执行
- **批量交易优化**: 一次交易中包含多个独立操作，Monad 可以并行处理

### 3. 我们的并行友好布局（25 秒）

我们的核心设计思路：
- **分散存储**: 使用 `mapping(bytes32 => Result)` 替代全局累加器
  - 每个 proofId 对应独立的存储槽
  - Monad 并行执行时，不同 proofId 的写入互不干扰
- **事件驱动统计**: 所有统计指标（如 totalVerified）在前端从事件聚合
  - 避免链上共享状态冲突
  - 减少不必要的状态写入

### 4. 批处理与指标（20 秒）

通过 `verifyBatch` 方法，一次交易可以验证 10/50/100 个 Proof：
- **Gas 优化**: 分摊固定成本（如交易基础费），降低单 Proof 成本
- **实时指标**: 展示 gas/proof、latency、成功率等关键指标
- **可扩展性**: 设计支持未来替换为真实 Groth16/Plonk Verifier

### 5. 总结（10 秒）

这个项目展示了如何在 Monad 上设计并行友好的智能合约，通过合理的存储布局避免写热点，充分利用并行执行能力，为 ZK 证明批量验证提供高效的解决方案。

## 📊 项目结构

```
monad/
├── pnpm-workspace.yaml          # PNPM workspace 配置
├── package.json                 # 根 package.json（含一键脚本）
├── .env.example                 # 环境变量模板
├── .gitignore                   # Git 忽略文件
├── setup.ps1                    # PowerShell 快速设置脚本
├── README.md                    # 本文档
├── scripts/
│   ├── quick-start.ps1          # PowerShell 快速启动脚本
│   └── check-env.ps1            # 环境变量检查脚本
├── packages/
│   └── contracts/               # 合约包
│       ├── hardhat.config.ts    # Hardhat 配置
│       ├── package.json
│       ├── tsconfig.json
│       ├── contracts/
│       │   └── ParallelZKPlayground.sol  # 主合约
│       └── scripts/
│           ├── deploy.ts        # 部署脚本
│           └── batchDemo.ts     # 批量验证演示脚本
└── apps/
    └── web/                     # 前端应用
        ├── package.json
        ├── next.config.js
        ├── tsconfig.json
        ├── tailwind.config.js
        ├── pages/
        │   ├── index.tsx        # 首页
        │   ├── upload.tsx       # 上传 Proof
        │   ├── batch.tsx        # 批量验证
        │   └── receipt/
        │       ├── index.tsx    # 查看回执（表单）
        │       └── [id].tsx     # 查看回执（路由参数）
        └── styles/
            └── globals.css      # 全局样式
```

## 🔧 合约设计说明

### 数据结构

```solidity
struct ProofJob {
    bytes32 id;
    bytes32 publicInputHash;
    bytes proof;
    uint32 work;
    uint64 deadline;
}

struct Result {
    bool done;
    bool ok;
    uint64 ts;
    address verifier;
}
```

### 核心方法

- **`submitProof(ProofJob calldata job)`**: 提交 Proof（仅发送事件，不改状态）
- **`verifyBatch(ProofJob[] calldata jobs)`**: 批量验证 Proof
  - 跳过过期和已处理的任务
  - 调用 `_mockVerify` 执行验证
  - 将结果写入 `results[id]`（分散写入，并行友好）
  - 发送 `ProofVerified` 事件

### 并行友好设计

1. **存储布局**: `mapping(bytes32 => Result)` 确保每个 proofId 独立存储槽
2. **避免共享状态**: 不使用 `totalVerified++` 等全局累加器
3. **事件驱动**: 统计指标从前端事件聚合

### Mock Verifier

当前使用 `_mockVerify` 模拟验证过程：
- 使用 keccak256 循环 work 次模拟计算量
- 用哈希低位决定验证结果（`(uint256(h) & 0xFF) < 0x80`）
- 限制 work <= 2000 避免 gas 爆炸

**注意**: 可以替换为真实的 Groth16/Plonk Verifier（接口位已预留）。

## 📋 可用脚本

### 根目录脚本

```bash
# 启动前端开发服务器
pnpm dev:web

# 编译合约
pnpm compile

# 部署合约到 Monad Testnet
pnpm deploy:testnet

# 运行批量验证演示脚本
pnpm demo:batch
```

### 合约脚本（packages/contracts）

```bash
# 编译合约
pnpm --filter contracts compile

# 部署合约
pnpm --filter contracts deploy:testnet

# 运行演示脚本
pnpm --filter contracts demo:batch
```

## ⚠️ 风险与限制

1. **Mock Verifier**: 当前使用的是模拟验证器，仅用于演示。生产环境需要替换为真实的 Groth16/Plonk Verifier。
2. **Work 上限**: `_mockVerify` 限制 work <= 2000，避免 gas 爆炸。
3. **Deadline 处理**: 过期任务会被跳过，不会回滚交易。
4. **网络依赖**: 需要连接到 Monad Testnet RPC，确保网络稳定。

## 🔧 常见问题

### 网络连接问题

**问题**: 运行 `pnpm install` 时出现大量 `ERR_PNPM_META_FETCH_FAIL` 或 `ECONNRESET` 错误。

**原因**: 
- 网络连接不稳定
- 访问 npm 官方源速度慢（国内用户常见）

**解决方案**:

1. **使用淘宝镜像（推荐国内用户）**:
   ```powershell
   .\scripts\fix-network.ps1 taobao
   pnpm install
   ```

2. **项目已包含 `.npmrc` 配置文件**，默认使用淘宝镜像。如果仍有问题：
   - 检查网络连接
   - 尝试切换回官方源: `.\scripts\fix-network.ps1 official`
   - 重试安装

3. **如果安装过程中有部分包失败**，可以配置重试次数：
   ```bash
   pnpm install --config.fetch-retries=5
   ```
   或者修改 `.npmrc` 文件添加：
   ```
   fetch-retries=5
   ```

## 🎯 跑通检查清单

### 前置条件

- [ ] Node.js 18+ 已安装
- [ ] PNPM 已安装 (`npm install -g pnpm`)
- [ ] MetaMask 或兼容钱包已安装（前端交互需要）

### 部署步骤

1. [ ] **克隆/打开项目**
   ```bash
   cd monad
   ```

2. [ ] **安装依赖**
   ```bash
   pnpm install
   ```
   - 预期：所有包的依赖安装完成，无错误

3. [ ] **配置环境变量**
   ```bash
   cp .env.example .env
   # 编辑 .env，填入 MONAD_RPC 和 PRIVATE_KEY
   ```

4. [ ] **编译合约**
   ```bash
   pnpm compile
   ```
   - 预期：`Successfully compiled 1 Solidity file(s).`

5. [ ] **部署合约**
   ```bash
   pnpm deploy:testnet
   ```
   - 预期：输出合约地址，`.env` 文件自动更新 CONTRACT_ADDRESS

6. [ ] **验证部署**（可选）
   - 在 Monad Testnet 区块浏览器查看合约地址

### 前端验证步骤

7. [ ] **启动前端**
   ```bash
   pnpm dev:web
   ```
   - 预期：`Ready on http://localhost:3000`

8. [ ] **访问首页**
   - 打开 `http://localhost:3000`
   - 预期：看到三个入口卡片（Upload、Batch、Receipt）

9. [ ] **测试 Upload 页面**
   - 访问 `/upload`
   - 填写或自动生成 Proof 信息
   - 点击 "Add to Local List"
   - 预期：Proof Job 出现在右侧列表

10. [ ] **测试 Batch 页面**
    - 访问 `/batch`
    - 设置合约地址（从 `.env` 复制）
    - 选择 10 个 ProofJobs（或手动勾选）
    - 连接钱包并点击 "Verify Batch"
    - 预期：交易发送成功，显示指标结果

11. [ ] **测试 Receipt 页面**
    - 从 Batch 页面复制一个 Proof ID
    - 访问 `/receipt`，输入 Proof ID 和合约地址
    - 点击 "查询"
    - 预期：显示验证结果和事件详情

### 脚本验证步骤

12. [ ] **运行批量验证演示**
    ```bash
    pnpm demo:batch
    ```
    - 预期：输出 10/50/100 三组批量验证的详细指标报告
    - 包括：batch_size、gas_used、gas_per_proof、latency_ms、success_count

### 最终检查

- [ ] 所有命令执行无错误
- [ ] 前端页面正常加载和交互
- [ ] 合约部署成功，地址已保存
- [ ] 批量验证脚本成功运行并输出指标
- [ ] 可以完成完整工作流：Upload → Batch → Receipt

## 📝 开发说明

### 合约开发

合约位于 `packages/contracts/contracts/ParallelZKPlayground.sol`。

修改合约后：
```bash
pnpm compile
pnpm deploy:testnet  # 重新部署
```

### 前端开发

前端位于 `apps/web`，使用 Next.js Pages Router。

修改前端后，开发服务器会自动热重载（`pnpm dev:web`）。

### 添加新的脚本

在 `packages/contracts/scripts/` 下创建新的 TypeScript 脚本，然后在 `packages/contracts/package.json` 中添加对应的 script。

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

---

**注意**: 本项目为演示项目，仅用于展示并行友好的 ZK 证明批量验证设计。生产环境使用前请进行充分的安全审计和测试。
