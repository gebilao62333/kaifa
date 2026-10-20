<#
.SYNOPSIS
构建并推送 eu搭子 的 backend / web 两个镜像（Sealos 用）。

.EXAMPLE
# 先登录镜像仓库（示例 Aliyun ACR）
docker login registry.cn-hangzhou.aliyuncs.com

# 构建 + 推送 v1
.\deploy\sealos\build-push.ps1 -Registry registry.cn-hangzhou.aliyuncs.com/你的命名空间 -Tag v1
#>
param(
  [Parameter(Mandatory = $true)][string]$Registry,
  [string]$Tag = "v1"
)

$ErrorActionPreference = "Stop"
$root = Resolve-Path (Join-Path $PSScriptRoot "..\..")
Set-Location $root

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
  throw "未找到 docker，请先安装 Docker Desktop，或在装有 Docker 的 Linux 机器上执行 README 中的命令"
}

$backendImage = "$Registry/eudazi-backend:$Tag"
$webImage = "$Registry/eudazi-web:$Tag"

Write-Host "== 构建后端镜像: $backendImage ==" -ForegroundColor Cyan
docker build -f Dockerfile -t $backendImage .

Write-Host "== 构建 Web 镜像: $webImage ==" -ForegroundColor Cyan
docker build -f Dockerfile.web -t $webImage .

Write-Host "== 推送镜像 ==" -ForegroundColor Cyan
docker push $backendImage
docker push $webImage

Write-Host ""
Write-Host "完成：" -ForegroundColor Green
Write-Host "  backend: $backendImage"
Write-Host "  web    : $webImage"
Write-Host "把这两个镜像地址填到 Sealos「应用管理 → 创建应用」。"
