# 🐳 Docker 部署中的环境变量配置方式

**问题**：使用 Docker Compose 部署时，是应该用完整连接字符串（DATABASE_URL）还是分解配置（DB_HOST、DB_PORT 等）？

**答案**：**都可以，但分解配置（方式二）更符合 Docker 最佳实践。**

---

## 📊 两种方式对比

| 特性 | 完整字符串（方式一） | 分解配置（方式二） |
|------|-----------------|-----------------|
| **格式** | `DATABASE_URL=postgresql://user:pass@host:port/db` | `DB_HOST=localhost`<br/>`DB_PORT=5432`<br/>`DB_NAME=db`<br/>`DB_USER=user`<br/>`DB_PASSWORD=pass` |
| **在 docker-compose 中使用** | ⚠️ 直接复制粘贴 | ✅ 灵活替换 |
| **可读性** | ❌ 紧凑，难以调试 | ✅ 清晰，易于管理 |
| **特殊字符处理** | ⚠️ 需要 URL 编码 | ✅ 简单直接 |
| **环境变量组合** | ❌ 单一字符串 | ✅ 多个独立变量 |
| **应用兼容性** | ✅ 优先级高 | ✅ 备选方案 |

---

## 🔄 应用的处理逻辑

应用代码已经做了智能处理：

```typescript
// 优先级：DATABASE_URL > 分解配置 > 默认值

如果有 DATABASE_URL
  ↓
直接使用 DATABASE_URL
  
否则，尝试从分解配置构建：
  ↓
拼接：postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}
  
都没有
  ↓
使用默认连接字符串
```

---

## 🐳 Docker Compose 的实际用法

### ❌ 方式一：完整字符串（不推荐）

**缺点**：
- 密码包含特殊字符时容易出错
- 在 docker-compose.yml 中不能灵活组合
- 从外部覆盖很麻烦

```yaml
# docker-compose.prod.yml
services:
  api:
    environment:
      DATABASE_URL: postgresql://postgres:your-password@postgres:5432/dailyuse

      # 问题：如果要改密码，需要改整个字符串
      # 如果密码包含 @ 符号，需要 URL 编码
```

**示例问题**：
```bash
# 如果密码是 "my@password123"，需要写成：
DATABASE_URL=postgresql://postgres:my%40password123@postgres:5432/dailyuse
# 容易写错！
```

---

### ✅ 方式二：分解配置（推荐）

**优点**：
- 清晰易懂
- 可以独立管理每个部分
- 在 docker-compose.yml 中可以直接替换
- 特殊字符无需处理

```yaml
# docker-compose.prod.yml
services:
  postgres:
    environment:
      POSTGRES_DB: ${DB_NAME:-dailyuse}
      POSTGRES_USER: ${DB_USER:-postgres}
      POSTGRES_PASSWORD: ${DB_PASSWORD:?error_no_password}
  
  api:
    depends_on:
      postgres:
        condition: service_healthy
    environment:
      DB_HOST: postgres          # Docker 网络中的主机名
      DB_PORT: 5432
      DB_NAME: ${DB_NAME:-dailyuse}
      DB_USER: ${DB_USER:-postgres}
      DB_PASSWORD: ${DB_PASSWORD:?error_no_password}
      
      # 不需要设置 DATABASE_URL，应用会自动拼接！
```

**好处**：
- PostgreSQL 容器和 API 容器使用相同的变量
- 从 `.env` 文件中统一读取：
  ```env
  DB_NAME=dailyuse
  DB_USER=postgres
  DB_PASSWORD=your-secure-password
  ```
- 无需重复

---

## 🎯 对应的 .env.production.local 配置

### 使用分解配置的推荐方式

```bash
# .env.production.local
NODE_ENV=production
LOG_LEVEL=warn

# 数据库配置（分解方式）
DB_HOST=postgres              # Docker 网络中的服务名
DB_PORT=5432
DB_NAME=dailyuse
DB_USER=postgres
DB_PASSWORD=your-secure-password-here

# 不需要设置 DATABASE_URL！
# 应用会自动根据 DB_* 变量拼接成：
# postgresql://postgres:your-secure-password-here@postgres:5432/dailyuse

# Redis 配置
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password

# JWT 和 CORS（如前）
JWT_SECRET=...
CORS_ORIGIN=https://yourdomain.com
```

