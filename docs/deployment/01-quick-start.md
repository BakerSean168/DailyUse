# 🚀 快速开始（5分钟版本）

**预计耗时**：5 分钟  
**适合**：想快速了解部署步骤的人

---

## 三步快速部署

### 1️⃣ 本地构建（Windows PowerShell，10 分钟）

```powershell
cd d:\myPrograms\DailyUse
.\scripts\deploy-prod.ps1 -Version v1.0.3
```

脚本会自动：
- ✓ 验证 TypeScript 编译
- ✓ 构建 Docker 镜像
- ✓ 推送到阿里云 ACR
- ✓ 输出部署摘要

---

### 2️⃣ 服务器准备（3 分钟）

```bash
# SSH 连接
ssh user@your-server-ip

# 进入部署目录
cd /path/to/deployment

# 创建配置文件
cat > .env.production.local << 'EOF'
NODE_ENV=production
DATABASE_URL="postgresql://dailyuse:password@postgres:5432/dailyuse"
REDIS_URL="redis://redis:6379/0"
JWT_SECRET="your-strong-secret-key-min-32-chars"
CORS_ORIGIN="https://yourdomain.com,https://www.yourdomain.com"
API_TAG=v1.0.3
EOF

# 设置权限
chmod 600 .env.production.local
```

**关键提示**：
- 🔒 不要提交此文件到 Git
- 🔒 权限必须是 600
- ⚙️ 包含敏感信息

---

### 3️⃣ 执行部署（服务器上，3 分钟）

```bash
cd /path/to/deployment

# 停止旧服务
docker-compose -f docker-compose.prod.yml down

# 拉取新镜像
docker-compose -f docker-compose.prod.yml --env-file .env.production.local pull

# 启动新服务
docker-compose -f docker-compose.prod.yml --env-file .env.production.local up -d

# 等待启动
sleep 30

# 验证成功
curl http://localhost:3000/healthz
```

**预期结果**：
```json
{"status":"ok","timestamp":"2025-01-11T..."}
```

---

## ✅ 快速验证

```bash
# 1. 检查容器
docker-compose -f docker-compose.prod.yml ps
# ✓ 所有容器都是 Up 状态

# 2. 健康检查
curl http://localhost:3000/healthz
# ✓ 返回 {"status":"ok",...}

# 3. 查看日志
docker-compose -f docker-compose.prod.yml logs api --tail=10
# ✓ 无 ERROR，有 "Server listening"
```

---

## ⚠️ 关键配置

必填项（.env.production.local）：
- `DATABASE_URL` - PostgreSQL 连接
- `REDIS_URL` - Redis 连接
- `JWT_SECRET` - 强密码（至少 32 字符）
- `CORS_ORIGIN` - 前端域名

---

## 🚨 常见问题

| 问题 | 快速解决 |
|------|--------|
| 脚本失败 | 查看 [02-build.md](02-build.md) |
| CORS 错误 | 检查 CORS_ORIGIN，见 [configs/CORS_CONFIGURATION.md](configs/CORS_CONFIGURATION.md) |
| DB 连接失败 | 等等 60 秒再重试 |
| 需要详细步骤 | 查看 [03-deploy.md](03-deploy.md) |

---

## 📚 需要更多？

- **详细构建步骤** → [02-build.md](02-build.md)
- **详细部署步骤** → [03-deploy.md](03-deploy.md)
- **验证和检查** → [04-verify.md](04-verify.md)
- **故障排查** → [05-troubleshooting.md](05-troubleshooting.md)
- **快速命令** → [reference/COMMAND_REFERENCE.md](reference/COMMAND_REFERENCE.md)

---

**现在就开始！** 🚀
