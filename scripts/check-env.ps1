# 检查环境变量配置
# 使用方法: .\scripts\check-env.ps1

Write-Host "🔍 检查环境变量配置..." -ForegroundColor Cyan
Write-Host ""

$envPath = ".env"
$allGood = $true

# 检查 .env 文件是否存在
if (!(Test-Path $envPath)) {
    Write-Host "❌ .env 文件不存在" -ForegroundColor Red
    Write-Host "   请从 .env.example 复制并填写" -ForegroundColor Yellow
    $allGood = $false
} else {
    Write-Host "✅ .env 文件存在" -ForegroundColor Green
    
    # 读取 .env 文件
    $envContent = Get-Content $envPath -Raw
    $lines = Get-Content $envPath
    
    # 检查必需的环境变量
    $requiredVars = @(
        @{Name="MONAD_RPC"; Optional=$false},
        @{Name="PRIVATE_KEY"; Optional=$false},
        @{Name="CONTRACT_ADDRESS"; Optional=$true}
    )
    
    foreach ($var in $requiredVars) {
        $pattern = "^$($var.Name)=(.*)$"
        $matched = $false
        $value = ""
        
        foreach ($line in $lines) {
            if ($line -match $pattern) {
                $matched = $true
                $value = $matches[1].Trim()
                break
            }
        }
        
        if ($matched) {
            if ([string]::IsNullOrWhiteSpace($value)) {
                if ($var.Optional) {
                    Write-Host "⚠️  $($var.Name) 未设置 (可选)" -ForegroundColor Yellow
                } else {
                    Write-Host "❌ $($var.Name) 为空" -ForegroundColor Red
                    $allGood = $false
                }
            } else {
                if ($var.Name -eq "PRIVATE_KEY") {
                    # 隐藏私钥显示
                    $displayValue = if ($value.Length -gt 8) { $value.Substring(0, 4) + "..." + $value.Substring($value.Length - 4) } else { "***" }
                    Write-Host "✅ $($var.Name) = $displayValue" -ForegroundColor Green
                } else {
                    Write-Host "✅ $($var.Name) = $value" -ForegroundColor Green
                }
            }
        } else {
            if ($var.Optional) {
                Write-Host "⚠️  $($var.Name) 未设置 (可选)" -ForegroundColor Yellow
            } else {
                Write-Host "❌ $($var.Name) 不存在" -ForegroundColor Red
                $allGood = $false
            }
        }
    }
}

Write-Host ""

if ($allGood) {
    Write-Host "✅ 环境变量配置检查通过！" -ForegroundColor Green
} else {
    Write-Host "❌ 环境变量配置不完整" -ForegroundColor Red
    Write-Host ""
    Write-Host "📝 请编辑 .env 文件，确保以下变量已设置:" -ForegroundColor Yellow
    Write-Host "   MONAD_RPC=https://testnet-rpc.monad.xyz" -ForegroundColor White
    Write-Host "   PRIVATE_KEY=your_private_key_here" -ForegroundColor White
    Write-Host "   CONTRACT_ADDRESS= (部署后自动填入)" -ForegroundColor White
}

Write-Host ""