---

## 🔄 在 Docker Compose 中的实际流程

### 步骤 1：读取 .env 文件

```env
# .env
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_NAME=dailyuse
DB_USER=dailyuse
DB_PASSWORD=dev-password
```

### 步骤 2：docker-compose.yml 中引用

```yaml
services:
  api:
    environment:
      DB_HOST: ${DB_HOST}
      DB_PORT: ${DB_PORT}
      DB_NAME: ${DB_NAME}
      DB_USER: ${DB_USER}
      DB_PASSWORD: ${DB_PASSWORD}
```

### 步骤 3：启动容器

```bash
docker-compose up -d

# Docker Compose 自动：
# 1. 读取 .env 文件
# 2. 替换 ${DB_HOST} → localhost
# 3. 替换 ${DB_PORT} → 5432
# ... 等等
# 4. 注入到容器的环境变量
```

### 步骤 4：应用接收环境变量

```typescript
// 应用代码中
const env = loadEnv()

// env 对象现在包含：
env.DB_HOST    // "localhost"
env.DB_PORT    // 5432
env.DB_NAME    // "dailyuse"
env.DB_USER    // "dailyuse"
env.DB_PASSWORD // "dev-password"

// 应用会自动拼接成 DATABASE_URL（内部使用）
```

---

## 🌍 实际场景对比

### 场景 1：本地开发

```env
# .env.local
DB_HOST=localhost
DB_PORT=5432
DB_NAME=dailyuse_dev
DB_USER=dailyuse
DB_PASSWORD=dev-password
REDIS_HOST=localhost
```

### 场景 2：Docker 本地测试

```env
# .env (Docker 版)
DB_HOST=postgres           # Docker 服务名
DB_PORT=5432
DB_NAME=dailyuse
DB_USER=dailyuse
DB_PASSWORD=docker-password
REDIS_HOST=redis           # Docker 服务名
```

```yaml
# docker-compose.yml
services:
  postgres:
    environment:
      POSTGRES_DB: ${DB_NAME}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
  
  api:
    environment:
      DB_HOST: ${DB_HOST}      # 自动替换为 "postgres"
      DB_PASSWORD: ${DB_PASSWORD}  # 自动替换为 "docker-password"
```

### 场景 3：生产环境（服务器）

```env
# .env.production.local（只在服务器上）
DB_HOST=postgres
DB_PORT=5432
DB_NAME=dailyuse
DB_USER=postgres
DB_PASSWORD=production-secure-password-123456
REDIS_HOST=redis
REDIS_PASSWORD=redis-secure-password-789012
JWT_SECRET=production-jwt-secret-key-...
CORS_ORIGIN=https://yourdomain.com
```

```bash
# 启动应用
docker-compose -f docker-compose.prod.yml up -d

# 应用自动：
# 1. 读取 .env（基础值）
# 2. 读取 .env.production（生产覆盖）
# 3. 读取 .env.production.local（敏感信息覆盖）
# 4. Docker Compose 使用这些变量替换 ${...}
# 5. 应用收到替换后的环境变量
# 6. 一切正常工作！
```

---

## 🎓 Docker 最佳实践建议

### ✅ 推荐做法

```yaml
# docker-compose.prod.yml

version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    environment:
      # 从 .env 中读取分解的配置
      POSTGRES_DB: ${DB_NAME}
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
  
  redis:
    image: redis:7-alpine
    command: redis-server --requirepass ${REDIS_PASSWORD}
  
  api:
    depends_on:
      postgres:
        condition: service_healthy
    environment:
      # 分解配置方式
      DB_HOST: postgres
      DB_PORT: 5432
      DB_NAME: ${DB_NAME}
      DB_USER: ${DB_USER}
      DB_PASSWORD: ${DB_PASSWORD}
      
      REDIS_HOST: redis
      REDIS_PORT: 6379
      REDIS_PASSWORD: ${REDIS_PASSWORD}
      
      JWT_SECRET: ${JWT_SECRET}
      CORS_ORIGIN: ${CORS_ORIGIN}
```

