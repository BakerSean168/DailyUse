# Docker 部署指南

## 📋 概述

本指南涵盖如何在本地构建 Docker 镜像，推送到容器仓库，以及在生产环境中运行。

### 项目结构
- **API** (`Dockerfile.api`): Node.js 后端，需要 Prisma 生成、Postgres、Redis
- **Web** (`Dockerfile.web`): Vue/React 前端，构建成静态资源，由 Nginx 提供服务
- **Infra**: PostgreSQL 16 和 Redis 7（在 `docker-compose.prod.yml` 中定义）

---

## 🛠 前置要求

### 本地环境
- **Docker Desktop** (Windows/Mac) 或 **Docker Engine** (Linux)
  - Windows: [下载 Docker Desktop](https://www.docker.com/products/docker-desktop)
  - 验证: `docker --version` 和 `docker compose --version`
- **pnpm** (可选，仅用于本地开发构建)
  - 验证: `pnpm --version`

### 镜像仓库账户
选择以下任一方案：
1. **Docker Hub** (免费公共、付费私有)
   - 注册: https://hub.docker.com
   - 命令: `docker login docker.io`
2. **GitHub Container Registry** (GHCR，推荐用于 GitHub 私有项目)
   - 命令: `docker login ghcr.io`
   - 需要个人访问令牌 (PAT)
3. **私有仓库** (Nexus, Artifactory, 或自托管 Harbor)

---

## 🏗 第 1 步：本地构建镜像

### 方案 A：快速构建脚本（PowerShell - Windows）

创建 `build-and-push.ps1`：

```powershell
# build-and-push.ps1

param(
    [string]$Registry = "docker.io",
    [string]$ImageNamespace = "yourname",
    [string]$Tag = "v1.0.0"
)

$ErrorActionPreference = "Stop"

$ImageNameApi = "$Registry/$ImageNamespace/dailyuse-api:$Tag"
$ImageNameWeb = "$Registry/$ImageNamespace/dailyuse-web:$Tag"

Write-Host "🔨 Building API image: $ImageNameApi" -ForegroundColor Green
docker build -f Dockerfile.api -t $ImageNameApi .
if ($LASTEXITCODE -ne 0) { 
    Write-Host "❌ API 构建失败" -ForegroundColor Red
    exit 1 
}

Write-Host "🔨 Building Web image: $ImageNameWeb" -ForegroundColor Green
docker build -f Dockerfile.web -t $ImageNameWeb .
if ($LASTEXITCODE -ne 0) { 
    Write-Host "❌ Web 构建失败" -ForegroundColor Red
    exit 1 
}

Write-Host "✅ 两个镜像构建成功！" -ForegroundColor Green
Write-Host "接下来运行推送命令或直接部署。" -ForegroundColor Cyan
```

运行：
```powershell
# 使用默认值
.\build-and-push.ps1

# 或指定参数
.\build-and-push.ps1 -Registry ghcr.io -ImageNamespace yourorg -Tag v1.0.0
```

### 方案 B：手动命令

```powershell
$REG = "docker.io"        # 改为 ghcr.io 或你的私有仓库
$NS = "yourname"          # 你的命名空间/组织名
$TAG = "v1.0.0"           # 版本标签

$IMG_API = "$REG/$NS/dailyuse-api:$TAG"
$IMG_WEB = "$REG/$NS/dailyuse-web:$TAG"

# 构建 API
docker build -f Dockerfile.api -t $IMG_API .

# 构建 Web
docker build -f Dockerfile.web -t $IMG_WEB .

# 验证
docker images | grep dailyuse
```

### 构建过程说明

#### API 构建 (`Dockerfile.api`)
1. 安装依赖 (`pnpm install --frozen-lockfile`)
2. 生成 Prisma 客户端 (`pnpm prisma:generate`)
3. 编译 TypeScript (`pnpm build`)
4. 最终镜像仅包含编译后的 `dist/` 和生产依赖（体积 ~200-300MB）

#### Web 构建 (`Dockerfile.web`)
1. 安装依赖 (`pnpm install --frozen-lockfile`)
2. 构建 SPA 产物到 `dist/` (`pnpm build`)
3. 最终镜像: Nginx Alpine (~150MB)，提供静态资源，SPA 路由配置

### 检查镜像

```powershell
# 列出本地镜像
docker images | grep dailyuse

# 检查镜像大小
docker image ls $IMG_API $IMG_WEB

# 检查镜像内部结构
docker history $IMG_API
```

---

## 🚀 第 2 步：推送到仓库

### 登录仓库

#### Docker Hub
```powershell
docker login docker.io
# 输入用户名和密码（或访问令牌）
```

#### GitHub Container Registry
```powershell
docker login ghcr.io
# 用户名: yourname
# 密码: GitHub 个人访问令牌 (repo, write:packages, read:packages)
```

### 推送镜像

```powershell
$IMG_API = "docker.io/yourname/dailyuse-api:v1.0.0"
$IMG_WEB = "docker.io/yourname/dailyuse-web:v1.0.0"

docker push $IMG_API
docker push $IMG_WEB
```

验证推送：
```powershell
# Docker Hub: 访问 https://hub.docker.com/r/yourname/dailyuse-api
# 或使用命令验证
docker pull $IMG_API  # 从远程拉取
```

### 标签和版本管理

```powershell
# 给同一镜像创建多个标签
docker tag $IMG_API "docker.io/yourname/dailyuse-api:latest"
docker push "docker.io/yourname/dailyuse-api:latest"

# 推送到不同环境
docker tag $IMG_API "docker.io/yourname/dailyuse-api:staging"
docker tag $IMG_API "docker.io/yourname/dailyuse-api:production"
```

---

## 🚢 第 3 步：部署（运行镜像）

### 方案 A：使用 Docker Compose（推荐）

#### 1. 准备环境文件

```powershell
# 复制示例文件并编辑
Copy-Item .env.prod.example .env.prod
# 手动编辑 .env.prod，设置：
# - REGISTRY, IMAGE_NAMESPACE, TAG（你推送的镜像位置）
# - DB_PASSWORD, REDIS_PASSWORD（强密码）
# - 其他特定应用配置
```

#### 2. 启动服务

```powershell
# 使用 .env.prod 中的变量
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d

# 查看日志
docker compose -f docker-compose.prod.yml logs -f api web postgres redis

# 停止服务
docker compose -f docker-compose.prod.yml down

# 完全删除（包括数据卷）
docker compose -f docker-compose.prod.yml down -v
```

#### 3. 验证服务状态

```powershell
# 检查运行中的容器
docker ps

# 查看特定容器日志
docker logs -f dailyuse-api
docker logs -f dailyuse-web

# 健康检查状态
docker ps --format "table {{.Names}}\t{{.Status}}"

# 测试 API
Invoke-WebRequest http://localhost:3000/health

# 测试 Web
Invoke-WebRequest http://localhost/
```

### 方案 B：单独运行容器

如果不使用 Compose，手动运行：

#### 1. 创建网络
```powershell
docker network create dailyuse-network
```

#### 2. 启动 PostgreSQL
```powershell
docker run -d --name dailyuse-postgres `
  --network dailyuse-network `
  -e POSTGRES_USER=dailyuse `
  -e POSTGRES_PASSWORD=your-secure-password `
  -e POSTGRES_DB=dailyuse `
  -v dailyuse-postgres-data:/var/lib/postgresql/data `
  postgres:16-alpine
```

#### 3. 启动 Redis
```powershell
docker run -d --name dailyuse-redis `
  --network dailyuse-network `
  -e REDIS_PASSWORD=your-secure-password `
  redis:7-alpine redis-server --requirepass your-secure-password
```

#### 4. 启动 API
```powershell
docker run -d --name dailyuse-api `
  --network dailyuse-network `
  -e NODE_ENV=production `
  -e DATABASE_URL="postgresql://dailyuse:your-secure-password@dailyuse-postgres:5432/dailyuse" `
  -e REDIS_URL="redis://:your-secure-password@dailyuse-redis:6379" `
  -p 3000:3000 `
  docker.io/yourname/dailyuse-api:v1.0.0
```

#### 5. 启动 Web
```powershell
docker run -d --name dailyuse-web `
  --network dailyuse-network `
  -p 80:80 `
  docker.io/yourname/dailyuse-web:v1.0.0
```

---

## 🌐 第 4 步：访问应用

| 服务 | URL | 说明 |
|------|-----|------|
| Web 前端 | http://localhost | 或 http://your-domain |
| API 健康检查 | http://localhost:3000/health | 返回 200 OK |
| PostgreSQL | localhost:5432 | 内部连接字符串见 Compose |
| Redis | localhost:6379 | 内部连接字符串见 Compose |

---

## 🔧 常见问题与故障排查

### Q1: 构建时出错 "COPY pnpm-lock.yaml failed"
**原因**: 运行命令的目录不是项目根目录  
**解决**: 确保在 `d:\myPrograms\DailyUse\` 目录执行 `docker build`

```powershell
cd d:\myPrograms\DailyUse
docker build -f Dockerfile.api -t dailyuse-api:v1 .
```

### Q2: 推送时失败 "denied: requested access is denied"
**原因**: 未登录或无权限  
**解决**:
```powershell
docker login docker.io  # 输入正确的用户名/密码
# 或检查镜像名是否正确（应包含用户名）
```

### Q3: 容器运行后立即退出
**原因**: 应用启动失败  
**解决**:
```powershell
docker logs dailyuse-api  # 查看错误日志
docker run -it dailyuse-api /bin/sh  # 进入容器调试
```

### Q4: API 无法连接到数据库
**原因**: 连接字符串错误或数据库未就绪  
**解决**:
```powershell
# 验证数据库健康状态
docker ps | grep postgres

# 检查网络连通性
docker exec dailyuse-api ping dailyuse-postgres

# 验证环境变量
docker exec dailyuse-api env | grep DATABASE_URL
```

### Q5: 如何更新镜像到新版本？
```powershell
# 1. 修改代码，重新构建
docker build -f Dockerfile.api -t docker.io/yourname/dailyuse-api:v1.1.0 .

# 2. 推送
docker push docker.io/yourname/dailyuse-api:v1.1.0

# 3. 更新 .env.prod 中的 TAG
# TAG=v1.1.0

# 4. 重启服务
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d
```

---

## 🔐 安全最佳实践

### 1. 环境变量管理
- **绝不**在 Dockerfile 中硬编码密钥
- 使用 `.env.prod` 传递敏感信息
- `.env.prod` **不应**提交到 Git（添加到 `.gitignore`）

```gitignore
# .gitignore
.env.prod
.env.local
```

### 2. 镜像安全扫描
```powershell
# 使用 Docker Scout 扫描漏洞（需要 Docker 登录）
docker scout cves docker.io/yourname/dailyuse-api:v1.0.0
```

### 3. 使用强密码
```powershell
# 生成安全密码
[Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes((New-Guid).ToString() + (Get-Random))) | Select-Object -First 32
```

### 4. 限制容器权限
- Dockerfile 中避免以 root 运行（添加 `USER` 指令）
- 使用资源限制: `docker run --memory 512m --cpus 1`

---

## 📊 性能优化

### 镜像大小优化
```powershell
# 查看镜像层
docker history docker.io/yourname/dailyuse-api:v1.0.0

# 多阶段构建已在 Dockerfile 中使用
# - Builder 阶段: 包含 pnpm, TS 编译器
# - Final 阶段: 仅含运行时依赖 (~200MB)
```

### 容器性能
- 使用 Alpine 基础镜像（轻量级）
- 启用日志轮转（compose 中已配置）
- 定期清理未使用的镜像和容器

```powershell
# 清理
docker system prune -a --volumes
```

---

## 📝 总结流程

```
[本地修改代码]
       ↓
[pnpm build 测试]
       ↓
[docker build] → API 镜像 & Web 镜像
       ↓
[docker login]
       ↓
[docker push] → 推送到 Docker Hub / GHCR / 私有仓库
       ↓
[编辑 .env.prod] → 配置镜像位置、密码、环境变量
       ↓
[docker compose up] → 启动 Postgres + Redis + API + Web
       ↓
[访问 http://localhost] → 应用就绪 ✅
```

---

## 📚 参考资源

- [Docker 官方文档](https://docs.docker.com/)
- [Docker Compose 参考](https://docs.docker.com/compose/compose-file/)
- [Best Practices for Dockerfile](https://docs.docker.com/develop/develop-images/dockerfile_best-practices/)
- [Node.js Docker 最佳实践](https://snyk.io/blog/10-best-practices-to-containerize-nodejs-web-applications-with-docker/)
