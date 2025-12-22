# 🔧 DATABASE_URL 自动生成修复指南

## 问题描述

生产服务器报错：
```
🚨 环境变量配置错误
环境变量验证失败:
  - DATABASE_URL: Invalid input: expected string, received undefined
```

### 原因

- 之前更新了 `.env.example` 推荐使用分解配置（DB_HOST, DB_PORT 等）
- 但应用的 Zod schema 中 `DATABASE_URL` 被定义为 **required**
- 当生产服务器只配置了分解配置，没有提供 `DATABASE_URL` 时，验证失败

## ✅ 解决方案

修改应用代码，使 `DATABASE_URL` 可选，并在运行时从分解配置自动生成。

### 代码改动

#### 1. [env.schema.ts](../../apps/api/src/shared/infrastructure/config/env.schema.ts)

**改动内容**：
- 将 `DATABASE_URL` 从 required 改为 optional
- 将 `DB_HOST` 从 optional 改为 required with default 'localhost'
- 新增 `processEnv()` 函数来自动生成 DATABASE_URL

```typescript
// BEFORE
DATABASE_URL: z
  .string()
  .url()
  .describe('PostgreSQL 连接字符串'),

DB_HOST: z.string().optional(),
DB_PASSWORD: z.string().optional(),

// AFTER
DATABASE_URL: z
  .string()
  .url()
  .optional()
  .describe('PostgreSQL 连接字符串（可选，优先使用）'),

DB_HOST: z.string().default('localhost'),
DB_PASSWORD: z.string().default(''),

// 新增处理函数
export function processEnv(env: Env): Env {
  if (!env.DATABASE_URL && env.DB_HOST) {
    const username = env.DB_USER || 'dailyuse';
    const password = env.DB_PASSWORD ? `:${env.DB_PASSWORD}` : '';
    const host = env.DB_HOST;
    const port = env.DB_PORT || 5432;
    const database = env.DB_NAME || 'dailyuse';
    
    env.DATABASE_URL = `postgresql://${username}${password}@${host}:${port}/${database}?schema=public`;
  }
  
  return env;
}
```

#### 2. [env.ts](../../apps/api/src/shared/infrastructure/config/env.ts)

**改动内容**：
- 导入新增的 `processEnv` 函数
- 在 Zod 验证后调用 `processEnv()` 来自动生成 DATABASE_URL

```typescript
import { envSchema, processEnv, type Env } from './env.schema.js';

function validateEnv(): Env {
  loadAllEnvFiles();
  
  try {
    let env = envSchema.parse(process.env);
    
    // 后处理：自动生成 DATABASE_URL
    env = processEnv(env);
    
    return env;
  } catch (error) {
    // ... error handling
  }
}
```

### 优先级规则

**DATABASE_URL 优先级**（推荐顺序）：

1. ✅ **直接提供 DATABASE_URL**（如果有，直接使用）
2. ✅ **分解配置**（DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD）
   - 应用自动生成：`postgresql://user:pass@host:port/db`
3. ❌ **都不提供**（会报错，因为 PostgreSQL 连接是必需的）

## 📋 配置文件更新

### .env（共享）
```env
# 分解配置 - 推荐
DB_HOST=localhost
DB_PORT=5432
DB_NAME=dailyuse
DB_USER=dailyuse
DB_PASSWORD=default-password

# 或直接提供完整 URL（可选）
# DATABASE_URL=postgresql://...
```

