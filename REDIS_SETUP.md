# Redis Configuration Guide

## 📦 Redis Setup for DailyUse

本项目使用 Redis 作为缓存层，用于 Dashboard 统计数据缓存等功能。

## 🚀 快速启动

### 1. 启动 Redis

```bash
# 使用 docker-compose
docker-compose up -d redis-dev

# 或使用便捷脚本
./docker-redis.sh start
```

### 2. 验证连接

```bash
./docker-redis.sh test
```

### 3. 启动 API 服务器

```bash
pnpm dev
```

## 🔧 Redis 管理脚本

我们提供了便捷的 Redis 管理脚本 `docker-redis.sh`：

```bash
./docker-redis.sh [command]
```

### 可用命令

| 命令      | 说明                        |
| --------- | --------------------------- |
| `start`   | 启动 Redis 容器             |
| `stop`    | 停止 Redis 容器             |
| `restart` | 重启 Redis 容器             |
| `logs`    | 查看 Redis 日志             |
| `status`  | 查看 Redis 容器状态         |
| `cli`     | 连接到 Redis CLI            |
| `test`    | 测试 Redis 连接             |
| `clean`   | 清除 Redis 数据（危险操作） |

## 📝 配置说明

### 环境变量配置 (apps/api/.env)

```bash
# Redis Cache
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=dailyuse123
REDIS_DB=0
```

### 也支持 URL 格式

```bash
REDIS_URL=redis://:dailyuse123@localhost:6379/0
```

## 🔍 连接信息

- **Host**: localhost
- **Port**: 6379
- **Password**: dailyuse123
- **Database**: 0 (默认)

## 🐳 Docker Compose 配置

Redis 服务配置在 `docker-compose.yml` 中：

```yaml
redis-dev:
  image: redis:7-alpine
  container_name: dailyuse-dev-redis
  ports:
    - '6379:6379'
  volumes:
    - redis-dev-data:/data
  command: redis-server --appendonly yes --requirepass dailyuse123
  healthcheck:
    test: ['CMD', 'redis-cli', '--raw', 'incr', 'ping']
    interval: 10s
    timeout: 5s
    retries: 5
  restart: unless-stopped
```

## 💡 使用场景

### Dashboard 统计缓存

Redis 主要用于缓存 Dashboard 统计数据：

- **TTL**: 5 分钟 (300 秒)
- **键前缀**: `dashboard:statistics:{userId}`
- **降级策略**: Redis 不可用时自动降级到直接查询数据库

### 缓存失效策略

当以下事件发生时，缓存会自动失效：

1. Task 统计更新
2. Goal 统计更新
3. Reminder 统计更新
4. Schedule 统计更新

## 🧪 测试连接

### 使用脚本

```bash
./docker-redis.sh test
```

### 使用 Redis CLI

```bash
# 进入 Redis CLI
./docker-redis.sh cli

# 测试命令
127.0.0.1:6379> PING
PONG

127.0.0.1:6379> SET test "Hello Redis"
OK

127.0.0.1:6379> GET test
"Hello Redis"

127.0.0.1:6379> DEL test
(integer) 1
```

### 使用 Docker 命令

```bash
# 直接执行 Redis 命令
docker exec dailyuse-dev-redis redis-cli -a dailyuse123 PING

# 查看所有键
docker exec dailyuse-dev-redis redis-cli -a dailyuse123 KEYS "*"

# 查看 Dashboard 缓存
docker exec dailyuse-dev-redis redis-cli -a dailyuse123 KEYS "dashboard:statistics:*"
```

## 🛠️ 故障排查

### Redis 未启动

```bash
# 检查状态
./docker-redis.sh status

# 启动 Redis
./docker-redis.sh start
```

### 连接认证失败

确保 `.env` 文件中的 `REDIS_PASSWORD` 与 `docker-compose.yml` 中的密码一致。

### 查看日志

```bash
./docker-redis.sh logs
```

### 端口冲突

如果 6379 端口被占用，可以修改 `docker-compose.yml` 中的端口映射：

```yaml
ports:
  - '6380:6379' # 使用 6380 端口
```

同时更新 `.env` 中的 `REDIS_PORT`：

```bash
REDIS_PORT=6380
```

## 🔒 生产环境注意事项

1. **修改密码**: 使用强密码替换 `dailyuse123`
2. **网络隔离**: 不要将 Redis 暴露到公网
3. **持久化**: 配置 AOF 或 RDB 持久化策略
4. **监控**: 配置 Redis 监控和告警
5. **备份**: 定期备份 Redis 数据

## 📊 性能优化

### 当前配置

- **最大内存**: 默认无限制
- **淘汰策略**: noeviction (默认)
- **持久化**: AOF (appendonly yes)

### 推荐生产配置

```bash
# 最大内存 (例如 1GB)
maxmemory 1gb

# LRU 淘汰策略
maxmemory-policy allkeys-lru

# 持久化 (AOF + RDB)
save 900 1
save 300 10
save 60 10000
appendonly yes
appendfsync everysec
```

## 🔗 相关资源

- [Redis 官方文档](https://redis.io/docs/)
- [ioredis 客户端文档](https://github.com/redis/ioredis)
- [Redis Docker 镜像](https://hub.docker.com/_/redis)

## 📧 支持

如有问题，请查看日志或联系开发团队。
