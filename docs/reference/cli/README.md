---
tags:
  - reference
  - cli
  - commands
  - nx
  - prisma
description: CLI命令参考 - 开发工具与脚本命令完整指南
created: 2025-11-23T17:45:00
updated: 2025-11-23T17:45:00
---

# ⌨️ CLI命令参考 - CLI Reference

> 项目开发与管理的命令行工具完整参考

## 📋 目录

- [Nx命令](#nx命令)
- [Prisma命令](#prisma命令)
- [Docker命令](#docker命令)
- [自定义脚本](#自定义脚本)
- [常用组合](#常用组合)

---

## ⚡ Nx命令

### 基础命令

#### 运行开发服务器

```bash
# 启动API服务
pnpm nx serve api

# 启动Web应用
pnpm nx serve web

# 启动Desktop应用
pnpm nx serve desktop

# 指定端口
pnpm nx serve api --port=3001
```

#### 构建项目

```bash
# 构建单个项目
pnpm nx build api
pnpm nx build web

# 构建所有项目
pnpm nx run-many --target=build --all

# 生产环境构建
pnpm nx build api --configuration=production
pnpm nx build web --configuration=production

# 并行构建
pnpm nx run-many --target=build --all --parallel=4
```

#### 运行测试

```bash
# 运行单元测试
pnpm nx test api
pnpm nx test web

# 运行所有测试
pnpm nx run-many --target=test --all

# 测试覆盖率
pnpm nx test api --coverage

# 监听模式
pnpm nx test api --watch

# 运行E2E测试
pnpm nx e2e web-e2e
pnpm nx e2e api-e2e
```

#### Lint检查

```bash
# Lint单个项目
pnpm nx lint api
pnpm nx lint web

# Lint所有项目
pnpm nx run-many --target=lint --all

# 自动修复
pnpm nx lint api --fix

# 并行Lint
pnpm nx run-many --target=lint --all --parallel=4
```

#### 类型检查

```bash
# TypeScript类型检查
pnpm nx run api:type-check
pnpm nx run web:type-check

# 所有项目类型检查
pnpm nx run-many --target=type-check --all
```

### 依赖图

```bash
# 查看项目依赖图
pnpm nx graph

# 查看特定项目的依赖
pnpm nx graph --focus=api

# 查看受影响的项目
pnpm nx affected:graph
```

### 受影响分析

```bash
# 查看受影响的项目
pnpm nx affected --target=build
pnpm nx affected --target=test
pnpm nx affected --target=lint

# 测试受影响的项目
pnpm nx affected:test

# 构建受影响的项目
pnpm nx affected:build

# 指定基准分支
pnpm nx affected:test --base=main
```

### 缓存管理

```bash
# 清除Nx缓存
pnpm nx reset

# 查看缓存状态
pnpm nx daemon --status

# 停止Nx守护进程
pnpm nx daemon --stop
```

### 生成器

```bash
# 生成新应用
pnpm nx g @nx/nest:app my-api
pnpm nx g @nx/vue:app my-web

# 生成库
pnpm nx g @nx/js:lib my-lib
pnpm nx g @nx/nest:lib my-nest-lib

# 生成组件
pnpm nx g @nx/vue:component Button --project=web

# 生成服务
pnpm nx g @nx/nest:service UserService --project=api

# 生成控制器
pnpm nx g @nx/nest:controller UserController --project=api
```

---

## 🗄️ Prisma命令

### 数据库迁移

```bash
# 创建迁移
pnpm nx run api:prisma:migrate:dev --name=add_user_table

# 应用迁移
pnpm nx run api:prisma:migrate:deploy

# 查看迁移状态
pnpm nx run api:prisma:migrate:status

# 重置数据库（危险！）
pnpm nx run api:prisma:migrate:reset

# 解决迁移冲突
pnpm nx run api:prisma:migrate:resolve --rolled-back 20250101000000
```

### Schema管理

```bash
# 格式化schema文件
pnpm nx run api:prisma:format

# 验证schema
pnpm nx run api:prisma:validate

# 生成Prisma Client
pnpm nx run api:prisma:generate

# 从数据库拉取schema（内省）
pnpm nx run api:prisma:db:pull

# 将schema推送到数据库（不创建迁移）
pnpm nx run api:prisma:db:push
```

### Prisma Studio

```bash
# 启动可视化数据库管理工具
pnpm nx run api:prisma:studio

# 指定端口
pnpm nx run api:prisma:studio --port=5556
```

### Seed数据

```bash
# 运行seed脚本
pnpm nx run api:prisma:seed

# 自定义seed脚本
node apps/api/prisma/seed.ts
```

---

## 🐳 Docker命令

### Docker Compose

```bash
# 启动所有服务
docker-compose up -d

# 启动特定服务
docker-compose up -d postgres redis

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f
docker-compose logs -f postgres

# 停止服务
docker-compose down

# 停止并删除卷
docker-compose down -v

# 重启服务
docker-compose restart postgres
```

### 自定义Docker脚本

```bash
# 启动所有Docker服务（推荐）
pnpm docker:services

# 启动数据库
pnpm docker:db

# 启动Redis
pnpm docker:redis

# 启动测试数据库
pnpm docker:test-db

# 停止所有服务
pnpm docker:down
```

### Docker管理

```bash
# 查看运行中的容器
docker ps

# 查看所有容器（包括停止的）
docker ps -a

# 进入容器
docker exec -it dailyuse-postgres bash
docker exec -it dailyuse-redis redis-cli

# 查看容器日志
docker logs dailyuse-postgres
docker logs -f dailyuse-redis

# 删除容器
docker rm dailyuse-postgres

# 删除镜像
docker rmi postgres:16
```

---

## 🛠 自定义脚本

### 开发脚本

```bash
# 安装依赖
pnpm install

# 清理安装
pnpm clean:install

# 格式化代码
pnpm format

# 检查格式
pnpm format:check
```

### 测试脚本

```bash
# 运行所有单元测试
pnpm test

# 运行所有E2E测试
pnpm test:e2e

# 运行集成测试
pnpm test:integration

# 测试覆盖率
pnpm test:coverage
```

### 构建脚本

```bash
# 构建所有项目
pnpm build

# 构建生产版本
pnpm build:prod

# 清理构建产物
pnpm clean:dist
```

### 数据库脚本

```bash
# 数据库迁移（开发）
pnpm db:migrate

# 数据库迁移（生产）
pnpm db:migrate:prod

# 数据库重置
pnpm db:reset

# Prisma Studio
pnpm db:studio

# 数据库seed
pnpm db:seed
```

### Git脚本

```bash
# 获取新token
./get-new-token.sh

# 诊断dashboard
./diagnose-dashboard.sh
```

---

## 🎯 常用组合

### 完整开发环境启动

```bash
# 1. 启动Docker服务
pnpm docker:services

# 2. 运行数据库迁移
pnpm db:migrate

# 3. 启动API服务
pnpm nx serve api

# 4. 启动Web应用（新终端）
pnpm nx serve web
```

### 代码质量检查

```bash
# 运行所有检查
pnpm format:check && \
pnpm nx run-many --target=lint --all && \
pnpm nx run-many --target=type-check --all && \
pnpm test
```

### 生产构建与部署

```bash
# 1. 运行测试
pnpm test && pnpm test:e2e

# 2. 构建生产版本
pnpm nx run-many --target=build --all --configuration=production

# 3. 构建Docker镜像
docker build -t dailyuse/api:latest ./apps/api
docker build -t dailyuse/web:latest ./apps/web
```

### 数据库维护

```bash
# 备份数据库
docker exec dailyuse-postgres pg_dump -U dailyuse dailyuse_dev > backup.sql

# 恢复数据库
docker exec -i dailyuse-postgres psql -U dailyuse dailyuse_dev < backup.sql

# 清理并重建
pnpm db:reset && pnpm db:seed
```

---

## 📝 Package.json脚本

### 完整脚本列表

```json
{
  "scripts": {
    // 开发
    "dev:api": "nx serve api",
    "dev:web": "nx serve web",
    "dev:desktop": "nx serve desktop",
    
    // 构建
    "build": "nx run-many --target=build --all",
    "build:prod": "nx run-many --target=build --all --configuration=production",
    "build:api": "nx build api",
    "build:web": "nx build web",
    
    // 测试
    "test": "nx run-many --target=test --all",
    "test:watch": "nx run-many --target=test --all --watch",
    "test:coverage": "nx run-many --target=test --all --coverage",
    "test:e2e": "nx run-many --target=e2e --all",
    "test:integration": "nx run api:test:integration",
    
    // Lint
    "lint": "nx run-many --target=lint --all",
    "lint:fix": "nx run-many --target=lint --all --fix",
    
    // 格式化
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    
    // 类型检查
    "type-check": "nx run-many --target=type-check --all",
    
    // 数据库
    "db:migrate": "nx run api:prisma:migrate:dev",
    "db:migrate:prod": "nx run api:prisma:migrate:deploy",
    "db:reset": "nx run api:prisma:migrate:reset",
    "db:studio": "nx run api:prisma:studio",
    "db:seed": "nx run api:prisma:seed",
    "db:generate": "nx run api:prisma:generate",
    
    // Docker
    "docker:services": "docker-compose up -d postgres redis",
    "docker:db": "docker-compose up -d postgres",
    "docker:redis": "docker-compose up -d redis",
    "docker:test-db": "docker-compose -f docker-compose.test.yml up -d",
    "docker:down": "docker-compose down",
    
    // 清理
    "clean": "nx reset && rm -rf node_modules dist",
    "clean:install": "rm -rf node_modules pnpm-lock.yaml && pnpm install",
    "clean:dist": "rm -rf dist",
    
    // 其他
    "graph": "nx graph",
    "affected": "nx affected"
  }
}
```

---

## 🔧 配置文件位置

```
DailyUse/
├── nx.json                    # Nx配置
├── package.json               # 项目脚本
├── tsconfig.base.json         # TypeScript基础配置
├── .eslintrc.json            # ESLint配置
├── .prettierrc               # Prettier配置
├── docker-compose.yml        # Docker Compose配置
├── apps/
│   ├── api/
│   │   ├── project.json      # API项目配置
│   │   └── prisma/
│   │       └── schema.prisma # Prisma Schema
│   └── web/
│       └── project.json      # Web项目配置
└── tools/
    └── scripts/              # 自定义脚本
```

---

## 📚 相关文档

- [[reference/configuration/nx|Nx配置参考]]
- [[guides/development/setup|开发环境配置]]
- [[guides/deployment/local|本地部署指南]]
- [[ops/docker/DOCKER_SERVICES_GUIDE|Docker服务指南]]

---

**最后更新**: 2025-11-23  
**维护者**: @BakerSean168  
**版本**: v2.0
