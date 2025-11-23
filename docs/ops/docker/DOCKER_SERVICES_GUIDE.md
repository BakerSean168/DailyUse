---
tags:
  - docker
  - ops
  - guide
description: Docker 服务详细使用指南与连接信息
created: 2025-11-23T14:54:12
updated: 2025-11-23T14:54:12
---

# Docker Services 使用指南

## 📦 服务列表

统一的 `docker-compose.yml` 包含以下服务：

| 服务 | 镜像 | 端口 | 说明 |
|------|------|------|------|
| **postgres-dev** | postgres:16-alpine | 5432 | 开发数据库（持久化存储） |
| **postgres-test** | postgres:15-alpine | 5433 | 测试数据库（tmpfs，重启清空） |
| **redis-dev** | redis:7-alpine | 6384 | Redis 缓存（持久化存储） |

## 🚀 快速开始

### 启动所有服务

```bash
# 方式 1: 使用 docker-compose
docker-compose up -d

# 方式 2: 使用管理脚本
./docker-services.sh start
```

### 启动单个服务

```bash
# 启动开发数据库
./docker-services.sh start dev-db

# 启动测试数据库
./docker-services.sh start test-db

# 启动 Redis
./docker-services.sh start redis
```

## 📊 连接信息

### 开发数据库 (PostgreSQL 16)

```
Host: localhost
Port: 5432
Database: dailyuse
User: dailyuse
Password: dailyuse123
```

**连接字符串**:
```
postgresql://dailyuse:dailyuse123@localhost:5432/dailyuse
```

### 测试数据库 (PostgreSQL 15)

```
Host: localhost
Port: 5433
Database: dailyuse_test
User: test_user
Password: test_pass
```

**连接字符串**:
```
postgresql://test_user:test_pass@localhost:5433/dailyuse_test
```

### Redis

```
Host: localhost
Port: 6384
Password: dailyuse123
DB: 0
```

**连接字符串**:
```
redis://:dailyuse123@localhost:6384/0
```

## 🛠️ 常用命令

### 使用管理脚本 (`docker-services.sh`)

```bash
# 查看帮助
./docker-services.sh

# 启动服务
./docker-services.sh start [all|dev-db|test-db|redis]

# 停止服务
./docker-services.sh stop [all|dev-db|test-db|redis]

# 重启服务
./docker-services.sh restart [all|dev-db|test-db|redis]

# 查看日志
./docker-services.sh logs [all|dev-db|test-db|redis]

# 查看状态
./docker-services.sh status

# 清理数据（谨慎！）
./docker-services.sh clean [dev-db|test-db|redis|all]

# 连接到 Redis CLI
./docker-services.sh redis-cli

# 连接到开发数据库
./docker-services.sh psql-dev

# 连接到测试数据库
./docker-services.sh psql-test
```

### 使用 docker-compose

```bash
# 启动所有服务
docker-compose up -d

# 启动特定服务
docker-compose up -d postgres-dev
docker-compose up -d postgres-test
docker-compose up -d redis-dev

# 停止所有服务
docker-compose stop

# 停止特定服务
docker-compose stop postgres-dev

# 查看日志
docker-compose logs -f

# 查看特定服务日志
docker-compose logs -f postgres-dev

# 查看状态
docker-compose ps

# 完全移除（包括容器和网络）
docker-compose down

# 移除并清理数据卷
docker-compose down -v
```

## 🔧 专用脚本（旧版，仍可用）

### 开发数据库脚本

```bash
# 启动开发数据库
./dev-docker-db.sh start

# 停止开发数据库
./dev-docker-db.sh stop

# 查看日志
./dev-docker-db.sh logs

# 连接到数据库
./dev-docker-db.sh shell

# 清理数据
./dev-docker-db.sh clean
```

### 测试数据库脚本

```bash
# 启动测试数据库
./docker-test-db.sh start

# 停止测试数据库
./docker-test-db.sh stop
```

### Redis 脚本

```bash
# 启动 Redis
./docker-redis.sh start

# 停止 Redis
./docker-redis.sh stop

# 连接到 Redis CLI
./docker-redis.sh cli

# 测试连接
./docker-redis.sh test
```

## 📝 注意事项

### 开发数据库 (postgres-dev)
- ✅ 数据持久化存储在 Docker 卷中
- ✅ 重启后数据保留
- ⚠️ 使用 `clean` 命令会**永久删除**所有数据

### 测试数据库 (postgres-test)
- ⚠️ 使用 **tmpfs**，数据存储在内存中
- ⚠️ 容器停止或重启后**数据会丢失**
- ✅ 速度更快，适合测试
- ✅ 禁用了 fsync 等功能以提升性能

### Redis
- ✅ 数据持久化（AOF 模式）
- ✅ 需要密码认证
- ⚠️ 端口已改为 **6384**（避免与其他 Redis 冲突）

## 🔄 迁移说明

### 从旧配置迁移

如果你之前使用 `docker-compose.test.yml` 或单独的 Redis 配置：

1. **停止所有旧容器**:
   ```bash
   docker-compose -f docker-compose.test.yml down
   docker stop dailyuse-dev-redis
   ```

2. **使用新配置启动**:
   ```bash
   docker-compose up -d
   ```

3. **更新应用配置**:
   - Redis 端口从 `6379` 改为 `6384`
   - 检查 `.env` 或配置文件中的 Redis 连接字符串

## 🐛 故障排查

### 端口冲突

如果遇到端口占用：

```bash
# 查看端口占用
lsof -i :5432
lsof -i :5433
lsof -i :6384

# 或者
netstat -tuln | grep 5432
netstat -tuln | grep 5433
netstat -tuln | grep 6384
```

### 容器无法启动

```bash
# 查看详细日志
docker-compose logs postgres-dev
docker-compose logs postgres-test
docker-compose logs redis-dev

# 检查容器状态
docker ps -a | grep dailyuse

# 删除有问题的容器重新创建
docker-compose down
docker-compose up -d
```

### 数据卷问题

```bash
# 查看数据卷
docker volume ls | grep dailyuse

# 检查数据卷详情
docker volume inspect dailyuse-dev-db-data
docker volume inspect dailyuse-dev-redis-data

# 删除数据卷（注意：会丢失数据）
docker volume rm dailyuse-dev-db-data
docker volume rm dailyuse-dev-redis-data
```

## 📚 相关文档

- [PostgreSQL Docker Hub](https://hub.docker.com/_/postgres)
- [Redis Docker Hub](https://hub.docker.com/_/redis)
- [Docker Compose 文档](https://docs.docker.com/compose/)
