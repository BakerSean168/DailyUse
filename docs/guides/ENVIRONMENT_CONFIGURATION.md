# 环境配置指南

## 概述

DailyUse 采用 **12-Factor App** 标准的多环境配置策略，提供清晰的开发者体验和安全的生产部署。

## 配置文件结构

```
项目根目录/
├── .env                    # 共享默认值（无敏感信息，可提交）
├── .env.development        # 开发环境配置（可提交）
├── .env.production         # 生产环境默认值（可提交）
├── .env.example            # 完整示例模板（包含所有配置项说明）
├── .env.local              # 本地覆盖（.gitignore）
├── .env.development.local  # 开发本地覆盖（.gitignore）
├── .env.production.local   # 生产本地敏感配置（.gitignore）
│
└── apps/api/src/shared/infrastructure/config/
    ├── env.schema.ts       # Zod Schema 定义（类型验证）
    └── env.ts              # 环境变量加载和导出
```

## 加载优先级

环境变量按以下顺序加载，**后面的覆盖前面的**：

```
.env
  ↓
.env.{NODE_ENV}          # 如 .env.development
  ↓
.env.local
  ↓
.env.{NODE_ENV}.local    # 如 .env.development.local
```

## 快速开始

### 1. 新开发者 Onboarding

```bash
# 克隆项目
git clone <repo-url>
cd dailyuse

# 复制配置模板
cp .env.example .env.local

# 编辑本地配置（仅需修改敏感信息）
# - DATABASE_URL
# - JWT_SECRET

# 安装依赖并启动
pnpm install
pnpm nx serve api
```

### 2. 生产环境部署

```bash
# 创建生产配置文件
cp .env.example .env.production.local

# 编辑生产配置（必须修改所有敏感信息！）
vim .env.production.local

# 使用 Docker Compose 部署
docker-compose -f docker-compose.prod.yml --env-file .env.production.local up -d
```

## 配置项分类

### 应用基础配置

| 变量名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `NODE_ENV` | enum | `development` | 运行环境：development / production / test |
| `API_PORT` | number | `3000` | API 监听端口 |
| `API_HOST` | string | `0.0.0.0` | API 监听地址 |
| `LOG_LEVEL` | enum | `info` | 日志级别：debug / info / warn / error |
| `TZ` | string | `Asia/Shanghai` | 时区 |

### 数据库配置

| 变量名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| `DATABASE_URL` | url | ✅ | PostgreSQL 连接字符串 |
| `DB_HOST` | string | - | 数据库主机（可选，用于变量替换） |
| `DB_PORT` | number | `5432` | 数据库端口 |
| `DB_NAME` | string | `dailyuse` | 数据库名 |
| `DB_USER` | string | `dailyuse` | 数据库用户 |
| `DB_PASSWORD` | string | - | 数据库密码 |

### Redis 缓存配置

| 变量名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `REDIS_URL` | url | - | Redis 连接字符串（优先） |
| `REDIS_HOST` | string | `localhost` | Redis 主机 |
| `REDIS_PORT` | number | `6379` | Redis 端口 |
| `REDIS_PASSWORD` | string | - | Redis 密码 |
| `REDIS_DB` | number | `0` | Redis 数据库编号 |

### JWT 认证配置

| 变量名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| `JWT_SECRET` | string(32+) | ✅ | JWT 签名密钥（至少32字符） |
| `JWT_EXPIRES_IN` | string | `7d` | Token 有效期 |
| `JWT_REFRESH_EXPIRES_IN` | string | `30d` | 刷新 Token 有效期 |
| `REFRESH_TOKEN_SECRET` | string | - | 刷新 Token 密钥（默认使用 JWT_SECRET） |

### CORS 跨域配置

| 变量名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `CORS_ORIGIN` | string | `http://localhost:5173` | 允许的来源，多个用逗号分隔，`*` 表示全部 |

### 功能开关

