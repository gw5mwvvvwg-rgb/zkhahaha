# Parallel ZK Playground - 快速设置脚本
# 使用方法: .\setup.ps1

Write-Host "🚀 Parallel ZK Playground - 快速设置" -ForegroundColor Cyan
Write-Host ""

# 检查 Node.js 和 PNPM
Write-Host "📋 检查环境..." -ForegroundColor Yellow
if (!(Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "❌ 未找到 Node.js，请先安装 Node.js 18+" -ForegroundColor Red
    exit 1
}

if (!(Get-Command pnpm -ErrorAction SilentlyContinue)) {
    Write-Host "⚠️  未找到 pnpm，正在安装..." -ForegroundColor Yellow
    npm install -g pnpm
}

Write-Host "✅ 环境检查通过" -ForegroundColor Green
Write-Host ""

# 检查并配置镜像源
Write-Host "🔍 检查 PNPM 镜像配置..." -ForegroundColor Yellow
if (!(Test-Path ".npmrc")) {
    Write-Host "⚠️  未找到 .npmrc 文件，正在配置淘宝镜像（推荐国内用户）..." -ForegroundColor Yellow
    $npmrcContent = @"
# PNPM 镜像配置 - 淘宝镜像（国内推荐）
registry=https://registry.npmmirror.com
auto-install-peers=true
strict-peer-dependencies=false
fetch-retries=5
"@
    Set-Content -Path ".npmrc" -Value $npmrcContent -Encoding UTF8
    Write-Host "✅ 已配置淘宝镜像源" -ForegroundColor Green
} else {
    Write-Host "✅ .npmrc 文件已存在" -ForegroundColor Green
}
Write-Host ""

# 安装依赖
Write-Host "📦 安装依赖..." -ForegroundColor Yellow
Write-Host "💡 提示: 如果遇到网络错误，可以稍后重试或使用脚本切换镜像源" -ForegroundColor Cyan
Write-Host "   切换镜像: .\scripts\fix-network.ps1 [taobao|official]" -ForegroundColor Gray
Write-Host ""

pnpm install

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "⚠️  依赖安装遇到问题，可能的原因:" -ForegroundColor Yellow
    Write-Host "   1. 网络连接不稳定" -ForegroundColor White
    Write-Host "   2. 镜像源访问慢" -ForegroundColor White
    Write-Host ""
    Write-Host "💡 建议:" -ForegroundColor Cyan
    Write-Host "   - 检查网络连接" -ForegroundColor White
    Write-Host "   - 尝试切换镜像源: .\scripts\fix-network.ps1 taobao" -ForegroundColor White
    Write-Host "   - 重试安装: pnpm install" -ForegroundColor White
    Write-Host ""
    Write-Host "⚠️  继续执行其他步骤（可以稍后重试安装）..." -ForegroundColor Yellow
}

Write-Host "✅ 依赖安装完成" -ForegroundColor Green
Write-Host ""

# 检查 .env 文件
Write-Host "📝 检查环境变量配置..." -ForegroundColor Yellow
if (!(Test-Path ".env")) {
    Write-Host "⚠️  .env 文件不存在，正在创建..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env" -ErrorAction SilentlyContinue
    
    if (Test-Path ".env") {
        Write-Host "✅ .env 文件已创建，请编辑 .env 文件填入以下内容:" -ForegroundColor Green
        Write-Host "   MONAD_RPC=https://testnet-rpc.monad.xyz" -ForegroundColor White
        Write-Host "   PRIVATE_KEY=your_private_key_here" -ForegroundColor White
        Write-Host "   CONTRACT_ADDRESS=" -ForegroundColor White
        Write-Host ""
        Write-Host "💡 提示: 部署合约后，CONTRACT_ADDRESS 会自动填入" -ForegroundColor Cyan
    } else {
        Write-Host "⚠️  无法创建 .env 文件，请手动从 .env.example 复制" -ForegroundColor Yellow
    }
} else {
    Write-Host "✅ .env 文件已存在" -ForegroundColor Green
}

Write-Host ""
Write-Host "🎉 设置完成！" -ForegroundColor Green
Write-Host ""
Write-Host "📚 下一步操作:" -ForegroundColor Cyan
Write-Host "   1. 编辑 .env 文件，填入 MONAD_RPC 和 PRIVATE_KEY" -ForegroundColor White
Write-Host "   2. 编译合约: pnpm compile" -ForegroundColor White
Write-Host "   3. 部署合约: pnpm deploy:testnet" -ForegroundColor White
Write-Host "   4. 启动前端: pnpm dev:web" -ForegroundColor White
Write-Host "   5. 运行演示: pnpm demo:batch" -ForegroundColor White
Write-Host ""
