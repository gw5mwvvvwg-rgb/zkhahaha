# PowerShell 脚本说明

本项目提供了一些 PowerShell 脚本，方便 Windows 用户快速设置和使用项目。

## 📋 脚本列表

### `../setup.ps1` - 快速设置脚本

一键检查环境、安装依赖、创建 `.env` 文件。

```powershell
.\setup.ps1
```

**功能**:
- 检查 Node.js 和 pnpm 是否已安装
- 自动安装 pnpm（如未安装）
- 安装项目依赖
- 检查并创建 `.env` 文件

### `check-env.ps1` - 环境变量检查脚本

检查 `.env` 文件中的环境变量配置是否完整。

```powershell
.\scripts\check-env.ps1
```

**功能**:
- 检查 `.env` 文件是否存在
- 验证必需的环境变量（MONAD_RPC、PRIVATE_KEY）
- 检查可选的环境变量（CONTRACT_ADDRESS）
- 显示配置状态（隐藏私钥敏感信息）

### `quick-start.ps1` - 快速启动脚本

一键执行完整的项目流程或分步执行特定操作。

```powershell
# 执行完整流程
.\scripts\quick-start.ps1 all

# 或分步执行
.\scripts\quick-start.ps1 setup    # 仅安装依赖
.\scripts\quick-start.ps1 compile  # 仅编译合约
.\scripts\quick-start.ps1 deploy   # 编译并部署合约
.\scripts\quick-start.ps1 dev      # 启动前端开发服务器
.\scripts\quick-start.ps1 demo     # 运行批量验证演示
```

**参数**:
- `setup` - 仅执行依赖安装
- `compile` - 仅编译合约
- `deploy` - 编译并部署合约（需要先配置 `.env`）
- `dev` - 启动前端开发服务器
- `demo` - 运行批量验证演示脚本（需要已部署合约）
- `all` - 执行完整流程（安装 → 编译 → 可选部署）

## 🚀 使用示例

### 首次使用

```powershell
# 1. 快速设置
.\setup.ps1

# 2. 编辑 .env 文件，填入 MONAD_RPC 和 PRIVATE_KEY

# 3. 检查环境变量配置
.\scripts\check-env.ps1

# 4. 编译并部署
.\scripts\quick-start.ps1 deploy

# 5. 启动前端（在新终端）
.\scripts\quick-start.ps1 dev
```

### 日常开发

```powershell
# 启动前端
.\scripts\quick-start.ps1 dev

# 运行演示
.\scripts\quick-start.ps1 demo
```

## ⚠️ 注意事项

1. **执行策略**: 如果遇到 "无法加载脚本" 错误，可能需要修改 PowerShell 执行策略：
   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   ```

2. **环境变量**: 脚本会检查 `.env` 文件，但不会自动修改。请手动编辑 `.env` 文件填入敏感信息（如 PRIVATE_KEY）。

3. **路径**: 所有脚本应在项目根目录执行（`c:\monad`）。

4. **兼容性**: 这些脚本专为 Windows PowerShell 设计。Linux/Mac 用户请使用 README 中的手动命令。

## 📚 更多信息

详细的项目使用说明请查看根目录的 [README.md](../README.md)。