| 变量名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `ENABLE_DAILY_ANALYSIS` | boolean | `true` | 启用每日分析任务 |
| `USE_PRIORITY_QUEUE_SCHEDULER` | boolean | `true` | 使用优先队列调度器 |

## 代码中使用

### 导入和使用

```typescript
// ✅ 推荐：使用统一的 env 模块
import { env, isDevelopment, isProduction, getJwtConfig, getCorsOrigins } from '@/shared/infrastructure/config/env.js';

// 使用环境变量
console.log(env.API_PORT);
console.log(env.DATABASE_URL);

// 使用便捷函数
if (isDevelopment) {
  console.log('Debug mode');
}

const jwtConfig = getJwtConfig();
const corsOrigins = getCorsOrigins();
```

### ❌ 避免直接使用 process.env

```typescript
// ❌ 不推荐：直接访问 process.env
const port = process.env.API_PORT || 3000;

// ✅ 推荐：使用类型安全的 env 对象
import { env } from '@/shared/infrastructure/config/env.js';
const port = env.API_PORT; // 已验证和类型化
```

## Schema 验证

应用启动时会自动验证所有环境变量：

```
====================================================
🚨 环境变量配置错误
====================================================
  - JWT_SECRET: JWT_SECRET 至少需要 32 个字符
  - DATABASE_URL: Required
====================================================

请检查 .env 文件配置是否正确

参考: .env.example 或 .env.development
```

## .gitignore 规则

```gitignore
# ✅ 可提交（不含敏感信息）
.env
.env.development
.env.production
.env.example

# ❌ 忽略（包含敏感信息）
.env.local
.env.*.local
.env.prod
```

## Docker 部署

### 使用环境文件

```bash
# 方式1：使用 --env-file
docker-compose -f docker-compose.prod.yml --env-file .env.production.local up -d

# 方式2：设置环境变量
export JWT_SECRET="your-secret"
export DATABASE_URL="postgresql://..."
docker-compose -f docker-compose.prod.yml up -d
```

### docker-compose.prod.yml 配置

```yaml
services:
  api:
    environment:
      NODE_ENV: production
      API_PORT: 3000
      DATABASE_URL: postgresql://${DB_USER}:${DB_PASSWORD}@postgres:5432/${DB_NAME}
      JWT_SECRET: ${JWT_SECRET:?请设置JWT密钥}
      CORS_ORIGIN: ${CORS_ORIGIN:-*}
```

## 安全最佳实践

1. **永远不要提交敏感配置**
   - 使用 `.env.local` 或 `.env.*.local` 存储敏感信息
   - 确保这些文件在 `.gitignore` 中

2. **生产环境使用强密钥**
   ```bash
   # 生成强随机密钥
   openssl rand -base64 64
   ```

3. **定期轮换密钥**
   - 建议每 90 天轮换 JWT_SECRET
   - 使用密钥管理服务（如 AWS Secrets Manager、HashiCorp Vault）

4. **最小权限原则**
   - 数据库用户只授予必要权限
   - 生产环境禁用调试日志

## 故障排查

### 启动失败：环境变量验证错误

1. 检查 `.env.local` 是否存在
2. 确认所有必填项已设置
3. 验证 DATABASE_URL 格式正确

### CORS 错误

参见 [CORS 配置指南](./CORS_CONFIGURATION.md)

### Redis 连接失败

1. 检查 REDIS_HOST 和 REDIS_PORT
2. 如果使用密码，确认 REDIS_PASSWORD 正确
3. 使用 REDIS_URL 完整连接字符串

## 相关文件

- [apps/api/src/shared/infrastructure/config/env.ts](../../apps/api/src/shared/infrastructure/config/env.ts) - 环境变量加载模块
- [apps/api/src/shared/infrastructure/config/env.schema.ts](../../apps/api/src/shared/infrastructure/config/env.schema.ts) - Zod Schema 定义
- [.env.example](../../.env.example) - 完整配置示例
- [docker-compose.prod.yml](../../docker-compose.prod.yml) - Docker 生产配置
