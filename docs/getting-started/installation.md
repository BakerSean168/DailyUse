---
tags:
  - getting-started
  - installation
  - setup
description: DailyUse完整安装指南
created: 2025-11-23T15:00:00
updated: 2025-11-23T15:00:00
---

# 📦 Installation Guide

完整的 DailyUse 安装和环境配置指南。

## 📋 前置要求

在开始之前，确保你的系统已安装以下工具：

### 必需软件

| 软件 | 最低版本 | 推荐版本 | 用途 |
|------|---------|---------|------|
| **Node.js** | 20.x | 22.x | JavaScript 运行时 |
| **pnpm** | 8.x | 9.x | 包管理器 |
| **PostgreSQL** | 14.x | 16.x | 数据库 |
| **Redis** | 6.x | 7.x | 缓存和消息队列 |
| **Git** | 2.30+ | latest | 版本控制 |

### 可选软件

| 软件 | 用途 |
|------|------|
| **Docker** | 容器化部署（推荐用于开发环境） |
| **VS Code** | 推荐编辑器 |
| **Nx Console** | VS Code 插件（提升 Nx 使用体验） |

## 🛠 安装步骤

### 1. 安装 Node.js

#### Windows

**方式 A: 使用官方安装包**
```powershell
# 访问 https://nodejs.org/
# 下载并安装 LTS 版本
```

**方式 B: 使用 Volta (推荐)**
```powershell
# 安装 Volta
irm https://get.volta.sh | iex

# 安装 Node.js
volta install node@22
```

**方式 C: 使用 nvm-windows**
```powershell
# 安装 nvm-windows
# 从 https://github.com/coreybutler/nvm-windows/releases 下载安装

# 安装 Node.js
nvm install 22
nvm use 22
```

#### macOS

```bash
# 使用 Homebrew
brew install node@22

# 或使用 nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 22
nvm use 22
```

#### Linux

```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs

# 或使用 nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 22
nvm use 22
```

**验证安装**:
```bash
node --version  # 应显示 v22.x.x
npm --version   # 应显示 10.x.x
```

### 2. 安装 pnpm

```bash
# 使用 npm 安装
npm install -g pnpm

# 或使用 Corepack (Node.js 16.13+)
corepack enable
corepack prepare pnpm@latest --activate
```

**验证安装**:
```bash
pnpm --version  # 应显示 9.x.x
```

### 3. 安装数据库

#### PostgreSQL

**Windows (使用 Docker - 推荐)**:
```powershell
# 启动 PostgreSQL 容器
docker run -d `
  --name dailyuse-postgres `
  -e POSTGRES_USER=dailyuse `
  -e POSTGRES_PASSWORD=dev123456 `
  -e POSTGRES_DB=dailyuse `
  -p 5432:5432 `
  postgres:16-alpine
```

**macOS**:
```bash
# 使用 Homebrew
brew install postgresql@16
brew services start postgresql@16

# 创建数据库
createdb dailyuse
```

**Linux**:
```bash
# Ubuntu/Debian
sudo apt-get install postgresql-16
sudo systemctl start postgresql

# 创建数据库和用户
sudo -u postgres psql
CREATE DATABASE dailyuse;
CREATE USER dailyuse WITH PASSWORD 'dev123456';
GRANT ALL PRIVILEGES ON DATABASE dailyuse TO dailyuse;
```

**验证安装**:
```bash
psql -U dailyuse -d dailyuse -h localhost
# 应该能成功连接
```

#### Redis

**Windows (使用 Docker - 推荐)**:
```powershell
# 启动 Redis 容器
docker run -d `
  --name dailyuse-redis `
  -p 6379:6379 `
  redis:7-alpine
```

**macOS**:
```bash
# 使用 Homebrew
brew install redis
brew services start redis
```

**Linux**:
```bash
# Ubuntu/Debian
sudo apt-get install redis-server
sudo systemctl start redis
```

**验证安装**:
```bash
redis-cli ping  # 应返回 PONG
```

### 4. 克隆项目

```bash
# 克隆仓库
git clone https://github.com/BakerSean168/DailyUse.git
cd DailyUse

# 如果你是贡献者，克隆你的 Fork
git clone https://github.com/YOUR_USERNAME/DailyUse.git
cd DailyUse
git remote add upstream https://github.com/BakerSean168/DailyUse.git
```

### 5. 安装项目依赖

```bash
# 安装所有依赖
pnpm install

