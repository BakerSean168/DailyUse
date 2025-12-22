# 📝 命令快速参考

所有常用部署命令的速查表

---

## 🖥️ 本地开发命令

### 构建和测试

```bash
# TypeScript 类型检查
pnpm nx run api:typecheck

# 单元测试
pnpm nx run api:test

# 集成测试
pnpm nx run api:test:integration

# 构建 API
pnpm nx run api:build

# 开发模式（热重载）
pnpm nx serve api
```

### Docker 构建

```bash
# 构建镜像
docker build -t dailyuse-api:v1.0.3 -f Dockerfile.api .

# 标记镜像
docker tag dailyuse-api:v1.0.3 \
  crpi-3po0rmvmxgu205ms.cn-hangzhou.personal.cr.aliyuncs.com/bakersean/dailyuse-api:v1.0.3

# 推送镜像
docker push \
  crpi-3po0rmvmxgu205ms.cn-hangzhou.personal.cr.aliyuncs.com/bakersean/dailyuse-api:v1.0.3

# 完整脚本（推荐）
./scripts/build-and-push.sh v1.0.3
```

---

## 🚀 部署命令（服务器）

### 启动/停止服务

```bash
# 启动所有服务
docker-compose -f docker-compose.prod.yml up -d

# 停止所有服务
docker-compose -f docker-compose.prod.yml down

# 只启动 API
docker-compose up -d api

# 查看服务状态
docker-compose ps

# 查看实时日志
docker-compose logs -f api

# 查看历史日志（最后 100 行）
docker-compose logs api --tail=100
```

### 重启和更新

```bash
# 重启 API 服务
docker-compose restart api

# 重启所有服务
docker-compose restart

# 从新镜像重启（更新）
docker-compose pull
docker-compose up -d --force-recreate

# 只更新 API 镜像
docker-compose pull api && docker-compose up -d api --force-recreate
```

### 管理

```bash
# 进入容器 shell
docker exec -it dailyuse-api /bin/bash

# 查看容器资源使用
docker stats

# 清理无用镜像/容器
docker system prune -a

# 导出日志
docker-compose logs api > api-logs.txt
```

---

## ✅ 验证和监控

### 健康检查

```bash
# 快速健康检查
curl http://localhost:3000/healthz

# 检查数据库连接
curl http://localhost:3000/api/health/db

# 检查 Redis 连接
curl http://localhost:3000/api/health/redis

# 详细健康信息（JSON）
curl http://localhost:3000/healthz | jq .
```

### 性能测试

```bash
# 使用 Apache Bench 进行负载测试（100 个请求，10 并发）
ab -n 100 -c 10 http://localhost:3000/healthz

# 使用 wrk（如已安装）
wrk -t4 -c100 -d30s http://localhost:3000/healthz

# 简单时间统计
for i in {1..10}; do
  time curl -s http://localhost:3000/healthz > /dev/null
done
```

### 日志监控

```bash
# 实时日志跟踪
docker-compose logs -f api

# 最后 N 行
docker-compose logs api --tail=50

# 特定时间范围内的日志
docker-compose logs api --since 2024-01-15T10:00:00

# 查找错误日志
docker-compose logs api | grep ERROR

# 查找特定关键字
docker-compose logs api | grep -i "cors\|auth\|connection"
```

---

## 🔧 配置和环境

### 编辑环境变量

```bash
# 编辑 .env 文件
nano /opt/dailyuse/.env

# 验证 .env 格式
cat /opt/dailyuse/.env | grep -v "^#" | grep -v "^$"

# 重新加载环境变量（需重启容器）
docker-compose restart api
```

### 数据库管理

```bash
# 进入 PostgreSQL
docker exec -it dailyuse-postgres psql -U postgres

# 列出数据库
\l

# 连接数据库
\c dailyuse

# 查看表
\dt

# 退出
\q

# 直接执行 SQL
docker exec dailyuse-postgres psql -U postgres -c "SELECT 1"
```

### Redis 管理

```bash
# 进入 Redis CLI
docker exec -it dailyuse-redis redis-cli

# 或使用密码
docker exec -it dailyuse-redis redis-cli -a "password"

# 常用命令
PING                    # 测试连接
DBSIZE                  # 数据库大小
FLUSHDB                 # 清空当前数据库
FLUSHALL                # 清空所有数据库
KEYS *                  # 列出所有 key
GET key_name            # 获取值
DEL key_name            # 删除 key
TTL key_name            # 查看过期时间

# 退出
exit
```

---

## 🔐 安全和备份

### 备份数据库

```bash
# 导出整个数据库
docker exec dailyuse-postgres pg_dump -U postgres dailyuse > backup.sql

# 导出单个表
docker exec dailyuse-postgres pg_dump -U postgres dailyuse -t table_name > table_backup.sql

# 压缩备份
docker exec dailyuse-postgres pg_dump -U postgres dailyuse | gzip > backup.sql.gz
```

### 恢复数据库

```bash
# 从备份恢复
docker exec -i dailyuse-postgres psql -U postgres < backup.sql

# 从压缩备份恢复
cat backup.sql.gz | gunzip | docker exec -i dailyuse-postgres psql -U postgres
```

### 证书管理

