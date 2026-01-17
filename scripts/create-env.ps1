# 创建 .env 文件
# 使用方法: .\scripts\create-env.ps1

$envContent = @"
# Monad Testnet RPC
MONAD_RPC=https://testnet-rpc.monad.xyz

# Private key for deployment (without 0x prefix)
PRIVATE_KEY=33dc309b60664f0e4cc1a9de83cc603fbac73c34e8bda7102dfb2271a1774d15

# Contract address (will be filled after deployment)
CONTRACT_ADDRESS=
"@

if (Test-Path .env) {
    Write-Host "⚠️  .env 文件已存在" -ForegroundColor Yellow
    $overwrite = Read-Host "是否覆盖? (Y/N)"
    if ($overwrite -ne "Y" -and $overwrite -ne "y") {
        Write-Host "❌ 已取消操作" -ForegroundColor Red
        exit 0
    }
}

Set-Content -Path ".env" -Value $envContent -Encoding UTF8

if (Test-Path .env) {
    Write-Host "✅ .env 文件已成功创建！" -ForegroundColor Green
    Write-Host ""
    Write-Host "文件路径: $PWD\.env" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "配置内容:" -ForegroundColor Yellow
    Get-Content .env | ForEach-Object {
        if ($_ -match "PRIVATE_KEY") {
            $parts = $_.Split('=')
            Write-Host "$($parts[0])=***已配置***" -ForegroundColor White
        } else {
            Write-Host $_ -ForegroundColor White
        }
    }
} else {
    Write-Host "❌ .env 文件创建失败" -ForegroundColor Red
    exit 1
}
