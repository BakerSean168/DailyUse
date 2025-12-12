# Docker 镜像快速构建和推送脚本
# 用法: .\build-and-push.ps1 -Registry docker.io -ImageNamespace yourname -Tag v1.0.0

param(
    [Parameter(Mandatory = $false)]
    [string]$Registry = "docker.io",
    
    [Parameter(Mandatory = $false)]
    [string]$ImageNamespace = "yourname",
    
    [Parameter(Mandatory = $false)]
    [string]$Tag = "v1.0.0",
    
    [Parameter(Mandatory = $false)]
    [switch]$Push = $false,
    
    [Parameter(Mandatory = $false)]
    [switch]$Latest = $false
)

$ErrorActionPreference = "Stop"

# 颜色输出函数
function Write-Success {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor Green
}

function Write-Info {
    param([string]$Message)
    Write-Host "ℹ️  $Message" -ForegroundColor Cyan
}

function Write-Warn {
    param([string]$Message)
    Write-Host "⚠️  $Message" -ForegroundColor Yellow
}

function Write-Error-Custom {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor Red
}

# 检查 Docker 是否已安装
Write-Info "检查 Docker 环境..."
try {
    $dockerVersion = docker --version
    Write-Success "Docker 已安装: $dockerVersion"
} catch {
    Write-Error-Custom "Docker 未安装或未在 PATH 中"
    exit 1
}

# 构建镜像名称
$ImageNameApi = "$Registry/$ImageNamespace/dailyuse-api:$Tag"
$ImageNameWeb = "$Registry/$ImageNamespace/dailyuse-web:$Tag"

Write-Info "=========================================="
Write-Info "Docker 镜像构建配置"
Write-Info "=========================================="
Write-Info "仓库: $Registry"
Write-Info "命名空间: $ImageNamespace"
Write-Info "标签: $Tag"
Write-Info "API 镜像: $ImageNameApi"
Write-Info "Web 镜像: $ImageNameWeb"
Write-Info "=========================================="

# 构建 API 镜像
Write-Info ""
Write-Info "构建 API 镜像..."
Write-Info "$ docker build -f Dockerfile.api -t $ImageNameApi ."

docker build -f Dockerfile.api -t $ImageNameApi .
if ($LASTEXITCODE -ne 0) {
    Write-Error-Custom "API 镜像构建失败"
    exit 1
}
Write-Success "API 镜像构建成功: $ImageNameApi"

# 构建 Web 镜像
Write-Info ""
Write-Info "构建 Web 镜像..."
Write-Info "$ docker build -f Dockerfile.web -t $ImageNameWeb ."

docker build -f Dockerfile.web -t $ImageNameWeb .
if ($LASTEXITCODE -ne 0) {
    Write-Error-Custom "Web 镜像构建失败"
    exit 1
}
Write-Success "Web 镜像构建成功: $ImageNameWeb"

# 显示镜像信息
Write-Info ""
Write-Info "本地镜像列表:"
docker images | grep "dailyuse"

# 可选：创建 latest 标签
if ($Latest) {
    Write-Info ""
    Write-Info "创建 latest 标签..."
    
    $ImageNameApiLatest = "$Registry/$ImageNamespace/dailyuse-api:latest"
    $ImageNameWebLatest = "$Registry/$ImageNamespace/dailyuse-web:latest"
    
    docker tag $ImageNameApi $ImageNameApiLatest
    docker tag $ImageNameWeb $ImageNameWebLatest
    
    Write-Success "已创建 latest 标签"
    Write-Info "API: $ImageNameApiLatest"
    Write-Info "Web: $ImageNameWebLatest"
}

# 可选：推送到仓库
if ($Push) {
    Write-Info ""
    Write-Warn "准备推送到仓库..."
    Write-Info "需要登录 $Registry"
    
    # 检查是否已登录
    $loginStatus = docker login --username test 2>&1
    
    Write-Info ""
    Write-Info "推送 API 镜像..."
    Write-Info "$ docker push $ImageNameApi"
    docker push $ImageNameApi
    if ($LASTEXITCODE -ne 0) {
        Write-Error-Custom "API 镜像推送失败"
        exit 1
    }
    Write-Success "API 镜像推送成功"
    
    Write-Info ""
    Write-Info "推送 Web 镜像..."
    Write-Info "$ docker push $ImageNameWeb"
    docker push $ImageNameWeb
    if ($LASTEXITCODE -ne 0) {
        Write-Error-Custom "Web 镜像推送失败"
        exit 1
    }
    Write-Success "Web 镜像推送成功"
    
    # 推送 latest 标签
    if ($Latest) {
        Write-Info ""
        Write-Info "推送 latest 标签..."
        docker push "$Registry/$ImageNamespace/dailyuse-api:latest"
        docker push "$Registry/$ImageNamespace/dailyuse-web:latest"
        Write-Success "latest 标签推送成功"
    }
}

# 最后总结
Write-Info ""
Write-Info "=========================================="
Write-Success "构建完成！"
Write-Info "=========================================="

if (-not $Push) {
    Write-Info ""
    Write-Info "下一步："
    Write-Info "1. 推送镜像到仓库:"
    Write-Info "   docker push $ImageNameApi"
    Write-Info "   docker push $ImageNameWeb"
    Write-Info ""
    Write-Info "或者使用本脚本的 -Push 标志:"
    Write-Info "   .\build-and-push.ps1 -Push"
    Write-Info ""
    Write-Info "2. 部署到生产环境:"
    Write-Info "   1. 复制 .env.prod.example 为 .env.prod"
    Write-Info "   2. 编辑 .env.prod 设置镜像位置和密钥"
    Write-Info "   3. 运行: docker compose -f docker-compose.prod.yml --env-file .env.prod up -d"
} else {
    Write-Info ""
    Write-Info "部署步骤:"
    Write-Info "1. 复制 .env.prod.example 为 .env.prod"
    Write-Info "2. 编辑 .env.prod 设置镜像位置和密钥"
    Write-Info "3. 运行: docker compose -f docker-compose.prod.yml --env-file .env.prod up -d"
}

Write-Info ""
Write-Info "更多信息请查看 DOCKER_DEPLOYMENT.md"
Write-Info "=========================================="