# 安装并构建依赖（首次安装推荐）
pnpm install --frozen-lockfile
```

**这一步会**:
- 安装所有 npm 包
- 设置 Nx 缓存
- 链接 workspace 中的包

### 6. 配置环境变量

```bash
# 复制环境变量模板
cp .env.example .env
```

**编辑 `.env` 文件**:
```bash
# 数据库配置
DATABASE_URL="postgresql://dailyuse:dev123456@localhost:5432/dailyuse"

# Redis 配置
REDIS_URL="redis://localhost:6379"

# JWT 密钥（开发环境）
JWT_SECRET="your-dev-secret-key"
JWT_EXPIRES_IN="7d"

# API 配置
API_PORT=3000
API_HOST="localhost"

# Web 应用配置
VITE_API_URL="http://localhost:3000"

# 日志级别
LOG_LEVEL="debug"
```

### 7. 初始化数据库

```bash
# 运行数据库迁移
pnpm nx run api:migrate

# 生成数据库客户端（Prisma）
pnpm nx run api:prisma-generate

# （可选）填充示例数据
pnpm nx run api:seed
```

### 8. 启动开发服务器

```bash
# 启动 API 服务
pnpm nx serve api

# 在新终端启动 Web 应用
pnpm nx serve web

# 在新终端启动 Desktop 应用
pnpm nx serve desktop
```

**验证**:
- API: http://localhost:3000
- Web: http://localhost:4200
- Desktop: 应该自动打开 Electron 窗口

## 🐳 使用 Docker (推荐)

### 一键启动所有服务

```bash
# 启动所有服务（数据库 + Redis + API + Web）
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止所有服务
docker-compose down
```

### 仅启动数据库服务

```bash
# 启动数据库和 Redis
docker-compose up -d postgres redis

# 本地运行应用
pnpm nx serve api
pnpm nx serve web
```

## 🔧 常见问题

### pnpm install 失败

**问题**: `EACCES: permission denied`

**解决方案**:
```bash
# 清理缓存
pnpm store prune

# 删除 node_modules 和 lockfile
rm -rf node_modules pnpm-lock.yaml

# 重新安装
pnpm install
```

### 数据库连接失败

**问题**: `ECONNREFUSED ::1:5432`

**解决方案**:
```bash
# 检查 PostgreSQL 是否运行
# Windows/macOS
docker ps | grep postgres

# Linux
sudo systemctl status postgresql

# 检查连接字符串
psql $DATABASE_URL
```

### Redis 连接失败

**问题**: `ECONNREFUSED 127.0.0.1:6379`

**解决方案**:
```bash
# 检查 Redis 是否运行
redis-cli ping

# 如果没有运行
# Docker
docker start dailyuse-redis

# macOS
brew services start redis

# Linux
sudo systemctl start redis
```

### Nx 构建失败

**问题**: `Cannot find module '@dailyuse/contracts'`

**解决方案**:
```bash
# 清理 Nx 缓存
pnpm nx reset

# 重新构建依赖
pnpm nx run-many --target=build --projects=@dailyuse/contracts,@dailyuse/utils

# 重试
pnpm nx serve api
```

### 端口占用

**问题**: `Port 3000 is already in use`

**解决方案**:
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# macOS/Linux
lsof -ti:3000 | xargs kill -9

# 或者更改端口
pnpm nx serve api --port=3001
```

## 📚 下一步

安装完成后，建议按以下顺序学习：

1. [[project-structure|📁 项目结构]] - 了解代码组织
2. [[../guides/development/setup|🛠 开发环境配置]] - 配置编辑器和工具
3. [[first-contribution|🎯 第一次贡献]] - 实现一个简单功能
4. [[../architecture/system-overview|📐 系统架构]] - 深入理解架构

## 🆘 需要帮助？

如果遇到问题：

1. 查看 [[../guides/troubleshooting/common-errors|常见错误]] 文档
2. 搜索 [GitHub Issues](https://github.com/BakerSean168/DailyUse/issues)
3. 在 [Discussions](https://github.com/BakerSean168/DailyUse/discussions) 提问
4. 联系维护者: baker.sean168@gmail.com

---

**注意**: 开发环境配置因系统而异，如果遇到问题，欢迎提 Issue 或改进文档！
