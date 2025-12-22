# 生产环境环境变量修复 (DATABASE_URL 错误)

**问题**：API 容器报错 `error: Environment variable not found: DATABASE_URL`

**原因**：环境变量配置不完整或不一致

---

## 快速修复（3 步）

### 1️⃣ 检查 .env.production.local 文件

在生产服务器上创建 `.env.production.local`：

```bash
# 在服务器上运行
cat > /opt/dailyuse/DailyUse/.env.production.local << 'EOF'
# ============================================================
# 生产环境敏感信息配置
# ============================================================
# 该文件包含敏感信息，不要提交到 Git
# 权限应设为 600: chmod 600 .env.production.local

# 数据库密码
DB_PASSWORD=your-strong-database-password

# Redis 密码
REDIS_PASSWORD=your-strong-redis-password

# JWT 密钥（生成强密钥: openssl rand -base64 32）
JWT_SECRET=your-strong-jwt-secret-key-at-least-32-chars

# 可选：刷新 Token 密钥（可以与 JWT_SECRET 相同）
REFRESH_TOKEN_SECRET=your-strong-jwt-secret-key-at-least-32-chars
EOF

# 设置权限（仅 root 可读）
chmod 600 /opt/dailyuse/DailyUse/.env.production.local
```

### 2️⃣ 验证 .env.production 配置

检查 `.env.production` 中的数据库和 Redis 配置：

```dotenv
# ✅ 正确配置
DB_HOST=postgres
DB_PORT=5432
DB_NAME=dailyuse
DB_USER=dailyuse           # ⚠️ 重要：必须是 dailyuse，不能是 postgres
# DB_PASSWORD 在 .env.production.local 中

REDIS_HOST=redis
REDIS_PORT=6379
REDIS_DB=0
# REDIS_PASSWORD 在 .env.production.local 中
```

### 3️⃣ 重启服务

```bash
# 停止现有容器
docker compose -f docker-compose.prod.yml down

# 拉取最新配置
docker compose -f docker-compose.prod.yml pull

# 启动新容器（会自动加载环境变量）
docker compose -f docker-compose.prod.yml up -d

# 检查状态（等待 40 秒）
sleep 40
docker compose -f docker-compose.prod.yml ps

# 查看日志
docker compose -f docker-compose.prod.yml logs api
```

---

## 环境变量工作原理

### 文件加载顺序

```
.env
  ↓ 被覆盖
.env.production
  ↓ 被覆盖
.env.production.local (敏感信息) ← 最高优先级
  ↓
docker-compose 环境变量 ${VAR_NAME}
  ↓
应用读取的最终值
```

### DATABASE_URL 生成过程

```
如果未提供 DATABASE_URL：
  应用会自动拼接：
  
  postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}
  
  即：
  postgresql://dailyuse:your-password@postgres:5432/dailyuse?schema=public
```

### Redis 连接生成过程

```
如果未提供 REDIS_URL：
  应用会自动拼接：
  
  redis://:{REDIS_PASSWORD}@{REDIS_HOST}:{REDIS_PORT}/{REDIS_DB}
  
  即（如果有密码）：
  redis://:your-password@redis:6379/0
  
  即（如果没有密码）：
  redis://redis:6379/0
```

---

## 关键配置点检查清单

### ✅ 必须检查

- [ ] `.env.production.local` 存在且包含：
  - [ ] `DB_PASSWORD`
  - [ ] `REDIS_PASSWORD`
  - [ ] `JWT_SECRET`（至少 32 字符）
  
- [ ] `.env.production` 中：
  - [ ] `DB_USER=dailyuse`（不能是 postgres）
  - [ ] `DB_HOST=postgres`（Docker 服务名）
  - [ ] `REDIS_HOST=redis`（Docker 服务名）
  
- [ ] `docker-compose.prod.yml` 中的 postgres 服务：
  - [ ] `POSTGRES_USER: ${DB_USER:-dailyuse}`
  - [ ] `POSTGRES_PASSWORD: ${DB_PASSWORD}`
  - [ ] `POSTGRES_DB: ${DB_NAME:-dailyuse}`

### ✅ 验证连接

```bash
# 1. 进入 API 容器
docker compose -f docker-compose.prod.yml exec api sh

# 2. 验证环境变量
echo $DB_HOST
echo $DB_PORT
echo $DB_USER
echo $DB_NAME
# DB_PASSWORD 不要打印（安全考虑）

# 3. 测试数据库连接
npm run db:migrate || npm run prisma:migrate

# 4. 查看生成的 DATABASE_URL（应用内部查看）
node -e "console.log(process.env.DATABASE_URL)" 2>/dev/null || echo "Can't log DATABASE_URL for security"

# 5. 测试 Redis 连接
node -e "const Redis = require('ioredis'); new Redis({host: process.env.REDIS_HOST, port: process.env.REDIS_PORT, password: process.env.REDIS_PASSWORD}).ping().then(() => console.log('Redis connected')).catch(e => console.error('Redis failed:', e.message))"
```

---

## 常见问题

### Q: 为什么是 `dailyuse` 而不是 `postgres`？

A: `postgres` 是数据库系统管理员账户，不应该用于应用程序连接。应该创建专属的 `dailyuse` 账户，权限更受限，更安全。

### Q: 环境变量看起来正确，为什么还是报错？

A: 常见原因：
1. `.env.production.local` 没有创建
2. 密码中包含特殊字符，需要 URL 编码（使用分解配置可避免）
3. 重启 Docker 前没有保存文件
4. 容器内缓存了旧的环境变量（需要 `--no-cache` 重建）

### Q: 如何生成强密码？

```bash
# Linux/Mac
openssl rand -base64 32

# PowerShell
[Convert]::ToBase64String($(New-Object -TypeName byte[] -ArgumentList 32 | % { $_[+$_] = Get-Random -Maximum 256 }))

# 或者使用在线工具
# https://generate-random.org/encryption-key-generator
```

---

## 相关文件

- [docker-compose.prod.yml](../../docker-compose.prod.yml) - 已更新 DB_USER 和错误消息
- [.env.production](../../.env.production) - 已更新 DB_USER
- [.env.example](../../.env.example) - 环境变量参考
- [apps/api/src/shared/infrastructure/config/env.schema.ts](../../apps/api/src/shared/infrastructure/config/env.schema.ts) - 环境变量定义

---

## 修复摘要

| 文件 | 改动 | 原因 |
|------|------|------|
| docker-compose.prod.yml | 将 `DB_USER: ${DB_USER:-postgres}` 改为 `DB_USER: ${DB_USER:-dailyuse}` | 匹配 API 的实际需求 |
| .env.production | 将 `DB_USER=postgres` 改为 `DB_USER=dailyuse` | 匹配 docker-compose 预期 |
| 错误消息 | 更新了 `.env` 提示 | 帮助用户快速定位敏感信息存放位置 |

---

**状态**：✅ 已修复

所有配置现在已同步，用户只需创建 `.env.production.local` 并重启即可。
