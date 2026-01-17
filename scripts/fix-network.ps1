# 修复网络连接问题 - 配置 PNPM 镜像
# 使用方法: .\scripts\fix-network.ps1 [mirror]
# mirror: taobao (淘宝镜像, 默认) | official (官方源)

param(
    [Parameter(Position=0)]
    [ValidateSet("taobao", "official")]
    [string]$Mirror = "taobao"
)

Write-Host "🔧 配置 PNPM 镜像源..." -ForegroundColor Cyan
Write-Host ""

$npmrcPath = ".npmrc"

# 镜像配置
$taobaoConfig = @"
# PNPM 镜像配置 - 淘宝镜像（国内推荐）
registry=https://registry.npmmirror.com
auto-install-peers=true
strict-peer-dependencies=false
fetch-retries=5
"@

$officialConfig = @"
# PNPM 镜像配置 - 官方源
registry=https://registry.npmjs.org
auto-install-peers=true
strict-peer-dependencies=false
fetch-retries=5
"@

if ($Mirror -eq "taobao") {
    Write-Host "📦 使用淘宝镜像源（推荐国内用户）..." -ForegroundColor Yellow
    Set-Content -Path $npmrcPath -Value $taobaoConfig -Encoding UTF8
    Write-Host "✅ 已配置淘宝镜像: https://registry.npmmirror.com" -ForegroundColor Green
} else {
    Write-Host "🌐 使用官方源..." -ForegroundColor Yellow
    Set-Content -Path $npmrcPath -Value $officialConfig -Encoding UTF8
    Write-Host "✅ 已配置官方源: https://registry.npmjs.org" -ForegroundColor Green
}

Write-Host ""
Write-Host "💡 提示: 如果遇到网络问题，可以尝试:" -ForegroundColor Cyan
Write-Host "   1. 使用淘宝镜像: .\scripts\fix-network.ps1 taobao" -ForegroundColor White
Write-Host "   2. 使用官方源: .\scripts\fix-network.ps1 official" -ForegroundColor White
Write-Host "   3. 重新运行安装: pnpm install" -ForegroundColor White
Write-Host ""
