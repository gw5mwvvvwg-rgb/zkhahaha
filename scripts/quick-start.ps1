# Parallel ZK Playground - 快速启动脚本
# 使用方法: .\scripts\quick-start.ps1 [action]
# action: setup | compile | deploy | dev | demo | all

param(
    [Parameter(Position=0)]
    [ValidateSet("setup", "compile", "deploy", "dev", "demo", "all")]
    [string]$Action = "all"
)

function Show-Header {
    Write-Host ""
    Write-Host "════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "  Parallel ZK Playground - 快速启动" -ForegroundColor Cyan
    Write-Host "════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host ""
}

function Invoke-Setup {
    Write-Host "📦 步骤 1: 安装依赖..." -ForegroundColor Yellow
    pnpm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ 依赖安装失败" -ForegroundColor Red
        return $false
    }
    Write-Host "✅ 依赖安装完成" -ForegroundColor Green
    return $true
}

function Invoke-Compile {
    Write-Host "🔨 步骤 2: 编译合约..." -ForegroundColor Yellow
    pnpm compile
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ 合约编译失败" -ForegroundColor Red
        return $false
    }
    Write-Host "✅ 合约编译完成" -ForegroundColor Green
    return $true
}

function Invoke-Deploy {
    Write-Host "🚀 步骤 3: 部署合约到 Monad Testnet..." -ForegroundColor Yellow
    
    # 检查 .env 文件
    if (!(Test-Path ".env")) {
        Write-Host "❌ .env 文件不存在，请先运行 setup" -ForegroundColor Red
        return $false
    }
    
    # 检查环境变量
    $envContent = Get-Content ".env" -Raw
    if ($envContent -notmatch "PRIVATE_KEY=.*[^\s]") {
        Write-Host "❌ 请在 .env 文件中设置 PRIVATE_KEY" -ForegroundColor Red
        return $false
    }
    
    pnpm deploy:testnet
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ 合约部署失败" -ForegroundColor Red
        return $false
    }
    Write-Host "✅ 合约部署完成" -ForegroundColor Green
    return $true
}

function Invoke-Dev {
    Write-Host "🌐 步骤 4: 启动前端开发服务器..." -ForegroundColor Yellow
    Write-Host "💡 提示: 前端将在 http://localhost:3000 启动" -ForegroundColor Cyan
    Write-Host "   按 Ctrl+C 停止服务器" -ForegroundColor Gray
    Write-Host ""
    pnpm dev:web
}

function Invoke-Demo {
    Write-Host "🎯 运行批量验证演示..." -ForegroundColor Yellow
    
    # 检查 .env 文件
    if (!(Test-Path ".env")) {
        Write-Host "❌ .env 文件不存在" -ForegroundColor Red
        return $false
    }
    
    # 检查 CONTRACT_ADDRESS
    $envContent = Get-Content ".env" -Raw
    if ($envContent -notmatch "CONTRACT_ADDRESS=.*[^\s]") {
        Write-Host "❌ 请在 .env 文件中设置 CONTRACT_ADDRESS" -ForegroundColor Red
        Write-Host "   或先运行部署: pnpm deploy:testnet" -ForegroundColor Yellow
        return $false
    }
    
    pnpm demo:batch
    return $true
}

# 主逻辑
Show-Header

switch ($Action) {
    "setup" {
        Invoke-Setup
    }
    "compile" {
        Invoke-Compile
    }
    "deploy" {
        Invoke-Compile
        Invoke-Deploy
    }
    "dev" {
        Invoke-Dev
    }
    "demo" {
        Invoke-Demo
    }
    "all" {
        Write-Host "🎯 执行完整流程..." -ForegroundColor Cyan
        Write-Host ""
        
        if (-not (Invoke-Setup)) { exit 1 }
        Write-Host ""
        
        if (-not (Invoke-Compile)) { exit 1 }
        Write-Host ""
        
        Write-Host "⚠️  下一步需要部署合约" -ForegroundColor Yellow
        Write-Host "   请确保 .env 文件已配置 PRIVATE_KEY" -ForegroundColor Yellow
        $deploy = Read-Host "   是否现在部署? (Y/N)"
        
        if ($deploy -eq "Y" -or $deploy -eq "y") {
            if (-not (Invoke-Deploy)) { exit 1 }
            Write-Host ""
            
            Write-Host "✅ 设置完成！现在可以:" -ForegroundColor Green
            Write-Host "   - 运行前端: pnpm dev:web" -ForegroundColor White
            Write-Host "   - 运行演示: pnpm demo:batch" -ForegroundColor White
        } else {
            Write-Host ""
            Write-Host "✅ 编译完成！请稍后手动部署:" -ForegroundColor Green
            Write-Host "   pnpm deploy:testnet" -ForegroundColor White
        }
    }
}

Write-Host ""
