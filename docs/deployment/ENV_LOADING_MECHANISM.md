# 🎯 环境变量加载机制完全指南

**核心原则**：你**不需要手动指定**，系统会根据 `NODE_ENV` 自动决定加载哪些文件。

---

## 🔄 完整的加载流程图

```
启动应用（Node.js）
    ↓
1️⃣  检查 process.env.NODE_ENV
    ↓
    ├─ 如果是 "production" → nodeEnv = "production"
    ├─ 如果是 "development" → nodeEnv = "development"
    └─ 如果未设置 → nodeEnv = "development"（默认）
    ↓
2️⃣  按顺序加载文件（后面覆盖前面的）
    ├─ .env                              ← 基础共享配置
    ├─ .env.${nodeEnv}                  ← 环境特定配置
    │   （如果 NODE_ENV=production，则加载 .env.production）
    ├─ .env.local                       ← 本地机器覆盖（不提交 Git）
    └─ .env.${nodeEnv}.local            ← 环境特定本地覆盖（不提交 Git）
    ↓
3️⃣  使用 Zod Schema 验证所有必需变量
    ↓
    ├─ ✅ 验证成功 → 应用启动，使用这些环境变量
    └─ ❌ 验证失败 → 应用崩溃，显示详细错误信息
```

---

## 📋 实际例子

### 情况 1：开发环境（NODE_ENV=development）

```
启动命令：
$ NODE_ENV=development pnpm nx serve api

加载文件顺序：
1. .env                  ← 读取基础值
2. .env.development      ← 用开发特定值覆盖
3. .env.local            ← 用本地开发覆盖
4. .env.development.local ← 用本地开发特定覆盖
5. 操作系统环境变量      ← 最高优先级（若有）
```

**文件内容示例**：

```env
# .env（共享）
NODE_ENV=development
LOG_LEVEL=info
API_PORT=3000

# .env.development（覆盖 NODE_ENV 和 LOG_LEVEL）
NODE_ENV=development
LOG_LEVEL=debug          ← 覆盖
REDIS_HOST=localhost     ← 新增

# .env.local（本地机器私密配置）
DATABASE_PASSWORD=my-local-password
JWT_SECRET=my-dev-secret-key
```

**最终结果**：
```env
NODE_ENV=development
LOG_LEVEL=debug          ← 来自 .env.development
API_PORT=3000            ← 来自 .env
REDIS_HOST=localhost     ← 来自 .env.development
DATABASE_PASSWORD=my-local-password  ← 来自 .env.local
JWT_SECRET=my-dev-secret-key        ← 来自 .env.local
```

---

### 情况 2：生产环境 - Docker Compose 部署（NODE_ENV=production）

#### 方式 A：使用 .env.production 文件（推荐）

```bash
cd /opt/dailyuse

# Docker Compose 默认会自动加载 .env 文件
# 但我们需要手动指定 NODE_ENV，使其加载 .env.production

# 方式 1：在命令行指定（临时）
NODE_ENV=production docker-compose -f docker-compose.prod.yml up -d

# 方式 2：在 .env 文件中设置（永久）
# 编辑 /opt/dailyuse/.env
echo "NODE_ENV=production" >> /opt/dailyuse/.env

# 然后正常启动
docker-compose -f docker-compose.prod.yml up -d
```

**文件加载顺序**：

```
根目录文件：
1. .env                    ← NODE_ENV=production, API_PORT=3000, ...
2. .env.production         ← LOG_LEVEL=warn, ...（覆盖）
3. .env.local              ← 本地敏感配置（如数据库密码）
4. .env.production.local   ← 生产环境本地敏感配置（覆盖）

最终环境变量 → 注入到 Docker 容器
```

#### 方式 B：Docker Compose 的 --env-file 参数

```bash
# 显式指定 env 文件
docker-compose -f docker-compose.prod.yml \
  --env-file /opt/dailyuse/.env.production \
  up -d

# 但这只会加载 .env.production，不会再加载 .env！
# ⚠️ 不推荐，容易漏掉基础配置
```

---

## 🗂️ 生产环境推荐的文件结构

```
/opt/dailyuse/
├── .env                      # ✅ 共享基础配置（提交 Git）
├── .env.production           # ✅ 生产环境配置（提交 Git）
├── .env.local                # ❌ 本地覆盖（不提交，.gitignore）
├── .env.production.local     # ❌ 生产本地敏感信息（不提交，.gitignore）
├── docker-compose.prod.yml   # Docker 配置
└── logs/
    └── api/
```

**每个文件的职责**：

