---
tags:
  - docker
  - ops
  - infrastructure
description: 统一整合 Docker 配置与服务管理的最终说明
created: 2025-11-23T14:54:12
updated: 2025-11-23T14:54:12
---

# Docker 配置整合完成 ✅

## 🎯 变更内容

### 1. 统一 Docker Compose 配置

**之前**：
- `docker-compose.yml` - 开发数据库 + Redis
- `docker-compose.test.yml` - 测试数据库（独立文件）

**现在**：
- **`docker-compose.yml`** - 开发数据库 + 测试数据库 + Redis（三合一）

### 2. Redis 端口变更

- **旧端口**: `6379`
- **新端口**: `6384` ⚠️

**原因**：避免与本地或其他 Redis 实例冲突

### 3. 新增统一管理脚本

**`docker-services.sh`** - 统一管理所有 Docker 服务

支持的操作：
```bash
./docker-services.sh start [dev-db|test-db|redis|all]
./docker-services.sh stop [dev-db|test-db|redis|all]
./docker-services.sh restart [dev-db|test-db|redis|all]
./docker-services.sh logs [dev-db|test-db|redis|all]
./docker-services.sh status
./docker-services.sh clean [dev-db|test-db|redis|all]
./docker-services.sh redis-cli
./docker-services.sh psql-dev
./docker-services.sh psql-test
```

## 📋 服务配置一览

| 服务 | 容器名 | 端口 | 镜像 | 数据持久化 |
|------|--------|------|------|------------|
| **开发数据库** | dailyuse-dev-db | 5432 | postgres:16-alpine | ✅ Docker Volume |
| **测试数据库** | dailyuse-test-db | 5433 | postgres:15-alpine | ❌ tmpfs (内存) |
| **Redis** | dailyuse-dev-redis | 6384 | redis:7-alpine | ✅ Docker Volume (AOF) |

## 🚀 快速开始

### 启动所有服务

```bash
# 方式 1: 使用 docker-compose
docker-compose up -d

# 方式 2: 使用管理脚本
./docker-services.sh start
```

### 查看服务状态

```bash
./docker-services.sh status
```

**输出**：
```
📊 Docker services status:

       Name                  Command              State                Ports         
-------------------------------------------------------------------------------------
dailyuse-dev-db      docker-entrypoint.sh      Up (healthy)   0.0.0.0:5432->5432/tcp
dailyuse-dev-redis   docker-entrypoint.sh      Up (healthy)   0.0.0.0:6384->6379/tcp
dailyuse-test-db     docker-entrypoint.sh      Up (healthy)   0.0.0.0:5433->5432/tcp
```

## ⚙️ 配置更新

### 1. 应用配置文件

**`apps/api/.env`** 已更新：

```diff
- REDIS_PORT=6379
+ REDIS_PORT=6384
```

**完整 Redis 配置**：
```env
REDIS_HOST=localhost
REDIS_PORT=6384
REDIS_PASSWORD=dailyuse123
REDIS_DB=0
```

**连接字符串**：
```
redis://:dailyuse123@localhost:6384/0
```

### 2. 数据库连接信息

#### 开发数据库
```
Host: localhost
Port: 5432
Database: dailyuse
User: dailyuse
Password: dailyuse123
```

**连接字符串**：
```
postgresql://dailyuse:dailyuse123@localhost:5432/dailyuse
```

#### 测试数据库
```
Host: localhost
Port: 5433
Database: dailyuse_test
User: test_user
Password: test_pass
```

**连接字符串**：
```
postgresql://test_user:test_pass@localhost:5433/dailyuse_test
```

## 🔄 迁移步骤

如果你有正在运行的旧服务：

### 1. 停止旧服务

```bash
# 停止并删除旧容器
docker-compose down
docker-compose -f docker-compose.test.yml down

# 清理旧的 Redis（如果单独运行）
docker stop dailyuse-dev-redis 2>/dev/null || true
docker rm dailyuse-dev-redis 2>/dev/null || true
```

### 2. 启动新服务

```bash
# 使用新配置启动所有服务
docker-compose up -d

# 或使用管理脚本
./docker-services.sh start
```

