# Docker 数据库环境配置指南

## 概述

项目使用 Docker Compose 管理开发和测试环境的 PostgreSQL 数据库，避免直接在本地安装数据库。

## 配置文件

### 开发环境 - `docker-compose.yml`
- **容器名**: `dailyuse-dev-db`
- **端口**: `5432:5432`
- **数据库**: `dailyuse`
- **用户**: `dailyuse` / `dailyuse123`
- **持久化**: 使用 named volume `postgres-dev-data`（数据不会在容器重启后丢失）

### 测试环境 - `docker-compose.test.yml`
- **容器名**: `dailyuse-test-db`
- **端口**: `5433:5432`
- **数据库**: `dailyuse_test`
- **用户**: `test_user` / `test_pass`
- **持久化**: 使用 `tmpfs`（内存文件系统，速度快，容器停止后数据丢失）
- **优化**: 关闭 fsync 等同步选项，加速测试

## 快速开始

### 开发环境

```bash
# 启动开发数据库
pnpm docker:dev:up

# 查看日志
pnpm docker:dev:logs

# 停止数据库
pnpm docker:dev:down

# 完全重置（删除数据卷并重新创建）
pnpm docker:dev:reset
```

### 测试环境

```bash
# 启动测试数据库
pnpm docker:test:up

# 停止测试数据库
pnpm docker:test:down

# 重置测试数据库
pnpm docker:test:reset
```

## 数据库连接

### 开发环境连接字符串
```
DATABASE_URL="postgresql://dailyuse:dailyuse123@localhost:5432/dailyuse"
```

### 测试环境连接字符串
```
DATABASE_URL="postgresql://test_user:test_pass@localhost:5433/dailyuse_test"
```

## 常用操作

### 1. 初次设置开发数据库

```bash
# 启动 Docker 容器
pnpm docker:dev:up

# 等待数据库就绪（健康检查通过）
docker-compose ps

# 运行 Prisma 迁移
pnpm prisma:migrate:deploy

# 生成 Prisma Client
pnpm prisma:generate

# （可选）填充种子数据
pnpm db:seed
```

### 2. 切换到 Docker 数据库

如果你之前使用的是本地安装的 PostgreSQL：

1. 更新 `apps/api/.env` 文件：
   ```env
   DATABASE_URL="postgresql://dailyuse:dailyuse123@localhost:5432/dailyuse"
   ```

2. 启动 Docker 数据库：
   ```bash
   pnpm docker:dev:up
   ```

3. 运行迁移：
   ```bash
   pnpm prisma:migrate:deploy
   ```

### 3. 运行 E2E 测试（使用测试数据库）

```bash
# 启动测试数据库
pnpm docker:test:up

# 更新测试环境变量（如果需要）
# 在 apps/web/.env.test 或测试配置中设置：
# DATABASE_URL="postgresql://test_user:test_pass@localhost:5433/dailyuse_test"

# 运行测试
pnpm e2e
```

### 4. 进入数据库容器

```bash
# 开发环境
docker exec -it dailyuse-dev-db psql -U dailyuse -d dailyuse

# 测试环境
docker exec -it dailyuse-test-db psql -U test_user -d dailyuse_test
```

### 5. 备份和恢复

```bash
# 备份开发数据库
docker exec dailyuse-dev-db pg_dump -U dailyuse dailyuse > backup.sql

# 恢复到开发数据库
docker exec -i dailyuse-dev-db psql -U dailyuse dailyuse < backup.sql
```

## 优势

### 使用 Docker 数据库的好处

1. **环境隔离**: 不污染本地系统，多个项目可以运行不同版本的数据库
2. **快速重置**: 可以快速清除数据并重新开始
3. **团队一致**: 所有开发者使用相同的数据库版本和配置
4. **CI/CD 友好**: 与持续集成环境配置一致
5. **资源可控**: 可以轻松停止/启动，不占用系统资源

### 测试环境优化说明

测试数据库使用 `tmpfs`（内存文件系统）和禁用同步选项：
- 数据存储在内存中，读写速度快
- 不执行磁盘 fsync，减少 I/O 等待
- 适合频繁创建/销毁的测试场景
- 容器停止后数据自动清除，确保测试独立性

## 故障排查

### 端口冲突

如果 5432 端口已被占用（例如本地安装的 PostgreSQL）：

**选项 1**: 停止本地 PostgreSQL
```bash
sudo service postgresql stop
# 或
sudo systemctl stop postgresql
```

**选项 2**: 修改 Docker 容器端口映射
```yaml
# docker-compose.yml
ports:
  - '5434:5432'  # 使用 5434 端口
```

对应更新连接字符串：
```
DATABASE_URL="postgresql://dailyuse:dailyuse123@localhost:5434/dailyuse"
```

### 容器无法启动

```bash
# 查看容器日志
docker-compose logs postgres-dev

# 检查容器状态
docker-compose ps

# 完全清理并重新创建
docker-compose down -v
docker-compose up -d
```

### 数据丢失

开发环境使用持久化存储，但如果执行了 `docker-compose down -v`（带 `-v` 参数），会删除数据卷。

恢复方法：
1. 从备份恢复（如果有）
2. 重新运行迁移和种子数据

## WSL 特别说明

在 WSL 环境中使用 Docker：

1. 确保 Docker Desktop 已启动并启用 WSL 2 集成
2. 在 WSL 中直接使用 `docker` 和 `docker-compose` 命令
3. 数据卷存储在 WSL 文件系统中（`/var/lib/docker/volumes/`）
4. 网络访问正常，容器端口映射到 `localhost`

## 推荐工作流

### 日常开发
```bash
# 早上开始工作
pnpm docker:dev:up
pnpm dev

# 晚上结束工作（可选停止容器节省资源）
pnpm docker:dev:down
```

### 测试前
```bash
# 确保测试数据库干净
pnpm docker:test:reset

# 运行测试
pnpm test
pnpm e2e
```

### 数据库迁移
```bash
# 创建新迁移
pnpm prisma:migrate:create

# 应用到开发数据库
pnpm docker:dev:up
pnpm prisma:migrate:deploy

# 验证迁移
pnpm prisma:studio
```

## 参考

- [Docker Compose 文档](https://docs.docker.com/compose/)
- [PostgreSQL Docker 镜像](https://hub.docker.com/_/postgres)
- [Prisma 文档](https://www.prisma.io/docs)
