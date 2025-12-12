# DailyUse 部署脚本 (PowerShell)
# 用于快速部署应用到生产环境

param(
    [string]$Environment = "dev",
    [switch]$Help
)

$ErrorActionPreference = "Stop"

# 颜色输出函数
function Write-Header {
    param([string]$Message)
    Write-Host "========================================" -ForegroundColor Blue
    Write-Host $Message -ForegroundColor Blue
    Write-Host "========================================" -ForegroundColor Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "✓ $Message" -ForegroundColor Green
}

function Write-Error {
    param([string]$Message)
    Write-Host "✗ $Message" -ForegroundColor Red
}

function Write-Warning {
    param([string]$Message)
    Write-Host "⚠ $Message" -ForegroundColor Yellow
}

# 显示帮助信息
function Show-Help {
    Write-Host "DailyUse 部署脚本" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "用法:" -ForegroundColor White
    Write-Host "  .\deploy.ps1 [-Environment <dev|prod>] [-Help]" -ForegroundColor Gray
    Write-Host ""
    Write-Host "参数:" -ForegroundColor White
    Write-Host "  -Environment  部署环境 (dev 或 prod)，默认: dev" -ForegroundColor Gray
    Write-Host "  -Help         显示此帮助信息" -ForegroundColor Gray
    Write-Host ""
    Write-Host "示例:" -ForegroundColor White
    Write-Host "  .\deploy.ps1                    # 部署开发环境" -ForegroundColor Gray
    Write-Host "  .\deploy.ps1 -Environment prod  # 部署生产环境" -ForegroundColor Gray
}

# 检查前提条件
function Test-Requirements {
    Write-Header "检查前提条件"
    
    # 检查 Docker
    try {
        $null = docker --version
        Write-Success "Docker 已安装"
    } catch {
        Write-Error "Docker 未安装或未启动"
        exit 1
    }
    
    # 检查 Docker Compose
    try {
        $null = docker-compose --version
        Write-Success "Docker Compose 已安装"
    } catch {
        Write-Error "Docker Compose 未安装"
        exit 1
    }
    
    # 检查 .env 文件
    if (-not (Test-Path ".env")) {
        Write-Warning ".env 文件不存在，正在复制 .env.example..."
        Copy-Item ".env.example" ".env"
        Write-Warning "请编辑 .env 文件并修改关键配置（如密码）"
        Write-Host ""
        Write-Host "请编辑 .env 文件后重新运行此脚本" -ForegroundColor Yellow
        exit 0
    }
    Write-Success ".env 文件已存在"
}

# 检查磁盘空间
function Test-DiskSpace {
    Write-Header "检查磁盘空间"
    
    $drive = (Get-Location).Drive
    $freeSpace = (Get-PSDrive $drive.Name).Free / 1GB
    
    if ($freeSpace -lt 2) {
        Write-Error "磁盘空间不足（需要 2GB，可用 $([math]::Round($freeSpace, 2))GB）"
        exit 1
    }
    Write-Success "磁盘空间充足（$([math]::Round($freeSpace, 2))GB）"
}

# 选择部署环境
function Get-DeploymentEnvironment {
    if ($Environment -eq "dev") {
        return "docker-compose.yml"
    } elseif ($Environment -eq "prod") {
        return "docker-compose.prod.yml"
    } else {
        Write-Error "无效的环境选择: $Environment (应为 'dev' 或 'prod')"
        exit 1
    }
}

# 构建镜像
function Build-Images {
    param([string]$ComposeFile)
    
    Write-Header "构建 Docker 镜像"
    Write-Warning "构建镜像中，这可能需要几分钟..."
    
    docker-compose -f $ComposeFile build --no-cache
    
    if ($LASTEXITCODE -ne 0) {
        Write-Error "镜像构建失败"
        exit 1
    }
    
    Write-Success "镜像构建完成"
}

# 启动服务
function Start-Services {
    param([string]$ComposeFile)
    
    Write-Header "启动服务"
    
    docker-compose -f $ComposeFile up -d
    
    if ($LASTEXITCODE -ne 0) {
        Write-Error "服务启动失败"
        exit 1
    }
    
    Write-Success "服务已启动"
}

# 数据库迁移
function Invoke-DatabaseMigration {
    param([string]$ComposeFile)
    
    Write-Header "数据库迁移"
    
    $migrate = Read-Host "运行数据库迁移？(y/n)"
    if ($migrate -eq "y") {
        Write-Warning "等待 API 容器启动..."
        Start-Sleep -Seconds 5
        
        docker-compose -f $ComposeFile exec -T api pnpm prisma:migrate:deploy
        
        if ($LASTEXITCODE -ne 0) {
            Write-Warning "数据库迁移失败，请检查日志"
        } else {
            Write-Success "数据库迁移完成"
        }
    }
}

# 健康检查
function Test-ServiceHealth {
    Write-Header "健康检查"
    
    Write-Host "等待服务就绪..." -NoNewline
    for ($i = 1; $i -le 30; $i++) {
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:3000/health" -UseBasicParsing -ErrorAction SilentlyContinue
            if ($response.StatusCode -eq 200) {
                Write-Host ""
                Write-Success "API 服务健康"
                break
            }
        } catch {
            Write-Host "." -NoNewline
            Start-Sleep -Seconds 1
        }
    }
    
    Write-Host ""
    Start-Sleep -Seconds 2
    
    try {
        $response = Invoke-WebRequest -Uri "http://localhost/" -UseBasicParsing -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            Write-Success "Web 服务健康"
        }
    } catch {
        Write-Warning "Web 健康检查失败"
    }
}

# 显示访问信息
function Show-AccessInfo {
    param([string]$EnvName, [string]$ComposeFile)
    
    Write-Header "部署完成！"
    
    Write-Host "环境: " -NoNewline
    Write-Host $EnvName -ForegroundColor Blue
    Write-Host "API 地址: " -NoNewline
    Write-Host "http://localhost:3000" -ForegroundColor Green
    Write-Host "Web 地址: " -NoNewline
    Write-Host "http://localhost" -ForegroundColor Green
    Write-Host ""
    Write-Host "常用命令:" -ForegroundColor White
    Write-Host "  查看日志:          docker-compose -f $ComposeFile logs -f api" -ForegroundColor Gray
    Write-Host "  停止服务:          docker-compose -f $ComposeFile down" -ForegroundColor Gray
    Write-Host "  重启服务:          docker-compose -f $ComposeFile restart" -ForegroundColor Gray
    Write-Host "  查看容器状态:      docker-compose -f $ComposeFile ps" -ForegroundColor Gray
}

# 主函数
function Main {
    if ($Help) {
        Show-Help
        exit 0
    }
    
    Write-Header "DailyUse 部署脚本"
    Write-Host "版本: 0.1.0"
    Write-Host ""
    
    Test-Requirements
    Test-DiskSpace
    
    $composeFile = Get-DeploymentEnvironment
    $envName = if ($Environment -eq "prod") { "生产" } else { "开发" }
    
    Write-Host "部署环境: $envName ($composeFile)" -ForegroundColor Cyan
    $confirm = Read-Host "确认开始部署？(y/n)"
    
    if ($confirm -ne "y") {
        Write-Warning "部署已取消"
        exit 0
    }
    
    try {
        Build-Images -ComposeFile $composeFile
        Start-Services -ComposeFile $composeFile
        Test-ServiceHealth
        Invoke-DatabaseMigration -ComposeFile $composeFile
        Show-AccessInfo -EnvName $envName -ComposeFile $composeFile
    } catch {
        Write-Error "部署失败: $_"
        exit 1
    }
}

# 运行主函数
Main