| 文件 | 提交 Git | 内容 | 示例 |
|------|---------|------|------|
| `.env` | ✅ | 所有环境的共享值 | `API_PORT=3000`<br/>`LOG_LEVEL=info` |
| `.env.production` | ✅ | 生产特定的非敏感配置 | `LOG_LEVEL=warn`<br/>`REDIS_HOST=redis` |
| `.env.local` | ❌ | 本地开发敏感信息 | `DATABASE_PASSWORD=xxx`<br/>`JWT_SECRET=xxx` |
| `.env.production.local` | ❌ | 生产服务器的敏感信息 | `DATABASE_PASSWORD=secure-prod-password`<br/>`JWT_SECRET=production-secret` |

---

## 🔐 生产环境的安全最佳实践

### ✅ 应该做的

```bash
# 1. 在生产服务器上创建 .env.production.local
cat > /opt/dailyuse/.env.production.local << 'EOF'
# ⚠️ 只在生产服务器上有这个文件！不要提交 Git！

# 数据库配置（强密码）
DATABASE_PASSWORD=Your-Very-Secure-Password-With-@#$!-123456
DATABASE_URL=postgresql://postgres:Your-Very-Secure-Password-With-@#$!-123456@postgres:5432/dailyuse

# JWT 密钥（强密钥）
JWT_SECRET=abc123def456ghi789jkl012mno345pqr678stu901vwx234yz56
REFRESH_TOKEN_SECRET=zzz999yyy888xxx777www666vvv555uuu444ttt333sss222rrr111qqq

# Redis 密码
REDIS_PASSWORD=secure-redis-password-here

# CORS 域名
CORS_ORIGIN=https://yourdomain.com,https://www.yourdomain.com

# 其他生产配置...
EOF

chmod 600 /opt/dailyuse/.env.production.local
```

### ❌ 不应该做的

```bash
# ❌ 不要在 .env.production 中暴露密钥
DATABASE_PASSWORD=admin123    # 太简单！

# ❌ 不要在 Git 中提交 .env.local 或 .env.production.local
git add .env.production.local  # ❌ 禁止！

# ❌ 不要在日志中打印敏感信息
console.log(env.DATABASE_PASSWORD)  # ❌ 禁止！

# ❌ 不要通过命令行传递密码（容易被 ps 看到）
docker-compose -e DATABASE_PASSWORD=xxx  # ❌ 不安全
```

---

## 🚀 完整的生产部署步骤

### 第一次部署

```bash
# 1. 登录到生产服务器
ssh root@your-server-ip

# 2. 创建部署目录
mkdir -p /opt/dailyuse
cd /opt/dailyuse

# 3. 从本地复制基础文件（这些可以提交 Git）
# 使用 Git 克隆或手动 scp
scp -r /path/to/local/.env docker-compose.prod.yml root@server:/opt/dailyuse/
scp -r /path/to/local/.env.production root@server:/opt/dailyuse/

# 4. 创建生产本地敏感信息文件
# 使用强密码（至少 16 个字符，包含大小写字母、数字、特殊符号）

# 生成强密码的方法：
openssl rand -base64 32

# 创建 .env.production.local
cat > /opt/dailyuse/.env.production.local << 'EOF'
DATABASE_PASSWORD=<从上面 openssl 生成的强密码>
DATABASE_URL=postgresql://postgres:<强密码>@postgres:5432/dailyuse

JWT_SECRET=<另一个强密码>
REFRESH_TOKEN_SECRET=<第三个强密码>

REDIS_PASSWORD=<第四个强密码>

CORS_ORIGIN=https://yourdomain.com,https://www.yourdomain.com
EOF

chmod 600 .env.production.local

# 5. 验证所有文件都在位
ls -la /opt/dailyuse/
# 应该看到：
# .env
# .env.production
# .env.production.local (权限 600)
# docker-compose.prod.yml

# 6. 启动应用
cd /opt/dailyuse
docker-compose -f docker-compose.prod.yml up -d

# 7. 检查日志
docker-compose logs -f api
# 应该看到：✅ Environment validated successfully
```

### 后续更新部署

```bash
# 更新镜像时，.env 文件保持不变
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d --force-recreate

# ⚠️ 不要重新创建 .env.production.local，它已经安全地存在于服务器上
```

---

## 🔍 诊断：查看实际加载了哪些值

### 方法 1：查看应用日志

```bash
docker-compose logs api | grep -i "environment\|loaded\|config"
```

### 方法 2：进入容器检查环境变量

```bash
# 进入容器
docker exec -it dailyuse-api /bin/bash

# 查看所有加载的环境变量
env | grep -E "^(NODE_ENV|DATABASE_|REDIS_|JWT_|CORS_)"

# 查看具体的值
echo $NODE_ENV
echo $DATABASE_URL
echo $CORS_ORIGIN
```

### 方法 3：在应用代码中打印（调试用）

```typescript
import { env } from '@/shared/infrastructure/config/env.js'

console.log('Environment Configuration:')
console.log('NODE_ENV:', env.NODE_ENV)
console.log('API_PORT:', env.API_PORT)
console.log('CORS_ORIGIN:', env.CORS_ORIGIN)
// ⚠️ 不要打印敏感信息如密码、密钥！
```