```bash
# 查看证书信息
openssl x509 -in /etc/letsencrypt/live/yourdomain.com/fullchain.pem -text -noout

# 测试证书有效期
openssl x509 -enddate -noout -in /etc/letsencrypt/live/yourdomain.com/fullchain.pem

# 续期证书
certbot renew --force-renewal

# 测试续期（不实际执行）
certbot renew --dry-run
```

---

## 🐛 故障排除命令

### 诊断工具

```bash
# 完整诊断
docker-compose exec api curl -s http://localhost:3000/healthz | jq .
docker-compose ps
docker-compose logs api | tail -50

# 检查网络
docker network inspect dailyuse_default

# 检查磁盘空间
df -h

# 检查端口使用
netstat -tuln | grep 3000

# 查看防火墙规则
sudo ufw status
```

### 修复常见问题

```bash
# 清理并重启
docker-compose down
docker system prune -a
docker-compose up -d

# 重新拉取镜像
docker pull crpi-3po0rmvmxgu205ms.cn-hangzhou.personal.cr.aliyuncs.com/bakersean/dailyuse-api:latest

# 登录 Docker Registry
docker login crpi-3po0rmvmxgu205ms.cn-hangzhou.personal.cr.aliyuncs.com

# 重新初始化数据库（危险！）
docker-compose down
rm -rf data/postgres/*
docker-compose up -d
sleep 30
docker-compose logs postgres
```

---

## 📊 系统维护命令

### 定期维护

```bash
# 查看系统资源
free -h
df -h
docker stats

# 清理日志
docker exec dailyuse-api truncate -s 0 /var/log/app.log

# 清理 Docker 资源
docker container prune --force
docker image prune -a --force
docker volume prune --force

# 旋转日志
logrotate /etc/logrotate.d/dailyuse -f
```

### 监控

```bash
# 实时监控所有容器
watch -n 1 'docker stats --no-stream'

# 监控磁盘空间
watch -n 5 'df -h | grep -E "Filesystem|/opt"'

# 监控日志大小
watch -n 10 'du -sh /opt/dailyuse/logs/*'
```

---

## 🔄 完整部署流程命令

### 从开发到生产的完整命令序列

```bash
# 1️⃣ 本地验证（开发机）
cd d:\myPrograms\DailyUse
pnpm nx run api:typecheck
pnpm nx run api:test
pnpm nx run api:build

# 2️⃣ 构建和推送镜像
./scripts/build-and-push.sh v1.0.3
# 或手动
docker build -t dailyuse-api:v1.0.3 -f Dockerfile.api .
docker tag dailyuse-api:v1.0.3 crpi-3po0rmvmxgu205ms.cn-hangzhou.personal.cr.aliyuncs.com/bakersean/dailyuse-api:v1.0.3
docker push crpi-3po0rmvmxgu205ms.cn-hangzhou.personal.cr.aliyuncs.com/bakersean/dailyuse-api:v1.0.3

# 3️⃣ 连接到服务器
ssh root@your.server.ip

# 4️⃣ 进入部署目录
cd /opt/dailyuse

# 5️⃣ 拉取最新镜像并更新
docker-compose pull
docker-compose down
docker-compose up -d

# 6️⃣ 验证部署
sleep 30
curl http://localhost:3000/healthz
docker-compose ps
docker-compose logs api | tail -20

# 7️⃣ 验证数据库
curl http://localhost:3000/api/health/db

# 8️⃣ 验证 Redis
curl http://localhost:3000/api/health/redis
```

---

## 📋 命令速查表

| 任务 | 命令 | 用途 |
|------|------|------|
| 检查状态 | `docker-compose ps` | 查看所有容器状态 |
| 查看日志 | `docker-compose logs api` | 查看 API 日志 |
| 实时日志 | `docker-compose logs -f api` | 实时跟踪日志 |
| 重启服务 | `docker-compose restart api` | 重启 API 服务 |
| 更新镜像 | `docker-compose pull && docker-compose up -d` | 更新所有服务 |
| 健康检查 | `curl http://localhost:3000/healthz` | 快速健康检查 |
| 进入容器 | `docker exec -it dailyuse-api /bin/bash` | 交互式 shell |
| 查看资源 | `docker stats` | 实时资源监控 |
| 清理资源 | `docker system prune -a` | 清理无用资源 |
| 备份数据库 | `docker exec dailyuse-postgres pg_dump -U postgres dailyuse > backup.sql` | 备份 DB |

---

## 🎯 常用快捷脚本

### 创建 shell 别名（可选）

```bash
# 添加到 ~/.bashrc 或 ~/.zshrc
alias dc='docker-compose'
alias dcl='docker-compose logs -f api'
alias dcp='docker-compose ps'
alias dclogs='docker-compose logs api | tail -50'
alias healthz='curl -s http://localhost:3000/healthz | jq .'

# 然后执行
source ~/.bashrc
```

**使用：**
```bash
dc ps          # 等同于 docker-compose ps
dcl            # 等同于 docker-compose logs -f api
healthz        # 等同于 curl -s http://localhost:3000/healthz | jq .
```

---

**需要完整说明？** 见：
- [../03-deploy.md](../03-deploy.md) - 完整部署说明
- [../04-verify.md](../04-verify.md) - 验证步骤
- [../05-troubleshooting.md](../05-troubleshooting.md) - 故障排除