### 3. 验证服务

```bash
# 查看状态
./docker-services.sh status

# 测试 Redis 连接
docker exec dailyuse-dev-redis redis-cli -a dailyuse123 -p 6379 PING
# 应该返回: PONG

# 测试开发数据库
docker exec dailyuse-dev-db pg_isready -U dailyuse -d dailyuse
# 应该返回: /var/run/postgresql:5432 - accepting connections

# 测试测试数据库
docker exec dailyuse-test-db pg_isready -U test_user -d dailyuse_test
# 应该返回: /var/run/postgresql:5432 - accepting connections
```

### 4. 更新应用配置（如需要）

检查以下文件中的 Redis 配置：
- `apps/api/.env` ✅ 已更新
- 其他可能的配置文件

确保 Redis 端口从 `6379` 改为 `6384`。

## 📝 旧脚本仍可用

以下脚本仍然可以使用（向后兼容）：

- `dev-docker-db.sh` - 开发数据库管理
- `docker-test-db.sh` - 测试数据库管理
- `docker-redis.sh` - Redis 管理 ✅ 已更新端口显示为 6384

但建议使用新的 **`docker-services.sh`** 统一管理。

## 🎨 优势

### 1. **统一管理**
- 一个配置文件管理所有服务
- 一个脚本控制所有服务
- 减少配置分散

### 2. **更简单的操作**
```bash
# 之前：需要记住多个文件和命令
docker-compose up -d postgres-dev
docker-compose -f docker-compose.test.yml up -d postgres-test
./docker-redis.sh start

# 现在：一个命令搞定
./docker-services.sh start
```

### 3. **避免端口冲突**
- Redis 使用 `6384` 端口，不会与默认 `6379` 冲突
- 可以同时运行多个项目的 Redis

### 4. **更好的隔离**
- 测试数据库使用 tmpfs（内存），更快且重启自动清空
- 开发数据库数据持久化
- Redis 数据持久化（AOF）

## 🐛 常见问题

### Q: 端口冲突怎么办？

**A**: 检查端口占用
```bash
# Linux/macOS
lsof -i :5432
lsof -i :5433
lsof -i :6384

# 或
netstat -tuln | grep 5432
```

停止占用端口的服务或修改 `docker-compose.yml` 中的端口映射。

### Q: Redis 连接失败？

**A**: 确认：
1. 端口已改为 `6384`
2. 密码是 `dailyuse123`
3. 容器正在运行：`docker ps | grep redis`

```bash
# 测试连接
./docker-services.sh redis-cli
# 输入: PING
# 应返回: PONG
```

### Q: 数据丢失了？

**A**: 检查：
- **测试数据库**使用 tmpfs，重启后数据会丢失（这是预期行为）
- **开发数据库**和 **Redis** 数据持久化，除非手动清理

```bash
# 查看数据卷
docker volume ls | grep dailyuse

# 如果数据卷被删除，需要重新初始化数据库
```

### Q: 如何重置所有数据？

**A**: 
```bash
# 清理所有数据（谨慎！）
./docker-services.sh clean all

# 重新启动
./docker-services.sh start
```

## 📚 相关文档

- **[DOCKER_SERVICES_GUIDE.md](./DOCKER_SERVICES_GUIDE.md)** - 详细使用指南
- **[REDIS_SETUP.md](./REDIS_SETUP.md)** - Redis 配置说明
- **[MIGRATE_TO_REAL_DATABASE.md](./MIGRATE_TO_REAL_DATABASE.md)** - 数据库迁移文档

## ✅ 验证清单

- [x] 所有服务已整合到 `docker-compose.yml`
- [x] Redis 端口改为 `6384`
- [x] 创建统一管理脚本 `docker-services.sh`
- [x] 更新 `.env` 文件中的 Redis 端口
- [x] 更新 `.env.example` 文件
- [x] 更新 `docker-redis.sh` 中的端口显示
- [x] 所有服务启动并运行正常
- [x] 健康检查全部通过
- [x] 创建使用文档

---

**更新时间**: 2025-01-14
**变更类型**: 配置整合 + 端口变更
**向后兼容**: ✅ 旧脚本仍可用