**好处**：
- PostgreSQL 和 API 共用 DB_* 变量
- Redis 密码由 Redis 命令处理，API 也能读取
- 所有敏感信息集中在 .env.production.local
- 维护方便

### ❌ 不推荐做法

```yaml
# ❌ 混合使用（容易混淆）
api:
  environment:
    DATABASE_URL: postgresql://postgres:${DB_PASSWORD}@postgres:5432/dailyuse
    DB_HOST: postgres
    # 哪一个会被应用使用？会有歧义！

# ❌ 在 docker-compose 中硬编码（不灵活）
api:
  environment:
    DATABASE_URL: postgresql://postgres:mypassword123@postgres:5432/dailyuse
    # 要改密码得修改 docker-compose.yml，危险！

# ❌ 直接在命令行中传递（容易被看到）
docker-compose -e DATABASE_URL=postgresql://... up
# 会出现在 ps 输出中，不安全！
```

---

## 🔧 如何更新你的配置

### 步骤 1：确认应用支持（已支持 ✅）

应用代码已经在 env.schema.ts 中定义了两种方式，优先级是：
```
DATABASE_URL > DB_HOST + DB_PORT + DB_NAME + DB_USER + DB_PASSWORD > 默认值
```

### 步骤 2：在 .env.production 中定义分解配置

```env
# .env.production

# 数据库（分解配置方式）
DB_HOST=postgres
DB_PORT=5432
DB_NAME=dailyuse
DB_USER=postgres
# DB_PASSWORD 在 .env.production.local 中设置
```

### 步骤 3：在 .env.production.local 中提供敏感信息

```env
# .env.production.local（不提交 Git）

DB_PASSWORD=your-secure-password
REDIS_PASSWORD=your-redis-password
```

### 步骤 4：更新 docker-compose.prod.yml

```yaml
services:
  api:
    environment:
      DB_HOST: ${DB_HOST}
      DB_PORT: ${DB_PORT}
      DB_NAME: ${DB_NAME}
      DB_USER: ${DB_USER}
      DB_PASSWORD: ${DB_PASSWORD}
```

---

## 🚀 完整的 Docker 部署示例

```bash
# 服务器上的准备

cd /opt/dailyuse

# 1. 确保有基础配置文件
cat .env           # 应该有 DB_HOST, DB_PORT, DB_NAME, DB_USER
cat .env.production

# 2. 创建敏感信息文件
cat > .env.production.local << EOF
DB_PASSWORD=production-password-min-16-chars
REDIS_PASSWORD=redis-password-min-16-chars
JWT_SECRET=jwt-secret-at-least-32-chars
REFRESH_TOKEN_SECRET=refresh-secret-at-least-32-chars
CORS_ORIGIN=https://yourdomain.com
EOF

chmod 600 .env.production.local

# 3. 启动（docker-compose 会自动加载 .env，然后应用会加载 .env.production 和 .env.production.local）
docker-compose -f docker-compose.prod.yml up -d

# 4. 验证
sleep 30
docker-compose logs api | grep -i "database\|redis\|environment"
```

---

## 📋 检查清单

- [ ] 应用代码支持分解配置（已支持 ✅）
- [ ] docker-compose.prod.yml 中使用 `${DB_HOST}` 等变量
- [ ] .env 文件中有 `DB_HOST=postgres` 等基础值
- [ ] .env.production 文件中有生产特定的非敏感值
- [ ] .env.production.local 只包含 `DB_PASSWORD=...` 等敏感信息
- [ ] .env.production.local 的权限是 600
- [ ] .env.production.local 在 .gitignore 中

---

## 📚 总结

| 部署方式 | 推荐方案 | 配置形式 |
|--------|--------|--------|
| 本地开发 | 分解配置 | DB_HOST=localhost |
| Docker 本地 | 分解配置 | DB_HOST=postgres（Docker 服务名）|
| 生产环境 | 分解配置 | DB_HOST=postgres（Docker 服务名）|

**统一使用分解配置（方式二）是最佳实践！**

---

**下一步**：我可以帮你更新 `.env.example` 和 `docker-compose.prod.yml`，让分解配置更清晰。要我现在更新吗？
