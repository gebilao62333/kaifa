<#
.SYNOPSIS
为 HBuilderX 打 App 自定义基座准备构建环境变量（写入 app/.env.production.local）。

.DESCRIPTION
H5 与 App 共用 Vite 生产构建；App 需要绝对 API 域名，而 H5 线上走同源。
本脚本只在打 App 基座前执行，打完用 -Restore 删除，避免影响 H5 构建/冒烟。

.EXAMPLE
.\deploy\sealos\prepare-app-build.ps1
# HBuilderX 打完自定义基座后：
.\deploy\sealos\prepare-app-build.ps1 -Restore
#>
param(
  [string]$ApiOrigin = "https://fazwhznenrqo.sealoshzh.site",
  [switch]$Restore
)

$ErrorActionPreference = "Stop"
$root = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$file = Join-Path $root "app\.env.production.local"

if ($Restore) {
  if (Test-Path $file) { Remove-Item $file -Force; Write-Host "已删除 $file" }
  else { Write-Host "没有需要清理的 $file" }
  exit 0
}

$content = @"
# 仅用于 App 自定义基座构建；H5 构建请删除本文件
VITE_API_ORIGIN=$ApiOrigin
VITE_SOCKET_URL=
VITE_USE_NATIVE_CALL=1
"@
Set-Content -Path $file -Value $content -Encoding UTF8
Write-Host "已写入 $file"
Write-Host "现在在 HBuilderX 中：发行 → 原生App-制作自定义调试基座"
Write-Host "基座完成后执行：.\deploy\sealos\prepare-app-build.ps1 -Restore"