---

## 📊 不同场景的 NODE_ENV 设置

### 场景 1：本地开发（laptop）

```bash
# 方式 A：临时设置
NODE_ENV=development pnpm nx serve api

# 方式 B：在 .env 中设置
# 编辑 .env，设置 NODE_ENV=development
pnpm nx serve api
```

**加载文件**：`.env` → `.env.development` → `.env.local` → `.env.development.local`

### 场景 2：Docker 本地开发（Docker Desktop）

```bash
# 在本地运行 Docker Compose
cd /path/to/project

# 方式 A：使用开发配置
NODE_ENV=development docker-compose -f docker-compose.yml up -d

# 方式 B：使用生产镜像但开发配置（测试）
NODE_ENV=development docker-compose -f docker-compose.prod.yml up -d
```

### 场景 3：生产服务器

```bash
# 方式 A：在 .env 中写死
# /opt/dailyuse/.env
NODE_ENV=production
API_PORT=3000
...

docker-compose -f docker-compose.prod.yml up -d

# 方式 B：在 docker-compose.prod.yml 中写死
# services:
#   api:
#     environment:
#       NODE_ENV: production
#     ...

# 这样启动时自动使用 production 配置
```

---

## ❓ 常见问题

### Q1: 我需要在 docker-compose 命令中指定 --env-file 吗？

**A**: 不需要！Docker Compose 会自动查找：
1. `.env` 文件（如果存在）
2. `.env.${COMPOSE_ENV_FILE}` 文件（如果设置了 COMPOSE_ENV_FILE）

你只需要：
```bash
# 在 /opt/dailyuse 目录下执行
docker-compose -f docker-compose.prod.yml up -d

# Docker Compose 自动加载 .env 文件
# 你的应用代码再根据 NODE_ENV 加载 .env.production
```

### Q2: .env.local 和 .env.production.local 有什么区别？

**A**:

| 文件 | 何时加载 | 用途 |
|------|---------|------|
| `.env.local` | 所有环境 | 本地开发机器的敏感信息（数据库密码、JWT 密钥等） |
| `.env.production.local` | NODE_ENV=production 时 | 生产服务器的敏感信息（强密码、强密钥等） |

**优先级顺序**：
```
.env → .env.${NODE_ENV} → .env.local → .env.${NODE_ENV}.local → 操作系统环境变量
                                            ↑ 最高优先级
```

### Q3: 如果两个环境需要不同的数据库，该怎么办？

**A**: 使用不同的 .env.* 文件：

```bash
# .env（共享基础）
DATABASE_HOST=localhost

# .env.development
DATABASE_HOST=localhost
DATABASE_NAME=dailyuse_dev
DATABASE_PASSWORD=dev-password

# .env.production
DATABASE_HOST=prod-db.example.com
DATABASE_NAME=dailyuse_prod
DATABASE_PASSWORD=   # 留空，在 .env.production.local 中设置

# .env.production.local（生产服务器）
DATABASE_PASSWORD=secure-production-password
```

### Q4: 我怎么知道应用实际加载了哪些值？

**A**: 查看应用启动日志：

```bash
# 应用启动时会打印：
# ✅ Environment Variables Loaded Successfully
# NODE_ENV: production
# API_PORT: 3000
# CORS_ORIGIN: https://yourdomain.com
# ...

docker-compose logs api | head -50
```

### Q5: 敏感信息都在 .env.production.local 中，它不会被 Docker 容器看到吗？

**A**: 会看到！流程是：

```
.env.production.local （服务器上）
    ↓
Node.js 进程加载它
    ↓
环境变量进入 process.env
    ↓
Docker 容器内应用可以访问
```

所以要确保：
1. `.env.production.local` 的文件权限是 `600`（只有所有者可读）
2. `.gitignore` 中包含它，不会被提交
3. 服务器访问权限也要限制

---

## 🎯 快速参考

### 开发环境
```bash
# 本地开发
NODE_ENV=development pnpm nx serve api
# 加载：.env → .env.development → .env.local → .env.development.local
```

### 生产环境
```bash
# 生产部署
cd /opt/dailyuse
NODE_ENV=production docker-compose -f docker-compose.prod.yml up -d
# 加载：.env → .env.production → .env.production.local
```

### 验证配置
```bash
# 检查是否有缺失的环境变量
docker-compose logs api | grep -i "validation\|error"

# 查看加载的变量
docker exec dailyuse-api env | grep -E "^(NODE_ENV|DATABASE_|REDIS_)"
```

---

更多详情见：[docs/deployment/configs/ENVIRONMENT_CONFIGURATION.md](../../deployment/configs/ENVIRONMENT_CONFIGURATION.md)
