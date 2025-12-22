# DailyUse 自动化部署脚本 (Windows PowerShell)
# 功能：构建、推送和部署新镜像
# 用法：.\deploy-prod.ps1 -Version v1.0.3 -Registry crpi-xxx.cn-hangzhou.personal.cr.aliyuncs.com -Namespace bakersean

param(
    [string]$Version = "v1.0.3",
    [string]$Registry = "crpi-3po0rmvmxgu205ms.cn-hangzhou.personal.cr.aliyuncs.com",
    [string]$Namespace = "bakersean",
    [switch]$SkipTypecheck,
    [switch]$SkipBuild,
    [switch]$SkipPush
)

# ============================================================
# 配置
# ============================================================

$ImageName = "dailyuse-api"
$FullImage = "$Registry/$Namespace/${ImageName}:$Version"

function Write-Info($Message) {
    Write-Host "ℹ️  $Message" -ForegroundColor Green
}

function Write-Warn($Message) {
    Write-Host "⚠️  $Message" -ForegroundColor Yellow
}

function Write-Error2($Message) {
    Write-Host "❌ $Message" -ForegroundColor Red
}

function Write-Step($StepNumber, $Message) {
    Write-Host ""
    Write-Host "=====================================================" -ForegroundColor Green
    Write-Host "步骤 $StepNumber：$Message" -ForegroundColor Green
    Write-Host "=====================================================" -ForegroundColor Green
}

# ============================================================
# 执行步骤
# ============================================================

# 步骤 1：验证本地编译
if (-not $SkipTypecheck) {
    Write-Step 1 "验证本地编译"
    Write-Info "运行 TypeScript 类型检查..."
    
    pnpm nx run api:typecheck 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Info "✅ TypeScript 编译通过"
    } else {
        Write-Error2 "TypeScript 编译失败"
        exit 1
    }
}

# 步骤 2：构建 API 镜像
if (-not $SkipBuild) {
    Write-Step 2 "构建 API 镜像"
    Write-Info "镜像信息：$FullImage"
    
    docker build -t "$FullImage" -f Dockerfile.api .
    
    if ($LASTEXITCODE -eq 0) {
        Write-Info "✅ 镜像构建成功"
    } else {
        Write-Error2 "镜像构建失败"
        exit 1
    }
}

# 步骤 3：推送镜像到仓库
if (-not $SkipPush) {
    Write-Step 3 "推送镜像到仓库"
    Write-Info "推送 $FullImage..."
    Write-Warn "如未登录，请先执行：docker login -u <username> $Registry"
    
    docker push "$FullImage"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Info "✅ 镜像推送成功"
    } else {
        Write-Error2 "镜像推送失败"
        exit 1
    }
}

# 步骤 4：总结和提示
Write-Step 4 "部署总结和下一步"
Write-Host ""
Write-Host "新镜像信息：" -ForegroundColor Cyan
Write-Host "  仓库：$Registry"
Write-Host "  命名空间：$Namespace"
Write-Host "  镜像名：$ImageName"
Write-Host "  版本：$Version"
Write-Host "  完整标签：$FullImage"
Write-Host ""
Write-Info "下一步：在生产服务器上执行以下命令部署"
Write-Host ""
Write-Host "  # 1. SSH 连接到服务器" -ForegroundColor Gray
Write-Host "  ssh user@your-server" -ForegroundColor Gray
Write-Host ""
Write-Host "  # 2. 进入项目目录" -ForegroundColor Gray
Write-Host "  cd /path/to/dailyuse-production" -ForegroundColor Gray
Write-Host ""
Write-Host "  # 3. 更新镜像版本并重新部署" -ForegroundColor Gray
Write-Host "  export API_TAG=$Version" -ForegroundColor Gray
Write-Host "  docker-compose -f docker-compose.prod.yml --env-file .env.production.local down" -ForegroundColor Gray
Write-Host "  docker-compose -f docker-compose.prod.yml --env-file .env.production.local pull" -ForegroundColor Gray
Write-Host "  docker-compose -f docker-compose.prod.yml --env-file .env.production.local up -d" -ForegroundColor Gray
Write-Host ""
Write-Host "  # 4. 验证部署" -ForegroundColor Gray
Write-Host "  curl http://localhost:3000/healthz" -ForegroundColor Gray
Write-Host ""
Write-Host "✅ 部署准备完成！" -ForegroundColor Green