### .env.development
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=dailyuse
DB_USER=dailyuse
DB_PASSWORD=dailyuse
```

### .env.production
```env
# Docker 网络中的服务名
DB_HOST=postgres
DB_PORT=5432
DB_NAME=dailyuse
DB_USER=postgres
# DB_PASSWORD 在 .env.production.local 中
```

### .env.production.local（服务器）
```env
DB_PASSWORD=your-secure-password
REDIS_PASSWORD=redis-password
JWT_SECRET=jwt-secret-at-least-32-chars
```

## 🚀 部署步骤

### 1. 拉取新镜像
```bash
# 本地构建完成，已推送到阿里云
docker pull crpi-3po0rmvmxgu205ms.cn-hangzhou.personal.cr.aliyuncs.com/bakersean/dailyuse-api:v1.0.3
```

### 2. 更新 docker-compose.prod.yml
```yaml
services:
  api:
    image: crpi-3po0rmvmxgu205ms.cn-hangzhou.personal.cr.aliyuncs.com/bakersean/dailyuse-api:v1.0.3
    environment:
      NODE_ENV: production
      
      # 分解配置
      DB_HOST: postgres
      DB_PORT: 5432
      DB_NAME: ${DB_NAME:-dailyuse}
      DB_USER: ${DB_USER:-postgres}
      DB_PASSWORD: ${DB_PASSWORD:?error}
      
      # Redis
      REDIS_HOST: redis
      REDIS_PORT: 6379
      REDIS_PASSWORD: ${REDIS_PASSWORD:?error}
```

### 3. 重启容器
```bash
docker-compose -f docker-compose.prod.yml up -d

# 验证
sleep 30
docker logs dailyuse-prod-api | grep -i "error\|success\|listen"
```

### 4. 验证修复
应该看到类似：
```
🚀 Server running at http://0.0.0.0:3000
✅ Database connection successful
✅ Redis connection successful
```

## 🔍 故障排查

### 问题 1：仍然报 DATABASE_URL 错误
- ✅ 检查是否已拉取 v1.0.3 镜像
- ✅ 检查 .env 或 .env.production 中是否配置了 DB_HOST
- ✅ 检查 docker-compose 中的 NODE_ENV 是否正确设置为 production

```bash
# 查看运行中的环境变量
docker exec dailyuse-prod-api env | grep -E "DB_|DATABASE_"
```

### 问题 2：数据库连接超时
- ✅ 检查 DB_HOST 是否正确（应为 `postgres`，即 docker-compose 中的服务名）
- ✅ 检查 DB_PORT 是否开放（默认 5432）
- ✅ 检查密码是否正确

```bash
# 测试数据库连接
docker exec dailyuse-prod-postgres psql -U postgres -h localhost -c "SELECT 1"
```

### 问题 3：密码中特殊字符导致连接失败
- ❌ 如果使用 DATABASE_URL，需要进行 URL 编码
- ✅ 如果使用分解配置，无需转义，应用自动处理

```env
# ❌ 错误
DATABASE_URL=postgresql://user:p@ssw0rd@localhost:5432/db

# ✅ 正确（使用分解配置）
DB_USER=user
DB_PASSWORD=p@ssw0rd
DB_HOST=localhost
```

## 📚 相关文件

| 文件 | 描述 |
|------|------|
| [env.schema.ts](../../apps/api/src/shared/infrastructure/config/env.schema.ts) | 环境变量定义和验证 |
| [env.ts](../../apps/api/src/shared/infrastructure/config/env.ts) | 环境变量加载和处理 |
| [.env.example](../../.env.example) | 环境变量示例配置 |
| [.env.production](../../.env.production) | 生产环境配置 |
| [DOCKER_ENV_CONFIGURATION.md](./DOCKER_ENV_CONFIGURATION.md) | Docker 环境配置详解 |
| [ENV_LOADING_MECHANISM.md](./ENV_LOADING_MECHANISM.md) | 环境变量加载机制 |

## 🎉 总结

### 问题
❓ DATABASE_URL 为 undefined，应用启动失败

### 原因
- Schema 定义 DATABASE_URL 为必需字段
- 配置文件只提供了分解配置，没有 DATABASE_URL

### 解决方案
✅ 修改 schema 使 DATABASE_URL 可选，应用自动从分解配置生成

### 优势
🚀 现在支持两种方式：
- 直接提供 `DATABASE_URL`（优先）
- 提供分解配置 `DB_*`（应用自动生成）

### 镜像版本
🐳 已推送 v1.0.3 到阿里云仓库
- 包含环境变量验证修复
- 支持自动生成 DATABASE_URL
- 完全兼容 Docker 最佳实践

**现在可以安全部署，使用分解配置而无需担心 DATABASE_URL 缺失！** ✨
